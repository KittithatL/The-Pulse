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
      title, description, status, start_at, deadline, dor, dod, assigned_to
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }

    // 1. ตรวจสอบสิทธิ์การเป็น Member และดึง Role
    const memberCheck = await db.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'You are not a member of this project' });
    }

    const role = memberCheck.rows[0].role;
    let assignedToFinal = userId; // ค่าเริ่มต้นเป็นตัวเอง

    // 2. 🛡️ Logic การกำหนดผู้รับผิดชอบ (Assignment Logic)
    if (role === 'owner') {
      // ถ้าเป็น PM และมีการส่ง assigned_to มา ให้ตรวจสอบก่อนว่าคนนั้นอยู่ในโปรเจกต์ไหม
      if (assigned_to) {
        try {
          assignedToFinal = await ensureAssigneeIsProjectMember(projectId, assigned_to);
        } catch (e) {
          return res.status(400).json({ success: false, message: e.message });
        }
      }
    } else {
      // ถ้าเป็น Member ทั่วไป บังคับให้ assign ตัวเองเท่านั้น
      assignedToFinal = userId;
    }

    // 3. บันทึกลง Database
    const result = await db.query(
      `INSERT INTO tasks (
        project_id, title, description, created_by, 
        status, assigned_to, dor, dod, start_at, deadline
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`,
      [
        projectId, 
        String(title).trim(), 
        description || null, 
        userId, 
        status || 'todo', 
        assignedToFinal, 
        dor || null, 
        dod || null, 
        start_at || null, 
        deadline || null
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

    // 1. ดึงข้อมูล Task มาตรวจสอบ
    const taskCheck = await db.query(
      'SELECT created_by, project_id, assigned_to FROM tasks WHERE id = $1', 
      [taskId]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const task = taskCheck.rows[0];

    // 2. ตรวจสอบ Role ในโปรเจกต์
    const memberCheck = await db.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [task.project_id, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Permission denied: Not a member' });
    }

    const role = memberCheck.rows[0].role;
    const isOwner = role === 'owner';
    const isAssignee = task.assigned_to && Number(task.assigned_to) === Number(userId);

    // 3. เช็คสิทธิ์การเข้าถึง: ต้องเป็น PM (Owner) หรือ ผู้รับผิดชอบงาน (Assignee) เท่านั้น
    if (!isOwner && !isAssignee) {
      return res.status(403).json({ success: false, message: 'Permission denied: Only Owner or Assignee can update' });
    }

    // 4. 🛡️ ข้อจำกัดการแก้ไข (🔒 Security Layer)
    if (!isOwner) {
      // ห้าม Member แก้ไข DoD
      if (req.body.dod !== undefined) delete req.body.dod;
      // ห้าม Member เปลี่ยนตัวผู้รับผิดชอบ (ป้องกันการโยนงาน)
      if (req.body.assigned_to !== undefined) delete req.body.assigned_to;
    }

    const {
      title, description, status, start_at, deadline, dor, dod, assigned_to
    } = req.body;

    // 5. เตรียมข้อมูล Update
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (start_at !== undefined) updateData.start_at = start_at;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (dor !== undefined) updateData.dor = dor;
    if (dod !== undefined) updateData.dod = dod; // จะเหลือแค่กรณี isOwner เท่านั้น
    
    // จัดการเรื่อง Assigned To (เฉพาะกรณีเป็น Owner)
    if (isOwner && assigned_to !== undefined) {
      updateData.assigned_to = await ensureAssigneeIsProjectMember(task.project_id, assigned_to);
    }

    const fields = Object.keys(updateData);
    const values = Object.values(updateData);

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    // 6. Execute Update
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
