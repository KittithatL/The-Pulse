const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const projectController = require('../controllers/projectController');
const taskController = require('../controllers/taskController');
const rolesController = require('../controllers/projectRolesController'); // ✅ เพิ่ม

const { checkProjectMember, checkProjectOwner } = require('../middleware/projectAuth');

router.use(protect);

// --- Project CRUD ---
router.get('/',             projectController.getProjects);
router.post('/',            projectController.createProject);
router.get('/:projectId',   checkProjectMember, projectController.getProject);
router.put('/:projectId',   checkProjectOwner,  projectController.updateProject);
router.delete('/:projectId',checkProjectOwner,  projectController.deleteProject);

// --- Member Management ---
router.get('/:projectId/members',           checkProjectMember, projectController.getMembers);
router.post('/:projectId/members',          checkProjectOwner,  projectController.addMember);
router.delete('/:projectId/members/:userId',checkProjectOwner,  projectController.removeMember);

// --- Assign role to member ---
router.put('/:projectId/members/:userId/role', checkProjectMember, rolesController.assignRole); // ✅

// --- Tasks ---
router.get('/:projectId/tasks', checkProjectMember, taskController.getTasks);
router.post('/:projectId/tasks',checkProjectMember, taskController.createTask);

// ── Roles (Discord-style) ────────────────────────────────────────────────────
router.get('/:projectId/roles',             checkProjectMember, rolesController.getRoles);        // ✅
router.post('/:projectId/roles',            checkProjectOwner,  rolesController.createRole);      // ✅
router.put('/:projectId/roles/:roleId',     checkProjectOwner,  rolesController.updateRole);      // ✅
router.delete('/:projectId/roles/:roleId',  checkProjectOwner,  rolesController.deleteRole);      // ✅
router.get('/:projectId/my-permissions',    checkProjectMember, rolesController.getMyPermissions);// ✅

module.exports = router;