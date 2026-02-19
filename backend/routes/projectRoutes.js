const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Import Controllers
const projectController = require('../controllers/projectController');
const taskController = require('../controllers/taskController'); // 👈 เพิ่มบรรทัดนี้

// Import Middleware
const { checkProjectMember, checkProjectOwner } = require('../middleware/projectAuth');

router.use(protect);

// --- Project CRUD ---
router.get('/', projectController.getProjects);
router.post('/', projectController.createProject);
router.get('/:projectId', checkProjectMember, projectController.getProject);
router.put('/:projectId', checkProjectOwner, projectController.updateProject);
router.delete('/:projectId', checkProjectOwner, projectController.deleteProject);

// --- Member Management ---
router.get('/:projectId/members', checkProjectMember, projectController.getMembers);
router.post('/:projectId/members', checkProjectOwner, projectController.addMember);
router.delete('/:projectId/members/:userId', checkProjectOwner, projectController.removeMember);

// =======================================================
// ✅ ย้ายมาใส่ตรงนี้ (Project Scope Tasks)
// URL จะเป็น: /api/projects/:projectId/tasks
// =======================================================
router.get('/:projectId/tasks', checkProjectMember, taskController.getTasks);
router.post('/:projectId/tasks', checkProjectMember, taskController.createTask);

module.exports = router;