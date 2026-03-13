const { computeMetrics, parseRangeToMs } = require('../services/metricsStore');
const pool = require('../config/database');
const os = require('os');
const fs = require('fs/promises');

function getCpuUsage() {
  return new Promise((resolve) => {
    const cpus1 = os.cpus();
    let idle1 = 0, total1 = 0;
    for (let cpu of cpus1) {
      for (let type in cpu.times) total1 += cpu.times[type];
      idle1 += cpu.times.idle;
    }
    setTimeout(() => {
      const cpus2 = os.cpus();
      let idle2 = 0, total2 = 0;
      for (let cpu of cpus2) {
        for (let type in cpu.times) total2 += cpu.times[type];
        idle2 += cpu.times.idle;
      }
      const idleDiff = idle2 - idle1;
      const totalDiff = total2 - total1;
      resolve(100 - (100 * idleDiff / totalDiff));
    }, 100);
  });
}

exports.getMetrics = async (req, res) => {
  try {
    const range = req.query.range || '1h';
    const rangeMs = parseRangeToMs(range);
    const now = Date.now();
    const metricsData = computeMetrics({ rangeMs, now });
    const latest = Array.isArray(metricsData) ? metricsData[metricsData.length - 1] : metricsData;
    try {
      const cpuUsage = await getCpuUsage();
      const rootPath = os.platform() === 'win32' ? 'C:\\' : '/';
      let diskUsage = { usedPercent: 0, free: 0, total: 0 };
      try {
        const stat = await fs.statfs(rootPath);
        const totalBytes = stat.blocks * stat.bsize;
        const freeBytes = stat.bfree * stat.bsize;
        const usedBytes = totalBytes - freeBytes;
        diskUsage = {
          usedPercent: Math.round((usedBytes / totalBytes) * 1000) / 10,
          free: Math.round(freeBytes / (1024 * 1024 * 1024) * 10) / 10,
          total: Math.round(totalBytes / (1024 * 1024 * 1024) * 10) / 10
        };
      } catch (err) {
        console.log("Could not read disk usage:", err.message);
      }
      const serverMetrics = {
        ...latest,
        cpuUsage: Math.round(cpuUsage * 10) / 10,
        memoryUsage: {
          used: Math.round((os.totalmem() - os.freemem()) / (1024 * 1024 * 1024) * 10) / 10,
          total: Math.round(os.totalmem() / (1024 * 1024 * 1024) * 10) / 10
        },
        diskUsage
      };
      return res.status(200).json({ success: true, data: serverMetrics });
    } catch (err) {
      console.error('Server metrics error:', err);
      return res.status(500).json({ success: false, message: 'Failed to access server info' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to compute metrics' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const result = await pool.query("SELECT id, username AS name, email, role FROM users ORDER BY id ASC");
    return res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;
    const result = await pool.query(
      "UPDATE users SET username = $1, email = $2, role = $3 WHERE id = $4 RETURNING id, username AS name, email, role",
      [name, email, role, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'User not found' });

    const actor = req.user?.username || req.user?.email || 'Admin';
    await pool.query(
      "INSERT INTO action_logs (actor, action, target) VALUES ($1, $2, $3)",
      [actor, 'Updated User', name]
    );

    const io = req?.app?.get('io');
    if (io) io.emit('new_action_log');

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to update user' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userResult = await pool.query("SELECT username FROM users WHERE id = $1", [id]);
    if (userResult.rowCount === 0) return res.status(404).json({ success: false, message: 'User not found' });

    const targetName = userResult.rows[0].username;
    const actor = req.user?.username || req.user?.email || 'Admin';

    await pool.query("DELETE FROM users WHERE id = $1", [id]);

    await pool.query(
      "INSERT INTO action_logs (actor, action, target) VALUES ($1, $2, $3)",
      [actor, 'Deleted User', targetName]
    );

    const io = req?.app?.get('io');
    if (io) io.emit('new_action_log');

    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const userCountResult = await pool.query("SELECT COUNT(*) FROM users");
    const projectCountResult = await pool.query("SELECT COUNT(*) FROM projects");
    const dbCheck = await pool.query("SELECT 1");
    const isDbAlive = dbCheck.rowCount > 0;
    const recentUsersResult = await pool.query("SELECT id, username AS name, email, created_at FROM users ORDER BY created_at DESC LIMIT 3");
    return res.status(200).json({
      success: true,
      data: {
        totalUsers: parseInt(userCountResult.rows[0].count),
        totalProjects: parseInt(projectCountResult.rows[0].count),
        recentUsers: recentUsersResult.rows,
        systemHealth: isDbAlive ? "Healthy" : "Warning",
        alerts: isDbAlive ? 0 : 1
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
};

exports.getLoginLogs = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.id, u.email, l.ip_address, l.status,
             l.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok' AS created_at
      FROM login_logs l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC LIMIT 20
    `);
    return res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to fetch login logs' });
  }
};

exports.getActionLogs = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, actor, action, target,
             created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok' AS created_at
      FROM action_logs
      ORDER BY created_at DESC LIMIT 20
    `);
    return res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to fetch action logs' });
  }
};