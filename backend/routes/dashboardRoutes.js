const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/:projectId/overview', dashboardController.getDashboardOverview);
router.get('/:projectId/infrastructure', dashboardController.getInfrastructureHealth);
router.get('/:projectId/risks', dashboardController.getRiskAlerts);
router.post('/:projectId/mood', dashboardController.submitTeamMood);


router.patch('/alerts/:alertId/resolve', dashboardController.resolveRiskAlert); 

module.exports = router;