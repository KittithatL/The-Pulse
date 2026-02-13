const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
// 🚩 1. อย่าลืม Import taskController เข้ามาด้วย! (สำคัญ)
const taskController = require('../controllers/taskController'); 
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// --- Project Routes ---
router.get('/', projectController.getProjects);
router.post('/', projectController.createProject);
router.get('/:projectId', projectController.getProject);
router.put('/:projectId', projectController.updateProject);
router.delete('/:projectId', projectController.deleteProject);

// --- Member Routes ---
router.get('/:projectId/members', projectController.getMembers);
router.post('/:projectId/members', projectController.addMember);
// router.delete('/:projectId/members/:userId', projectController.removeMember);

// --- 🚩 2. Task Routes (จุดที่แก้ปัญหา Route not found) ---
// ต้องมี 2 บรรทัดนี้ เพื่อให้ดึงงาน (GET) และสร้างงาน (POST) ภายใต้โปรเจกต์ได้
router.get('/:projectId/tasks', taskController.getTasks);  
router.post('/:projectId/tasks', taskController.createTask); // 👈 บรรทัดนี้แหละที่ขาดไป!
router.put('/tasks/:taskId/status', taskController.updateTaskStatus);
module.exports = router;