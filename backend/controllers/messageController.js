const pool = require('../config/database'); // ✅ เปลี่ยน db เป็น pool

const getMessages = async (req, res) => {
  try {
    const { taskId } = req.params;
    // Limit & Offset logic (ป้องกันค่าลบและค่าเกิน)
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const offset = Math.max(Number(req.query.offset || 0), 0);

    const result = await pool.query(
      `SELECT 
        tm.id AS message_id,
        tm.message,
        tm.created_at,
        u.id AS user_id,
        u.username
      FROM task_messages tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.task_id = $1
      ORDER BY tm.created_at ASC
      LIMIT $2 OFFSET $3`,
      [taskId, limit, offset]
    );

    return res.status(200).json({
      success: true,
      data: { messages: result.rows },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.id;
    const { message } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });
    if (!message || String(message).trim() === '') {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    // ✅ Double Check: ตรวจสอบอีกครั้งว่า user อยู่ในโปรเจคจริงๆ
    // (แม้ Middleware จะเช็คแล้ว แต่เช็คซ้ำใน Controller เพื่อความปลอดภัยสูงสุด)
    const memberCheck = await pool.query(
      `SELECT 1
       FROM project_members pm
       JOIN tasks t ON pm.project_id = t.project_id
       WHERE t.id = $1 AND pm.user_id = $2`,
      [taskId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'You are not a member of this project' });
    }

    // Insert Message
    const insertResult = await pool.query(
      `INSERT INTO task_messages (task_id, user_id, message)
       VALUES ($1, $2, $3)
       RETURNING id, task_id, user_id, message, created_at`,
      [taskId, userId, String(message).trim()]
    );

    const messageData = insertResult.rows[0];

    // ดึง username มาแปะให้ Frontend แสดงผลได้เลย
    const userResult = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message: {
          ...messageData,
          username: user?.username,
        },
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    // const userId = req.user?.id; // ไม่ต้องใช้ user_id ใน query แล้ว

    // ⚠️ แก้ไข: ลบเงื่อนไข "AND user_id = $2" ออก
    // เพราะเราใช้ Middleware `checkMessageAccess` ตรวจสอบสิทธิ์มาแล้ว (Author OR Owner)
    // ถ้าใส่ user_id ไว้ตรงนี้ Owner จะลบข้อความลูกทีมไม่ได้
    const result = await pool.query(
      'DELETE FROM task_messages WHERE id = $1 RETURNING id',
      [messageId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Delete message error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete message' });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  deleteMessage,
};