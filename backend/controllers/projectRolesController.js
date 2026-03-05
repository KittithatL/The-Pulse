const pool = require('../config/database');

// ── Helper: check owner ────────────────────────────────────────────────────────
const isOwner = async (projectId, userId) => {
  const r = await pool.query(
    `SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2 AND role = 'owner'`,
    [projectId, userId]
  );
  return r.rows.length > 0;
};

// ── GET /projects/:projectId/roles ─────────────────────────────────────────────
const getRoles = async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await pool.query(
      `SELECT * FROM project_roles WHERE project_id = $1 ORDER BY created_at ASC`,
      [projectId]
    );
    return res.status(200).json({ success: true, data: { roles: result.rows } });
  } catch (err) {
    console.error('getRoles error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch roles' });
  }
};

// ── POST /projects/:projectId/roles ────────────────────────────────────────────
const createRole = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    if (!(await isOwner(projectId, userId))) {
      return res.status(403).json({ success: false, message: 'Only owner can create roles' });
    }

    const {
      name,
      color = '#6366f1',
      can_view_tasks = true,
      can_view_finance = false,
      can_view_risk = false,
      can_view_decisions = false,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Role name is required' });
    }

    const result = await pool.query(
      `INSERT INTO project_roles
         (project_id, name, color, can_view_tasks, can_view_finance, can_view_risk, can_view_decisions)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [projectId, name.trim(), color, can_view_tasks, can_view_finance, can_view_risk, can_view_decisions]
    );

    return res.status(201).json({ success: true, data: { role: result.rows[0] } });
  } catch (err) {
    console.error('createRole error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create role' });
  }
};

// ── PUT /projects/:projectId/roles/:roleId ─────────────────────────────────────
const updateRole = async (req, res) => {
  try {
    const { projectId, roleId } = req.params;
    const userId = req.user.id;

    if (!(await isOwner(projectId, userId))) {
      return res.status(403).json({ success: false, message: 'Only owner can update roles' });
    }

    const {
      name,
      color,
      can_view_tasks,
      can_view_finance,
      can_view_risk,
      can_view_decisions,
    } = req.body;

    const result = await pool.query(
      `UPDATE project_roles SET
         name               = COALESCE($1, name),
         color              = COALESCE($2, color),
         can_view_tasks     = COALESCE($3, can_view_tasks),
         can_view_finance   = COALESCE($4, can_view_finance),
         can_view_risk      = COALESCE($5, can_view_risk),
         can_view_decisions = COALESCE($6, can_view_decisions)
       WHERE id = $7 AND project_id = $8
       RETURNING *`,
      [
        name?.trim() ?? null,
        color ?? null,
        can_view_tasks ?? null,
        can_view_finance ?? null,
        can_view_risk ?? null,
        can_view_decisions ?? null,
        roleId,
        projectId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    return res.status(200).json({ success: true, data: { role: result.rows[0] } });
  } catch (err) {
    console.error('updateRole error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update role' });
  }
};

// ── DELETE /projects/:projectId/roles/:roleId ──────────────────────────────────
const deleteRole = async (req, res) => {
  try {
    const { projectId, roleId } = req.params;
    const userId = req.user.id;

    if (!(await isOwner(projectId, userId))) {
      return res.status(403).json({ success: false, message: 'Only owner can delete roles' });
    }

    // Clear role_id ของ members ที่ใช้ role นี้ก่อน
    await pool.query(
      `UPDATE project_members SET role_id = NULL WHERE project_id = $1 AND role_id = $2`,
      [projectId, roleId]
    );

    const result = await pool.query(
      `DELETE FROM project_roles WHERE id = $1 AND project_id = $2 RETURNING id`,
      [roleId, projectId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    return res.status(200).json({ success: true, message: 'Role deleted' });
  } catch (err) {
    console.error('deleteRole error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete role' });
  }
};

// ── PUT /projects/:projectId/members/:userId/role ──────────────────────────────
const assignRole = async (req, res) => {
  try {
    const { projectId, userId: targetUserId } = req.params;
    const requesterId = req.user.id;

    if (!(await isOwner(projectId, requesterId))) {
      return res.status(403).json({ success: false, message: 'Only owner can assign roles' });
    }

    const { role_id } = req.body; // null = ลบ role

    // ถ้าส่ง role_id มา ตรวจว่า role นั้น belong to project นี้
    if (role_id) {
      const roleCheck = await pool.query(
        `SELECT 1 FROM project_roles WHERE id = $1 AND project_id = $2`,
        [role_id, projectId]
      );
      if (roleCheck.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Role not found in this project' });
      }
    }

    const result = await pool.query(
      `UPDATE project_members SET role_id = $1 WHERE project_id = $2 AND user_id = $3 RETURNING *`,
      [role_id || null, projectId, targetUserId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    return res.status(200).json({ success: true, message: 'Role assigned', data: { member: result.rows[0] } });
  } catch (err) {
    console.error('assignRole error:', err);
    return res.status(500).json({ success: false, message: 'Failed to assign role' });
  }
};

// ── GET /projects/:projectId/my-permissions ────────────────────────────────────
const getMyPermissions = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT
         pm.role,
         pm.role_id,
         (pm.role = 'owner') AS is_owner,
         COALESCE(pr.can_view_tasks,      false) AS can_view_tasks,
         COALESCE(pr.can_view_finance,    false) AS can_view_finance,
         COALESCE(pr.can_view_risk,       false) AS can_view_risk,
         COALESCE(pr.can_view_decisions,  false) AS can_view_decisions
       FROM project_members pm
       LEFT JOIN project_roles pr ON pr.id = pm.role_id
       WHERE pm.project_id = $1 AND pm.user_id = $2`,
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not a member of this project' });
    }

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('getMyPermissions error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch permissions' });
  }
};

module.exports = { getRoles, createRole, updateRole, deleteRole, assignRole, getMyPermissions };