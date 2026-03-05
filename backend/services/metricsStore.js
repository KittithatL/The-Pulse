const DEFAULT_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h

function clampNumber(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function parseRangeToMs(range) {
  if (!range) return 60 * 60 * 1000; // 1h default
  const s = String(range).trim().toLowerCase();
  const m = s.match(/^(\d+)\s*(m|h|d)$/);
  if (!m) return 60 * 60 * 1000;
  const value = Number(m[1]);
  const unit = m[2];
  const mult = unit === 'm' ? 60 * 1000 : unit === 'h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  return clampNumber(value * mult, 60 * 1000, DEFAULT_MAX_AGE_MS);
}

function normalizePath(pathname) {
  const p = String(pathname || '').split('?')[0];
  return p
    .replace(/\/\d+(?=\/|$)/g, '/:id')
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/gi, '/:id');
}

function percentile(values, p) {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[clampNumber(rank, 0, sorted.length - 1)];
}

function groupKey(method, path) {
  return `${String(method || 'GET').toUpperCase()} ${path || '/'}`;
}

const state = {
  maxAgeMs: DEFAULT_MAX_AGE_MS,
  requests: [],
  socketsConnected: 0,
};

function recordRequest(evt) {
  state.requests.push(evt);
  purgeOld(Date.now());
}

function purgeOld(now) {
  const cutoff = now - state.maxAgeMs;
  while (state.requests.length > 0 && state.requests[0].ts < cutoff) {
    state.requests.shift();
  }
}

function socketConnected() {
  state.socketsConnected += 1;
}

function socketDisconnected() {
  state.socketsConnected = Math.max(0, state.socketsConnected - 1);
}

function computeMetrics({ rangeMs, now }) {
  const windowStart = now - rangeMs;
  const windowEvents = state.requests.filter((e) => e.ts >= windowStart && e.ts <= now);

  const total = windowEvents.length;
  const minutes = rangeMs / 60000;
  const rpm = minutes > 0 ? Math.round((total / minutes) * 10) / 10 : 0;

  const durations = windowEvents.map((e) => e.durationMs).filter((n) => Number.isFinite(n));
  const errors = windowEvents.filter((e) => e.status >= 500).length;
  const errorRate = total > 0 ? Math.round((errors / total) * 1000) / 10 : 0;

  const uniqueUsers = new Set(windowEvents.map((e) => e.userId).filter((u) => u !== null && u !== undefined)).size;

  const p50 = Math.round(percentile(durations, 50));
  const p95 = Math.round(percentile(durations, 95));
  const p99 = Math.round(percentile(durations, 99));
  const avg = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  // Timeseries (1-minute buckets)
  const bucketMs = 60 * 1000;
  const startBucket = Math.floor(windowStart / bucketMs) * bucketMs;
  const endBucket = Math.floor(now / bucketMs) * bucketMs;
  const buckets = new Map();

  for (let t = startBucket; t <= endBucket; t += bucketMs) {
    buckets.set(t, { ts: new Date(t).toISOString(), count: 0, errors: 0, durations: [] });
  }

  for (const e of windowEvents) {
    const bt = Math.floor(e.ts / bucketMs) * bucketMs;
    const b = buckets.get(bt);
    if (!b) continue;
    b.count += 1;
    if (e.status >= 500) b.errors += 1;
    if (Number.isFinite(e.durationMs)) b.durations.push(e.durationMs);
  }

  const timeseries = Array.from(buckets.values()).map((b) => ({
    ts: b.ts,
    rpm: Math.round((b.count / 1) * 10) / 10,
    errors: b.errors,
    p95: Math.round(percentile(b.durations, 95)),
  }));

  // Top endpoints
  const byEndpoint = new Map();
  for (const e of windowEvents) {
    const key = groupKey(e.method, e.path);
    const cur = byEndpoint.get(key) || { method: e.method, path: e.path, count: 0, errors: 0, durations: [] };
    cur.count += 1;
    if (e.status >= 500) cur.errors += 1;
    if (Number.isFinite(e.durationMs)) cur.durations.push(e.durationMs);
    byEndpoint.set(key, cur);
  }

  const topEndpoints = Array.from(byEndpoint.values())
    .map((v) => ({
      method: v.method,
      path: v.path,
      count: v.count,
      error_rate: v.count > 0 ? Math.round((v.errors / v.count) * 1000) / 10 : 0,
      p95: Math.round(percentile(v.durations, 95)),
    }))
    .sort((a, b) => (b.count - a.count) || (b.error_rate - a.error_rate))
    .slice(0, 15);

  const slowRequests = [...windowEvents]
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, 20)
    .map((e) => ({
      ts: new Date(e.ts).toISOString(),
      method: e.method,
      path: e.path,
      status: e.status,
      durationMs: Math.round(e.durationMs),
      userId: e.userId,
    }));

  return {
    kpis: {
      rpm,
      activeUsers: uniqueUsers,
      sockets: state.socketsConnected,
      errorRate,
      p50,
      p95,
      p99,
      avg,
      totalRequests: total,
    },
    charts: { timeseries },
    topEndpoints,
    slowRequests,
    meta: {
      rangeMs,
      windowStart: new Date(windowStart).toISOString(),
      windowEnd: new Date(now).toISOString(),
    },
  };
}

function metricsMiddleware(options = {}) {
  const {
    maxAgeMs = DEFAULT_MAX_AGE_MS,
    exclude = (req) => {
      const url = req.originalUrl || '';
      return url.startsWith('/health') || url.startsWith('/api/health') || url.startsWith('/api/admin');
    },
  } = options;

  state.maxAgeMs = maxAgeMs;

  return function (req, res, next) {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
      if (exclude(req)) return;
      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1e6;

      const rawPath = normalizePath(req.path || req.originalUrl || '/');
      const method = String(req.method || 'GET').toUpperCase();
      const status = Number(res.statusCode) || 0;
      const userId = req.user?.id ?? null;

      recordRequest({
        ts: Date.now(),
        method,
        path: rawPath,
        status,
        durationMs,
        userId,
      });
    });

    next();
  };
}

module.exports = {
  parseRangeToMs,
  normalizePath,
  computeMetrics,
  metricsMiddleware,
  socketConnected,
  socketDisconnected,
};

