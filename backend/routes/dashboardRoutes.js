const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

// 🔒 ป้องกันการเข้าถึง: ต้องทำการ Login ก่อนเข้าถึงข้อมูลทุกส่วน
router.use(protect);

// ---------------------------------------------------------
// 🔔 Global Notifications & Personal Briefing
// ---------------------------------------------------------

/** * ✅ 1. ดึงการแจ้งเตือนความเสี่ยงและงานทั้งหมด (Navbar)
 */
router.get('/notifications/all', dashboardController.getAllUserNotifications);

/** * ✅ 2. ข้อมูลสรุปสำหรับหน้า My Day (Mission Control Center)
 * ดึงข้อมูล Critical Path, System Integrity และ Gemini Insights
 */
router.get('/my-day/briefing', dashboardController.getMyDayBriefing);

/** * ✅ 3. ล้างการแจ้งเตือนทั้งหมดของผู้ใช้ (Clear All)
 */
router.delete('/notifications/clear-all', dashboardController.clearAllNotifications);


// ---------------------------------------------------------
// 📊 Dashboard Overview & KPIs (รายโปรเจกต์)
// ---------------------------------------------------------

// ดึงข้อมูลสถิติภาพรวม ความคืบหน้า และ AI Briefing
router.get('/:projectId/overview', dashboardController.getDashboardOverview);

// ดึงสถานะสุขภาพของโครงสร้างพื้นฐาน (Hardware/Cloud)
router.get('/:projectId/infrastructure', dashboardController.getInfrastructureHealth);

// ดึงรายการความเสี่ยงที่ยังไม่ได้รับการแก้ไขของโปรเจกต์นั้น
router.get('/:projectId/risks', dashboardController.getRiskAlerts);

// สร้าง Risk Alert (ใช้สำหรับจำลองเหตุการณ์)
router.post('/:projectId/alerts', dashboardController.createRiskAlert);

// บันทึกอารมณ์ของทีม (Sentiment Sync) รายวัน
router.post('/:projectId/mood', dashboardController.submitTeamMood);


// ---------------------------------------------------------
// 🛠️ Action Handlers (Specific IDs)
// ---------------------------------------------------------

// จัดการสถานะการแจ้งเตือนว่า "แก้ไขแล้ว" (Resolve)
router.patch('/alerts/:alertId/resolve', dashboardController.resolveRiskAlert); 


// ---------------------------------------------------------
// 🚀 Risk Sentinel (Strategic Analysis)
// ---------------------------------------------------------

// ดึงข้อมูลการวิเคราะห์เชิงลึก (Matrix, Bus Factor, Mitigation Tasks)
router.get('/:projectId/risk-sentinel', dashboardController.getRiskSentinelData);

module.exports = router;