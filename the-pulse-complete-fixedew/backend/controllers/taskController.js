const db = require('../config/database');

// --- HELPERS ---
const isValidUUID = (v) => v !== undefined && v !== null && String(v).trim() !== '';

// เช็คว่าคนที่จะ Assign ให้ เป็นสมาชิกในโปรเจกต์จริงไหม
const ensureAssigneeIsProjectMember = async (projectId, assignedTo) => {
  if (!isValidUUID(assignedTo)) return null; // ถ้าส่งมาเป็นค่าว่าง หรือ null ให้เคลียร์ Assignee
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
        t.id, t.name, t.description, t.status, 
        t.start_at, t.deadline, t.dor, t.dod,
        t.created_at, t.updated_at,
        t.created_by,
        creator.name AS created_by_username,
        t.assigned_to,
        assignee.name AS assignee_username, -- 👈 แก้ชื่อ alias ให้สื่อความหมาย
        assignee.name AS assigned_username  -- 👈 เผื่อ Frontend ตัวเก่าใช้
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE t.project_id = $1
    `;

    const params = [projectId];
    
    if (status) {
      params.push(status);
      query += ` AND t.status = $2`;
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

// ✅ 2. ดึงงานส่วนตัว (My Tasks)
const getMyTasks = async (req, res) => {
  try {
    const userId = req.user.id; 

    const result = await db.query(
      `SELECT 
        t.id, t.name, t.description, t.status, t.deadline, t.priority,
        t.project_id, t.updated_at,
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
    console.error('Get my tasks error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch your tasks' });
  }
};

// ✅ 3. ดึงรายละเอียดงานเดียว
const getTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const result = await db.query(
      `SELECT t.*, 
        creator.name AS created_by_username,
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
    const { name, description, status, priority, start_at, deadline, dor, dod, assigned_to } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Task name is required' });
    }

    // เช็คสิทธิ์ในโปรเจกต์
    const memberCheck = await db.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not a member of this project' });
    }

    const role = memberCheck.rows[0].role;
    let assignedToFinal = userId; // Default: assign ให้ตัวเอง

    // ถ้าเป็น Owner ถึงจะ assign ให้คนอื่นได้
    if (role === 'owner' && assigned_to) {
      assignedToFinal = await ensureAssigneeIsProjectMember(projectId, assigned_to);
    }

    const result = await db.query(
      `INSERT INTO tasks (
        project_id, name, description, created_by, 
        status, priority, assigned_to, dor, dod, start_at, deadline
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING *`,
      [
        projectId, 
        String(name).trim(), 
        description || null, 
        userId, 
        status || 'todo', 
        priority || 'medium', // เพิ่ม Priority
        assignedToFinal, 
        dor || null, 
        dod || null, 
        start_at || null, 
        deadline || null
      ]
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
    const { name, description, status, priority, start_at, deadline, dor, dod, assigned_to } = req.body;

    // 1. ดึงข้อมูลงานเดิม
    const taskCheck = await db.query('SELECT project_id, assigned_to FROM tasks WHERE id = $1', [taskId]);
    if (taskCheck.rows.length === 0) return res.status(404).json({ success: false, message: 'Task not found' });
    const task = taskCheck.rows[0];

    // 2. เช็ค Role ของคนกดแก้ไข
    const memberCheck = await db.query('SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2', [task.project_id, userId]);
    if (memberCheck.rows.length === 0) return res.status(403).json({ success: false, message: 'Forbidden' });

    const role = memberCheck.rows[0].role;
    const isOwner = role === 'owner';
    const isAssignee = String(task.assigned_to) === String(userId);

    if (!isOwner && !isAssignee) return res.status(403).json({ success: false, message: 'You can only edit your own tasks' });

    // 3. เตรียมข้อมูลอัปเดต
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (start_at !== undefined) updateData.start_at = start_at;
    if (dor !== undefined) updateData.dor = dor;
    
    // 🚩 Logic สิทธิ์: Owner แก้ได้ทุกอย่าง / Assignee แก้ได้แค่บางอย่าง
    if (isOwner) {
      if (deadline !== undefined) updateData.deadline = deadline;
      if (priority !== undefined) updateData.priority = priority;
      if (dod !== undefined) updateData.dod = dod;
      if (assigned_to !== undefined) {
        updateData.assigned_to = await ensureAssigneeIsProjectMember(task.project_id, assigned_to);
      }
    } else {
       // ถ้าไม่ใช่ Owner อย่าให้แก้ Deadline หรือเปลี่ยนคนรับผิดชอบ
       // (Optional: ถ้าอยากให้ Assignee แก้ Deadline ได้ ก็ย้ายขึ้นไปข้างบน)
    }

    // 4. สร้าง Query แบบ Dynamic
    const fields = Object.keys(updateData);
    if (fields.length === 0) return res.status(200).json({ success: true, message: 'Nothing to update' });

    const values = Object.values(updateData);
    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    
    values.push(taskId); // ตัวแปรสุดท้ายคือ ID

    const result = await db.query(
      `UPDATE tasks SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *`,
      values
    );

    return res.status(200).json({ success: true, data: { task: result.rows[0] } });
  } catch (error) {
    console.error('Update task error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Update failed' });
  }
};

// ✅ 6. อัปเดตสถานะ (Drag & Drop) - เพิ่ม Security Check
const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    // 🚩 ต้องเช็คสิทธิ์ก่อนอัปเดต!
    const taskCheck = await db.query(
      `SELECT t.project_id, t.assigned_to, pm.role 
       FROM tasks t
       JOIN project_members pm ON t.project_id = pm.project_id AND pm.user_id = $2
       WHERE t.id = $1`,
      [taskId, userId]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'No permission to move this task' });
    }

    const task = taskCheck.rows[0];
    const isOwner = task.role === 'owner';
    const isAssignee = String(task.assigned_to) === String(userId);

    // อนุญาตให้ Owner หรือเจ้าของงานย้ายได้
    if (!isOwner && !isAssignee) {
      return res.status(403).json({ success: false, message: 'Only assignee or owner can move tasks' });
    }

    const result = await db.query(
      `UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 RETURNING *`,
      [status, taskId]
    );

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update status error:', error);
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
    console.error('Delete task error:', error);
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