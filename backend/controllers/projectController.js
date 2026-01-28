const db = require('../config/database');


const getProjects = async (req, res) => {
  try {
   
    const userId = req.user ? req.user.user_id : 1; 

    const result = await db.query(
      `SELECT 
        p.project_id,
        p.title,
        p.description,
        p.created_at,
        p.end_at,
        p.status,
        p.progress,
        p.created_by,
        u.username as creator_username,
        u.full_name as creator_name,
        u.avatar_url as creator_avatar,
        COUNT(DISTINCT pm2.user_id) as member_count
      FROM projects p
      INNER JOIN project_members pm ON p.project_id = pm.project_id AND pm.user_id = $1
      LEFT JOIN users u ON p.created_by = u.user_id
      LEFT JOIN project_members pm2 ON p.project_id = pm2.project_id
      GROUP BY p.project_id, u.user_id
      ORDER BY p.created_at DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: {
        projects: result.rows,
      },
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

    const result = await db.query(
      `SELECT 
        p.project_id,
        p.title,
        p.description,
        p.created_at,
        p.end_at,
        p.status,
        p.progress,
        p.created_by,
        u.username as creator_username,
        u.full_name as creator_name,
        u.avatar_url as creator_avatar
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.user_id
      WHERE p.project_id = $1`,
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
      data: {
        project: result.rows[0],
      },
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

    const userId = req.user ? req.user.user_id : 1;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Project title is required',
      });
    }

    await client.query('BEGIN');

  
    const projectResult = await client.query(
      `INSERT INTO projects (title, description, created_by, end_at, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       RETURNING *`,
      [title, description || null, userId, end_at || null]
    );

    const project = projectResult.rows[0];


    await client.query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, $3)`,
      [project.project_id, userId, 'owner']
    );

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: {
        project,
      },
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
    const { title, description, end_at, status, progress } = req.body;

    const userId = req.user ? req.user.user_id : 1;

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
    if (userRole !== 'owner' && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only owner or admin can edit project details',
      });
    }


    const result = await db.query(
      `UPDATE projects 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           end_at = COALESCE($3, end_at),
           status = COALESCE($4, status),
           progress = COALESCE($5, progress),
           updated_at = CURRENT_TIMESTAMP
       WHERE project_id = $6
       RETURNING *`,
      [title, description, end_at, status, progress, projectId]
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
      data: {
        project: result.rows[0],
      },
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

    const result = await db.query(
      'DELETE FROM projects WHERE project_id = $1 RETURNING project_id',
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

    const requesterId = req.user ? req.user.user_id : 1;

    if (!emailOrUsername) {
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

    const requesterRole = roleCheck.rows[0].role;
    if (requesterRole !== 'owner' && requesterRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only owner or admin can add members',
      });
    }


    const userResult = await db.query(
      'SELECT user_id, username, email, full_name, avatar_url FROM users WHERE email = $1 OR username = $1',
      [emailOrUsername]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = userResult.rows[0];


    const memberCheck = await db.query(
      'SELECT member_id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, user.user_id]
    );

    if (memberCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this project',
      });
    }


    const memberRole = role || 'member';
    await db.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [projectId, user.user_id, memberRole]
    );

    return res.status(201).json({
      success: true,
      message: 'Member added successfully',
      data: {
        user: {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          role: memberRole,
        },
      },
    });
  } catch (error) {
    console.error('Add member error:', error);
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
        pm.member_id,
        pm.role,
        pm.joined_at,
        u.user_id,
        u.username,
        u.email,
        u.full_name,
        u.avatar_url
      FROM project_members pm
      JOIN users u ON pm.user_id = u.user_id
      WHERE pm.project_id = $1
      ORDER BY 
        CASE pm.role 
          WHEN 'owner' THEN 1
          WHEN 'admin' THEN 2
          WHEN 'member' THEN 3
        END,
        pm.joined_at ASC`,
      [projectId]
    );

    return res.status(200).json({
      success: true,
      data: {
        members: result.rows,
      },
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

    const requesterId = req.user ? req.user.user_id : 1;


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

    const requesterRole = requesterRoleCheck.rows[0].role;
    if (requesterRole !== 'owner' && requesterRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only owner or admin can remove members',
      });
    }

  
    const targetRoleCheck = await db.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
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


    const result = await db.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2 RETURNING member_id',
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
