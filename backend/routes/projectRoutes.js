const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

// Project CRUD (No authentication required)
router.get('/', projectController.getProjects);
router.post('/', projectController.createProject);
router.get('/:projectId', projectController.getProject);
router.put('/:projectId', projectController.updateProject);
router.delete('/:projectId', projectController.deleteProject);

// Project Members
router.get('/:projectId/members', projectController.getMembers);
router.post('/:projectId/members', projectController.addMember);
router.delete('/:projectId/members/:userId', projectController.removeMember);

module.exports = router;
