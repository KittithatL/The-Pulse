const db = require('../config/database');

// ✅ 1. ดึงรายการโปรเจกต์ทั้งหมดที่ User เป็นสมาชิก
const getProjects = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : 1; // ลบ :1 ออกเมื่อระบบ Login สมบูรณ์

    const result = await db.query(
      `SELECT 
        p.id AS project_id,
        p.name, 
        p.description,
        p.created_at,
        p.end_at,
        p.created_by,
        u.name AS creator_name,
        COUNT(DISTINCT pm2.user_id) AS member_count
      FROM projects p
      INNER JOIN project_members pm 
        ON p.id = pm.project_id AND pm.user_id = $1
      LEFT JOIN users u 
        ON p.created_by = u.id
      LEFT JOIN project_members pm2 
        ON p.id = pm2.project_id
      GROUP BY 
        p.id, p.name, p.description, p.created_at, p.end_at, p.created_by,
        u.id, u.name
      ORDER BY p.created_at DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: { projects: result.rows },
    });
  } catch (error) {
    console.error('Get projects error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error: Failed to fetch projects',
    });
  }
};

// ✅ 2. ดึงรายละเอียดโปรเจกต์เดียว
const getProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user ? req.user.id : 1;

    const memberCheck = await db.query(
      `SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );
    
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: You are not a member of this project',
      });
    }

    const result = await db.query(
      `SELECT 
        p.id AS project_id,
        p.name,
        p.description,
        p.created_at,
        p.end_at,
        p.created_by,
        u.name AS creator_name
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = $1`,
      [projectId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Error: Project not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: { project: result.rows[0] },
    });
  } catch (error) {
    console.error('Get project error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error: Failed to fetch project details',
    });
  }
};

// ✅ 3. สร้างโปรเจกต์ใหม่ (มี Transaction ป้องกันข้อมูลค้าง)
const createProject = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { name, description, end_at } = req.body;
    const userId = req.user ? req.user.id : 1;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Project name is required',
      });
    }

    await client.query('BEGIN');

    const projectResult = await client.query(
      `INSERT INTO projects (name, description, created_by, end_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [String(name).trim(), description || null, userId, end_at || null]
    );

    const project = projectResult.rows[0];

    await client.query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, $3)`,
      [project.id, userId, 'owner']
    );

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create project error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database Error: Failed to create project',
    });
  } finally {
    client.release();
  }
};

// ✅ 4. แก้ไขโปรเจกต์
const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, end_at } = req.body;
    const userId = req.user ? req.user.id : 1;

    const roleCheck = await db.query(
      `SELECT role FROM project_members 
       WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );

    if (roleCheck.rows.length === 0 || roleCheck.rows[0].role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Permission Denied: Only owners can update project details',
      });
    }

    const result = await db.query(
      `UPDATE projects 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           end_at = COALESCE($3, end_at)
       WHERE id = $4
       RETURNING *`,
      [name || null, description || null, end_at || null, projectId]
    );

    return res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: { project: result.rows[0] },
    });
  } catch (error) {
    console.error('Update project error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error: Failed to update project',
    });
  }
};

// ✅ 5. ลบโปรเจกต์
const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user ? req.user.id : 1;

    const roleCheck = await db.query(
      `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );

    if (roleCheck.rows.length === 0 || roleCheck.rows[0].role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Permission Denied: Only owners can delete projects',
      });
    }

    await db.query(`DELETE FROM projects WHERE id = $1`, [projectId]);

    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error: Failed to delete project',
    });
  }
};

// ✅ 6. เพิ่มสมาชิก (ใช้ emailOrName)
const addMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { emailOrName, role } = req.body; 
    const requesterId = req.user ? req.user.id : 1;

    const roleCheck = await db.query(
      `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, requesterId]
    );

    if (roleCheck.rows.length === 0 || roleCheck.rows[0].role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Permission Denied: Only owners can add members',
      });
    }

    const userResult = await db.query(
      `SELECT id, name, email FROM users WHERE email = $1 OR name = $1`,
      [String(emailOrName).trim()]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found in the system' });
    }

    const user = userResult.rows[0];
    const memberRole = (role && String(role).toLowerCase() === 'owner') ? 'member' : (role || 'member');

    await db.query(
      `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)
       ON CONFLICT (project_id, user_id) DO NOTHING`, // ป้องกันการเพิ่มซ้ำ
      [projectId, user.id, memberRole]
    );

    return res.status(201).json({
      success: true,
      message: 'Member added successfully',
      data: { user: { id: user.id, name: user.name, email: user.email, role: memberRole } },
    });
  } catch (error) {
    console.error('Add member error:', error);
    return res.status(500).json({ success: false, message: 'Server Error: Failed to add member' });
  }
};

// ✅ ส่วนที่เหลือ (getMembers, removeMember) คงเดิมแต่ปรับปรุง Error Handling
const getMembers = async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await db.query(
      `SELECT pm.role, pm.joined_at, u.id AS user_id, u.name, u.email
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1
      ORDER BY CASE pm.role WHEN 'owner' THEN 1 ELSE 2 END, pm.joined_at ASC`,
      [projectId]
    );
    return res.status(200).json({ success: true, data: { members: result.rows } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch members' });
  }
};

const removeMember = async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const requesterId = req.user ? req.user.id : 1;

    const requesterRoleCheck = await db.query(
      `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, requesterId]
    );

    if (requesterRoleCheck.rows.length === 0 || requesterRoleCheck.rows[0].role !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only owner can remove members' });
    }

    await db.query(`DELETE FROM project_members WHERE project_id = $1 AND user_id = $2`, [projectId, userId]);

    return res.status(200).json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to remove member' });
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  getMembers,
  removeMember,
};