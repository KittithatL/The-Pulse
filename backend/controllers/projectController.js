const db = require('../config/database');

const getProjects = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : 1; // ✅ users.id

    const result = await db.query(
      `SELECT 
        p.id AS project_id,
        p.title,
        p.description,
        p.created_at,
        p.end_at,
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
        p.id, p.title, p.description, p.created_at, p.end_at, p.created_by,
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

const getProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user ? req.user.id : 1;

    // ✅ แนะนำ: กันคนไม่ใช่สมาชิกดูโปรเจค
    const memberCheck = await db.query(
      `SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this project',
      });
    }

    const result = await db.query(
      `SELECT 
        p.id AS project_id,
        p.title,
        p.description,
        p.created_at,
        p.end_at,
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

const createProject = async (req, res) => {
  const client = await db.pool.connect();

  try {
    const { title, description, end_at } = req.body;
    const userId = req.user ? req.user.id : 1;

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Project title is required',
      });
    }

    await client.query('BEGIN');

    const projectResult = await client.query(
      `INSERT INTO projects (title, description, created_by, end_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [String(title).trim(), description ?? null, userId, end_at ?? null]
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
      message: 'Failed to create project',
    });
  } finally {
    client.release();
  }
};

const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, end_at } = req.body;
    const userId = req.user ? req.user.id : 1;

    const roleCheck = await db.query(
      `SELECT role FROM project_members 
       WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );

    if (roleCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this project',
      });
    }

    const userRole = roleCheck.rows[0].role;
    // ✅ schema role มีแค่ owner/member
    if (userRole !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only owner can edit project details',
      });
    }

    const result = await db.query(
      `UPDATE projects 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           end_at = COALESCE($3, end_at)
       WHERE id = $4
       RETURNING *`,
      [title ?? null, description ?? null, end_at ?? null, projectId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: { project: result.rows[0] },
    });
  } catch (error) {
    console.error('Update project error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update project',
    });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user ? req.user.id : 1;

    // ✅ กันลบมั่ว: ต้องเป็น owner
    const roleCheck = await db.query(
      `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );

    if (roleCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this project',
      });
    }

    if (roleCheck.rows[0].role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only owner can delete project',
      });
    }

    const result = await db.query(
      `DELETE FROM projects WHERE id = $1 RETURNING id`,
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
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete project',
    });
  }
};

const addMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { emailOrUsername, role } = req.body;

    const requesterId = req.user ? req.user.id : 1;

    if (!emailOrUsername || !String(emailOrUsername).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email or username is required',
      });
    }

    const roleCheck = await db.query(
      `SELECT role FROM project_members 
       WHERE project_id = $1 AND user_id = $2`,
      [projectId, requesterId]
    );

    if (roleCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this project',
      });
    }

    // ✅ schema role มีแค่ owner/member
    if (roleCheck.rows[0].role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only owner can add members',
      });
    }

    const userResult = await db.query(
      `SELECT id, username, email 
       FROM users 
       WHERE email = $1 OR username = $1`,
      [String(emailOrUsername).trim()]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = userResult.rows[0];

    // ✅ กันซ้ำ (PK composite)
    const memberCheck = await db.query(
      `SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, user.id]
    );
    if (memberCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this project',
      });
    }

    const memberRole = (role && String(role).toLowerCase() === 'owner') ? 'owner' : 'member';
    // ปกติไม่ควรให้ add คนเป็น owner ผ่าน API นี้ แต่คงไว้แบบกันพัง

    await db.query(
      `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)`,
      [projectId, user.id, memberRole === 'owner' ? 'member' : memberRole] // ✅ บังคับเป็น member
    );

    return res.status(201).json({
      success: true,
      message: 'Member added successfully',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: 'member',
        },
      },
    });
  } catch (error) {
    console.error('Add member error:', error);

    // unique/PK collision
    if (error && error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this project',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to add member',
    });
  }
};

const getMembers = async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await db.query(
      `SELECT 
        pm.role,
        pm.joined_at,
        u.id AS user_id,
        u.username,
        u.email
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1
      ORDER BY 
        CASE pm.role 
          WHEN 'owner' THEN 1
          WHEN 'member' THEN 2
        END,
        pm.joined_at ASC`,
      [projectId]
    );

    return res.status(200).json({
      success: true,
      data: { members: result.rows },
    });
  } catch (error) {
    console.error('Get members error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch members',
    });
  }
};

const removeMember = async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const requesterId = req.user ? req.user.id : 1;

    const requesterRoleCheck = await db.query(
      `SELECT role FROM project_members 
       WHERE project_id = $1 AND user_id = $2`,
      [projectId, requesterId]
    );

    if (requesterRoleCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this project',
      });
    }

    if (requesterRoleCheck.rows[0].role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only owner can remove members',
      });
    }

    const targetRoleCheck = await db.query(
      `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );

    if (targetRoleCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in this project',
      });
    }

    if (targetRoleCheck.rows[0].role === 'owner') {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove project owner',
      });
    }

    // ✅ schema ไม่มี member_id ให้ return
    const result = await db.query(
      `DELETE FROM project_members 
       WHERE project_id = $1 AND user_id = $2
       RETURNING user_id`,
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Remove member error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove member',
    });
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
