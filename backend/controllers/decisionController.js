const pool = require('../config/database');

const getQuarterRange = (q) => {
  const year = new Date().getFullYear();
  const ranges = {
    Q1: [`${year}-01-01`, `${year}-03-31`],
    Q2: [`${year}-04-01`, `${year}-06-30`],
    Q3: [`${year}-07-01`, `${year}-09-30`],
    Q4: [`${year}-10-01`, `${year}-12-31`],
  };
  return ranges[q] || null;
};

exports.getDecisions = async (req, res) => {
  const { projectId } = req.params;
  const { category, status, period, keyword } = req.query;

  try {
    const params = [projectId];
    const conditions = ['d.project_id = $1'];

    if (category && category !== 'ALL') {
      params.push(category);
      conditions.push(`d.category = $${params.length}`);
    }
    if (status && status !== 'ALL') {
      params.push(status);
      conditions.push(`d.status = $${params.length}`);
    }
    if (keyword) {
      params.push(`%${keyword}%`);
      conditions.push(`(d.title ILIKE $${params.length} OR d.rationale ILIKE $${params.length} OR d.trade_offs ILIKE $${params.length})`);
    }
    if (period && period !== 'ALL') {
      const range = getQuarterRange(period);
      if (range) {
        params.push(range[0], range[1]);
        conditions.push(`d.created_at BETWEEN $${params.length - 1} AND $${params.length}`);
      } else if (period === 'MONTH') {
        conditions.push(`d.created_at >= NOW() - INTERVAL '30 days'`);
      }
    }

    const result = await pool.query(
      `SELECT
         d.*,
         u.username AS creator_name,
         u.id AS creator_id,
         COALESCE(
           JSON_AGG(
             DISTINCT JSONB_BUILD_OBJECT('user_id', s.user_id, 'username', su.username)
           ) FILTER (WHERE s.user_id IS NOT NULL),
           '[]'
         ) AS stakeholders,
         COALESCE(
           JSON_AGG(
             DISTINCT JSONB_BUILD_OBJECT('type', r.emoji, 'user_id', r.user_id)
           ) FILTER (WHERE r.id IS NOT NULL),
           '[]'
         ) AS reactions,
         (SELECT COUNT(*) FROM decision_comments dc WHERE dc.decision_id = d.id) AS comment_count
       FROM decisions d
       LEFT JOIN users u ON d.created_by = u.id
       LEFT JOIN decision_stakeholders s ON s.decision_id = d.id
       LEFT JOIN users su ON su.id = s.user_id
       LEFT JOIN decision_reactions r ON r.decision_id = d.id
       WHERE ${conditions.join(' AND ')}
       GROUP BY d.id, u.id, u.username
       ORDER BY d.created_at DESC`,
      params
    );

    return res.json({ success: true, data: { decisions: result.rows } });
  } catch (err) {
    console.error('getDecisions error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch decisions' });
  }
};

exports.getDecision = async (req, res) => {
  const { decisionId } = req.params;
  try {
    const [decRes, commentsRes, activityRes] = await Promise.all([
      pool.query(
        `SELECT d.*, u.username AS creator_name,
           COALESCE(
             JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('user_id', s.user_id, 'username', su.username))
             FILTER (WHERE s.user_id IS NOT NULL), '[]'
           ) AS stakeholders,
           COALESCE(
             JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('type', r.emoji, 'user_id', r.user_id))
             FILTER (WHERE r.id IS NOT NULL), '[]'
           ) AS reactions
         FROM decisions d
         LEFT JOIN users u ON d.created_by = u.id
         LEFT JOIN decision_stakeholders s ON s.decision_id = d.id
         LEFT JOIN users su ON su.id = s.user_id
         LEFT JOIN decision_reactions r ON r.decision_id = d.id
         WHERE d.id = $1
         GROUP BY d.id, u.id, u.username`,
        [decisionId]
      ),
      pool.query(
        `SELECT dc.*, u.username, u.id AS user_id
         FROM decision_comments dc
         LEFT JOIN users u ON u.id = dc.user_id
         WHERE dc.decision_id = $1
         ORDER BY dc.created_at ASC`,
        [decisionId]
      ),
      pool.query(
        `SELECT da.*, u.username
         FROM decision_activity da
         LEFT JOIN users u ON u.id = da.actor_id
         WHERE da.decision_id = $1
         ORDER BY da.created_at DESC
         LIMIT 50`,
        [decisionId]
      ),
    ]);

    if (decRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Decision not found' });
    }

    return res.json({
      success: true,
      data: {
        decision: decRes.rows[0],
        comments: commentsRes.rows,
        activity: activityRes.rows,
      },
    });
  } catch (err) {
    console.error('getDecision error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch decision' });
  }
};

exports.createDecision = async (req, res) => {
  const { projectId } = req.params;
  const {
    title, category = 'Technical', impact = 'medium',
    status = 'proposed', rationale, trade_offs,
    jira_link, confluence_link, stakeholder_ids = [],
  } = req.body;

  if (!title?.trim()) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const countRes = await client.query(
      `SELECT COUNT(*) AS cnt FROM decisions WHERE project_id = $1`, [projectId]
    );
    const code = `D-${101 + parseInt(countRes.rows[0].cnt)}`;

    const result = await client.query(
      `INSERT INTO decisions
         (project_id, code, title, category, impact, status, rationale, trade_offs, jira_link, confluence_link, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [projectId, code, title.trim(), category, impact, status, rationale || null, trade_offs || null,
       jira_link || null, confluence_link || null, req.user.id]
    );
    const decision = result.rows[0];

    for (const uid of stakeholder_ids) {
      await client.query(
        `INSERT INTO decision_stakeholders (decision_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [decision.id, uid]
      );
    }

    await client.query(
      `INSERT INTO decision_activity (decision_id, actor_id, action, detail)
       VALUES ($1, $2, 'CREATED', $3)`,
      [decision.id, req.user.id, `Decision ${code} created with status "${status}"`]
    );

    await client.query('COMMIT');
    return res.status(201).json({ success: true, data: { decision } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createDecision error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create decision' });
  } finally {
    client.release();
  }
};

exports.updateDecision = async (req, res) => {
  const { decisionId } = req.params;
  const { title, category, impact, status, rationale, trade_offs, jira_link, confluence_link } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const oldRes = await client.query(`SELECT status, title FROM decisions WHERE id = $1`, [decisionId]);
    if (oldRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Decision not found' });
    }

    const result = await client.query(
      `UPDATE decisions SET
         title           = COALESCE($1, title),
         category        = COALESCE($2, category),
         impact          = COALESCE($3, impact),
         status          = COALESCE($4, status),
         rationale       = COALESCE($5, rationale),
         trade_offs      = COALESCE($6, trade_offs),
         jira_link       = COALESCE($7, jira_link),
         confluence_link = COALESCE($8, confluence_link),
         updated_at      = NOW()
       WHERE id = $9
       RETURNING *`,
      [title, category, impact, status, rationale, trade_offs, jira_link, confluence_link, decisionId]
    );

    const old = oldRes.rows[0];
    if (status && status !== old.status) {
      await client.query(
        `INSERT INTO decision_activity (decision_id, actor_id, action, detail)
         VALUES ($1, $2, 'STATUS_CHANGED', $3)`,
        [decisionId, req.user.id, `Status changed from "${old.status}" → "${status}"`]
      );
    } else {
      await client.query(
        `INSERT INTO decision_activity (decision_id, actor_id, action, detail)
         VALUES ($1, $2, 'UPDATED', 'Decision fields updated')`,
        [decisionId, req.user.id]
      );
    }

    await client.query('COMMIT');
    return res.json({ success: true, data: { decision: result.rows[0] } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('updateDecision error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update decision' });
  } finally {
    client.release();
  }
};

exports.archiveDecision = async (req, res) => {
  const { decisionId } = req.params;
  try {
    const result = await pool.query(
      `UPDATE decisions SET is_archived = TRUE, updated_at = NOW() WHERE id = $1 RETURNING id, code`,
      [decisionId]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Decision not found' });

    await pool.query(
      `INSERT INTO decision_activity (decision_id, actor_id, action, detail) VALUES ($1,$2,'ARCHIVED','Decision archived')`,
      [decisionId, req.user.id]
    );
    return res.json({ success: true, message: 'Decision archived' });
  } catch (err) {
    console.error('archiveDecision error:', err);
    return res.status(500).json({ success: false, message: 'Failed to archive decision' });
  }
};

exports.addComment = async (req, res) => {
  const { decisionId } = req.params;
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ success: false, message: 'Comment content required' });

  try {
    const result = await pool.query(
      `INSERT INTO decision_comments (decision_id, user_id, content) VALUES ($1,$2,$3) RETURNING *`,
      [decisionId, req.user.id, content.trim()]
    );
    await pool.query(
      `INSERT INTO decision_activity (decision_id, actor_id, action, detail) VALUES ($1,$2,'COMMENTED','Added a comment')`,
      [decisionId, req.user.id]
    );
    const full = await pool.query(
      `SELECT dc.*, u.username FROM decision_comments dc LEFT JOIN users u ON u.id = dc.user_id WHERE dc.id = $1`,
      [result.rows[0].id]
    );
    return res.status(201).json({ success: true, data: { comment: full.rows[0] } });
  } catch (err) {
    console.error('addComment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
};

exports.deleteComment = async (req, res) => {
  const { commentId } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM decision_comments WHERE id = $1 AND user_id = $2 RETURNING id`,
      [commentId, req.user.id]
    );
    if (result.rows.length === 0) return res.status(403).json({ success: false, message: 'Not authorized or comment not found' });
    return res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete comment' });
  }
};

exports.toggleReaction = async (req, res) => {
  const { decisionId } = req.params;
  const { emoji } = req.body; // 'up' | 'down' | etc.
  if (!emoji) return res.status(400).json({ success: false, message: 'emoji is required' });

  try {
    const existing = await pool.query(
      `SELECT id FROM decision_reactions WHERE decision_id=$1 AND user_id=$2 AND emoji=$3`,
      [decisionId, req.user.id, emoji]
    );
    if (existing.rows.length > 0) {
      await pool.query(`DELETE FROM decision_reactions WHERE id=$1`, [existing.rows[0].id]);
      return res.json({ success: true, action: 'removed' });
    } else {
      await pool.query(
        `INSERT INTO decision_reactions (decision_id, user_id, emoji) VALUES ($1,$2,$3)`,
        [decisionId, req.user.id, emoji]
      );
      return res.json({ success: true, action: 'added' });
    }
  } catch (err) {
    console.error('toggleReaction error:', err);
    return res.status(500).json({ success: false, message: 'Failed to toggle reaction' });
  }
};

exports.updateStakeholders = async (req, res) => {
  const { decisionId } = req.params;
  const { stakeholder_ids = [] } = req.body;
  try {
    await pool.query(`DELETE FROM decision_stakeholders WHERE decision_id = $1`, [decisionId]);
    for (const uid of stakeholder_ids) {
      await pool.query(
        `INSERT INTO decision_stakeholders (decision_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [decisionId, uid]
      );
    }
    await pool.query(
      `INSERT INTO decision_activity (decision_id, actor_id, action, detail) VALUES ($1,$2,'STAKEHOLDERS_UPDATED','Stakeholders list updated')`,
      [decisionId, req.user.id]
    );
    return res.json({ success: true, message: 'Stakeholders updated' });
  } catch (err) {
    console.error('updateStakeholders error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update stakeholders' });
  }
};


exports.getStrategyReport = async (req, res) => {
  const { projectId } = req.params;
  try {
    const stats = await pool.query(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE status = 'approved') AS approved,
         COUNT(*) FILTER (WHERE status = 'proposed') AS proposed,
         COUNT(*) FILTER (WHERE status = 'under_review') AS under_review,
         COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
         COUNT(*) FILTER (WHERE status = 'superseded') AS superseded,
         COUNT(*) FILTER (WHERE impact = 'high') AS high_impact,
         COUNT(*) FILTER (WHERE category = 'Technical') AS technical,
         COUNT(*) FILTER (WHERE category = 'Business') AS business,
         COUNT(*) FILTER (WHERE category = 'UIUX') AS uiux
       FROM decisions WHERE project_id = $1 AND is_archived = FALSE`,
      [projectId]
    );

    const latest = await pool.query(
      `SELECT title, status, impact, created_at FROM decisions
       WHERE project_id = $1 AND is_archived = FALSE
       ORDER BY created_at DESC LIMIT 5`,
      [projectId]
    );

    const s = stats.rows[0];
    const approvalRate = s.total > 0 ? Math.round((s.approved / s.total) * 100) : 0;

    return res.json({
      success: true,
      data: {
        stats: {
          total: parseInt(s.total),
          approved: parseInt(s.approved),
          proposed: parseInt(s.proposed),
          under_review: parseInt(s.under_review),
          rejected: parseInt(s.rejected),
          superseded: parseInt(s.superseded),
          high_impact: parseInt(s.high_impact),
          approval_rate: approvalRate,
          by_category: {
            Technical: parseInt(s.technical),
            Business: parseInt(s.business),
            UIUX: parseInt(s.uiux),
          },
        },
        latest_decisions: latest.rows,
        insight: approvalRate >= 70
          ? `Strategic momentum is strong with ${approvalRate}% approval rate. Focus area: ${parseInt(s.technical) > parseInt(s.business) ? 'Technical architecture' : 'Business strategy'}.`
          : `${s.under_review} decisions pending review. Recommend prioritizing ${s.high_impact} high-impact items for faster throughput.`,
      },
    });
  } catch (err) {
    console.error('getStrategyReport error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
};