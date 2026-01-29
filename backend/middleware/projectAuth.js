const db = require('../config/database');

const checkProjectMember = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

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
    return res.status(500).json({ success: false, message: 'Authorization check failed' });
  }
};

const checkProjectOwner = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

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

    if (role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only project owner can perform this action',
      });
    }

    req.projectRole = role;
    next();
  } catch (error) {
    console.error('Project authorization error:', error);
    return res.status(500).json({ success: false, message: 'Authorization check failed' });
  }
};

// ✅ ใช้กับ /tasks/:id เพื่อหา projectId ของ task นั้นก่อน
const attachProjectIdFromTask = async (req, res, next) => {
  try {
    const taskId = req.params.id || req.params.taskId;
    if (!taskId) {
      return res.status(400).json({ success: false, message: 'Task id is required' });
    }

    const result = await db.query('SELECT project_id FROM tasks WHERE id = $1', [taskId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // ใส่ projectId ให้ middleware ตัวอื่นใช้ต่อ
    req.params.projectId = String(result.rows[0].project_id);
    next();
  } catch (error) {
    console.error('Attach projectId from task error:', error);
    return res.status(500).json({ success: false, message: 'Authorization check failed' });
  }
};

// ✅ Owner-only สำหรับ routes /tasks/:id (อาศัย attachProjectIdFromTask)
const checkTaskProjectOwner = async (req, res, next) => {
  return checkProjectOwner(req, res, next);
};

// ✅ Member-only สำหรับ routes /tasks/:id (อาศัย attachProjectIdFromTask)
const checkTaskProjectMember = async (req, res, next) => {
  return checkProjectMember(req, res, next);
};

module.exports = {
  checkProjectMember,
  checkProjectOwner,
  attachProjectIdFromTask,
  checkTaskProjectOwner,
  checkTaskProjectMember,
};
