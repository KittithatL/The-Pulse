const { verifyToken } = require('../utils/jwt');
const db = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const decoded = verifyToken(token);

    // ✅ jwt payload ต้องมี decoded.id
    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // ✅ schema users: id, username, email, password, created_at, updated_at
    const result = await db.query(
      'SELECT id, username, email, created_at, updated_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    req.user = result.rows[0]; // ✅ req.user.id พร้อมใช้งานทุก controller
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

module.exports = authenticate;
