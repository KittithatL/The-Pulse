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
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }
  return next();
};

module.exports = { requireAdmin };

