const express = require('express');
const router = express.Router();

const taskController = require('../controllers/taskController');
const messageController = require('../controllers/messageController');

const { protect } = require('../middleware/authMiddleware');
const { 
  checkTaskProjectMember, 
  checkTaskProjectOwner, 
  checkTaskAccess, // ใช้สำหรับ Edit/Delete
  checkMessageAccess 
} = require('../middleware/taskAuth');

router.use(protect);

// ❌ ลบ Route /projects/... ออกจากที่นี่ให้หมดครับ

/**
 * =========================
 * Tasks (Task Scoped)
 * URL เริ่มต้นด้วย /api/tasks/...
 * =========================
 */

// GET /api/tasks/:taskId
router.get('/:taskId', checkTaskProjectMember, taskController.getTask);

// PUT /api/tasks/:taskId
router.put('/:taskId', checkTaskAccess, taskController.updateTask);

// DELETE /api/tasks/:taskId
router.delete('/:taskId', checkTaskAccess, taskController.deleteTask);

/**
 * =========================
 * Task Messages (Chat)
 * =========================
 */
router.get('/:taskId/messages', checkTaskProjectMember, messageController.getMessages);
router.post('/:taskId/messages', checkTaskProjectMember, messageController.sendMessage);
router.delete('/messages/:messageId', checkMessageAccess, messageController.deleteMessage);

module.exports = router;