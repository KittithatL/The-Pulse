const db = require('../config/database');

const isValidInt = (v) =>
  v !== undefined && v !== null && String(v).trim() !== '' && !Number.isNaN(Number(v));

const ensureAssigneeIsProjectMember = async (projectId, assignedTo) => {
  // allow null/unassigned
  if (!isValidInt(assignedTo)) return null;

  const uid = Number(assignedTo);

  const check = await db.query(
    `SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2`,
    [projectId, uid]
  );

  if (check.rows.length === 0) {
    const err = new Error('Assignee must be a member of this project');
    err.statusCode = 400;
    throw err;
  }

  return uid;
};

const getTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.query;

    let query = `
      SELECT 
        t.id AS task_id,
        t.title,
        t.description,
        t.status,
        t.start_at,
        t.deadline,
        t.dor,
        t.dod,
        t.created_at,
        t.updated_at,
        t.created_by AS created_by_id,
        creator.username AS created_by_username,

        t.assigned_to,
        assignee.username AS assigned_username

      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON assignee.id::bigint = t.assigned_to
      WHERE t.project_id = $1
    `;

    const params = [projectId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND t.status = $${paramCount}`;
      params.push(status);
    }

    query += ' ORDER BY t.created_at DESC';

    const result = await db.query(query, params);

    return res.status(200).json({
      success: true,
      data: { tasks: result.rows },
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
    });
  }
};

const getTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const result = await db.query(
      `SELECT 
        t.id AS task_id,
        t.project_id,
        t.title,
        t.description,
        t.status,
        t.start_at,
        t.deadline,
        t.dor,
        t.dod,
        t.created_by AS created_by_id,
        t.created_at,
        t.updated_at,
        creator.username AS created_by_username,

        t.assigned_to,
        assignee.username AS assigned_username

      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON assignee.id::bigint = t.assigned_to
      WHERE t.id = $1`,
      [taskId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    return res.status(200).json({
      success: true,
      data: { task: result.rows[0] },
    });
  } catch (error) {
    console.error('Get task error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch task' });
  }
};

const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const {
      title,
      description,
      status,
      start_at,
      deadline,
      dor,
      dod,
      assigned_to, // ✅ ใช้ชื่อนี้
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }

    // must be project member
    const memberCheck = await db.query(
      `SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'You are not a member of this project' });
    }

    // validate assignee
    let assignedTo = null;
    try {
      assignedTo = await ensureAssigneeIsProjectMember(projectId, assigned_to);
    } catch (e) {
      return res.status(e.statusCode || 400).json({ success: false, message: e.message });
    }

    const result = await db.query(
      `INSERT INTO tasks (
        project_id, title, description, created_by,
        status, start_at, deadline, dor, dod,
        assigned_to
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        projectId,
        String(title).trim(),
        description ?? null,
        userId,
        status ?? 'todo',
        start_at ?? null,
        deadline ?? null,
        dor ?? null,
        dod ?? null,
        assignedTo,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task: result.rows[0] },
    });
  } catch (error) {
    console.error('Create task error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create task' });
  }
};

const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const taskCheck = await db.query(
      'SELECT created_by, project_id FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const task = taskCheck.rows[0];

    // must be member + (creator or owner)
    const memberCheck = await db.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [task.project_id, userId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'You do not have permission to update this task' });
    }

    const role = memberCheck.rows[0].role;
    const isCreator = Number(task.created_by) === Number(userId);
    const isOwner = role === 'owner';

    if (!isCreator && !isOwner) {
      return res.status(403).json({ success: false, message: 'You do not have permission to update this task' });
    }

    const {
      title,
      description,
      status,
      start_at,
      deadline,
      dor,
      dod,
      assigned_to, // ✅
    } = req.body;

    // validate assignee if provided
    let assignedTo;
    if (assigned_to !== undefined) {
      try {
        assignedTo = await ensureAssigneeIsProjectMember(task.project_id, assigned_to);
      } catch (e) {
        return res.status(e.statusCode || 400).json({ success: false, message: e.message });
      }
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (start_at !== undefined) updateData.start_at = start_at;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (dor !== undefined) updateData.dor = dor;
    if (dod !== undefined) updateData.dod = dod;
    if (assigned_to !== undefined) updateData.assigned_to = assignedTo; // ✅

    const fields = Object.keys(updateData);
    const values = Object.values(updateData);

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    values.push(taskId);

    const result = await db.query(
      `UPDATE tasks 
       SET ${setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${values.length}
       RETURNING *`,
      values
    );

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: { task: result.rows[0] },
    });
  } catch (error) {
    console.error('Update task error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update task' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const taskCheck = await db.query(
      `SELECT t.created_by, t.project_id, pm.role
       FROM tasks t
       LEFT JOIN project_members pm 
         ON t.project_id = pm.project_id AND pm.user_id = $2
       WHERE t.id = $1`,
      [taskId, userId]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const task = taskCheck.rows[0];
    const isCreator = Number(task.created_by) === Number(userId);
    const isOwner = task.role === 'owner';

    if (!isCreator && !isOwner) {
      return res.status(403).json({ success: false, message: 'You do not have permission to delete this task' });
    }

    await db.query('DELETE FROM tasks WHERE id = $1', [taskId]);

    return res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete task' });
  }
};

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
};
