const db = require('../config/database');

const getMyTasks = async (req, res) => {
  try {
    // ดึง userId จาก authenticate middleware
    const userId = req.user ? req.user.id : 1; 

    const result = await db.query(
      `SELECT 
        t.id,
        t.title,
        t.description,
        t.status,
        t.deadline,
        t.project_id,
        p.title AS project_title,
        t.created_at,
        -- ป้องกัน Error หากยังไม่มีคอลัมน์เหล่านี้ใน DB ให้ส่งค่า Default ไปก่อน
        'medium' AS priority,
        0 AS checklists_done,
        0 AS checklists_total
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.assigned_to::bigint = $1::bigint
      ORDER BY 
        CASE t.status 
          WHEN 'doing' THEN 1 
          WHEN 'todo' THEN 2 
          WHEN 'done' THEN 3 
          ELSE 4
        END, 
        t.deadline ASC`,
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

    // เพิ่มการ Casting ::bigint เพื่อให้ตรงกับโครงสร้าง DB ของคุณ
    const result = await db.query(
      `UPDATE tasks 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND assigned_to::bigint = $3::bigint
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