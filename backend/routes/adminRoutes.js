const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/requireAdmin');

router.use(protect);
router.use(requireAdmin);

router.get('/metrics', adminController.getMetrics);
router.get('/users', adminController.getAllUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/dashboard-stats', adminController.getDashboardStats);
router.get('/logs/login', adminController.getLoginLogs);
router.get('/logs/action', adminController.getActionLogs);

module.exports = router;