const pool = require('../config/database');

// ✅ 1. Overview Stats
exports.getDashboardOverview = async (req, res) => {
  const { projectId } = req.params;
  try {
    // 1. ดึงข้อมูล Task & Project (เหมือนเดิม)
    const taskRes = await pool.query(
      `SELECT COUNT(*) as total, 
              COUNT(*) FILTER (WHERE status = 'done') as done 
       FROM public.tasks WHERE project_id = $1`, [projectId]
    );

    exports.getProjectTasks = async (req, res) => {
      const { projectId } = req.params;
      try {
        const result = await pool.query(
          `SELECT id, title, status, priority, deadline, 
                  (status = 'done') as is_completed
          FROM public.tasks 
          WHERE project_id = $1 
          ORDER BY created_at DESC`, 
          [projectId]
        );
        
        res.json({ 
          success: true, 
          data: { tasks: result.rows } 
        });
      } catch (err) {
        res.status(500).json({ success: false, message: err.message });
      }
    };

    const efficiencyRes = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'done') as total_done,
        COUNT(*) FILTER (WHERE status = 'done' AND updated_at <= deadline) as on_time_done
      FROM public.tasks 
      WHERE project_id = $1`, 
      [projectId]
    );
    const effStats = efficiencyRes.rows[0];
    const totalDone = parseInt(effStats.total_done);
    const onTimeDone = parseInt(effStats.on_time_done);
    const actualEfficiency = totalDone > 0 
      ? Math.round((onTimeDone / totalDone) * 100) 
      : 100;

    const userVoteRes = await pool.query(
      `SELECT sentiment_score FROM public.team_mood 
      WHERE project_id = $1 AND user_id = $2 
      AND created_at::date = CURRENT_DATE 
      LIMIT 1`,
      [projectId, req.user.id]
    );

    const projectRes = await pool.query(
      `SELECT title, learning_capacity, deadline 
       FROM public.projects WHERE id = $1`, [projectId]
    );

    if (projectRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // 2. 🔥 คำนวณค่าเฉลี่ย Mood จริงจาก Database
    const moodRes = await pool.query(
      `SELECT AVG(sentiment_score)::numeric(3,1) as avg_score, 
              COUNT(*) as total_votes 
       FROM public.team_mood WHERE project_id = $1`, [projectId]
    );

    // 3. 🔥 คำนวณ Risk Level ตามจำนวน Alert ที่ยังไม่ถูก Resolve
    const riskRes = await pool.query(
      `SELECT COUNT(*) as active_risks 
       FROM public.risk_alerts WHERE project_id = $1 AND is_resolved = false`, [projectId]
    );

    const stats = taskRes.rows[0];
    const project = projectRes.rows[0];
    const mood = moodRes.rows[0];
    const activeRisks = parseInt(riskRes.rows[0].active_risks);

    // Logic กำหนดระดับความเสี่ยงอัตโนมัติ
    let dynamicRiskLevel = 'low';
    if (activeRisks > 5) dynamicRiskLevel = 'critical';
    else if (activeRisks > 2) dynamicRiskLevel = 'medium';

    const percent = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

    res.json({
      success: true,
      data: {
        project: { name: project.title },
        ai_briefing: activeRisks > 0 
          ? `WARNING: ${activeRisks} active security/risk alerts detected. Immediate review required.`
          : "SYSTEM ANALYSIS: All parameters nominal. Team productivity is stable.",
        completion: { 
          percentage: percent, 
          completed_tasks: parseInt(stats.done), 
          total_tasks: parseInt(stats.total) 
        },
        efficiency: { percentage: 92 }, 
        risk_level: dynamicRiskLevel, // ✅ ใช้ค่าที่คำนวณจริง
        team_mood: { 
          score: mood.avg_score || "0.0", // ✅ ใช้ค่าเฉลี่ยจริง
          total_responses: parseInt(mood.total_votes || 0) ,
          user_voted_score: userVoteRes.rows.length > 0 ? parseInt(userVoteRes.rows[0].sentiment_score) : null
        },
        efficiency: { percentage: actualEfficiency },
        learning_capacity: { 
          percentage: project.learning_capacity || 0, 
          due_date: project.deadline 
        }
      }
    });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ success: false, message: err.message }); 
  }
};

// ✅ 2. Infrastructure Health
exports.getInfrastructureHealth = async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await pool.query(
      `SELECT * FROM public.infrastructure_health WHERE project_id = $1 ORDER BY last_checked DESC`, 
      [projectId]
    );
    res.json({ success: true, data: { components: result.rows } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ✅ 3. Risk Alerts
exports.getRiskAlerts = async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await pool.query(
      `SELECT * FROM public.risk_alerts WHERE project_id = $1 AND is_resolved = false ORDER BY created_at DESC`, 
      [projectId]
    );
    res.json({ success: true, data: { alerts: result.rows } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ✅ 4. Resolve Alert
exports.resolveRiskAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    const result = await pool.query(
      `UPDATE public.risk_alerts SET is_resolved = true WHERE id = $1 RETURNING *`, 
      [alertId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    res.json({ success: true, message: 'Alert Resolved' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ✅ 5. Submit Mood
exports.submitTeamMood = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { sentiment_score } = req.body;
    const userId = req.user.id;

    // 1. ตรวจสอบว่าวันนี้ User คนนี้กดไปหรือยัง (ใช้ CURRENT_DATE ในการเช็ค)
    const checkRes = await pool.query(
      `SELECT id FROM public.team_mood 
       WHERE project_id = $1 AND user_id = $2 
       AND created_at::date = CURRENT_DATE`,
      [projectId, userId]
    );

    if (checkRes.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'LIMIT REACHED: One sentiment sync per day allowed.' 
      });
    }

    // 2. ถ้ายังไม่เคยทำ ให้บันทึกข้อมูล
    await pool.query(
      `INSERT INTO public.team_mood (project_id, user_id, sentiment_score) 
       VALUES ($1, $2, $3)`, 
      [projectId, userId, sentiment_score]
    );

    res.json({ success: true, message: 'SENTIMENT_SYNCED' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};