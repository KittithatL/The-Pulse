const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authenticate = require('../middleware/authenticate');
const { checkProjectMember, checkProjectOwner } = require('../middleware/projectAuth');

// All project routes require authentication
router.use(authenticate);

// Project CRUD
router.get('/', projectController.getProjects);
router.post('/', projectController.createProject);

// ต้องเป็น member ถึงดู/แก้/ลบ
router.get('/:projectId', checkProjectMember, projectController.getProject);
router.put('/:projectId', checkProjectOwner, projectController.updateProject);
router.delete('/:projectId', checkProjectOwner, projectController.deleteProject);

// Project Members
router.get('/:projectId/members', checkProjectMember, projectController.getMembers);
router.post('/:projectId/members', checkProjectOwner, projectController.addMember);
router.delete('/:projectId/members/:userId', checkProjectOwner, projectController.removeMember);

module.exports = router;
