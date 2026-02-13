/**
 * Cron Jobs / Scheduled Tasks
 * Handles periodic background tasks for The Pulse
 */

const RiskDetectionService = require('./riskDetectionService');

class CronJobManager {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  /**
   * Start all cron jobs
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Cron jobs already running');
      return;
    }

    console.log('🕐 Starting cron jobs...');

    // Risk Detection - Every hour
    this.scheduleJob('risk-detection', 60 * 60 * 1000, async () => {
      console.log('\n📊 [CRON] Running automated risk detection...');
      await RiskDetectionService.detectRisksForAllProjects();
    });

    // Health Check Cleanup - Every 24 hours
    this.scheduleJob('health-cleanup', 24 * 60 * 60 * 1000, async () => {
      console.log('\n🧹 [CRON] Cleaning old health check logs...');
      await this.cleanupOldHealthLogs();
    });

    // Mood Summary - Daily at 9 AM
    this.scheduleDailyJob('mood-summary', 9, 0, async () => {
      console.log('\n📈 [CRON] Generating daily mood summaries...');
      await this.generateDailyMoodSummaries();
    });

    // Auto-resolve old risks - Every 6 hours
    this.scheduleJob('auto-resolve-risks', 6 * 60 * 60 * 1000, async () => {
      console.log('\n✅ [CRON] Auto-resolving outdated risks...');
      await this.autoResolveOldRisks();
    });

    this.isRunning = true;
    console.log('✅ All cron jobs started successfully\n');
  }

  stop() {
    console.log('🛑 Stopping cron jobs...');
    this.jobs.forEach((intervalId, jobName) => {
      clearInterval(intervalId);
      console.log(`   Stopped: ${jobName}`);
    });
    this.jobs.clear();
    this.isRunning = false;
    console.log('✅ All cron jobs stopped\n');
  }

  scheduleJob(name, intervalMs, callback) {
    if (this.jobs.has(name)) return;

    callback().catch(console.error);

    const intervalId = setInterval(async () => {
      try {
        await callback();
      } catch (error) {
        console.error(`❌ Error in job '${name}':`, error);
      }
    }, intervalMs);

    this.jobs.set(name, intervalId);
    console.log(`   ✓ Scheduled: ${name}`);
  }

  scheduleDailyJob(name, hour, minute, callback) {
    const now = new Date();
    const scheduledTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hour,
      minute,
      0
    );

    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const msUntilFirst = scheduledTime - now;
    const oneDayMs = 24 * 60 * 60 * 1000;

    setTimeout(() => {
      callback().catch(console.error);

      const intervalId = setInterval(async () => {
        try {
          await callback();
        } catch (error) {
          console.error(`❌ Error in daily job '${name}':`, error);
        }
      }, oneDayMs);

      this.jobs.set(name, intervalId);
    }, msUntilFirst);

    console.log(`   ✓ Scheduled: ${name}`);
  }

  async cleanupOldHealthLogs() {
    const pool = require('../config/database');
    try {
      await pool.query(`
        DELETE FROM infrastructure_health_log
        WHERE created_at < NOW() - INTERVAL '30 days'
      `);
    } catch (error) {
      console.error(error);
    }
  }

  async generateDailyMoodSummaries() {
    const pool = require('../config/database');
    try {
      await pool.query(`SELECT 1`);
    } catch (error) {
      console.error(error);
    }
  }

  async autoResolveOldRisks() {
    const pool = require('../config/database');
    try {
      const projects = await pool.query(
        `SELECT id FROM projects WHERE deleted_at IS NULL`
      );

      for (const project of projects.rows) {
        await RiskDetectionService.autoResolveRisks(project.id);
      }
    } catch (error) {
      console.error(error);
    }
  }

  getStatus() {
    return {
      running: this.isRunning,
      jobs: Array.from(this.jobs.keys()),
      count: this.jobs.size,
    };
  }
}

const cronJobManager = new CronJobManager();
module.exports = cronJobManager;