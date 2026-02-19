const pool = require('../config/database');


exports.getOverview = async (req, res) => {
  const { projectId } = req.params;
  try {

    const budgetRes = await pool.query(
      `SELECT total_budget, currency FROM project_budgets WHERE project_id = $1`,
      [projectId]
    );
    if (budgetRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No budget configured for this project' });
    }
    const { total_budget, currency } = budgetRes.rows[0];

   
    const usedRes = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS used
       FROM disbursement_ledger
       WHERE project_id = $1 AND status IN ('approved', 'paid')`,
      [projectId]
    );
    const budgetUsed = parseFloat(usedRes.rows[0].used);
    const remaining = parseFloat(total_budget) - budgetUsed;
    const usedPercent = total_budget > 0 ? Math.round((budgetUsed / parseFloat(total_budget)) * 100) : 0;

    
    const burnRes = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) / NULLIF(COUNT(DISTINCT DATE_TRUNC('month', paid_at)), 0) AS monthly_burn
       FROM disbursement_ledger
       WHERE project_id = $1
         AND status = 'paid'
         AND paid_at >= NOW() - INTERVAL '3 months'`,
      [projectId]
    );
    const monthlyBurn = parseFloat(burnRes.rows[0].monthly_burn || 0);
    const runwayMonths = monthlyBurn > 0 ? Math.floor(remaining / monthlyBurn) : null;

    
    const pendingRes = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS pending_total, COUNT(*) AS pending_count
       FROM fund_requests
       WHERE project_id = $1 AND status = 'pending'`,
      [projectId]
    );

    return res.json({
      success: true,
      data: {
        currency,
        total_budget: parseFloat(total_budget),
        budget_used: budgetUsed,
        remaining,
        used_percent: usedPercent,
        monthly_burn: monthlyBurn,
        runway_months: runwayMonths,
        pending_requests: {
          count: parseInt(pendingRes.rows[0].pending_count),
          total: parseFloat(pendingRes.rows[0].pending_total),
        },
      },
    });
  } catch (err) {
    console.error('getOverview error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch financial overview' });
  }
};


exports.adjustBudget = async (req, res) => {
  const { projectId } = req.params;
  const { total_budget, reason } = req.body;
  if (!total_budget || isNaN(total_budget) || Number(total_budget) < 0) {
    return res.status(400).json({ success: false, message: 'Valid total_budget is required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO project_budgets (project_id, total_budget, currency, updated_by, updated_at)
       VALUES ($1, $2, COALESCE((SELECT currency FROM project_budgets WHERE project_id=$1), 'USD'), $3, NOW())
       ON CONFLICT (project_id) DO UPDATE
         SET total_budget = $2, updated_by = $3, updated_at = NOW()
       RETURNING *`,
      [projectId, Number(total_budget), req.user.id]
    );

   
    await pool.query(
      `INSERT INTO financial_audit_log (project_id, actor_id, action, amount, note)
       VALUES ($1, $2, 'BUDGET_ADJUSTED', $3, $4)`,
      [projectId, req.user.id, Number(total_budget), reason || 'Manual budget adjustment']
    );

    return res.json({ success: true, message: 'Budget updated', data: result.rows[0] });
  } catch (err) {
    console.error('adjustBudget error:', err);
    return res.status(500).json({ success: false, message: 'Failed to adjust budget' });
  }
};


exports.getSpendForecast = async (req, res) => {
  const { projectId } = req.params;
  try {
    const res_ = await pool.query(
      `SELECT
         TO_CHAR(DATE_TRUNC('month', paid_at), 'Mon YY') AS month,
         DATE_TRUNC('month', paid_at) AS month_date,
         SUM(amount) AS actual
       FROM disbursement_ledger
       WHERE project_id = $1 AND status = 'paid'
       GROUP BY DATE_TRUNC('month', paid_at)
       ORDER BY month_date ASC
       LIMIT 12`,
      [projectId]
    );


    const actuals = res_.rows;
    const last3 = actuals.slice(-3);
    const avgBurn = last3.length > 0
      ? last3.reduce((s, r) => s + parseFloat(r.actual), 0) / last3.length
      : 0;


    const forecast = [];
    const lastDate = actuals.length > 0
      ? new Date(actuals[actuals.length - 1].month_date)
      : new Date();

    for (let i = 1; i <= 3; i++) {
      const d = new Date(lastDate);
      d.setMonth(d.getMonth() + i);
      forecast.push({
        month: d.toLocaleString('en', { month: 'short', year: '2-digit' }),
        forecast: Math.round(avgBurn),
      });
    }

    return res.json({
      success: true,
      data: {
        actuals: actuals.map(r => ({ month: r.month, actual: parseFloat(r.actual) })),
        forecast,
        avg_monthly_burn: Math.round(avgBurn),
      },
    });
  } catch (err) {
    console.error('getSpendForecast error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch forecast' });
  }
};


exports.getFundRequests = async (req, res) => {
  const { projectId } = req.params;
  const { status } = req.query; 
  try {
    const params = [projectId];
    let where = 'WHERE fr.project_id = $1';
    if (status) { params.push(status); where += ` AND fr.status = $${params.length}`; }

    const result = await pool.query(
      `SELECT fr.*, 
              u.username AS requester_name,
              a.username AS approver_name
       FROM fund_requests fr
       LEFT JOIN users u ON fr.requester_id = u.id
       LEFT JOIN users a ON fr.approver_id = a.id
       ${where}
       ORDER BY fr.created_at DESC`,
      params
    );
    return res.json({ success: true, data: { requests: result.rows } });
  } catch (err) {
    console.error('getFundRequests error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch fund requests' });
  }
};

exports.createFundRequest = async (req, res) => {
  const { projectId } = req.params;
  const { amount, category, justification } = req.body;

  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ success: false, message: 'Valid amount is required' });
  }
  if (!justification) {
    return res.status(400).json({ success: false, message: 'Justification is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO fund_requests (project_id, requester_id, amount, category, justification)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [projectId, req.user.id, Number(amount), category || 'General', justification]
    );
    return res.status(201).json({ success: true, data: { request: result.rows[0] } });
  } catch (err) {
    console.error('createFundRequest error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create fund request' });
  }
};

exports.approveFundRequest = async (req, res) => {
  const { requestId } = req.params;
  const { adjusted_amount, note } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const reqRes = await client.query(
      `SELECT * FROM fund_requests WHERE id = $1 AND status = 'pending'`,
      [requestId]
    );
    if (reqRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Pending request not found' });
    }
    const fr = reqRes.rows[0];
    const finalAmount = adjusted_amount ? Number(adjusted_amount) : parseFloat(fr.amount);


    await client.query(
      `UPDATE fund_requests
       SET status = 'approved', approver_id = $1, approved_amount = $2, 
           reviewer_note = $3, reviewed_at = NOW()
       WHERE id = $4`,
      [req.user.id, finalAmount, note || null, requestId]
    );

    
    await client.query(
      `INSERT INTO disbursement_ledger (project_id, fund_request_id, recipient_id, amount, category, status, description)
       VALUES ($1, $2, $3, $4, $5, 'approved', $6)`,
      [fr.project_id, requestId, fr.requester_id, finalAmount, fr.category, fr.justification]
    );

  
    await client.query(
      `INSERT INTO financial_audit_log (project_id, actor_id, action, amount, note, ref_id)
       VALUES ($1, $2, 'REQUEST_APPROVED', $3, $4, $5)`,
      [fr.project_id, req.user.id, finalAmount, note || 'Approved', requestId]
    );

    await client.query('COMMIT');
    return res.json({ success: true, message: 'Fund request approved' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('approveFundRequest error:', err);
    return res.status(500).json({ success: false, message: 'Failed to approve request' });
  } finally {
    client.release();
  }
};

exports.rejectFundRequest = async (req, res) => {
  const { requestId } = req.params;
  const { note } = req.body;
  try {
    const result = await pool.query(
      `UPDATE fund_requests
       SET status = 'rejected', approver_id = $1, reviewer_note = $2, reviewed_at = NOW()
       WHERE id = $3 AND status = 'pending'
       RETURNING *`,
      [req.user.id, note || null, requestId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pending request not found' });
    }

  
    await pool.query(
      `INSERT INTO financial_audit_log (project_id, actor_id, action, amount, note, ref_id)
       VALUES ($1, $2, 'REQUEST_REJECTED', $3, $4, $5)`,
      [result.rows[0].project_id, req.user.id, parseFloat(result.rows[0].amount), note || 'Rejected', requestId]
    );

    return res.json({ success: true, message: 'Fund request rejected' });
  } catch (err) {
    console.error('rejectFundRequest error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reject request' });
  }
};


exports.getDisbursements = async (req, res) => {
  const { projectId } = req.params;
  try {
    const result = await pool.query(
      `SELECT dl.*, u.username AS recipient_name
       FROM disbursement_ledger dl
       LEFT JOIN users u ON dl.recipient_id = u.id
       WHERE dl.project_id = $1
       ORDER BY dl.created_at DESC`,
      [projectId]
    );
    return res.json({ success: true, data: { disbursements: result.rows } });
  } catch (err) {
    console.error('getDisbursements error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch disbursements' });
  }
};

exports.updateDisbursementStatus = async (req, res) => {
  const { disbursementId } = req.params;
  const { status } = req.body; 
  const allowed = ['approved', 'paid', 'cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });
  }
  try {
    const extra = status === 'paid' ? ', paid_at = NOW()' : '';
    const result = await pool.query(
      `UPDATE disbursement_ledger SET status = $1 ${extra} WHERE id = $2 RETURNING *`,
      [status, disbursementId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Disbursement not found' });
    }

    await pool.query(
      `INSERT INTO financial_audit_log (project_id, actor_id, action, amount, note, ref_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        result.rows[0].project_id,
        req.user.id,
        `DISBURSEMENT_${status.toUpperCase()}`,
        parseFloat(result.rows[0].amount),
        `Status changed to ${status}`,
        disbursementId,
      ]
    );

    return res.json({ success: true, message: `Disbursement marked as ${status}`, data: result.rows[0] });
  } catch (err) {
    console.error('updateDisbursementStatus error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update disbursement' });
  }
};

exports.approveAllPending = async (req, res) => {
  const { projectId } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE disbursement_ledger SET status = 'paid', paid_at = NOW()
       WHERE project_id = $1 AND status IN ('approved', 'scheduled')
       RETURNING id`,
      [projectId]
    );
    await client.query(
      `INSERT INTO financial_audit_log (project_id, actor_id, action, amount, note)
       VALUES ($1, $2, 'BATCH_PAYROLL_APPROVED', 0, $3)`,
      [projectId, req.user.id, `Batch approved ${result.rowCount} disbursements`]
    );
    await client.query('COMMIT');
    return res.json({ success: true, message: `${result.rowCount} disbursements marked as paid` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('approveAllPending error:', err);
    return res.status(500).json({ success: false, message: 'Batch approve failed' });
  } finally {
    client.release();
  }
};


exports.getAuditLog = async (req, res) => {
  const { projectId } = req.params;
  try {
    const result = await pool.query(
      `SELECT al.*, u.username AS actor_name
       FROM financial_audit_log al
       LEFT JOIN users u ON al.actor_id = u.id
       WHERE al.project_id = $1
       ORDER BY al.created_at DESC
       LIMIT 100`,
      [projectId]
    );
    return res.json({ success: true, data: { logs: result.rows } });
  } catch (err) {
    console.error('getAuditLog error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch audit log' });
  }
};