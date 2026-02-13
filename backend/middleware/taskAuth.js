const pool = require('../config/database');

// Helper: เช็ค Role ใน Project
const _checkRole = async (projectId, userId) => {
  const result = await pool.query(
    'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, userId]
  );
  return result.rows[0]?.role || null;
};

// ✅ 1. Middleware สำหรับดึง Project ID จาก Task
const attachProjectIdFromTask = async (req, res, next) => {
  try {
    const taskId = req.params.taskId || req.params.id;
    if (!taskId) return res.status(400).json({ success: false, message: 'Task ID is required' });

    const result = await pool.query('SELECT project_id FROM tasks WHERE id = $1', [taskId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    req.projectIdFromTask = String(result.rows[0].project_id);
    req.params.projectId = req.projectIdFromTask;
    next();
  } catch (err) {
    console.error('attachProjectIdFromTask error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ✅ 2. เช็คว่า User เป็นสมาชิกของ Project (สำหรับ View Task / Get Messages)
const checkTaskProjectMember = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const taskId = req.params.taskId || req.params.id;

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const taskRes = await pool.query('SELECT project_id FROM tasks WHERE id = $1', [taskId]);
    if (taskRes.rows.length === 0) return res.status(404).json({ message: 'Task not found' });

    const projectId = taskRes.rows[0].project_id;
    const role = await _checkRole(projectId, userId);

    if (!role) {
      return res.status(403).json({ success: false, message: 'You are not a member of this project' });
    }

    req.projectRole = role;
    req.params.projectId = String(projectId);
    next();
  } catch (err) {
    console.error('checkTaskProjectMember error:', err);
    return res.status(500).json({ success: false, message: 'Authorization check failed' });
  }
};

// ✅ 3. เช็คว่าเป็น Project Owner (สำหรับ Force Delete Task)
const checkTaskProjectOwner = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const taskId = req.params.taskId || req.params.id;

    const taskRes = await pool.query('SELECT project_id FROM tasks WHERE id = $1', [taskId]);
    if (taskRes.rows.length === 0) return res.status(404).json({ message: 'Task not found' });

    const projectId = taskRes.rows[0].project_id;
    const role = await _checkRole(projectId, userId);

    if (role !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only project owner can perform this action' });
    }

    req.projectRole = role;
    req.params.projectId = String(projectId);
    next();
  } catch (err) {
    console.error('checkTaskProjectOwner error:', err);
    return res.status(500).json({ success: false, message: 'Authorization check failed' });
  }
};

// ✅ 4. เช็คสิทธิ์ Edit/Delete Task (Owner, Assignee, Creator)
const checkTaskAccess = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const taskId = req.params.taskId || req.params.id;
    
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const taskResult = await pool.query(
      'SELECT project_id, assigned_to, created_by FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const task = taskResult.rows[0];
    const role = await _checkRole(task.project_id, userId);

    const isProjectOwner = role === 'owner';
    const isAssignee = String(task.assigned_to) === String(userId);
    const isCreator = String(task.created_by) === String(userId);

    if (isProjectOwner || isAssignee || isCreator) {
      req.projectRole = role;
      req.isTaskAssignee = isAssignee;
      req.params.projectId = String(task.project_id);
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

// ✅ 5. เช็คสิทธิ์ "ลบ" Message (คนเขียน หรือ Owner เท่านั้น)
// ⚠️ สำคัญ: ใช้สำหรับ DELETE /messages/:messageId
const checkMessageAccess = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { messageId } = req.params;

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // ดึงข้อมูล Message + Task Project ID
    const result = await pool.query(
      `SELECT m.user_id as author_id, t.project_id 
       FROM task_messages m 
       JOIN tasks t ON t.id = m.task_id 
       WHERE m.id = $1`,
      [messageId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const { author_id, project_id } = result.rows[0];
    const role = await _checkRole(project_id, userId);

    const isAuthor = String(author_id) === String(userId);
    const isOwner = role === 'owner';

    // อนุญาตถ้าเป็น: คนเขียนข้อความ หรือ Project Owner
    if (isAuthor || isOwner) {
      req.projectRole = role;
      next();
    } else {
      return res.status(403).json({ success: false, message: 'You can only delete your own messages' });
    }

  } catch (err) {
    console.error('checkMessageAccess error:', err);
    return res.status(500).json({ success: false, message: 'Authorization check failed' });
  }
};

module.exports = {
  attachProjectIdFromTask,
  checkTaskProjectMember,
  checkTaskProjectOwner,
  checkTaskAccess,
  checkMessageAccess,
};