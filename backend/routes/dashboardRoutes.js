const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

// ป้องกันการเข้าถึง ต้อง Login ก่อน
router.use(protect);

// ----------------------------------------
// Dashboard Overview & KPIs
// ----------------------------------------
router.get('/:projectId/overview', dashboardController.getDashboardOverview);
router.get('/:projectId/infrastructure', dashboardController.getInfrastructureHealth);
router.get('/:projectId/risks', dashboardController.getRiskAlerts);
router.post('/:projectId/mood', dashboardController.submitTeamMood);
router.patch('/alerts/:alertId/resolve', dashboardController.resolveRiskAlert); 

// ----------------------------------------
// 🚀 Risk Sentinel (เพิ่มใหม่ สำหรับหน้านี้โดยเฉพาะ)
// ----------------------------------------
router.get('/:projectId/risk-sentinel', dashboardController.getRiskSentinelData);

module.exports = router;