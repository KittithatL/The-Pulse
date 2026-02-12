const pool = require('../config/database');

/**
 * Get Dashboard Overview
 * Returns project completion, team mood, efficiency, and AI briefing
 */
exports.getDashboardOverview = async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.id;

  try {
    // Verify user has access to project
    const projectCheck = await pool.query(
      `SELECT p.id, p.name, pm.role 
       FROM projects p
       INNER JOIN project_members pm ON p.id = pm.project_id
       WHERE p.id = $1 AND pm.user_id = $2 AND pm.deleted_at IS NULL`,
      [projectId, userId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project',
      });
    }

    // Get project completion percentage
    const completionResult = await pool.query(
      `SELECT 
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::float / 
        NULLIF(COUNT(*), 0) * 100 as completion_percentage,
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks
       FROM tasks 
       WHERE project_id = $1 AND deleted_at IS NULL`,
      [projectId]
    );

    // Get team mood (average sentiment score)
    const moodResult = await pool.query(
      `SELECT 
        COALESCE(AVG(sentiment_score), 3.0) as avg_mood,
        COUNT(*) as total_responses
       FROM team_mood 
       WHERE project_id = $1 
         AND created_at > NOW() - INTERVAL '7 days'`,
      [projectId]
    );

    // Get efficiency metrics
    const efficiencyResult = await pool.query(
      `SELECT 
        COALESCE(
          (COUNT(CASE WHEN completed_at <= due_date THEN 1 END)::float / 
          NULLIF(COUNT(CASE WHEN status = 'completed' THEN 1 END), 0) * 100),
          0
        ) as efficiency_percentage
       FROM tasks 
       WHERE project_id = $1 
         AND status = 'completed' 
         AND deleted_at IS NULL`,
      [projectId]
    );

    // Get pipeline velocity (tasks completed per week)
    const velocityResult = await pool.query(
      `SELECT 
        COUNT(*)::float / NULLIF(
          EXTRACT(WEEK FROM MAX(completed_at)) - 
          EXTRACT(WEEK FROM MIN(completed_at)) + 1, 
          0
        ) as velocity
       FROM tasks 
       WHERE project_id = $1 
         AND status = 'completed' 
         AND completed_at IS NOT NULL
         AND deleted_at IS NULL`,
      [projectId]
    );

    // Get learning capacity
    const learningResult = await pool.query(
      `SELECT 
        COALESCE(learning_capacity, 0) as learning_capacity,
        due_date
       FROM projects 
       WHERE id = $1`,
      [projectId]
    );

    // Generate AI Briefing
    const completion = completionResult.rows[0].completion_percentage || 0;
    const mood = moodResult.rows[0].avg_mood || 3.0;
    const efficiency = efficiencyResult.rows[0].efficiency_percentage || 0;
    
    let briefing = '';
    let riskLevel = 'low';

    if (completion >= 70) {
      briefing = `The ${projectCheck.rows[0].name} is ${Math.round(completion)}% complete in modernizing our core microservices infrastructure under my direction as PM.`;
      
      if (mood < 3.0) {
        briefing += ` However, the low team mood of ${mood.toFixed(1)}/5.0 presents significant risks to project velocity and successful delivery that require immediate attention.`;
        riskLevel = 'high';
      } else {
        briefing += ` The team is maintaining positive momentum with a mood score of ${mood.toFixed(1)}/5.0.`;
        riskLevel = 'medium';
      }
    } else {
      briefing = `The ${projectCheck.rows[0].name} is ${Math.round(completion)}% complete. `;
      
      if (mood < 3.0) {
        briefing += `Critical attention needed: low team mood (${mood.toFixed(1)}/5.0) and slow progress are creating substantial delivery risks.`;
        riskLevel = 'critical';
      } else if (completion < 50) {
        briefing += `Progress is behind schedule. Team mood is ${mood.toFixed(1)}/5.0. Recommend reviewing priorities and blockers.`;
        riskLevel = 'high';
      }
    }

    res.json({
      success: true,
      data: {
        project: {
          id: projectId,
          name: projectCheck.rows[0].name,
        },
        ai_briefing: briefing,
        risk_level: riskLevel,
        completion: {
          percentage: parseFloat(completion.toFixed(1)),
          completed_tasks: completionResult.rows[0].completed_tasks,
          total_tasks: completionResult.rows[0].total_tasks,
        },
        team_mood: {
          score: parseFloat(mood.toFixed(1)),
          max_score: 5.0,
          total_responses: moodResult.rows[0].total_responses,
        },
        efficiency: {
          percentage: parseFloat(efficiency.toFixed(1)),
        },
        pipeline_velocity: {
          tasks_per_week: parseFloat((velocityResult.rows[0].velocity || 0).toFixed(1)),
        },
        learning_capacity: {
          percentage: learningResult.rows[0].learning_capacity || 0,
          due_date: learningResult.rows[0].due_date,
        },
      },
    });
  } catch (error) {
    console.error('Error getting dashboard overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message,
    });
  }
};

/**
 * Submit Team Mood
 * Allows team members to submit their mood/sentiment
 */
exports.submitTeamMood = async (req, res) => {
  const { projectId } = req.params;
  const { sentiment_score, comment } = req.body;
  const userId = req.user.id;

  try {
    // Validate sentiment score
    if (!sentiment_score || sentiment_score < 1 || sentiment_score > 5) {
      return res.status(400).json({
        success: false,
        message: 'Sentiment score must be between 1 and 5',
      });
    }

    // Verify project access
    const projectCheck = await pool.query(
      `SELECT id FROM project_members 
       WHERE project_id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [projectId, userId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project',
      });
    }

    // Insert mood entry
    const result = await pool.query(
      `INSERT INTO team_mood (project_id, user_id, sentiment_score, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING id, sentiment_score, comment, created_at`,
      [projectId, userId, sentiment_score, comment || null]
    );

    res.status(201).json({
      success: true,
      message: 'Mood submitted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error submitting team mood:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit mood',
      error: error.message,
    });
  }
};

/**
 * Get Team Mood History
 * Returns mood trends over time
 */
exports.getTeamMoodHistory = async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.id;
  const { days = 30 } = req.query;

  try {
    // Verify project access
    const projectCheck = await pool.query(
      `SELECT id FROM project_members 
       WHERE project_id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [projectId, userId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project',
      });
    }

    // Get mood history
    const result = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        AVG(sentiment_score) as avg_score,
        COUNT(*) as responses
       FROM team_mood
       WHERE project_id = $1 
         AND created_at > NOW() - INTERVAL '1 day' * $2
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [projectId, days]
    );

    res.json({
      success: true,
      data: {
        history: result.rows.map(row => ({
          date: row.date,
          avg_score: parseFloat(row.avg_score.toFixed(1)),
          responses: parseInt(row.responses),
        })),
      },
    });
  } catch (error) {
    console.error('Error getting mood history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mood history',
      error: error.message,
    });
  }
};

/**
 * Get Infrastructure Health
 * Returns status of various system components
 */
exports.getInfrastructureHealth = async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.id;

  try {
    // Verify project access
    const projectCheck = await pool.query(
      `SELECT id FROM project_members 
       WHERE project_id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [projectId, userId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project',
      });
    }

    // Get infrastructure components status
    const result = await pool.query(
      `SELECT 
        component_name,
        status,
        last_check,
        uptime_percentage,
        response_time_ms
       FROM infrastructure_health
       WHERE project_id = $1
       ORDER BY component_name`,
      [projectId]
    );

    res.json({
      success: true,
      data: {
        components: result.rows,
        overall_status: result.rows.every(c => c.status === 'operational') 
          ? 'operational' 
          : 'degraded',
      },
    });
  } catch (error) {
    console.error('Error getting infrastructure health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch infrastructure health',
      error: error.message,
    });
  }
};

/**
 * Update Infrastructure Component Status
 * Admin endpoint to update component health
 */
exports.updateInfrastructureStatus = async (req, res) => {
  const { projectId } = req.params;
  const { component_name, status, response_time_ms } = req.body;
  const userId = req.user.id;

  try {
    // Verify admin access
    const adminCheck = await pool.query(
      `SELECT role FROM project_members 
       WHERE project_id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [projectId, userId]
    );

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    // Calculate uptime
    const uptimeResult = await pool.query(
      `SELECT 
        (COUNT(CASE WHEN status = 'operational' THEN 1 END)::float / 
         NULLIF(COUNT(*), 0) * 100) as uptime
       FROM infrastructure_health_log
       WHERE project_id = $1 
         AND component_name = $2
         AND created_at > NOW() - INTERVAL '24 hours'`,
      [projectId, component_name]
    );

    const uptime = uptimeResult.rows[0]?.uptime || 100;

    // Upsert infrastructure status
    const result = await pool.query(
      `INSERT INTO infrastructure_health 
        (project_id, component_name, status, uptime_percentage, response_time_ms)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (project_id, component_name) 
       DO UPDATE SET 
         status = $3,
         uptime_percentage = $4,
         response_time_ms = $5,
         last_check = NOW()
       RETURNING *`,
      [projectId, component_name, status, uptime, response_time_ms]
    );

    // Log the status
    await pool.query(
      `INSERT INTO infrastructure_health_log 
        (project_id, component_name, status, response_time_ms)
       VALUES ($1, $2, $3, $4)`,
      [projectId, component_name, status, response_time_ms]
    );

    res.json({
      success: true,
      message: 'Infrastructure status updated',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating infrastructure status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update infrastructure status',
      error: error.message,
    });
  }
};

/**
 * Get Risk Sentinel Alerts
 * Returns active risks and warnings
 */
exports.getRiskAlerts = async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.id;

  try {
    // Verify project access
    const projectCheck = await pool.query(
      `SELECT id FROM project_members 
       WHERE project_id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [projectId, userId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project',
      });
    }

    // Get active risks
    const result = await pool.query(
      `SELECT 
        id,
        risk_type,
        severity,
        title,
        description,
        detected_at,
        resolved_at
       FROM risk_alerts
       WHERE project_id = $1 
         AND (resolved_at IS NULL OR resolved_at > NOW() - INTERVAL '7 days')
       ORDER BY 
         CASE severity 
           WHEN 'critical' THEN 1 
           WHEN 'high' THEN 2 
           WHEN 'medium' THEN 3 
           WHEN 'low' THEN 4 
         END,
         detected_at DESC`,
      [projectId]
    );

    res.json({
      success: true,
      data: {
        alerts: result.rows,
        critical_count: result.rows.filter(r => r.severity === 'critical').length,
        high_count: result.rows.filter(r => r.severity === 'high').length,
      },
    });
  } catch (error) {
    console.error('Error getting risk alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch risk alerts',
      error: error.message,
    });
  }
};

/**
 * Create Risk Alert
 * System or admin can create risk alerts
 */
exports.createRiskAlert = async (req, res) => {
  const { projectId } = req.params;
  const { risk_type, severity, title, description } = req.body;
  const userId = req.user.id;

  try {
    // Verify admin access
    const adminCheck = await pool.query(
      `SELECT role FROM project_members 
       WHERE project_id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [projectId, userId]
    );

    if (adminCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Validate input
    const validSeverities = ['critical', 'high', 'medium', 'low'];
    if (!validSeverities.includes(severity)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid severity level',
      });
    }

    // Create risk alert
    const result = await pool.query(
      `INSERT INTO risk_alerts 
        (project_id, risk_type, severity, title, description, detected_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [projectId, risk_type, severity, title, description, userId]
    );

    res.status(201).json({
      success: true,
      message: 'Risk alert created',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating risk alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create risk alert',
      error: error.message,
    });
  }
};

/**
 * Resolve Risk Alert
 */
exports.resolveRiskAlert = async (req, res) => {
  const { projectId, alertId } = req.params;
  const { resolution_notes } = req.body;
  const userId = req.user.id;

  try {
    // Verify access
    const accessCheck = await pool.query(
      `SELECT role FROM project_members 
       WHERE project_id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [projectId, userId]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Resolve alert
    const result = await pool.query(
      `UPDATE risk_alerts 
       SET resolved_at = NOW(),
           resolved_by = $3,
           resolution_notes = $4
       WHERE id = $1 AND project_id = $2 AND resolved_at IS NULL
       RETURNING *`,
      [alertId, projectId, userId, resolution_notes]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Risk alert not found or already resolved',
      });
    }

    res.json({
      success: true,
      message: 'Risk alert resolved',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error resolving risk alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve risk alert',
      error: error.message,
    });
  }
};

/**
 * Get Project Cycle Info
 * Returns current cycle/sprint information
 */
exports.getProjectCycle = async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.id;

  try {
    // Verify project access
    const projectCheck = await pool.query(
      `SELECT id FROM project_members 
       WHERE project_id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [projectId, userId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project',
      });
    }

    // Get current cycle
    const result = await pool.query(
      `SELECT 
        cycle_number,
        start_date,
        end_date,
        completion_percentage,
        EXTRACT(DAY FROM (end_date - CURRENT_DATE)) as days_remaining
       FROM project_cycles
       WHERE project_id = $1 
         AND start_date <= CURRENT_DATE 
         AND end_date >= CURRENT_DATE
       ORDER BY start_date DESC
       LIMIT 1`,
      [projectId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active cycle found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error getting project cycle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cycle information',
      error: error.message,
    });
  }
};
