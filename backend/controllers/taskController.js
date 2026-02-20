const pool = require('../config/database');

// Helper: ตรวจสอบว่าเป็น integer ที่ถูกต้อง
const isValidInt = (v) =>
  v !== undefined && v !== null && String(v).trim() !== '' && !Number.isNaN(Number(v));

// Helper: ตรวจสอบว่าคนที่จะ Assign งานให้ เป็นคนในโปรเจกต์จริงไหม
const ensureAssigneeIsProjectMember = async (projectId, assignedTo) => {
  if (!isValidInt(assignedTo)) return null;
  const uid = Number(assignedTo);
  const check = await pool.query(
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

// ✅ 1. Get All Tasks in Project
const getTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.query;

    let query = `
      SELECT 
        t.id AS task_id, t.title, t.description, t.status, t.priority,
        t.start_at, t.deadline, t.dor, t.dod, t.created_at, t.updated_at,
        t.created_by AS created_by_id, creator.username AS created_by_username,
        t.assigned_to, assignee.username AS assigned_username
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON assignee.id = t.assigned_to
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
    const result = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      data: { tasks: result.rows },
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
};

// ✅ 2. Get Single Task
const getTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const result = await pool.query(
      `SELECT 
        t.id AS task_id, t.project_id, t.title, t.description, t.status, t.priority,
        t.start_at, t.deadline, t.dor, t.dod, t.created_by AS created_by_id,
        t.created_at, t.updated_at, creator.username AS created_by_username,
        t.assigned_to, assignee.username AS assigned_username
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON assignee.id = t.assigned_to
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

// ✅ 3. Create Task (Real-time Notification)
const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });

    const { title, description, status, priority, deadline, dor, dod, assigned_to } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }

    const memberCheck = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'You are not a member of this project' });
    }

    const role = memberCheck.rows[0].role;
    let assignedToFinal = userId;

    if (role === 'owner' && assigned_to) {
      try {
        assignedToFinal = await ensureAssigneeIsProjectMember(projectId, assigned_to);
      } catch (e) {
        return res.status(400).json({ success: false, message: e.message });
      }
    }

    const result = await pool.query(
      `INSERT INTO tasks (
        project_id, title, description, created_by, 
        status, priority, assigned_to, dor, dod, start_at, deadline
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE, $10) 
      RETURNING *`,
      [
        projectId, String(title).trim(), description || null, userId,
        status || 'todo', priority || 'medium', assignedToFinal,
        dor || null, dod || null, deadline || null
      ]
    );

    const newTask = result.rows[0];

    const io = req.app.get('io');
    if (io && assignedToFinal) {
      const projectInfo = await pool.query('SELECT title FROM projects WHERE id = $1', [projectId]);
      
      const notificationData = {
        id: newTask.id,
        type: 'task',
        message: newTask.title,
        severity: newTask.priority,
        project_name: projectInfo.rows[0]?.title || 'Unknown Project',
        project_id: projectId,
        created_at: new Date()
      };

      io.to(`user_${assignedToFinal}`).emit('new_notification', notificationData);
    }

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task: newTask },
    });
  } catch (error) {
    console.error('Create task error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create task' });
  }
};

// ✅ 4. Update Task
const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });

    const taskCheck = await pool.query(
      'SELECT created_by, project_id, assigned_to FROM tasks WHERE id = $1', 
      [taskId]
    );

    if (taskCheck.rows.length === 0) return res.status(404).json({ success: false, message: 'Task not found' });
    const task = taskCheck.rows[0];

    const memberCheck = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [task.project_id, userId]
    );

    if (memberCheck.rows.length === 0) return res.status(403).json({ success: false, message: 'Permission denied' });

    const role = memberCheck.rows[0].role;
    const isOwner = role === 'owner';
    const isAssignee = task.assigned_to && String(task.assigned_to) === String(userId);

    if (!isOwner && !isAssignee) return res.status(403).json({ success: false, message: 'Permission denied' });

    const { title, description, status, priority, start_at, deadline, dor, dod, assigned_to } = req.body;

    let updates = [];
    let values = [];
    let counter = 1;

    const addUpdate = (field, value) => {
      updates.push(`${field} = $${counter}`);
      values.push(value);
      counter++;
    };

    if (title !== undefined) addUpdate('title', title);
    if (description !== undefined) addUpdate('description', description);
    if (status !== undefined) addUpdate('status', status);
    if (priority !== undefined) addUpdate('priority', priority);
    
    if (start_at && String(start_at).trim() !== '') {
      addUpdate('start_at', String(start_at).substring(0, 10));
    }
    if (deadline && String(deadline).trim() !== '') {
      addUpdate('deadline', String(deadline).substring(0, 10));
    }
    if (dor !== undefined) addUpdate('dor', dor);

    if (isOwner) {
      if (dod !== undefined) addUpdate('dod', dod);
      if (assigned_to !== undefined) {
         try {
           const validAssignee = await ensureAssigneeIsProjectMember(task.project_id, assigned_to);
           addUpdate('assigned_to', validAssignee);
           
           const io = req.app.get('io');
           if (io && validAssignee !== task.assigned_to) {
              io.to(`user_${validAssignee}`).emit('new_notification', {
                id: taskId,
                type: 'task',
                message: `You were assigned to: ${title || 'Existing Task'}`,
                project_id: task.project_id,
                created_at: new Date()
              });
           }
         } catch(e) {
           return res.status(400).json({ success: false, message: e.message });
         }
      }
    }

    if (updates.length === 0) return res.status(400).json({ success: false, message: 'No valid fields to update' });

    values.push(taskId);
    const query = `
  UPDATE tasks 
  SET ${updates.map(u => {
      if(u.includes('start_at') || u.includes('deadline')) {
          return u + '::date';
      }
      return u;
      }).join(', ')}, 
      updated_at = TIMEZONE('asia/bangkok', NOW())
      WHERE id = $${counter}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (status === 'done') {
        const io = req.app.get('io');
        if (io) io.emit('resolve_notification', { id: taskId, type: 'task' });
    }

    return res.status(200).json({ success: true, data: { task: result.rows[0] } });
  } catch (error) {
    console.error('Update task error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update task' });
  }
};

// ✅ 5. Delete Task
const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });

    const taskCheck = await pool.query(
      `SELECT t.created_by, t.project_id, pm.role FROM tasks t
       LEFT JOIN project_members pm ON t.project_id = pm.project_id AND pm.user_id = $2
       WHERE t.id = $1`, [taskId, userId]
    );

    if (taskCheck.rows.length === 0) return res.status(404).json({ success: false, message: 'Task not found' });
    const task = taskCheck.rows[0];
    if (String(task.created_by) !== String(userId) && task.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'No permission' });
    }

    await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);

    const io = req.app.get('io');
    if (io) io.emit('resolve_notification', { id: taskId, type: 'task' });

    return res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete task' });
  }
};

// ✅ 6. Get My Tasks (สำหรับหน้า My Day และ My Tasks)
const getMyTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            `SELECT 
                t.id,
                t.title,
                t.description,
                t.status,
                t.deadline,
                t.project_id,
                p.title AS project_title
             FROM public.tasks t
             JOIN public.projects p ON t.project_id = p.id
             WHERE t.assigned_to = $1
             ORDER BY 
                CASE t.status 
                    WHEN 'doing' THEN 1 
                    WHEN 'todo' THEN 2 
                    WHEN 'done' THEN 3 
                    ELSE 4
                END, t.deadline ASC`,
            [userId]
        );
        res.json({ success: true, data: { tasks: result.rows } });
    } catch (err) {
        console.error('Get my tasks error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch personal tasks' });
    }
};

// ✅ ส่งออกฟังก์ชันทั้งหมด (รวม getMyTasks ด้วย)
module.exports = { 
    getTasks, 
    getTask, 
    createTask, 
    updateTask, 
    deleteTask, 
    getMyTasks // ต้องมีบรรทัดนี้เพื่อป้องกัน Error ใน Route
};