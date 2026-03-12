const pool = require('../config/database');

// ─────────────────────────────────────────────────────────
// POST /api/pairing/request
// Body: { task_id, target_id, message? }
// ─────────────────────────────────────────────────────────
exports.createPairingRequest = async (req, res) => {
  try {
    const requesterId = req.user.id;
    const { task_id, target_id, message } = req.body;

    if (!task_id || !target_id) {
      return res.status(400).json({ success: false, message: 'task_id and target_id are required' });
    }
    if (String(requesterId) === String(target_id)) {
      return res.status(400).json({ success: false, message: 'Cannot pair with yourself' });
    }

    // ดึง task + project info
    const taskRes = await pool.query(
      `SELECT t.id, t.title, t.project_id, p.title AS project_name
       FROM public.tasks t
       JOIN public.projects p ON t.project_id = p.id
       WHERE t.id = $1`,
      [task_id]
    );
    if (taskRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    const task = taskRes.rows[0];

    // ตรวจสอบว่า target เป็น member ของ project ด้วย
    const memberCheck = await pool.query(
      `SELECT 1 FROM public.project_members WHERE project_id = $1 AND user_id = $2`,
      [task.project_id, target_id]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Target user is not a member of this project' });
    }

    // ดึงชื่อ requester
    const requesterRes = await pool.query(
      `SELECT username FROM public.users WHERE id = $1`,
      [requesterId]
    );
    const requesterName = requesterRes.rows[0]?.username || 'Someone';

    // Insert pairing request (upsert — ถ้ามี pending อยู่แล้วจะ conflict)
    let result;
    try {
      result = await pool.query(
        `INSERT INTO public.pairing_requests (task_id, project_id, requester_id, target_id, message)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [task_id, task.project_id, requesterId, target_id, message || null]
      );
    } catch (uniqueErr) {
      if (uniqueErr.code === '23505') {
        return res.status(409).json({ success: false, message: 'Pairing request already sent' });
      }
      throw uniqueErr;
    }

    const newRequest = result.rows[0];

    // ─── Socket: ส่ง notification ไปหา target ทันที ───
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${target_id}`).emit('new_notification', {
        id: newRequest.id,
        type: 'pairing',
        message: `${requesterName} is requesting your help on: "${task.title}"`,
        severity: 'normal',
        project_name: task.project_name,
        project_id: task.project_id,
        task_id: task_id,
        user: requesterName,
        node: task.title,
        weight: 'Normal',
        created_at: new Date(),
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Pairing request sent',
      data: newRequest,
    });
  } catch (err) {
    console.error('createPairingRequest error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/pairing/my-requests
// ดึง pending requests ที่ target = ตัวเอง (สำหรับแสดงใน My Day)
// ─────────────────────────────────────────────────────────
exports.getMyPairingRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT 
         pr.id, pr.message, pr.status, pr.created_at,
         pr.task_id, pr.project_id,
         t.title AS node,
         p.title AS project_name,
         u.username AS user,
         CASE 
           WHEN t.priority IN ('critical','high') THEN 'High'
           ELSE 'Normal'
         END AS weight
       FROM public.pairing_requests pr
       JOIN public.tasks t ON pr.task_id = t.id
       JOIN public.projects p ON pr.project_id = p.id
       JOIN public.users u ON pr.requester_id = u.id
       WHERE pr.target_id = $1 AND pr.status = 'pending'
       ORDER BY pr.created_at DESC`,
      [userId]
    );

    return res.json({ success: true, data: { requests: result.rows } });
  } catch (err) {
    console.error('getMyPairingRequests error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/pairing/:requestId/accept
// ─────────────────────────────────────────────────────────
exports.acceptPairingRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `UPDATE public.pairing_requests
       SET status = 'accepted', updated_at = NOW()
       WHERE id = $1 AND target_id = $2 AND status = 'pending'
       RETURNING *, (SELECT username FROM public.users WHERE id = $2) AS target_name`,
      [requestId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Request not found or already handled' });
    }

    const req_ = result.rows[0];

    // Socket: แจ้ง requester ว่าถูก accept
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${req_.requester_id}`).emit('new_notification', {
        id: req_.id,
        type: 'pairing_accepted',
        message: `${req_.target_name} accepted your pairing request on task #${req_.task_id}`,
        project_id: req_.project_id,
        created_at: new Date(),
      });

      // ลบออกจาก notification ของ target
      io.to(`user_${userId}`).emit('resolve_notification', {
        id: req_.id,
        type: 'pairing',
      });
    }

    return res.json({ success: true, message: 'Pairing accepted', data: req_ });
  } catch (err) {
    console.error('acceptPairingRequest error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/pairing/:requestId/decline
// ─────────────────────────────────────────────────────────
exports.declinePairingRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `UPDATE public.pairing_requests
       SET status = 'declined', updated_at = NOW()
       WHERE id = $1 AND target_id = $2 AND status = 'pending'
       RETURNING *`,
      [requestId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Request not found or already handled' });
    }

    const req_ = result.rows[0];

    // Socket: ลบออกจาก notification ของ target
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('resolve_notification', {
        id: req_.id,
        type: 'pairing',
      });
    }

    return res.json({ success: true, message: 'Pairing declined' });
  } catch (err) {
    console.error('declinePairingRequest error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyPairs = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT 
         pr.id, pr.status, pr.created_at, pr.updated_at,
         pr.task_id, pr.project_id,
         t.title AS node,
         p.title AS project_name,
         -- requester info
         u_req.id AS requester_id,
         u_req.username AS requester_name,
         -- target info
         u_tgt.id AS target_id,
         u_tgt.username AS target_name,
         -- partner คือคนอีกฝั่ง
         CASE 
           WHEN pr.requester_id = $1 THEN u_tgt.username
           ELSE u_req.username
         END AS partner_name,
         CASE
           WHEN pr.requester_id = $1 THEN 'outgoing'
           ELSE 'incoming'
         END AS direction,
         CASE WHEN t.priority IN ('critical','high') THEN 'High' ELSE 'Normal' END AS weight
       FROM public.pairing_requests pr
       JOIN public.tasks t      ON pr.task_id      = t.id
       JOIN public.projects p   ON pr.project_id   = p.id
       JOIN public.users u_req  ON pr.requester_id = u_req.id
       JOIN public.users u_tgt  ON pr.target_id    = u_tgt.id
       WHERE (pr.requester_id = $1 OR pr.target_id = $1)
         AND pr.status = 'accepted'
       ORDER BY pr.updated_at DESC`,
      [userId]
    );

    return res.json({ success: true, data: { pairs: result.rows } });
  } catch (err) {
    console.error('getMyPairs error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};