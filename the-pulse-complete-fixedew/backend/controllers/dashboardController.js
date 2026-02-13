const db = require('../config/database');

// --- Helper Functions ---
const calculateRiskLevel = (overdue, critical) => {
  if (overdue > 5 || critical > 2) return 'CRITICAL';
  if (overdue > 2 || critical > 0) return 'HIGH';
  if (overdue > 0) return 'MEDIUM';
  return 'LOW';
};

const generateAIBriefing = (completion, risk, projectName) => {
  if (risk === 'CRITICAL') return `ALERT: Critical bottlenecks detected in ${projectName}. Immediate action required.`;
  if (completion === 100) return "Mission Accomplished. All systems nominal.";
  if (completion > 80) return "Final approach. Optimization protocols active.";
  if (completion === 0) return "System Initialized. Awaiting task execution.";
  return "Operations active. Tracking velocity and team sentiment.";
};

// ✅ 1. Overview Stats (สูตรใหม่: งาน + อารมณ์)
exports.getDashboardOverview = async (req, res) => {
  const { projectId } = req.params;
  try {
    // 1.1 ดึงข้อมูล Project
    const projectRes = await db.query(
      `SELECT name, deadline FROM projects WHERE id = $1`, [projectId]
    );
    if (projectRes.rows.length === 0) return res.status(404).json({ message: 'Project not found' });
    const project = projectRes.rows[0];

    // 1.2 ดึงข้อมูล Task Stats (ปรับ SQL ให้รองรับตัวพิมพ์เล็ก/ใหญ่)
    const taskRes = await db.query(`
      SELECT 
        COUNT(*) as total,
        -- ใช้ LOWER() เพื่อให้ DONE, Done, done นับเป็นเสร็จหมด
        COUNT(*) FILTER (WHERE LOWER(status) = 'done') as done,
        COUNT(*) FILTER (WHERE LOWER(status) != 'done' AND deadline < NOW()) as overdue,
        COUNT(*) FILTER (WHERE priority = 'critical' AND LOWER(status) != 'done') as critical_open
      FROM tasks 
      WHERE project_id = $1
    `, [projectId]);
    
    const stats = taskRes.rows[0];
    const total = parseInt(stats.total) || 0;
    const done = parseInt(stats.done) || 0;
    const overdue = parseInt(stats.overdue) || 0;
    const critical = parseInt(stats.critical_open) || 0;

    // 1.3 ดึงข้อมูล Mood
    const moodRes = await db.query(`
      SELECT AVG(sentiment_score) as avg_score, COUNT(*) as total_responses
      FROM project_moods 
      WHERE project_id = $1
    `, [projectId]);
    
    const rawMood = parseFloat(moodRes.rows[0].avg_score || 0);
    const moodScore = rawMood.toFixed(1);
    const totalMoods = parseInt(moodRes.rows[0].total_responses) || 0;

    // --- 1.4 Logic สูตรคำนวณใหม่ ---
    
    // A. Completion %
    const completionPercent = total > 0 ? Math.round((done / total) * 100) : 0;

    // B. Task Health (งานส่งช้าเยอะ สุขภาพงานยิ่งแย่)
    const taskHealth = total > 0 ? ((total - overdue) / total) * 100 : 100;

    // C. Mood Health (แปลงคะแนนเต็ม 5 เป็นเต็ม 100)
    const moodHealth = (rawMood / 5) * 100;

    // D. Efficiency Score (Weighted Average: งาน 70% + อารมณ์ 30%)
    let efficiencyPercent;
    if (totalMoods > 0) {
        efficiencyPercent = Math.round((taskHealth * 0.7) + (moodHealth * 0.3));
    } else {
        efficiencyPercent = Math.round(taskHealth);
    }

    const riskLevel = calculateRiskLevel(overdue, critical);
    const aiBriefing = generateAIBriefing(completionPercent, riskLevel, project.name);

    res.json({
      success: true,
      data: {
        project: { name: project.name },
        ai_briefing: aiBriefing,
        completion: { percentage: completionPercent, completed_tasks: done, total_tasks: total },
        efficiency: { percentage: efficiencyPercent },
        risk_level: riskLevel,
        team_mood: { score: moodScore, total_responses: totalMoods },
        learning_capacity: { percentage: 85, due_date: project.deadline } 
      }
    });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ success: false, message: err.message }); 
  }
};

// ✅ 2. Infrastructure Health (Software Monitor)
exports.getInfrastructureHealth = async (req, res) => {
  try {
    const components = [];

    // 2.1 เช็ค Database (PostgreSQL)
    const start = Date.now();
    try {
      await db.query('SELECT 1'); 
      const dbLatency = Date.now() - start;
      components.push({ component_name: 'PostgreSQL Database', status: 'online', latency: dbLatency, updated_at: new Date() });
    } catch (dbErr) {
      components.push({ component_name: 'PostgreSQL Database', status: 'error', latency: 9999, updated_at: new Date() });
    }

    // 2.2 เช็ค API Server Memory (RAM)
    const memoryUsage = process.memoryUsage();
    const ramUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    
    components.push({
      component_name: 'API Server RAM',
      status: ramUsageMB > 500 ? 'high_load' : 'online',
      latency: ramUsageMB, // ส่งค่าเป็น MB
      updated_at: new Date()
    });

    // 2.3 เช็ค Uptime (ชั่วโมง)
    const uptimeHours = (process.uptime() / 3600).toFixed(2);
    components.push({
      component_name: 'System Uptime',
      status: 'online',
      latency: uptimeHours, // ส่งค่าเป็นชั่วโมง
      updated_at: new Date()
    });

    res.json({ success: true, data: { components } });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ 3. Risk Alerts (Generate จากงานที่ Overdue)
exports.getRiskAlerts = async (req, res) => {
  try {
    const { projectId } = req.params;
    // ปรับ SQL ให้รองรับตัวพิมพ์เล็ก/ใหญ่ (LOWER)
    const result = await db.query(`
      SELECT id, name, priority, deadline 
      FROM tasks 
      WHERE project_id = $1 
      AND (deadline < NOW() OR priority = 'critical') 
      AND LOWER(status) != 'done'
      ORDER BY deadline ASC
      LIMIT 5
    `, [projectId]);

    const alerts = result.rows.map(task => ({
      id: task.id,
      severity: task.priority === 'critical' ? 'CRITICAL' : 'HIGH',
      message: `Task "${task.name}" is ${task.priority === 'critical' ? 'CRITICAL STATUS' : 'OVERDUE'}`,
      created_at: new Date()
    }));

    if (alerts.length === 0) {
      alerts.push({ id: 0, severity: 'LOW', message: 'System stable. No anomalies detected.', created_at: new Date() });
    }

    res.json({ success: true, data: { alerts } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ✅ 4. Submit Mood
exports.submitTeamMood = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { sentiment_score } = req.body;
    const userId = req.user.id;

    await db.query(
      `INSERT INTO project_moods (project_id, user_id, sentiment_score) VALUES ($1, $2, $3)`, 
      [projectId, userId, sentiment_score]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ✅ 5. Resolve Alert
exports.resolveRiskAlert = async (req, res) => {
  res.json({ success: true, message: 'Acknowledged' });
};