const db = require('../config/database');

// helper: check member/owner ด้วย projectId
const _checkRole = async (projectId, userId) => {
  const r = await db.query(
    'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, userId]
  );
  return r.rows[0]?.role || null;
};

// ✅ ใช้กับ /tasks/:taskId
const attachProjectIdFromTask = async (req, res, next) => {
  try {
    const taskId = req.params.taskId;
    if (!taskId) return res.status(400).json({ success: false, message: 'Task id is required' });

    // schema ของคุณ tasks PK = id
    const result = await db.query('SELECT project_id FROM tasks WHERE id = $1', [taskId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    req.projectIdFromTask = String(result.rows[0].project_id);
    next();
  } catch (err) {
    console.error('attachProjectIdFromTask error:', err);
    return res.status(500).json({ success: false, message: 'Authorization check failed' });
  }
};

const checkTaskProjectMember = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    await attachProjectIdFromTask(req, res, async () => {
      const role = await _checkRole(req.projectIdFromTask, userId);
      if (!role) {
        return res.status(403).json({ success: false, message: 'You are not a member of this project' });
      }
      req.projectRole = role;
      req.params.projectId = req.projectIdFromTask; // เผื่อ controller อยากใช้
      next();
    });
  } catch (err) {
    console.error('checkTaskProjectMember error:', err);
    return res.status(500).json({ success: false, message: 'Authorization check failed' });
  }
};

const checkTaskProjectOwner = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    await attachProjectIdFromTask(req, res, async () => {
      const role = await _checkRole(req.projectIdFromTask, userId);
      if (!role) {
        return res.status(403).json({ success: false, message: 'You are not a member of this project' });
      }
      if (role !== 'owner') {
        return res.status(403).json({ success: false, message: 'Only project owner can perform this action' });
      }
      req.projectRole = role;
      req.params.projectId = req.projectIdFromTask;
      next();
    });
  } catch (err) {
    console.error('checkTaskProjectOwner error:', err);
    return res.status(500).json({ success: false, message: 'Authorization check failed' });
  }
};

// ✅ ใช้กับ /messages/:messageId (กันลบมั่ว)
const checkMessageProjectMember = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { messageId } = req.params;
    if (!messageId) return res.status(400).json({ success: false, message: 'Message id is required' });

    // หา project_id ผ่าน messages -> tasks
    const result = await db.query(
      `
      SELECT t.project_id
      FROM messages m
      JOIN tasks t ON t.id = m.task_id
      WHERE m.id = $1
      `,
      [messageId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const projectId = String(result.rows[0].project_id);
    const role = await _checkRole(projectId, userId);

    if (!role) {
      return res.status(403).json({ success: false, message: 'You are not a member of this project' });
    }

    req.projectRole = role;
    req.params.projectId = projectId;
    next();
  } catch (err) {
    console.error('checkMessageProjectMember error:', err);
    return res.status(500).json({ success: false, message: 'Authorization check failed' });
  }
};

module.exports = {
  checkTaskProjectMember,
  checkTaskProjectOwner,
  checkMessageProjectMember,
};
