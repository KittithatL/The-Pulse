const db = require('../config/database');

// --- HELPERS ---
// ✅ เช็คความเป็น UUID (ไม่ใช้ parseInt เพราะไม่ใช่ตัวเลข)
const isValidUUID = (v) => v !== undefined && v !== null && String(v).trim() !== '';

const ensureAssigneeIsProjectMember = async (projectId, assignedTo) => {
  if (!isValidUUID(assignedTo)) return null;
  const uid = String(assignedTo); 

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

// ✅ 1. ดึงงานทั้งหมดในโปรเจกต์ (หน้า Kanban)
const getTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.query;

    let query = `
      SELECT 
        t.id AS task_id,
        t.name,             -- 👈 เปลี่ยนจาก title เป็น name แล้ว
        t.description,
        t.status,
        t.start_at,
        t.deadline,
        t.dor,
        t.dod,
        t.created_at,
        t.updated_at,
        t.created_by AS created_by_id,
        creator.name AS created_by_username,
        t.assigned_to,
        assignee.name AS assigned_username
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
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
    return res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
};

// ✅ 2. ดึงงานส่วนตัว (หน้า My Tasks) - แก้จุด t.title -> t.name เรียบร้อย
const getMyTasks = async (req, res) => {
  try {
    const userId = req.user.id; 

    const result = await db.query(
      `SELECT 
        t.id AS task_id,
        t.name,             -- 👈 ตรวจสอบแล้ว: ใช้ name ตามตาราง tasks
        t.description,
        t.status,
        t.deadline,
        t.project_id,
        p.name AS project_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.assigned_to = $1
      ORDER BY t.deadline ASC NULLS LAST`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: { tasks: result.rows },
    });
  } catch (error) {
    console.error('❌ SQL ERROR ใน getMyTasks:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch your tasks' });
  }
};

// ✅ 3. ดึงรายละเอียดงานเดียว
const getTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const result = await db.query(
      `SELECT 
        t.id AS task_id,
        t.project_id,
        t.name,
        t.description,
        t.status,
        t.start_at,
        t.deadline,
        t.dor,
        t.dod,
        t.created_by AS created_by_id,
        t.created_at,
        t.updated_at,
        creator.name AS created_by_username,
        t.assigned_to,
        assignee.name AS assigned_username
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
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

// ✅ 4. สร้างงานใหม่
const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;

    const { name, description, status, start_at, deadline, dor, dod, assigned_to } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Task name is required' });
    }

    const memberCheck = await db.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not a member of this project' });
    }

    const role = memberCheck.rows[0].role;
    let assignedToFinal = userId;

    if (role === 'owner' && assigned_to) {
      assignedToFinal = await ensureAssigneeIsProjectMember(projectId, assigned_to);
    }

    const result = await db.query(
      `INSERT INTO tasks (
        project_id, name, description, created_by, 
        status, assigned_to, dor, dod, start_at, deadline
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`,
      [projectId, String(name).trim(), description || null, userId, status || 'todo', assignedToFinal, dor || null, dod || null, start_at || null, deadline || null]
    );

    return res.status(201).json({ success: true, data: { task: result.rows[0] } });
  } catch (error) {
    console.error('Create task error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create task' });
  }
};

// ✅ 5. อัปเดตงาน (Full Update)
const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.id;

    const taskCheck = await db.query('SELECT project_id, assigned_to FROM tasks WHERE id = $1', [taskId]);
    if (taskCheck.rows.length === 0) return res.status(404).json({ success: false, message: 'Task not found' });

    const task = taskCheck.rows[0];
    const memberCheck = await db.query('SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2', [task.project_id, userId]);

    if (memberCheck.rows.length === 0) return res.status(403).json({ success: false, message: 'Forbidden' });

    const role = memberCheck.rows[0].role;
    const isOwner = role === 'owner';
    const isAssignee = String(task.assigned_to) === String(userId);

    if (!isOwner && !isAssignee) return res.status(403).json({ success: false, message: 'No permission' });

    const { name, description, status, start_at, deadline, dor, dod, assigned_to } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (start_at !== undefined) updateData.start_at = start_at;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (dor !== undefined) updateData.dor = dor;
    
    if (isOwner) {
      if (dod !== undefined) updateData.dod = dod;
      if (assigned_to !== undefined) {
        updateData.assigned_to = await ensureAssigneeIsProjectMember(task.project_id, assigned_to);
      }
    }

    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    if (fields.length === 0) return res.status(400).json({ success: false, message: 'No fields to update' });

    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    values.push(taskId);

    const result = await db.query(
      `UPDATE tasks SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *`,
      values
    );

    return res.status(200).json({ success: true, data: { task: result.rows[0] } });
  } catch (error) {
    console.error('Update error:', error);
    return res.status(500).json({ success: false, message: 'Update failed' });
  }
};

// ✅ 6. อัปเดตสถานะ (Drag & Drop)
const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const result = await db.query(
      `UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 RETURNING *`,
      [status, taskId]
    );

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update status' });
  }
};

// ✅ 7. ลบงาน
const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.id;

    const taskCheck = await db.query(
      `SELECT t.created_by, t.project_id, pm.role
       FROM tasks t
       LEFT JOIN project_members pm ON t.project_id = pm.project_id AND pm.user_id = $2
       WHERE t.id = $1`,
      [taskId, userId]
    );

    if (taskCheck.rows.length === 0) return res.status(404).json({ success: false, message: 'Task not found' });

    const task = taskCheck.rows[0];
    const isCreator = String(task.created_by) === String(userId);
    const isOwner = task.role === 'owner';

    if (!isCreator && !isOwner) return res.status(403).json({ success: false, message: 'No permission' });

    await db.query('DELETE FROM tasks WHERE id = $1', [taskId]);
    return res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Delete failed' });
  }
};

module.exports = { 
  getTasks, 
  getMyTasks, 
  getTask, 
  createTask, 
  updateTask, 
  updateTaskStatus, 
  deleteTask 
};