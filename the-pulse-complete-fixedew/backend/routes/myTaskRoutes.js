const express = require('express');
const router = express.Router();

// ✅ ตรวจสอบชื่อไฟล์ Controller ให้ดีว่าคือ 'myTaskController' (ไม่ใช่ taskController ตัวเก่า)
const myTaskController = require('../controllers/myTasksControllers'); 
const authenticate = require('../middleware/authenticate');

// ✅ ตรวจสอบว่า myTaskController.getMyTasks ไม่เป็น undefined
// ถ้าคุณใช้ taskController (ไม่มี my) แต่มันไม่มีฟังก์ชัน getMyTasks อยู่ข้างใน มันจะพังทันทีครับ
router.get('/', authenticate, myTaskController.getMyTasks);
router.patch('/:taskId/status', authenticate, myTaskController.updateTaskStatus);

module.exports = router;