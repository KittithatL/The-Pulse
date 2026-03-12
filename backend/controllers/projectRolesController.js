const pool = require('../config/database');

// ✅ GET All Roles ของ project
exports.getRoles = async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await pool.query(
      `SELECT * FROM public.project_roles WHERE project_id = $1 ORDER BY created_at ASC`,
      [projectId]
    );
    res.json({ success: true, data: { roles: result.rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ CREATE Role — ป้องกัน duplicate case-insensitive
exports.createRole = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, color, can_view_tasks, can_view_finance, can_view_risk, can_view_decisions } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Role name is required' });
    }

    // ── Duplicate check (case-insensitive) ──
    const dupCheck = await pool.query(
      `SELECT id FROM public.project_roles
       WHERE project_id = $1 AND LOWER(TRIM(name)) = LOWER(TRIM($2))`,
      [projectId, name]
    );

    
    if (dupCheck.rows.length > 0) {
      return res.status(409).json({ success: false, message: `Role "${name}" already exists in this project` });
    }

    const result = await pool.query(
      `INSERT INTO public.project_roles
         (project_id, name, color, can_view_tasks, can_view_finance, can_view_risk, can_view_decisions)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        projectId,
        String(name).trim(),
        color || '#6366f1',
        can_view_tasks  ?? true,
        can_view_finance  ?? false,
        can_view_risk     ?? false,
        can_view_decisions ?? false,
      ]
    );

    res.status(201).json({ success: true, data: { role: result.rows[0] } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ UPDATE Role — ป้องกัน duplicate case-insensitive (ยกเว้น role ตัวเอง)
exports.updateRole = async (req, res) => {
  try {
    const { projectId, roleId } = req.params;
    const { name, color, can_view_tasks, can_view_finance, can_view_risk, can_view_decisions } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Role name is required' });
    }

    // ── Duplicate check ยกเว้นตัวเอง ──
    const dupCheck = await pool.query(
      `SELECT id FROM public.project_roles
       WHERE project_id = $1
         AND LOWER(TRIM(name)) = LOWER(TRIM($2))
         AND id != $3`,
      [projectId, name, roleId]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(409).json({ success: false, message: `Role "${name}" already exists in this project` });
    }

    const result = await pool.query(
      `UPDATE public.project_roles
       SET name               = $1,
           color              = $2,
           can_view_tasks     = $3,
           can_view_finance   = $4,
           can_view_risk      = $5,
           can_view_decisions = $6,
           updated_at         = NOW()
       WHERE id = $7 AND project_id = $8
       RETURNING *`,
      [
        String(name).trim(),
        color,
        can_view_tasks  ?? true,
        can_view_finance  ?? false,
        can_view_risk     ?? false,
        can_view_decisions ?? false,
        roleId,
        projectId,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    res.json({ success: true, data: { role: result.rows[0] } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ DELETE Role
exports.deleteRole = async (req, res) => {
  try {
    const { projectId, roleId } = req.params;

    // ถอด role_id ออกจาก members ก่อนลบ
    await pool.query(
      `UPDATE public.project_members SET role_id = NULL WHERE project_id = $1 AND role_id = $2`,
      [projectId, roleId]
    );

    const result = await pool.query(
      `DELETE FROM public.project_roles WHERE id = $1 AND project_id = $2 RETURNING id`,
      [roleId, projectId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    res.json({ success: true, message: 'Role deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ ASSIGN Role ให้ member
exports.assignRole = async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const { role_id } = req.body;

    // ถ้าส่ง role_id มาให้ตรวจว่าอยู่ใน project เดียวกัน
    if (role_id) {
      const roleCheck = await pool.query(
        `SELECT id FROM public.project_roles WHERE id = $1 AND project_id = $2`,
        [role_id, projectId]
      );
      if (roleCheck.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Role does not belong to this project' });
      }
    }

    const result = await pool.query(
      `UPDATE public.project_members
       SET role_id = $1
       WHERE project_id = $2 AND user_id = $3
       RETURNING *`,
      [role_id || null, projectId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    res.json({ success: true, message: 'Role assigned', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ GET My Permissions
exports.getMyPermissions = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // ── เช็คก่อนว่า req.user มีอะไรบ้าง ──
    console.log('req.user:', req.user);
    
    const userId = req.user?.id ?? req.user?.user_id ?? req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const ownerCheck = await pool.query(
      `SELECT created_by FROM public.projects WHERE id = $1`,
      [projectId]
    );

    const isOwner = ownerCheck.rows.length > 0 &&
      String(ownerCheck.rows[0].created_by) === String(userId);

    if (isOwner) {
      return res.json({
        success: true,
        data: {
          is_owner: true,
          can_view_tasks: true,
          can_view_finance: true,
          can_view_risk: true,
          can_view_decisions: true,
          role_name: 'Owner',
          color: '#f59e0b',
        },
      });
    }

    const result = await pool.query(
      `SELECT 
         COALESCE(pr.can_view_tasks, false)     AS can_view_tasks,
         COALESCE(pr.can_view_finance, false)   AS can_view_finance,
         COALESCE(pr.can_view_risk, false)      AS can_view_risk,
         COALESCE(pr.can_view_decisions, false) AS can_view_decisions,
         pr.name  AS role_name,
         pr.color AS color
       FROM public.project_members pm
       LEFT JOIN public.project_roles pr ON pm.role_id = pr.id
       WHERE pm.project_id = $1 AND pm.user_id = $2`,
      [projectId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    res.json({
      success: true,
      data: { is_owner: false, ...result.rows[0] },
    });

  } catch (err) {
    console.error('getMyPermissions ERROR:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};