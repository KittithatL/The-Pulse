const express = require('express');
const router = express.Router();

const taskController = require('../controllers/taskController');
const messageController = require('../controllers/messageController');

const authenticate = require('../middleware/authenticate');

const { checkProjectMember, checkProjectOwner } = require('../middleware/projectAuth');
const {
  checkTaskProjectMember,
  checkTaskProjectOwner,
  checkMessageProjectMember,
  checkTaskAccess,
} = require('../middleware/taskAuth');

// All routes require authentication
router.use(authenticate);

/**
 * =========================
 * Tasks (project scoped)
 * =========================
 */

// ✅ List tasks: member ดูได้
router.get('/projects/:projectId/tasks', checkProjectMember, taskController.getTasks);

// ✅ Create task: owner เท่านั้น
// router.post('/projects/:projectId/tasks', checkProjectOwner, taskController.createTask);
router.post('/projects/:projectId/tasks', checkProjectMember, taskController.createTask);

/**
 * =========================
 * Tasks (task scoped)
 * =========================
 */

// ✅ Get task detail: member ดูได้
router.get('/tasks/:taskId', checkTaskProjectMember, taskController.getTask);

// ✅ Update task: owner เท่านั้น
// router.put('/tasks/:taskId', checkTaskProjectOwner, taskController.updateTask);
router.put('/tasks/:taskId', checkTaskAccess, taskController.updateTask);

// ✅ Delete task: owner เท่านั้น
router.delete('/tasks/:taskId', checkTaskAccess, taskController.deleteTask);

/**
 * =========================
 * Task Messages (Chat)
 * =========================
 */

// ✅ member ของโปรเจคนี้ดู/ส่งได้
router.get('/tasks/:taskId/messages', checkTaskProjectMember, messageController.getMessages);
router.post('/tasks/:taskId/messages', checkTaskProjectMember, messageController.sendMessage);

// ✅ ลบ message: อย่างน้อยต้องเป็น member ของโปรเจคที่ message นั้นสังกัด
router.delete('/messages/:messageId', checkMessageProjectMember, messageController.deleteMessage);

module.exports = router;
