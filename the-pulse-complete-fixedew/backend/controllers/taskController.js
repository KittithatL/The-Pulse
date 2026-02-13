const db = require('../config/database');

// --- HELPERS ---
const isValidUUID = (v) => v !== undefined && v !== null && String(v).trim() !== '';

// เช็คว่าคนที่จะ Assign ให้ เป็นสมาชิกในโปรเจกต์จริงไหม
const ensureAssigneeIsProjectMember = async (projectId, assignedTo) => {
  if (!isValidUUID(assignedTo)) return null; // ถ้าส่งมาเป็นค่าว่าง หรือ null ให้คืนค่า null

  const check = await db.query(
    `SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2`,
    [projectId, assignedTo]
  );

  if (check.rows.length === 0) {
    const err = new Error('Assignee must be a member of this project');
    err.statusCode = 400;
    throw err;
  }
  return assignedTo;
};

// ✅ 1. ดึงงานทั้งหมดในโปรเจกต์ (หน้า Kanban)
const getTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.query;

    let query = `
      SELECT 
        t.*,
        creator.username AS created_by_username,
        assignee.username AS assignee_username, 
        assignee.username AS assigned_username,
        assignee.email AS assignee_email
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
        t.*,
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
        creator.username AS created_by_username,
        assignee.username AS assigned_username
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
    const userId = req.user.id;
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

    // จัดการ Assignee
    let assignedToFinal = userId; // Default: assign ให้ตัวเอง
    if (isValidUUID(assigned_to)) {
       // ถ้ามีการส่ง assigned_to มา ให้เช็คว่าเป็นสมาชิกไหม
       const validMember = await ensureAssigneeIsProjectMember(projectId, assigned_to);
       if (validMember) assignedToFinal = validMember;
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
        priority || 'medium', 
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
    return res.status(500).json({ success: false, message: error.message || 'Failed to create task' });
  }
};

// ✅ 5. อัปเดตงาน (Full Update) - แก้ไข Logic ให้ Dynamic Query ทำงานได้จริง
const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const { name, description, status, priority, start_at, deadline, dor, dod, assigned_to } = req.body;

    // 1. ดึงข้อมูลงานเดิม และเช็ค Role ของคนกดแก้ไข
    const checkQuery = `
      SELECT t.project_id, t.assigned_to, pm.role 
      FROM tasks t
      LEFT JOIN project_members pm ON t.project_id = pm.project_id AND pm.user_id = $2
      WHERE t.id = $1
    `;
    const checkResult = await db.query(checkQuery, [taskId, userId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found or access denied' });
    }

    const { project_id, assigned_to: currentAssignee, role } = checkResult.rows[0];
    const isOwner = role === 'owner';
    const isAssignee = String(currentAssignee) === String(userId);

    // เช็คสิทธิ์พื้นฐาน
    if (!isOwner && !isAssignee) {
      return res.status(403).json({ success: false, message: 'You can only edit your own tasks' });
    }

    // 2. เตรียมข้อมูลอัปเดต (Build Dynamic Query)
    const updates = [];
    const values = [];
    let paramIndex = 1;

    // Helper ในการ push ค่าลง Query
    const addUpdate = (field, value) => {
      updates.push(`${field} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    };

    // -- ฟิลด์ที่ใครๆ (Owner/Assignee) ก็แก้ได้ --
    if (name !== undefined) addUpdate('name', name);
    if (description !== undefined) addUpdate('description', description);
    if (status !== undefined) addUpdate('status', status);
    if (start_at !== undefined) addUpdate('start_at', start_at);
    if (dor !== undefined) addUpdate('dor', dor);

    // -- ฟิลด์ที่เฉพาะ Owner แก้ได้ --
    if (isOwner) {
      if (priority !== undefined) addUpdate('priority', priority);
      if (deadline !== undefined) addUpdate('deadline', deadline);
      if (dod !== undefined) addUpdate('dod', dod);
      
      // ถ้ามีการเปลี่ยน Assignee
      if (assigned_to !== undefined) {
        const validAssignee = await ensureAssigneeIsProjectMember(project_id, assigned_to);
        // ถ้า validAssignee เป็น null (คือส่งค่าว่างมา) ก็ยอมให้เป็น null ได้ (Unassign)
        addUpdate('assigned_to', validAssignee); 
      }
    }

    // ถ้าไม่มีอะไรให้อัปเดตเลย
    if (updates.length === 0) {
      return res.status(200).json({ success: true, message: 'No changes detected' });
    }

    // 3. ยิง Query
    values.push(taskId); // ตัวแปรสุดท้ายคือ ID
    const query = `
      UPDATE tasks 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;

    const result = await db.query(query, values);

    return res.status(200).json({ success: true, data: { task: result.rows[0] } });

  } catch (error) {
    console.error('Update task error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Update failed' });
  }
};

// ✅ 6. อัปเดตสถานะ (Drag & Drop)
const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    // เช็คสิทธิ์
    const taskCheck = await db.query(
      `SELECT t.project_id, t.assigned_to, pm.role 
       FROM tasks t
       LEFT JOIN project_members pm ON t.project_id = pm.project_id AND pm.user_id = $2
       WHERE t.id = $1`,
      [taskId, userId]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Task not found or permission denied' });
    }

    const { assigned_to, role } = taskCheck.rows[0];
    const isOwner = role === 'owner';
    const isAssignee = String(assigned_to) === String(userId);

    // อนุญาตให้ Owner หรือ Assignee ย้ายงานได้
    // (ถ้าอยากให้ทุกคนในโปรเจกต์ย้ายได้ ให้แก้เงื่อนไขตรงนี้)
    if (!isOwner && !isAssignee && !role) { // !role คือไม่ใช่ member เลย
      return res.status(403).json({ success: false, message: 'Permission denied' });
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
    const userId = req.user.id;

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

    if (!isCreator && !isOwner) return res.status(403).json({ success: false, message: 'No permission to delete' });

    await db.query('DELETE FROM tasks WHERE id = $1', [taskId]);
    return res.status(200).json({ success: true, message: 'Task deleted successfully' });
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