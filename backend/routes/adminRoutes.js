const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/requireAdmin');

router.use(protect);
router.use(requireAdmin);

router.get('/metrics', adminController.getMetrics);

module.exports = router;

