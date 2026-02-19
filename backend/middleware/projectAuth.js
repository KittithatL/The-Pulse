const pool = require('../config/database'); // ✅ ใช้ pool ให้ตรงกับไฟล์อื่น

// ✅ 1. เช็คว่าเป็นสมาชิกใน Project หรือไม่
const checkProjectMember = async (req, res, next) => {
  try {
    // พยายามหา projectId จาก params (ถ้าผ่าน attachProjectIdFromTask มาแล้วจะมีค่านี้)
    const projectId = req.params.projectId; 
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required for authorization check' });
    }

    const result = await pool.query(
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

// ✅ 2. เช็คว่าเป็น Owner หรือไม่
const checkProjectOwner = async (req, res, next) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const result = await pool.query(
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

// ✅ 3. หา Project ID จาก Task ID (Middleware ตัวช่วย)
// ใช้สำหรับ Route ที่ส่งมาแต่ Task ID (เช่น GET /tasks/:id, DELETE /tasks/:id)
const attachProjectIdFromTask = async (req, res, next) => {
  try {
    const taskId = req.params.id || req.params.taskId;
    
    if (!taskId) {
      return res.status(400).json({ success: false, message: 'Task ID is required' });
    }

    // ป้องกัน Error 500 กรณีส่ง text มาแทนตัวเลข
    if (isNaN(taskId)) {
        return res.status(400).json({ success: false, message: 'Invalid Task ID' });
    }

    const result = await pool.query('SELECT project_id FROM tasks WHERE id = $1', [taskId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // ⭐ Key Point: ยัด project_id กลับเข้าไปใน req.params 
    // เพื่อให้ checkProjectMember/Owner ด้านบนทำงานต่อได้โดยไม่ต้องเขียน logic ใหม่
    req.params.projectId = String(result.rows[0].project_id);
    
    next();
  } catch (error) {
    console.error('Attach projectId from task error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ✅ Wrapper: ใช้กับ Route /tasks/:id ที่ต้องการสิทธิ์ Owner
const checkTaskProjectOwner = [attachProjectIdFromTask, checkProjectOwner];

// ✅ Wrapper: ใช้กับ Route /tasks/:id ที่ต้องการสิทธิ์ Member
const checkTaskProjectMember = [attachProjectIdFromTask, checkProjectMember];

module.exports = {
  checkProjectMember,
  checkProjectOwner,
  attachProjectIdFromTask,
  checkTaskProjectOwner,
  checkTaskProjectMember,
};