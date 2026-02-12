const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.get('/:projectId/overview', dashboardController.getDashboardOverview);
router.post('/:projectId/mood', dashboardController.submitTeamMood);
router.get('/:projectId/mood/history', dashboardController.getTeamMoodHistory);
router.get('/:projectId/infrastructure', dashboardController.getInfrastructureHealth);
router.put('/:projectId/infrastructure', dashboardController.updateInfrastructureStatus);
router.get('/:projectId/risks', dashboardController.getRiskAlerts);
router.post('/:projectId/risks', dashboardController.createRiskAlert);
router.put('/:projectId/risks/:alertId/resolve', dashboardController.resolveRiskAlert);
router.get('/:projectId/cycle', dashboardController.getProjectCycle);

module.exports = router;
