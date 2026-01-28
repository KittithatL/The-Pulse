const db = require('../config/database');


const getMessages = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await db.query(
      `SELECT 
        tm.message_id,
        tm.message,
        tm.created_at,
        u.user_id,
        u.username,
        u.full_name,
        u.avatar_url
      FROM task_messages tm
      JOIN users u ON tm.user_id = u.user_id
      WHERE tm.task_id = $1
      ORDER BY tm.created_at ASC
      LIMIT $2 OFFSET $3`,
      [taskId, limit, offset]
    );

    return res.status(200).json({
      success: true,
      data: {
        messages: result.rows,
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
    });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.user_id;
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty',
      });
    }

    const memberCheck = await db.query(
      `SELECT pm.member_id 
       FROM project_members pm
       JOIN tasks t ON pm.project_id = t.project_id
       WHERE t.task_id = $1 AND pm.user_id = $2`,
      [taskId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this project',
      });
    }

    const result = await db.query(
      `INSERT INTO task_messages (task_id, user_id, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [taskId, userId, message.trim()]
    );

    const messageData = result.rows[0];

    const userResult = await db.query(
      'SELECT username, full_name, avatar_url FROM users WHERE user_id = $1',
      [userId]
    );

    const user = userResult.rows[0];

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message: {
          ...messageData,
          user_id: userId,
          username: user.username,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
        },
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send message',
    });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.user_id;

    const result = await db.query(
      'DELETE FROM task_messages WHERE message_id = $1 AND user_id = $2 RETURNING message_id',
      [messageId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or you do not have permission to delete it',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Delete message error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete message',
    });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  deleteMessage,
};
