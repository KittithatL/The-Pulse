const pool = require('../config/database');
const AnalyticsService = require('./analyticsService');

class RiskDetectionService {

  /* ================= RUN ALL CHECKS FOR PROJECT ================= */
  static async detectAllRisks(projectId) {
    const risks = [];

    try {
      const checks = [
        this.checkTeamMoodRisk(projectId),
        this.checkVelocityRisk(projectId),
        this.checkDeadlineRisk(projectId),
        this.checkTaskOverdueRisk(projectId),
        this.checkTeamCapacityRisk(projectId),
      ];

      const results = await Promise.allSettled(checks);

      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          risks.push(result.value);
        }
      });

      for (const risk of risks) {
        await this.createRiskAlert(projectId, risk);
      }

      return risks;
    } catch (error) {
      console.error('Error detecting risks:', error);
      return risks;
    }
  }

  /* ================= TEAM MOOD ================= */
  static async checkTeamMoodRisk(projectId) {
    try {
      const result = await pool.query(
        `SELECT AVG(sentiment_score) as avg_mood,
                COUNT(*) as response_count
         FROM team_mood
         WHERE project_id = $1`,
        [projectId]
      );

      const { avg_mood, response_count } = result.rows[0];
      if (response_count < 3) return null;

      if (avg_mood < 2.5) {
        return {
          risk_type: 'mood',
          severity: 'high',
          title: 'Low Team Morale Detected',
          description: `Team sentiment is low (${parseFloat(avg_mood).toFixed(1)}/5).`
        };
      }
      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  /* ================= VELOCITY ================= */
  static async checkVelocityRisk(projectId) {
    try {
      const velocity = await AnalyticsService.calculateVelocity(projectId, 2);
      if (velocity < 3) {
        return {
          risk_type: 'velocity',
          severity: 'medium',
          title: 'Low Velocity',
          description: 'Team velocity is lower than expected.'
        };
      }
      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  /* ================= DEADLINE ================= */
  static async checkDeadlineRisk(projectId) {
    try {
      const result = await pool.query(
        `SELECT COUNT(*) as total_tasks
         FROM tasks
         WHERE project_id = $1`,
        [projectId]
      );

      if (result.rows[0].total_tasks == 0) return null;

      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  /* ================= OVERDUE ================= */
  static async checkTaskOverdueRisk(projectId) {
    try {
      const result = await pool.query(
        `SELECT COUNT(*) as overdue
         FROM tasks
         WHERE project_id = $1
         AND status != 'completed'
         AND due_date < CURRENT_DATE`,
        [projectId]
      );

      if (result.rows[0].overdue > 5) {
        return {
          risk_type: 'quality',
          severity: 'medium',
          title: 'Overdue Tasks',
          description: `${result.rows[0].overdue} tasks overdue`
        };
      }
      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  /* ================= TEAM CAPACITY ================= */
  static async checkTeamCapacityRisk(projectId) {
    try {
      const result = await pool.query(
        `SELECT COUNT(*) as members
         FROM project_members
         WHERE project_id = $1`,
        [projectId]
      );

      if (result.rows[0].members == 0) return null;
      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  /* ================= CREATE ALERT ================= */
  static async createRiskAlert(projectId, risk) {
    if (!risk) return;

    await pool.query(
      `INSERT INTO risk_alerts
       (project_id, risk_type, severity, title, description)
       VALUES ($1,$2,$3,$4,$5)`,
      [projectId, risk.risk_type, risk.severity, risk.title, risk.description]
    );
  }

  /* ================= CRON: ALL PROJECTS ================= */
  static async detectRisksForAllProjects() {
    try {
      const projects = await pool.query(
        `SELECT id,name FROM projects WHERE deleted_at IS NULL`
      );

      console.log(`🔍 Running risk detection for ${projects.rows.length} projects`);

      for (const p of projects.rows) {
        await this.detectAllRisks(p.id);
      }

      console.log('✅ Risk detection finished');
    } catch (error) {
      console.error('Batch risk detection error:', error);
    }
  }
}

module.exports = RiskDetectionService;
