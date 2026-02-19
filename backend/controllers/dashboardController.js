const pool = require('../config/database');

// ✅ 1. Overview Stats
exports.getDashboardOverview = async (req, res) => {
  const { projectId } = req.params;
  try {
    const taskRes = await pool.query(
      `SELECT COUNT(*) as total, 
              COUNT(*) FILTER (WHERE status = 'done') as done 
       FROM public.tasks WHERE project_id = $1`, [projectId]
    );

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

    const moodRes = await pool.query(
      `SELECT AVG(sentiment_score)::numeric(3,1) as avg_score, 
              COUNT(*) as total_votes 
       FROM public.team_mood WHERE project_id = $1`, [projectId]
    );

    const riskRes = await pool.query(
      `SELECT COUNT(*) as active_risks 
       FROM public.risk_alerts WHERE project_id = $1 AND is_resolved = false`, [projectId]
    );

    const stats = taskRes.rows[0];
    const project = projectRes.rows[0];
    const mood = moodRes.rows[0];
    const activeRisks = parseInt(riskRes.rows[0].active_risks);

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
        efficiency: { percentage: actualEfficiency },
        risk_level: dynamicRiskLevel,
        team_mood: { 
          score: mood.avg_score || "0.0", 
          total_responses: parseInt(mood.total_votes || 0) ,
          user_voted_score: userVoteRes.rows.length > 0 ? parseInt(userVoteRes.rows[0].sentiment_score) : null
        },
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

// ✅ 1.5 Get Project Tasks
exports.getProjectTasks = async (req, res) => {
  const { projectId } = req.params;
  try {
    // ✅ แก้จาก name เป็น title
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

// ✅ 6. Data สำหรับหน้า Risk Sentinel (รวม Mood, Deadline, จำนวนงาน)
exports.getRiskSentinelData = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    console.log(`\n--- 🔍 สแกนความเสี่ยง (Project ID: ${projectId}) ---`);

    // 1. ดึงงานที่ยังไม่เสร็จทั้งหมด ✅ (แก้ t.name เป็น t.title)
    const openTasksRes = await pool.query(`
      SELECT t.id, t.title, t.priority, t.deadline, u.username as assignee
      FROM public.tasks t
      LEFT JOIN public.users u ON t.assigned_to = u.id
      WHERE t.project_id = $1 AND t.status != 'done'
    `, [projectId]);
    const openTasks = openTasksRes.rows;
    console.log(`📦 พบงานที่ค้างอยู่: ${openTasks.length} งาน`);

    // 2. ดึงค่าเฉลี่ยอารมณ์ทีม (Mood)
    const moodRes = await pool.query(`
      SELECT AVG(sentiment_score)::numeric(3,1) as avg_score 
      FROM public.team_mood WHERE project_id = $1
    `, [projectId]);
    const avgMood = parseFloat(moodRes.rows[0]?.avg_score || 3.0); 
    console.log(`❤️ อารมณ์ทีมเฉลี่ย: ${avgMood} / 5.0`);

    // 3. นับจำนวนงาน (Workload) ของแต่ละคน
    const assigneeCounts = {};
    let totalAssignedTasks = 0;
    openTasks.forEach(task => {
      if (task.assignee) {
        assigneeCounts[task.assignee] = (assigneeCounts[task.assignee] || 0) + 1;
        totalAssignedTasks++;
      }
    });
    console.log(`🧑‍💻 งานที่มีการมอบหมายแล้ว: ${totalAssignedTasks} งาน`);

    // --- 4. คำนวณ Matrix Data ---
    const matrixData = openTasks.map(task => {
      // ดักบัคตัวพิมพ์เล็ก-ใหญ่ของ Priority
      const priorityVal = task.priority ? task.priority.toLowerCase() : 'medium';

      // Impact (แกน Y) - คิดจากความสำคัญของงาน
      let impact = 20;
      if (priorityVal === 'critical') impact = 90;
      else if (priorityVal === 'high') impact = 70;
      else if (priorityVal === 'medium') impact = 40;

      // Likelihood (แกน X) - โอกาสที่จะมีปัญหา (เริ่มที่ 10%)
      let likelihood = 10; 

      // ปัจจัยที่ 1: Deadline (วันกำหนดส่ง)
      if (task.deadline) {
        const daysLeft = Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) likelihood += 60; // เลยเดดไลน์ (อันตรายมาก)
        else if (daysLeft <= 3) likelihood += 40; // ใกล้เดดไลน์มากๆ
        else if (daysLeft <= 7) likelihood += 20; // เหลืออีกไม่กี่วัน
      }

      // ปัจจัยที่ 2: Team Mood (อารมณ์ทีม)
      if (avgMood <= 2.0) likelihood += 20; // ทีมเครียดจัด โอกาสพลาดสูงขึ้น
      else if (avgMood <= 3.0) likelihood += 10; // ทีมตึงๆ
      else if (avgMood >= 4.5) likelihood -= 10; // ทีมมีความสุขมาก โอกาสพลาดลดลง

      // ปัจจัยที่ 3: Workload (จำนวนงานในมือของคนรับผิดชอบ)
      const userTaskCount = task.assignee ? (assigneeCounts[task.assignee] || 0) : 0;
      if (userTaskCount >= 5) likelihood += 20; // งานล้นมือจัดๆ
      else if (userTaskCount >= 3) likelihood += 10; // งานเริ่มเยอะ

      // จำกัด Likelihood ให้อยู่ระหว่าง 5% ถึง 95%
      likelihood = Math.min(95, Math.max(5, likelihood));

      return {
        id: task.id,
        name: task.title, // ✅ เปลี่ยนเป็น task.title
        impact,
        likelihood,
        severity: priorityVal 
      };
    });

    // --- 5. คำนวณ Bus Factor ---
    const sortedAssignees = Object.entries(assigneeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    let busFactor = 0;
    let criticalHolders = [];
    
    // คำนวณจากงานที่ถูก Assign แล้วเท่านั้น ป้องกัน Error
    if (sortedAssignees.length > 0 && totalAssignedTasks > 0) {
      if (sortedAssignees[0].count / totalAssignedTasks > 0.5) {
        busFactor = 1; 
        criticalHolders = [sortedAssignees[0].name];
      } else if (sortedAssignees.length >= 2 && (sortedAssignees[0].count + sortedAssignees[1].count) / totalAssignedTasks > 0.6) {
        busFactor = 2; 
        criticalHolders = [sortedAssignees[0].name, sortedAssignees[1].name];
      } else {
        busFactor = sortedAssignees.length > 3 ? 3 : sortedAssignees.length; 
        criticalHolders = sortedAssignees.slice(0, 2).map(a => a.name);
      }
    }

    const busFactorDetails = {
      factor: busFactor || 'N/A',
      holders: criticalHolders,
      message: criticalHolders.length > 0 
        ? `"Pulse detects delivery risk: ${criticalHolders.join(' & ')} handle most of the ${totalAssignedTasks} open tasks. Current Team Mood: ${avgMood}/5."`
        : `"Workload is evenly distributed or tasks are unassigned. System stable with Team Mood at ${avgMood}/5."`
    };

    // --- 6. ดึง Mitigation Tasks (งานด่วน) ---
    // ✅ แก้ t.name เป็น t.title
    const mitigationTasksRes = await pool.query(`
      SELECT t.id, t.title, t.status, u.username as assignee
      FROM public.tasks t
      LEFT JOIN public.users u ON t.assigned_to = u.id
      WHERE t.project_id = $1 
      AND (t.priority = 'critical' OR t.priority = 'high' OR t.priority = 'CRITICAL' OR t.priority = 'HIGH') 
      AND t.status != 'done'
      ORDER BY t.updated_at DESC
      LIMIT 4
    `, [projectId]);
    
    console.log(`🚨 พบงานด่วน (Critical/High): ${mitigationTasksRes.rows.length} งาน`);
    console.log(`---------------------------------------------------\n`);

    res.json({
      success: true,
      data: {
        matrixData,
        busFactor: busFactorDetails,
        mitigationTasks: mitigationTasksRes.rows
      }
    });

  } catch (error) {
    console.error('Risk Sentinel Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch risk data' });
  }
};