const isValidInt = (v) =>
  v !== undefined && v !== null && String(v).trim() !== '' && !Number.isNaN(Number(v));

function parseIdList(raw) {
  return String(raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter(isValidInt)
    .map((s) => Number(s));
}

const requireAdmin = (req, res, next) => {
  const allowlist = parseIdList(process.env.ADMIN_USER_IDS);
  if (allowlist.length === 0) return next(); // allow all if not configured

  const uid = req.user?.id;
  if (!isValidInt(uid) || !allowlist.includes(Number(uid))) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }

  return next();
};

module.exports = { requireAdmin };

