const pool = require('../config/database');

/**
 * ✅ 1. Get All Projects (เฉพาะที่มึงเป็นสมาชิก)
 */
const getProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT p.*, u.name AS creator_name,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) AS member_count
      FROM projects p
      INNER JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE pm.user_id = $1
      ORDER BY p.created_at DESC`, [userId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ✅ 2. Create Project (The Master Transaction)
 */
const createProject = async (req, res) => {
  // 🚩 ป้องกันบัค pool.connect: ต้องมั่นใจว่า database.js export pool ออกมาตรงๆ
  const client = await pool.connect(); 
  try {
    const { name, description, deadline, learning_capacity } = req.body;
    const userId = req.user.id;

    await client.query('BEGIN');

    // 1. บันทึกตัวโปรเจกต์
    const pRes = await client.query(
      `INSERT INTO projects (name, description, created_by, deadline, learning_capacity)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, description, userId, deadline, learning_capacity || 0]
    );
    const project = pRes.rows[0];

    // 2. ⚡ เพิ่มคนสร้างเป็น 'admin' (ใช้ ON CONFLICT เพื่อความปลอดภัย)
    await client.query(
      `INSERT INTO project_members (project_id, user_id, role) 
       VALUES ($1, $2, 'admin')
       ON CONFLICT (project_id, user_id) DO NOTHING`,
      [project.id, userId]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release(); // คืนเครื่องมือให้ Pool
  }
};

/**
 * ✅ 3. Get Single Project (พร้อมเช็คสิทธิ์)
 */
const getProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await pool.query(
      `SELECT p.* FROM projects p 
       JOIN project_members pm ON p.id = pm.project_id 
       WHERE p.id = $1 AND pm.user_id = $2`, [projectId, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Access Denied or Not Found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

/**
 * ✅ 4. Update Project (เพิ่มการเช็คสิทธิ์แอดมิน)
 */
const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, deadline, status, learning_capacity } = req.body;

    // เช็คก่อนว่ามึงเป็น admin ของโปรเจกต์นี้ไหม
    const checkRole = await pool.query(
      `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, req.user.id]
    );

    if (checkRole.rows.length === 0 || checkRole.rows[0].role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can edit' });
    }

    const result = await pool.query(
      `UPDATE projects SET 
        name=COALESCE($1, name), 
        description=COALESCE($2, description), 
        deadline=COALESCE($3, deadline), 
        status=COALESCE($4, status), 
        learning_capacity=COALESCE($5, learning_capacity)
       WHERE id = $6 RETURNING *`, [name, description, deadline, status, learning_capacity, projectId]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

/**
 * ✅ 5. Delete Project (Cascading Delete Logic)
 */
const deleteProject = async (req, res) => {
  const client = await pool.connect();
  try {
    const { projectId } = req.params;
    
    // 1. เช็คว่ามึงเป็นเจ้าของไหม
    const projectCheck = await pool.query(
      `SELECT id FROM projects WHERE id = $1 AND created_by = $2`, [projectId, req.user.id]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Unauthorized Deletion' });
    }

    await client.query('BEGIN');

    // 2. ลบข้อมูลที่เกี่ยวข้องก่อน (ถ้า DB ไม่ได้ตั้ง CASCADE)
    await client.query(`DELETE FROM project_members WHERE project_id = $1`, [projectId]);
    // มึงอาจจะมีตาราง tasks, comments ฯลฯ ก็สั่งลบที่นี่
    
    // 3. ลบโปรเจกต์
    await client.query(`DELETE FROM projects WHERE id = $1`, [projectId]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'MISSION TERMINATED: Project and members removed.' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

/**
 * ✅ 6. Members Logic
 */
const addMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { emailOrName, role } = req.body;
    
    const userRes = await pool.query(`SELECT id FROM users WHERE email = $1 OR name = $1`, [emailOrName]);
    if (userRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Target user not found' });
    
    const targetUserId = userRes.rows[0].id;

    await pool.query(
      `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)
       ON CONFLICT (project_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
      [projectId, targetUserId, role || 'member']
    );
    res.json({ success: true, message: 'UPLINK ESTABLISHED' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getMembers = async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, pm.role FROM project_members pm
       JOIN users u ON pm.user_id = u.id WHERE pm.project_id = $1`, [projectId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { 
  getProjects, 
  createProject, 
  getProject, 
  updateProject, 
  deleteProject, 
  addMember, 
  getMembers 
};