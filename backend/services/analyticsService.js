const pool = require('../config/database');

/**
 * Analytics Service
 * Provides utility functions for calculating project metrics and analytics
 */

class AnalyticsService {
  /**
   * Calculate project health score (0-100)
   * Based on completion, mood, efficiency, and velocity
   */
  static async calculateHealthScore(projectId) {
    try {
      const result = await pool.query(
        `SELECT 
          -- Completion score (40% weight)
          COALESCE(
            (COUNT(CASE WHEN t.status = 'completed' THEN 1 END)::float / 
            NULLIF(COUNT(t.id), 0) * 100) * 0.4,
            0
          ) as completion_score,
          
          -- Mood score (30% weight)
          COALESCE(
            (AVG(tm.sentiment_score) / 5.0 * 100) * 0.3,
            0
          ) as mood_score,
          
          -- Efficiency score (20% weight)
          COALESCE(
            (COUNT(CASE WHEN t.completed_at <= t.due_date THEN 1 END)::float /
            NULLIF(COUNT(CASE WHEN t.status = 'completed' THEN 1 END), 0) * 100) * 0.2,
            0
          ) as efficiency_score,
          
          -- Risk score (10% weight, inverted - fewer risks = higher score)
          COALESCE(
            (100 - (COUNT(DISTINCT ra.id) * 5)) * 0.1,
            10
          ) as risk_score
          
         FROM projects p
         LEFT JOIN tasks t ON p.id = t.project_id AND t.deleted_at IS NULL
         LEFT JOIN team_mood tm ON p.id = tm.project_id 
           AND tm.created_at > NOW() - INTERVAL '7 days'
         LEFT JOIN risk_alerts ra ON p.id = ra.project_id 
           AND ra.resolved_at IS NULL
         WHERE p.id = $1
         GROUP BY p.id`,
        [projectId]
      );

      if (result.rows.length === 0) {
        return 0;
      }

      const { completion_score, mood_score, efficiency_score, risk_score } = result.rows[0];
      const healthScore = Math.round(
        parseFloat(completion_score) +
        parseFloat(mood_score) +
        parseFloat(efficiency_score) +
        parseFloat(risk_score)
      );

      return Math.max(0, Math.min(100, healthScore));
    } catch (error) {
      console.error('Error calculating health score:', error);
      return 0;
    }
  }

  /**
   * Calculate team velocity (tasks per week)
   */
  static async calculateVelocity(projectId, weeks = 4) {
    try {
      const result = await pool.query(
        `SELECT 
          COUNT(*)::float / $2 as velocity
         FROM tasks
         WHERE project_id = $1
           AND status = 'completed'
           AND completed_at > NOW() - INTERVAL '1 week' * $2
           AND deleted_at IS NULL`,
        [projectId, weeks]
      );

      return parseFloat((result.rows[0]?.velocity || 0).toFixed(1));
    } catch (error) {
      console.error('Error calculating velocity:', error);
      return 0;
    }
  }

  /**
   * Calculate burndown rate
   * Returns tasks remaining per day until deadline
   */
  static async calculateBurndownRate(projectId) {
    try {
      const result = await pool.query(
        `SELECT 
          COUNT(CASE WHEN t.status != 'completed' THEN 1 END) as remaining_tasks,
          EXTRACT(DAY FROM (p.due_date - CURRENT_DATE)) as days_remaining
         FROM projects p
         LEFT JOIN tasks t ON p.id = t.project_id AND t.deleted_at IS NULL
         WHERE p.id = $1
         GROUP BY p.due_date`,
        [projectId]
      );

      if (result.rows.length === 0) {
        return { remaining_tasks: 0, days_remaining: 0, required_rate: 0 };
      }

      const { remaining_tasks, days_remaining } = result.rows[0];
      const required_rate = days_remaining > 0 
        ? (remaining_tasks / days_remaining).toFixed(1)
        : remaining_tasks;

      return {
        remaining_tasks: parseInt(remaining_tasks),
        days_remaining: parseInt(days_remaining),
        required_rate: parseFloat(required_rate)
      };
    } catch (error) {
      console.error('Error calculating burndown rate:', error);
      return { remaining_tasks: 0, days_remaining: 0, required_rate: 0 };
    }
  }

  /**
   * Get team productivity trends
   * Returns daily/weekly productivity metrics
   */
  static async getProductivityTrends(projectId, days = 30) {
    try {
      const result = await pool.query(
        `SELECT 
          DATE(completed_at) as date,
          COUNT(*) as tasks_completed,
          AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/3600)::integer as avg_completion_hours
         FROM tasks
         WHERE project_id = $1
           AND status = 'completed'
           AND completed_at > NOW() - INTERVAL '1 day' * $2
           AND deleted_at IS NULL
         GROUP BY DATE(completed_at)
         ORDER BY date DESC`,
        [projectId, days]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting productivity trends:', error);
      return [];
    }
  }

  /**
   * Analyze team mood trends
   * Returns sentiment analysis over time
   */
  static async analyzeMoodTrends(projectId, days = 30) {
    try {
      const result = await pool.query(
        `SELECT 
          DATE(created_at) as date,
          AVG(sentiment_score) as avg_score,
          COUNT(*) as responses,
          COUNT(CASE WHEN sentiment_score <= 2 THEN 1 END) as negative_count,
          COUNT(CASE WHEN sentiment_score >= 4 THEN 1 END) as positive_count
         FROM team_mood
         WHERE project_id = $1
           AND created_at > NOW() - INTERVAL '1 day' * $2
         GROUP BY DATE(created_at)
         ORDER BY date DESC`,
        [projectId, days]
      );

      // Calculate trend (improving, declining, stable)
      let trend = 'stable';
      if (result.rows.length >= 2) {
        const recent = result.rows[0].avg_score;
        const previous = result.rows[1].avg_score;
        if (recent > previous + 0.3) trend = 'improving';
        else if (recent < previous - 0.3) trend = 'declining';
      }

      return {
        trend,
        data: result.rows.map(row => ({
          date: row.date,
          avg_score: parseFloat(row.avg_score).toFixed(1),
          responses: parseInt(row.responses),
          negative_count: parseInt(row.negative_count),
          positive_count: parseInt(row.positive_count)
        }))
      };
    } catch (error) {
      console.error('Error analyzing mood trends:', error);
      return { trend: 'stable', data: [] };
    }
  }

  /**
   * Get task distribution by status
   */
  static async getTaskDistribution(projectId) {
    try {
      const result = await pool.query(
        `SELECT 
          status,
          COUNT(*) as count,
          (COUNT(*)::float / SUM(COUNT(*)) OVER () * 100)::numeric(5,1) as percentage
         FROM tasks
         WHERE project_id = $1 AND deleted_at IS NULL
         GROUP BY status
         ORDER BY count DESC`,
        [projectId]
      );

      return result.rows.map(row => ({
        status: row.status,
        count: parseInt(row.count),
        percentage: parseFloat(row.percentage)
      }));
    } catch (error) {
      console.error('Error getting task distribution:', error);
      return [];
    }
  }

  /**
   * Identify at-risk tasks
   * Tasks that are overdue or approaching deadline
   */
  static async identifyAtRiskTasks(projectId) {
    try {
      const result = await pool.query(
        `SELECT 
          t.id,
          t.title,
          t.status,
          t.due_date,
          t.priority,
          EXTRACT(DAY FROM (t.due_date - CURRENT_DATE)) as days_until_due,
          u.full_name as assigned_to
         FROM tasks t
         LEFT JOIN users u ON t.assigned_to = u.id
         WHERE t.project_id = $1
           AND t.status != 'completed'
           AND t.deleted_at IS NULL
           AND (
             t.due_date < CURRENT_DATE OR -- Overdue
             (t.due_date <= CURRENT_DATE + INTERVAL '3 days' AND t.priority = 'high') -- High priority due soon
           )
         ORDER BY t.due_date ASC`,
        [projectId]
      );

      return result.rows.map(row => ({
        ...row,
        days_until_due: parseInt(row.days_until_due),
        risk_level: row.days_until_due < 0 ? 'critical' : 'high'
      }));
    } catch (error) {
      console.error('Error identifying at-risk tasks:', error);
      return [];
    }
  }

  /**
   * Calculate member contribution scores
   */
  static async getMemberContributions(projectId, days = 30) {
    try {
      const result = await pool.query(
        `SELECT 
          u.id,
          u.full_name,
          u.username,
          COUNT(DISTINCT t.id) as tasks_completed,
          AVG(EXTRACT(EPOCH FROM (t.completed_at - t.created_at))/3600)::integer as avg_completion_hours,
          COUNT(DISTINCT cm.id) as messages_sent
         FROM users u
         INNER JOIN project_members pm ON u.id = pm.user_id
         LEFT JOIN tasks t ON u.id = t.assigned_to 
           AND t.status = 'completed'
           AND t.completed_at > NOW() - INTERVAL '1 day' * $2
           AND t.project_id = $1
         LEFT JOIN chat_messages cm ON u.id = cm.user_id
           AND cm.project_id = $1
           AND cm.created_at > NOW() - INTERVAL '1 day' * $2
         WHERE pm.project_id = $1
           AND pm.deleted_at IS NULL
         GROUP BY u.id, u.full_name, u.username
         ORDER BY tasks_completed DESC`,
        [projectId, days]
      );

      return result.rows.map(row => ({
        user_id: row.id,
        full_name: row.full_name,
        username: row.username,
        tasks_completed: parseInt(row.tasks_completed || 0),
        avg_completion_hours: parseInt(row.avg_completion_hours || 0),
        messages_sent: parseInt(row.messages_sent || 0)
      }));
    } catch (error) {
      console.error('Error getting member contributions:', error);
      return [];
    }
  }

  /**
   * Generate executive summary
   * High-level overview for stakeholders
   */
  static async generateExecutiveSummary(projectId) {
    try {
      const [
        healthScore,
        velocity,
        burndown,
        taskDistribution,
        atRiskTasks,
        moodAnalysis
      ] = await Promise.all([
        this.calculateHealthScore(projectId),
        this.calculateVelocity(projectId),
        this.calculateBurndownRate(projectId),
        this.getTaskDistribution(projectId),
        this.identifyAtRiskTasks(projectId),
        this.analyzeMoodTrends(projectId, 7)
      ]);

      // Get project details
      const projectResult = await pool.query(
        `SELECT name, due_date, created_at 
         FROM projects 
         WHERE id = $1`,
        [projectId]
      );

      const project = projectResult.rows[0];

      return {
        project: {
          name: project.name,
          due_date: project.due_date,
          days_active: Math.floor(
            (Date.now() - new Date(project.created_at)) / (1000 * 60 * 60 * 24)
          )
        },
        health: {
          score: healthScore,
          status: healthScore >= 80 ? 'excellent' : 
                  healthScore >= 60 ? 'good' : 
                  healthScore >= 40 ? 'fair' : 'poor'
        },
        velocity: {
          current: velocity,
          required: burndown.required_rate,
          on_track: velocity >= burndown.required_rate
        },
        tasks: {
          distribution: taskDistribution,
          at_risk_count: atRiskTasks.length,
          total_remaining: burndown.remaining_tasks
        },
        team: {
          mood_trend: moodAnalysis.trend,
          avg_mood: moodAnalysis.data[0]?.avg_score || 'N/A'
        },
        timeline: {
          days_remaining: burndown.days_remaining,
          on_schedule: velocity >= burndown.required_rate
        }
      };
    } catch (error) {
      console.error('Error generating executive summary:', error);
      return null;
    }
  }
}

module.exports = AnalyticsService;