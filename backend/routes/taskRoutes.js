const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const messageController = require('../controllers/messageController');
const authenticate = require('../middleware/authenticate');
const { checkProjectMember } = require('../middleware/projectAuth');

// All routes require authentication
router.use(authenticate);

// Task CRUD
router.get('/projects/:projectId/tasks', checkProjectMember, taskController.getTasks);
router.post('/projects/:projectId/tasks', checkProjectMember, taskController.createTask);
router.get('/tasks/:taskId', taskController.getTask);
router.put('/tasks/:taskId', taskController.updateTask);
router.delete('/tasks/:taskId', taskController.deleteTask);

// Task Messages (Chat)
router.get('/tasks/:taskId/messages', messageController.getMessages);
router.post('/tasks/:taskId/messages', messageController.sendMessage);
router.delete('/messages/:messageId', messageController.deleteMessage);

module.exports = router;
