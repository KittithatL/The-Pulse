const pool = require('../config/database');

// ✅ GET All Projects (ของ user นั้นๆ)
const getProjects = async (req, res) => {
  try {
    // ใช้ user.id จริง ถ้าไม่มีให้ return 401
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT 
        p.id AS project_id,
        p.title,
        p.description,
        p.created_at,
        p.deadline,  -- ✅ ใช้ deadline ตรงๆ เพราะแก้ DB แล้ว
        p.learning_capacity,
        p.created_by,
        u.username AS creator_username,
        COUNT(DISTINCT pm2.user_id) AS member_count
      FROM projects p
      INNER JOIN project_members pm 
        ON p.id = pm.project_id AND pm.user_id = $1
      LEFT JOIN users u 
        ON p.created_by = u.id
      LEFT JOIN project_members pm2 
        ON p.id = pm2.project_id
      GROUP BY 
        p.id, p.title, p.description, p.created_at, p.deadline, p.learning_capacity, p.created_by,
        u.id, u.username
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
      message: 'Failed to fetch projects',
    });
  }
};

// ✅ GET Single Project
const getProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Check Member
    const memberCheck = await pool.query(
      `SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this project',
      });
    }

    const result = await pool.query(
      `SELECT 
        p.id AS project_id,
        p.title,
        p.description,
        p.created_at,
        p.deadline, -- ✅ ใช้ deadline
        p.learning_capacity,
        p.created_by,
        u.username AS creator_username
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = $1`,
      [projectId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
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
      message: 'Failed to fetch project',
    });
  }
};

// ✅ CREATE Project
const createProject = async (req, res) => {
  const client = await pool.connect(); // ใช้ client สำหรับ Transaction

  try {
    const { title, description, deadline, learning_capacity } = req.body;
    const userId = req.user.id;

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Project title is required',
      });
    }

    await client.query('BEGIN');

    // Insert Project
    // ✅ แก้ไข: ใช้ deadline ใน INSERT
    const projectResult = await client.query(
      `INSERT INTO projects (title, description, created_by, deadline, learning_capacity)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        String(title).trim(), 
        description ?? null, 
        userId, 
        deadline ?? null, // ✅ ส่งค่า deadline
        learning_capacity ?? 0
      ]
    );

    const project = projectResult.rows[0];

    // Add Creator as Owner
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
      message: 'Failed to create project',
    });
  } finally {
    client.release();
  }
};

// ✅ UPDATE Project
const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log("🔍 req.body:", req.body);
    const { title, description, deadline, learning_capacity } = req.body;
    const userId = req.user.id;

    const roleCheck = await pool.query(
      `SELECT role FROM project_members 
       WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );

    if (roleCheck.rows.length === 0) return res.status(403).json({ message: 'Not a member' });
    if (roleCheck.rows[0].role !== 'owner') {
      return res.status(403).json({ message: 'Only owner can edit project details' });
    }

    // ✅ แก้ไข: ใช้ deadline ใน UPDATE
    const result = await pool.query(
      `UPDATE projects 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           deadline = COALESCE($3, deadline), 
           learning_capacity = COALESCE($4, learning_capacity)
       WHERE id = $5
       RETURNING *`,
      [title ?? null, description ?? null, deadline ?? null, learning_capacity ?? null, projectId]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'Project not found' });

    return res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: { project: result.rows[0] },
    });
  } catch (error) {
    console.error('Update project error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update project' });
  }
};

// ✅ DELETE Project
const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const roleCheck = await pool.query(
      `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );

    if (roleCheck.rows.length === 0) return res.status(403).json({ message: 'Not a member' });
    if (roleCheck.rows[0].role !== 'owner') return res.status(403).json({ message: 'Only owner can delete project' });

    const result = await pool.query(
      `DELETE FROM projects WHERE id = $1 RETURNING id`,
      [projectId]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'Project not found' });

    return res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete project' });
  }
};

// ✅ ADD Member
const addMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { emailOrUsername, role } = req.body;
    const requesterId = req.user.id;

    if (!emailOrUsername) return res.status(400).json({ message: 'Email or username is required' });

    // Check Requester Role
    const roleCheck = await pool.query(
      `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, requesterId]
    );

    if (roleCheck.rows.length === 0 || roleCheck.rows[0].role !== 'owner') {
      return res.status(403).json({ message: 'Only owner can add members' });
    }

    // Find User to Add
    const userResult = await pool.query(
      `SELECT id, username, email FROM users WHERE email = $1 OR username = $1`,
      [String(emailOrUsername).trim()]
    );

    if (userResult.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    const userToAdd = userResult.rows[0];

    // Check if already member
    const memberCheck = await pool.query(
      `SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, userToAdd.id]
    );
    if (memberCheck.rows.length > 0) return res.status(400).json({ message: 'User is already a member' });

    // Insert
    await pool.query(
      `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)`,
      [projectId, userToAdd.id, 'member'] // Force role as member
    );

    return res.status(201).json({
      success: true,
      message: 'Member added successfully',
      data: { user: { ...userToAdd, role: 'member' } },
    });
  } catch (error) {
    console.error('Add member error:', error);
    return res.status(500).json({ success: false, message: 'Failed to add member' });
  }
};

// ✅ GET Members
const getMembers = async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await pool.query(
      `SELECT pm.role, pm.joined_at, u.id AS user_id, u.username, u.email
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1
       ORDER BY CASE pm.role WHEN 'owner' THEN 1 ELSE 2 END, pm.joined_at ASC`,
      [projectId]
    );
    return res.status(200).json({ success: true, data: { members: result.rows } });
  } catch (error) {
    console.error('Get members error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch members' });
  }
};

// ✅ REMOVE Member
const removeMember = async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const requesterId = req.user.id;

    const requesterCheck = await pool.query(
      `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, requesterId]
    );

    if (requesterCheck.rows.length === 0 || requesterCheck.rows[0].role !== 'owner') {
      return res.status(403).json({ message: 'Only owner can remove members' });
    }

    const targetCheck = await pool.query(
      `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );

    if (targetCheck.rows.length === 0) return res.status(404).json({ message: 'Member not found' });
    if (targetCheck.rows[0].role === 'owner') return res.status(400).json({ message: 'Cannot remove owner' });

    await pool.query(
      `DELETE FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );

    return res.status(200).json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
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