const express = require('express');
const router = express.Router();

const taskController = require('../controllers/taskController');
const messageController = require('../controllers/messageController');

const { protect } = require('../middleware/authMiddleware');
const { 
  checkTaskProjectMember, 
  checkTaskAccess, 
  checkMessageAccess 
} = require('../middleware/taskAuth');

// 🔒 ป้องกันการเข้าถึง: ต้องทำการ Login (Authentication) ก่อนเข้าถึงข้อมูลทุกส่วน
router.use(protect);

/**
 * =========================
 * ✅ 1. My Tasks (Global Scoped)
 * [IMPORTANT] ต้องวางไว้ก่อน /:taskId เพื่อไม่ให้ Express สับสนว่า 'my-tasks' คือ ID
 * =========================
 */
// GET /api/task/my-tasks
router.get('/my-tasks', taskController.getMyTasks); 

/**
 * =========================
 * 2. Tasks (Task Scoped)
 * URL เริ่มต้นด้วย /api/task/...
 * =========================
 */

// ดึงรายละเอียดงานเดี่ยว: GET /api/task/:taskId
router.get('/:taskId', checkTaskProjectMember, taskController.getTask);

// อัปเดตงาน (Status/Detail): PUT /api/task/:taskId
router.put('/:taskId', checkTaskAccess, taskController.updateTask);

// ลบงาน: DELETE /api/task/:taskId
router.delete('/:taskId', checkTaskAccess, taskController.deleteTask);

/**
 * =========================
 * 3. Task Messages (Chat Context)
 * =========================
 */
// ดึงข้อความแชทในงาน: GET /api/task/:taskId/messages
router.get('/:taskId/messages', checkTaskProjectMember, messageController.getMessages);

// ส่งข้อความ: POST /api/task/:taskId/messages
router.post('/:taskId/messages', checkTaskProjectMember, messageController.sendMessage);

// ลบข้อความ: DELETE /api/task/messages/:messageId
router.delete('/messages/:messageId', checkMessageAccess, messageController.deleteMessage);

module.exports = router;