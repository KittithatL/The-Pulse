const db = require('../config/database');

const checkProjectMember = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.user_id;

    const result = await db.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this project',
      });
    }

    req.projectRole = result.rows[0].role;
    next();
  } catch (error) {
    console.error('Project authorization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization check failed',
    });
  }
};

const checkProjectOwnerOrAdmin = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.user_id;

    const result = await db.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this project',
      });
    }

    const role = result.rows[0].role;
    
    if (role !== 'owner' && role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only project owners or admins can perform this action',
      });
    }

    req.projectRole = role;
    next();
  } catch (error) {
    console.error('Project authorization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization check failed',
    });
  }
};

module.exports = {
  checkProjectMember,
  checkProjectOwnerOrAdmin,
};
