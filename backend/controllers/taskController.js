const db = require('../config/database');


const getTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, assigned_to } = req.query;

    let query = `
      SELECT 
        t.task_id,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.start_at,
        t.deadline,
        t.dor,
        t.dod,
        t.created_at,
        t.updated_at,
        t.completed_at,
        creator.user_id as created_by_id,
        creator.username as created_by_username,
        creator.full_name as created_by_name,
        creator.avatar_url as created_by_avatar,
        assignee.user_id as assigned_to_id,
        assignee.username as assigned_to_username,
        assignee.full_name as assigned_to_name,
        assignee.avatar_url as assigned_to_avatar
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.user_id
      LEFT JOIN users assignee ON t.assigned_to = assignee.user_id
      WHERE t.project_id = $1
    `;

    const params = [projectId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND t.status = $${paramCount}`;
      params.push(status);
    }

    if (assigned_to) {
      paramCount++;
      query += ` AND t.assigned_to = $${paramCount}`;
      params.push(assigned_to);
    }

    query += ' ORDER BY t.created_at DESC';

    const result = await db.query(query, params);

    return res.status(200).json({
      success: true,
      data: {
        tasks: result.rows,
      },
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
        t.*,
        creator.username as created_by_username,
        creator.full_name as created_by_name,
        creator.avatar_url as created_by_avatar,
        assignee.username as assigned_to_username,
        assignee.full_name as assigned_to_name,
        assignee.avatar_url as assigned_to_avatar
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.user_id
      LEFT JOIN users assignee ON t.assigned_to = assignee.user_id
      WHERE t.task_id = $1`,
      [taskId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        task: result.rows[0],
      },
    });
  } catch (error) {
    console.error('Get task error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch task',
    });
  }
};

const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.user_id;
    const {
      title,
      description,
      assigned_to,
      status,
      priority,
      start_at,
      deadline,
      dor,
      dod,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required',
      });
    }

    const result = await db.query(
      `INSERT INTO tasks (
        project_id, title, description, created_by, assigned_to,
        status, priority, start_at, deadline, dor, dod
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        projectId,
        title,
        description || null,
        userId,
        assigned_to || null,
        status || 'todo',
        priority || 'medium',
        start_at || null,
        deadline || null,
        dor || null,
        dod || null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: {
        task: result.rows[0],
      },
    });
  } catch (error) {
    console.error('Create task error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create task',
    });
  }
};

const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const {
      title,
      description,
      assigned_to,
      status,
      priority,
      start_at,
      deadline,
      dor,
      dod,
    } = req.body;

    const taskCheck = await db.query(
      'SELECT created_by, project_id FROM tasks WHERE task_id = $1',
      [taskId]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const task = taskCheck.rows[0];
    const userId = req.user.user_id;

    
    const memberCheck = await db.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [task.project_id, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this task',
      });
    }

    const role = memberCheck.rows[0].role;
    const isCreator = task.created_by === userId;
    const isOwnerOrAdmin = role === 'owner' || role === 'admin';

    if (!isCreator && !isOwnerOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this task',
      });
    }


    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'done') {
        updateData.completed_at = new Date();
      }
    }
    if (priority !== undefined) updateData.priority = priority;
    if (start_at !== undefined) updateData.start_at = start_at;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (dor !== undefined) updateData.dor = dor;
    if (dod !== undefined) updateData.dod = dod;

    const fields = Object.keys(updateData);
    const values = Object.values(updateData);

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
    }

    const setClause = fields
      .map((field, index) => `${field} = $${index + 1}`)
      .join(', ');

    values.push(taskId);

    const result = await db.query(
      `UPDATE tasks SET ${setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE task_id = $${values.length}
       RETURNING *`,
      values
    );

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: {
        task: result.rows[0],
      },
    });
  } catch (error) {
    console.error('Update task error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update task',
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.user_id;


    const taskCheck = await db.query(
      `SELECT t.created_by, t.project_id, pm.role
       FROM tasks t
       LEFT JOIN project_members pm ON t.project_id = pm.project_id AND pm.user_id = $2
       WHERE t.task_id = $1`,
      [taskId, userId]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const task = taskCheck.rows[0];
    const isCreator = task.created_by === userId;
    const isOwnerOrAdmin = task.role === 'owner' || task.role === 'admin';

    if (!isCreator && !isOwnerOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this task',
      });
    }

    await db.query('DELETE FROM tasks WHERE task_id = $1', [taskId]);

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete task error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete task',
    });
  }
};

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
};
