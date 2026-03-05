const pool = require('../config/database');

/**
 * Helper สำหรับดึง Context ของ Task และ User ใน Query เดียว
 * ช่วยลดจำนวนครั้งที่ต้องต่อ Database
 */
const getTaskWithUserRole = async (taskId, userId) => {
  const query = `
    SELECT 
      t.*, 
      pm.role as user_role
    FROM tasks t
    LEFT JOIN project_members pm ON t.project_id = pm.project_id AND pm.user_id = $2
    WHERE t.id = $1
  `;
  const result = await pool.query(query, [taskId, userId]);
  return result.rows[0];
};

// ✅ 1. Middleware สำหรับดึง Project ID (ตัวเดิมแต่กระชับขึ้น)
const attachProjectIdFromTask = async (req, res, next) => {
  try {
    const taskId = req.params.taskId || req.params.id;
    const result = await pool.query('SELECT project_id FROM tasks WHERE id = $1', [taskId]);
    
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Task not found' });

    req.params.projectId = String(result.rows[0].project_id);
    next();
  } catch (err) {
    next(err);
  }
};

// ✅ 2 & 3 & 4. รวมการเช็คสิทธิ์ Task (ลดการ Query)
const checkTaskAccess = (requiredRole = 'member') => async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const taskId = req.params.taskId || req.params.id;
    
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const task = await getTaskWithUserRole(taskId, userId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const isProjectOwner = task.user_role === 'owner';
    const isAssignee = String(task.assigned_to) === String(userId);
    const isCreator = String(task.created_by) === String(userId);

    // เก็บข้อมูลลง req เผื่อใช้ใน Controller
    req.projectRole = task.user_role;
    req.taskData = task;
    req.params.projectId = String(task.project_id);

    // Logic แยกตามความต้องการ
    if (requiredRole === 'owner' && !isProjectOwner) {
      return res.status(403).json({ success: false, message: 'Only project owner can perform this action' });
    }

    if (!task.user_role) {
      return res.status(403).json({ success: false, message: 'You are not a member of this project' });
    }

    // สำหรับการ Edit/Delete ทั่วไป (Owner, Assignee, Creator)
    if (requiredRole === 'access' && !(isProjectOwner || isAssignee || isCreator)) {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }

    next();
  } catch (err) {
    console.error('checkTaskAccess error:', err);
    res.status(500).json({ success: false, message: 'Authorization check failed' });
  }
};

// ✅ 5. เช็คสิทธิ์ "ลบ" Message
const checkMessageAccess = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { messageId } = req.params;

    const result = await pool.query(
      `SELECT m.user_id as author_id, pm.role 
       FROM task_messages m 
       JOIN tasks t ON t.id = m.task_id 
       LEFT JOIN project_members pm ON t.project_id = pm.project_id AND pm.user_id = $2
       WHERE m.id = $1`,
      [messageId, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Message not found' });

    const { author_id, role } = result.rows[0];
    if (String(author_id) === String(userId) || role === 'owner') {
      req.projectRole = role;
      return next();
    }

    res.status(403).json({ success: false, message: 'You can only manage your own messages or be an owner' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  attachProjectIdFromTask,
  checkTaskProjectMember: checkTaskAccess('member'),
  checkTaskProjectOwner: checkTaskAccess('owner'),
  checkTaskAccess: checkTaskAccess('access'),
  checkMessageAccess,
};