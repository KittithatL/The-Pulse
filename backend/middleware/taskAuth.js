const db = require('../config/database');

// helper: check member/owner ด้วย projectId
const _checkRole = async (projectId, userId) => {
  const r = await db.query(
    'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, userId]
  );
  return r.rows[0]?.role || null;
};

// ✅ ใช้กับ /tasks/:taskId เพื่อดึง Project ID มาแปะที่ req
const attachProjectIdFromTask = async (req, res, next) => {
  try {
    const taskId = req.params.taskId;
    if (!taskId) return res.status(400).json({ success: false, message: 'Task id is required' });

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

// ✅ สำหรับสมาชิกทุกคนในโปรเจกต์
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
      req.params.projectId = req.projectIdFromTask;
      next();
    });
  } catch (err) {
    console.error('checkTaskProjectMember error:', err);
    return res.status(500).json({ success: false, message: 'Authorization check failed' });
  }
};

// ✅ สำหรับ Owner เท่านั้น (ที่คุณใช้ใน Delete ตอนแรก)
const checkTaskProjectOwner = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    await attachProjectIdFromTask(req, res, async () => {
      const role = await _checkRole(req.projectIdFromTask, userId);
      if (role !== 'owner') {
        return res.status(403).json({ success: false, message: 'Only project owner can perform this action' });
      }
      req.projectRole = role;
      next();
    });
  } catch (err) {
    console.error('checkTaskProjectOwner error:', err);
    return res.status(500).json({ success: false, message: 'Authorization check failed' });
  }
};

// ✅ สำหรับ Owner หรือ Assignee หรือ Creator (ใช้กับ Edit/Delete ที่ Assignee ทำได้)
const checkTaskAccess = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { taskId } = req.params;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // เปลี่ยนจาก pool.query เป็น db.query
    const taskResult = await db.query(
      'SELECT project_id, assigned_to, created_by FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const task = taskResult.rows[0];
    const role = await _checkRole(task.project_id, userId);

    const isOwner = role === 'owner';
    const isAssignee = String(task.assigned_to) === String(userId);
    const isCreator = String(task.created_by) === String(userId);

    if (isOwner || isAssignee || isCreator) {
      req.projectRole = role;
      req.isTaskAssignee = isAssignee;
      req.params.projectId = task.project_id;
      next();
    } else {
      return res.status(403).json({ 
        success: false, 
        message: 'Permission denied. Only owner, assignee, or creator can perform this action.' 
      });
    }
  } catch (err) {
    console.error('checkTaskAccess error:', err);
    return res.status(500).json({ success: false, message: 'Authorization check failed' });
  }
};

// ✅ สำหรับ Message
const checkMessageProjectMember = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { messageId } = req.params;
    const result = await db.query(
      'SELECT t.project_id FROM messages m JOIN tasks t ON t.id = m.task_id WHERE m.id = $1',
      [messageId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const projectId = String(result.rows[0].project_id);
    const role = await _checkRole(projectId, userId);

    if (!role) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    req.projectRole = role;
    next();
  } catch (err) {
    console.error('checkMessageProjectMember error:', err);
    return res.status(500).json({ success: false, message: 'Authorization check failed' });
  }
};

module.exports = {
  attachProjectIdFromTask,
  checkTaskProjectMember,
  checkTaskProjectOwner,
  checkMessageProjectMember,
  checkTaskAccess,
};