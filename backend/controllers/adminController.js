const { computeMetrics, parseRangeToMs } = require('../services/metricsStore');

exports.getMetrics = async (req, res) => {
  try {
    const range = req.query.range || '1h';
    const rangeMs = parseRangeToMs(range);
    const now = Date.now();

    const data = computeMetrics({ rangeMs, now });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    console.error('Admin metrics error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to compute metrics',
    });
  }
};

