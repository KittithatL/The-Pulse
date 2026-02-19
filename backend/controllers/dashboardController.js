const pool = require('../config/database');

// ✅ 1. Overview Stats (รายโปรเจกต์)
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

// ✅ 3. Risk Alerts (รายโปรเจกต์)
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

// ✅ 4. ดึงการแจ้งเตือนทั้งหมด (ความเสี่ยงทีม + งานส่วนตัว)
exports.getAllUserNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const risks = await pool.query(
            `SELECT ra.id, ra.message, ra.severity, ra.created_at, p.title as project_name, ra.project_id, 'risk' as type
             FROM public.risk_alerts ra
             JOIN public.project_members pm ON ra.project_id = pm.project_id
             JOIN public.projects p ON ra.project_id = p.id
             WHERE pm.user_id = $1 AND ra.is_resolved = false`,
            [userId]
        );

        const myTasks = await pool.query(
            `SELECT t.id, t.title as message, t.priority as severity, t.created_at, p.title as project_name, t.project_id, 'task' as type
             FROM public.tasks t
             JOIN public.projects p ON t.project_id = p.id
             WHERE t.assigned_to = $1 AND t.status != 'done'`,
            [userId]
        );

        const combined = [...risks.rows, ...myTasks.rows].sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
        );

        res.json({ success: true, data: { alerts: combined } });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ success: false, message: err.message }); 
    }
};

// ✅ 5. ล้างการแจ้งเตือนทั้งหมดของผู้ใช้
exports.clearAllNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        // Resolve Risks ทั้งหมดในโปรเจกต์ที่ user เกี่ยวข้อง
        await pool.query(
            `UPDATE public.risk_alerts ra
             SET is_resolved = true
             FROM public.project_members pm
             WHERE ra.project_id = pm.project_id AND pm.user_id = $1`,
            [userId]
        );

        // ✅ แจ้งเตือนผ่าน Socket ให้หน้าจออัปเดตทันที
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${userId}`).emit('clear_all_notifications');
        }

        res.json({ success: true, message: 'All notifications cleared' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ✅ 6. สร้าง Risk Alert ใหม่ พร้อมส่ง Socket Notification
exports.createRiskAlert = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { severity, message } = req.body;
        
        const result = await pool.query(
            `INSERT INTO public.risk_alerts (project_id, severity, message, is_resolved) 
             VALUES ($1, $2, $3, false) RETURNING *`, 
            [projectId, severity.toLowerCase(), message]
        );

        const projectRes = await pool.query(`SELECT title FROM public.projects WHERE id = $1`, [projectId]);
        const projectName = projectRes.rows[0]?.title || "Unknown Project";

        // ✅ ส่งข้อมูลผ่าน Socket.io (Real-time)
        const io = req.app.get('io');
        if (io) {
            const newNotification = {
                ...result.rows[0],
                project_name: projectName,
                type: 'risk'
            };
            io.emit('new_notification', newNotification);
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ✅ 7. Resolve Alert รายชิ้น
exports.resolveRiskAlert = async (req, res) => {
    try {
        const { alertId } = req.params;
        const result = await pool.query(
            `UPDATE public.risk_alerts SET is_resolved = true WHERE id = $1 RETURNING *`, 
            [alertId]
        );
        if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Alert not found' });
        
        // แจ้งเตือนผ่าน Socket ว่า Alert ถูกแก้แล้ว
        const io = req.app.get('io');
        if (io) {
            io.emit('resolve_notification', { id: alertId, type: 'risk' });
        }

        res.json({ success: true, message: 'Alert Resolved' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ✅ 8. Submit Mood
exports.submitTeamMood = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { sentiment_score } = req.body;
        const userId = req.user.id;

        const checkRes = await pool.query(
            `SELECT id FROM public.team_mood WHERE project_id = $1 AND user_id = $2 AND created_at::date = CURRENT_DATE`,
            [projectId, userId]
        );

        if (checkRes.rows.length > 0) return res.status(400).json({ success: false, message: 'LIMIT REACHED' });

        await pool.query(
            `INSERT INTO public.team_mood (project_id, user_id, sentiment_score) VALUES ($1, $2, $3)`, 
            [projectId, userId, sentiment_score]
        );
        res.json({ success: true, message: 'SENTIMENT_SYNCED' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getMyDayBriefing = async (req, res) => {
    try {
        const userId = req.user.id;
        // 1. งาน Critical
        const critical = await pool.query(`SELECT id, title FROM tasks WHERE assigned_to = $1 AND priority = 'critical' AND status != 'done'`, [userId]);
        // 2. Blocking Risks
        const risks = await pool.query(`SELECT COUNT(*) FROM risk_alerts ra JOIN project_members pm ON ra.project_id = pm.project_id WHERE pm.user_id = $1 AND ra.is_resolved = false`, [userId]);
        
        res.json({
            success: true,
            data: {
                critical_tasks: critical.rows,
                system_integrity: parseInt(risks.rows[0].count) > 0 ? "85%" : "100%",
                gemini_insight: "Analyzing Cycle 42 velocity: Your output is 12% above average.",
                cycle: 42
            }
        });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};

// ✅ 9. Risk Sentinel Data Calculation
exports.getRiskSentinelData = async (req, res) => {
    try {
        const { projectId } = req.params;
        
        const openTasksRes = await pool.query(`
            SELECT t.id, t.title, t.priority, t.deadline, u.username as assignee
            FROM public.tasks t
            LEFT JOIN public.users u ON t.assigned_to = u.id
            WHERE t.project_id = $1 AND t.status != 'done'
        `, [projectId]);
        const openTasks = openTasksRes.rows;

        const moodRes = await pool.query(`SELECT AVG(sentiment_score)::numeric(3,1) as avg_score FROM public.team_mood WHERE project_id = $1`, [projectId]);
        const avgMood = parseFloat(moodRes.rows[0]?.avg_score || 3.0); 

        const assigneeCounts = {};
        let totalAssignedTasks = 0;
        openTasks.forEach(task => {
            if (task.assignee) {
                assigneeCounts[task.assignee] = (assigneeCounts[task.assignee] || 0) + 1;
                totalAssignedTasks++;
            }
        });

        const matrixData = openTasks.map(task => {
            const p = task.priority ? task.priority.toLowerCase() : 'medium';
            let impact = p === 'critical' ? 90 : p === 'high' ? 70 : p === 'medium' ? 40 : 20;
            let likelihood = 10; 
            if (task.deadline) {
                const days = Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                likelihood += days < 0 ? 60 : days <= 3 ? 40 : days <= 7 ? 20 : 0;
            }
            if (avgMood <= 2.0) likelihood += 20;
            likelihood = Math.min(95, Math.max(5, likelihood));

            return { id: task.id, name: task.title, impact, likelihood, severity: p };
        });

        const sorted = Object.entries(assigneeCounts).sort((a, b) => b[1] - a[1]);
        let busFactor = sorted.length > 0 ? (sorted[0][1] / totalAssignedTasks > 0.5 ? 1 : Math.min(sorted.length, 3)) : 0;

        const mitigationRes = await pool.query(`
            SELECT t.id, t.title, t.status, u.username as assignee
            FROM public.tasks t
            LEFT JOIN public.users u ON t.assigned_to = u.id
            WHERE t.project_id = $1 AND LOWER(t.priority) IN ('critical', 'high') AND t.status != 'done'
            ORDER BY t.updated_at DESC LIMIT 4
        `, [projectId]);

        res.json({ success: true, data: { matrixData, busFactor: { factor: busFactor, holders: sorted.slice(0, 2).map(a => a[0]) }, mitigationTasks: mitigationRes.rows } });
    } catch (error) { res.status(500).json({ success: false, message: 'Error' }); }
};