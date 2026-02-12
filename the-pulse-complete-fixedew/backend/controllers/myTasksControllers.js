const db = require('../config/database');

const getMyTasks = async (req, res) => {
  try {
    // ✅ ดึง userId (UUID) จาก authenticate middleware
    // ถ้าไม่มีให้ return 401 ไปเลย ดีกว่า fallback เป็น 1 (เพราะ UUID ไม่ใช่ตัวเลข)
    const userId = req.user ? req.user.id : null; 

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No user ID found' });
    }

    const result = await db.query(
      `SELECT 
        t.id AS task_id,    -- ใช้ Alias ให้ตรงกับที่ Frontend เรียก
        t.name,             -- ✅ เปลี่ยนจาก title เป็น name
        t.description,
        t.status,
        t.deadline,
        t.project_id,
        p.name AS project_name, -- ✅ เปลี่ยนจาก p.title เป็น p.name
        t.created_at,
        'medium' AS priority,
        0 AS checklists_done,
        0 AS checklists_total
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.assigned_to = $1 -- ❌ ลบ ::bigint ออก เพราะเป็น UUID (String)
      ORDER BY 
        CASE t.status 
          WHEN 'doing' THEN 1 
          WHEN 'todo' THEN 2 
          WHEN 'done' THEN 3 
          ELSE 4
        END, 
        t.deadline ASC NULLS LAST`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: { tasks: result.rows },
    });
  } catch (error) {
    console.error('❌ SQL ERROR ใน getMyTasks:', error.message); 
    return res.status(500).json({
      success: false,
      message: 'Server Error: ' + error.message,
    });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    // ✅ ลบการ Casting ::bigint ทิ้งให้หมด เพราะ UUID เทียบกันเป็น String ได้เลย
    const result = await db.query(
      `UPDATE tasks 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND assigned_to = $3
       RETURNING *`,
      [status, taskId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found or permission denied' });
    }

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ SQL ERROR ใน updateTaskStatus:', error.message);
    return res.status(500).json({ success: false, message: 'Update failed: ' + error.message });
  }
};

module.exports = {
  getMyTasks,
  updateTaskStatus
};