const pool = require('../config/database');
const Groq = require('groq-sdk');

const insightCache = new Map();
const CACHE_TTL_MS = 2 * 60 * 1000;

// ✅ 1. Overview Stats (รายโปรเจกต์)
exports.getDashboardOverview = async (req, res) => {
    const { projectId } = req.params;
    try {
        const taskRes = await pool.query(
            `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'done') as done 
             FROM public.tasks WHERE project_id = $1`, [projectId]
        );
        const efficiencyRes = await pool.query(
            `SELECT COUNT(*) FILTER (WHERE status = 'done') as total_done,
                COUNT(*) FILTER (WHERE status = 'done' AND updated_at <= deadline) as on_time_done
            FROM public.tasks WHERE project_id = $1`, [projectId]
        );
        const effStats = efficiencyRes.rows[0];
        const totalDone = parseInt(effStats.total_done);
        const onTimeDone = parseInt(effStats.on_time_done);
        const actualEfficiency = totalDone > 0 ? Math.round((onTimeDone / totalDone) * 100) : 100;

        const userVoteRes = await pool.query(
            `SELECT sentiment_score FROM public.team_mood 
            WHERE project_id = $1 AND user_id = $2 AND created_at::date = CURRENT_DATE LIMIT 1`,
            [projectId, req.user.id]
        );
        const projectRes = await pool.query(
            `SELECT title, learning_capacity, deadline FROM public.projects WHERE id = $1`, [projectId]
        );
        if (projectRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        const moodRes = await pool.query(
            `SELECT AVG(sentiment_score)::numeric(3,1) as avg_score, COUNT(*) as total_votes 
             FROM public.team_mood WHERE project_id = $1`, [projectId]
        );
        const riskRes = await pool.query(
            `SELECT COUNT(*) as active_risks FROM public.risk_alerts WHERE project_id = $1 AND is_resolved = false`, [projectId]
        );
        const stats = taskRes.rows[0];
        const project = projectRes.rows[0];
        const mood = moodRes.rows[0];
        const activeRisks = parseInt(riskRes.rows[0].active_risks);
        let dynamicRiskLevel = activeRisks > 5 ? 'critical' : activeRisks > 2 ? 'medium' : 'low';
        const percent = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

        // ── Groq AI Briefing ──
        let ai_briefing = activeRisks > 0
            ? `WARNING: ${activeRisks} active risk alerts detected. Immediate review required.`
            : "SYSTEM ANALYSIS: All parameters nominal. Team productivity is stable.";

        if (process.env.GROQ_KEY) {
            const cacheKey = `project_${projectId}`;
            const cached = insightCache.get(cacheKey);

            if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
                ai_briefing = cached.insight;
            } else {
                try {
                    const groq = new Groq({ apiKey: process.env.GROQ_KEY });
                    const completion = await groq.chat.completions.create({
                        model: 'llama-3.1-8b-instant',
                        messages: [{
                            role: 'user',
                            content: `คุณคือนักวิเคราะห์โปรเจกต์มืออาชีพ วิเคราะห์สถานะโปรเจกต์นี้แล้วให้คำแนะนำ 1 ประโยค กระชับ ตรงประเด็น ไม่ต้องมีคำนำ

โปรเจกต์: ${project.title}
งานทั้งหมด: ${parseInt(stats.total)} งาน (เสร็จแล้ว ${parseInt(stats.done)} งาน, ${percent}%)
ประสิทธิภาพ: ${actualEfficiency}%
ความเสี่ยงที่ยังเปิดอยู่: ${activeRisks} รายการ
Team Mood: ${mood.avg_score || 0}/5

ตอบเป็นภาษาไทย 1 ประโยค บอกว่าโปรเจกต์นี้ควรโฟกัสอะไร`
                        }],
                        max_tokens: 120,
                    });

                    ai_briefing = completion.choices[0]?.message?.content?.trim() || ai_briefing;
                    insightCache.set(cacheKey, { insight: ai_briefing, timestamp: Date.now() });
                } catch (groqErr) {
                    console.error('Groq project briefing error:', groqErr.message);
                    // ใช้ fallback เดิม
                }
            }
        }

        res.json({
            success: true,
            data: {
                project: { name: project.title },
                ai_briefing,  // ✅ ใช้ตัวแปรแทน hardcode
                completion: { percentage: percent, completed_tasks: parseInt(stats.done), total_tasks: parseInt(stats.total) },
                efficiency: { percentage: actualEfficiency },
                risk_level: dynamicRiskLevel,
                team_mood: {
                    score: mood.avg_score || "0.0",
                    total_responses: parseInt(mood.total_votes || 0),
                    user_voted_score: userVoteRes.rows.length > 0 ? parseInt(userVoteRes.rows[0].sentiment_score) : null
                },
                learning_capacity: { percentage: project.learning_capacity || 0, due_date: project.deadline }
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
            `SELECT * FROM public.infrastructure_health WHERE project_id = $1 ORDER BY last_checked DESC`, [projectId]
        );
        res.json({ success: true, data: { components: result.rows } });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ✅ 3. Risk Alerts (รายโปรเจกต์)
exports.getRiskAlerts = async (req, res) => {
    try {
        const { projectId } = req.params;
        const result = await pool.query(
            `SELECT * FROM public.risk_alerts WHERE project_id = $1 AND is_resolved = false ORDER BY created_at DESC`, [projectId]
        );
        res.json({ success: true, data: { alerts: result.rows } });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ✅ 4. ดึง notifications ทั้งหมด — risks + tasks + pairing (กรอง dismissed แล้ว)
exports.getAllUserNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        const risks = await pool.query(
            `SELECT ra.id, ra.message, ra.severity, ra.created_at,
                    p.title as project_name, ra.project_id, 'risk' as type
             FROM public.risk_alerts ra
             JOIN public.project_members pm ON ra.project_id = pm.project_id
             JOIN public.projects p ON ra.project_id = p.id
             WHERE pm.user_id = $1::integer
               AND ra.is_resolved = false
               AND NOT EXISTS (
                   SELECT 1 FROM public.dismissed_notifications dn
                   WHERE dn.user_id = $1::integer AND dn.ref_id = ra.id AND dn.ref_type = 'risk'
               )`,
            [userId]
        );

        const myTasks = await pool.query(
            `SELECT t.id, t.title as message, t.priority as severity, t.created_at,
                    p.title as project_name, t.project_id, 'task' as type
             FROM public.tasks t
             JOIN public.projects p ON t.project_id = p.id
             WHERE t.assigned_to = $1::integer
               AND t.status != 'done'
               AND NOT EXISTS (
                   SELECT 1 FROM public.dismissed_notifications dn
                   WHERE dn.user_id = $1::integer AND dn.ref_id = t.id AND dn.ref_type = 'task'
               )`,
            [userId]
        );

        const pairings = await pool.query(
            `SELECT 
                pr.id, pr.message, pr.created_at,
                p.title as project_name, pr.project_id,
                t.title as node,
                u.username as user,
                'pairing' as type,
                'normal' as severity,
                CASE WHEN t.priority IN ('critical','high') THEN 'High' ELSE 'Normal' END as weight
             FROM public.pairing_requests pr
             JOIN public.tasks t ON pr.task_id = t.id
             JOIN public.projects p ON pr.project_id = p.id
             JOIN public.users u ON pr.requester_id = u.id
             WHERE pr.target_id = $1::integer AND pr.status = 'pending'`,
            [userId]
        );

        const combined = [...risks.rows, ...myTasks.rows, ...pairings.rows].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );

        res.json({ success: true, data: { alerts: combined } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ✅ 5. Clear All — dismiss risks/tasks + decline pairing
exports.clearAllNotifications = async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.id;
        await client.query('BEGIN');

        await client.query(
            `INSERT INTO public.dismissed_notifications (user_id, ref_id, ref_type)
             SELECT $1::integer, ra.id, 'risk'
             FROM public.risk_alerts ra
             JOIN public.project_members pm ON ra.project_id = pm.project_id
             WHERE pm.user_id = $1::integer AND ra.is_resolved = false
             ON CONFLICT (user_id, ref_id, ref_type) DO NOTHING`,
            [userId]
        );

        await client.query(
            `INSERT INTO public.dismissed_notifications (user_id, ref_id, ref_type)
             SELECT $1::integer, t.id, 'task'
             FROM public.tasks t
             WHERE t.assigned_to = $1::integer AND t.status != 'done'
             ON CONFLICT (user_id, ref_id, ref_type) DO NOTHING`,
            [userId]
        );

        await client.query(
            `UPDATE public.pairing_requests
             SET status = 'declined', updated_at = NOW()
             WHERE target_id = $1::integer AND status = 'pending'`,
            [userId]
        );

        await client.query('COMMIT');

        const io = req.app.get('io');
        if (io) io.to(`user_${userId}`).emit('clear_all_notifications');

        res.json({ success: true, message: 'All notifications cleared' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        client.release();
    }
};

// ✅ 6. Create Risk Alert — ส่ง noti เฉพาะ members ใน project (ไม่ broadcast ทั้ง server)
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

        const membersRes = await pool.query(
            `SELECT user_id FROM public.project_members WHERE project_id = $1`, [projectId]
        );
        const io = req.app.get('io');
        if (io) {
            const newNotification = { ...result.rows[0], project_name: projectName, type: 'risk' };
            membersRes.rows.forEach(({ user_id }) => {
                io.to(`user_${user_id}`).emit('new_notification', newNotification);
            });
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
            `UPDATE public.risk_alerts SET is_resolved = true WHERE id = $1 RETURNING *`, [alertId]
        );
        if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Alert not found' });

        const io = req.app.get('io');
        if (io) io.emit('resolve_notification', { id: alertId, type: 'risk' });

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

// ✅ 9. My Day Briefing — รวม pairing requests
const activeAIRequests = new Map();
exports.getMyDayBriefing = async (req, res) => {
  try {
    const userId = String(req.user?.id ?? req.user?.user_id);

    // 1. Fetch DB Data (Tasks & Pairings)
    const tasksResult = await pool.query(
      `SELECT t.title, t.priority, t.status, t.deadline, p.title AS project_name
       FROM public.tasks t
       JOIN public.projects p ON t.project_id = p.id
       WHERE t.assigned_to = $1 AND t.status != 'done'
       ORDER BY t.deadline ASC NULLS LAST LIMIT 20`,
      [userId]
    );
    const tasks = tasksResult.rows;

    const now = new Date();
    const criticalTasks = tasks.filter(t => 
      t.priority === 'critical' || t.priority === 'high' || (t.deadline && new Date(t.deadline) < now)
    );

    const integrity = tasks.length === 0 ? 100 : Math.round(((tasks.length - criticalTasks.length) / tasks.length) * 100);

    const pairings = await pool.query(
      `SELECT pr.id, pr.message, pr.project_id, t.title as node, p.title as project_name, u.username as user
       FROM public.pairing_requests pr
       JOIN public.tasks t ON pr.task_id = t.id
       JOIN public.projects p ON pr.project_id = p.id
       JOIN public.users u ON pr.requester_id = u.id
       WHERE pr.target_id = $1 AND pr.status = 'pending'
       ORDER BY pr.created_at DESC`,
      [userId]
    );

    // ─── GEMINI LOGIC WITH LOCKING ───
    let gemini_insight = 'Standby for tactical analysis...';
    const cached = insightCache.get(userId);
    const isCacheExpired = !cached || (Date.now() - cached.timestamp) > CACHE_TTL_MS;

    if (tasks.length === 0) {
      gemini_insight = 'No active tasks detected. All sectors clear — great time to plan ahead.';
    } else if (cached && !isCacheExpired) {
      // Use fresh cache
      gemini_insight = cached.insight;
    } else if (process.env.GROQ_KEY) {

    if (activeAIRequests.has(userId)) {
        gemini_insight = cached?.insight || 'AI is currently analyzing your data...';
    } else {
        const aiPromise = (async () => {
        try {
            const groq = new Groq({ apiKey: process.env.GROQ_KEY });
            const taskList = tasks
            .map(t => `- [${t.priority || 'normal'}] ${t.title} (${t.project_name})`)
            .join('\n');

            const completion = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [{
                role: 'user',
                content: `คุณคือนักวิเคราะห์โปรเจกต์มืออาชีพ วิเคราะห์ workload ของสมาชิกคนนี้แล้วให้คำแนะนำ 1 ประโยค กระชับ ตรงประเด็น ไม่ต้องมีคำนำ Tasks ที่ต้องทำ (${tasks.length} งาน, critical ${criticalTasks.length} งาน): ${taskList} System Integrity: ${integrity}% ตอบเป็นภาษาไทย 1 ประโยค บอกว่าควรโฟกัสอะไรก่อน`
            }],
            max_tokens: 100,
            });

            const text = completion.choices[0]?.message?.content?.trim() || 'Analysis complete.';
            insightCache.set(userId, { insight: text, timestamp: Date.now() });
            return text;
        } catch (err) {
            console.error(`Groq error for ${userId}:`, err.message);
            const fallback = cached?.insight || 'AI analysis temporarily unavailable.';
            insightCache.set(userId, { insight: fallback, timestamp: Date.now() });
            return fallback;
        } finally {
            activeAIRequests.delete(userId);
        }
        })();

        activeAIRequests.set(userId, aiPromise);
        gemini_insight = cached?.insight ? cached.insight : await aiPromise;
    }
    }

    res.json({
      success: true,
      data: {
        critical_tasks: criticalTasks,
        pairing_requests: pairings.rows,
        system_integrity: `${integrity}%`,
        gemini_insight,
      },
    });

  } catch (err) {
    console.error('getMyDayBriefing ERROR:', err.message, '\nSTACK:', err.stack);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ 10. Risk Sentinel Data
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

        const moodRes = await pool.query(
            `SELECT AVG(sentiment_score)::numeric(3,1) as avg_score FROM public.team_mood WHERE project_id = $1`, [projectId]
        );
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
        let busFactor = sorted.length > 0
            ? (sorted[0][1] / totalAssignedTasks > 0.5 ? 1 : Math.min(sorted.length, 3))
            : 0;

        const mitigationRes = await pool.query(`
            SELECT t.id, t.title, t.status, u.username as assignee
            FROM public.tasks t
            LEFT JOIN public.users u ON t.assigned_to = u.id
            WHERE t.project_id = $1 AND LOWER(t.priority) IN ('critical', 'high') AND t.status != 'done'
            ORDER BY t.updated_at DESC LIMIT 4
        `, [projectId]);

        res.json({
            success: true,
            data: {
                matrixData,
                busFactor: { factor: busFactor, holders: sorted.slice(0, 2).map(a => a[0]) },
                mitigationTasks: mitigationRes.rows
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error' });
    }
};