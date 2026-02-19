import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';
import { financialAPI, projectAPI } from '../services/api';

const fmt = (n, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n || 0);

const STATUS_BADGE = {
  pending:   { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: 'rgba(251,191,36,0.4)', label: 'PENDING' },
  approved:  { bg: 'rgba(34,197,94,0.15)',  color: '#22c55e', border: 'rgba(34,197,94,0.4)',  label: 'APPROVED' },
  rejected:  { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444', border: 'rgba(239,68,68,0.4)',  label: 'REJECTED' },
  paid:      { bg: 'rgba(99,102,241,0.15)', color: '#818cf8', border: 'rgba(99,102,241,0.4)', label: 'PAID' },
  scheduled: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: 'rgba(59,130,246,0.4)', label: 'SCHEDULED' },
  cancelled: { bg: 'rgba(107,114,128,0.15)',color: '#9ca3af', border: 'rgba(107,114,128,0.4)',label: 'CANCELLED' },
};

const Badge = ({ status }) => {
  const s = STATUS_BADGE[status] || STATUS_BADGE.pending;
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 6, padding: '2px 10px', fontSize: 10, fontWeight: 700, letterSpacing: 1,
    }}>{s.label}</span>
  );
};

const MetricCard = ({ label, value, sub, accent = '#ef4444', progress }) => (
  <div style={{
    background: '#0f1629', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16, padding: '20px 24px',
  }}>
    <div style={{ color: '#6b7280', fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>{label}</div>
    <div style={{ color: '#fff', fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{value}</div>
    {sub && <div style={{ color: '#9ca3af', fontSize: 12 }}>{sub}</div>}
    {progress !== undefined && (
      <div style={{ marginTop: 10 }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
          <div style={{
            background: `linear-gradient(90deg, ${accent}, ${accent}aa)`,
            width: `${Math.min(100, progress)}%`, height: '100%', borderRadius: 4,
            transition: 'width 0.4s',
          }} />
        </div>
        <div style={{ color: accent, fontSize: 11, marginTop: 4, fontWeight: 700 }}>{progress}% used</div>
      </div>
    )}
  </div>
);

const TABS = ['OVERVIEW', 'REQUESTS', 'DISBURSEMENTS', 'FORECAST', 'AUDIT'];

export default function FinancialHub() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [overview, setOverview] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [requests, setRequests] = useState([]);
  const [disbursements, setDisbursements] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(null);

  const [budgetForm, setBudgetForm] = useState({ total_budget: '', reason: '' });
  const [reqForm, setReqForm] = useState({ amount: '', category: 'General', justification: '' });
  const [approveForm, setApproveForm] = useState({ adjusted_amount: '', note: '' });
  const [rejectNote, setRejectNote] = useState('');

  useEffect(() => {
    if (!projectId) {
      projectAPI.getProjects().then(r => {
        const p = r.data.data?.projects || [];
        if (p.length > 0) navigate(`/dashboard/${p[0].project_id}/finance`, { replace: true });
        else navigate('/projects', { replace: true });
      }).catch(() => navigate('/projects', { replace: true }));
    }
  }, [projectId, navigate]);

  const loadAll = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [ovRes, fcRes, rqRes, dbRes, alRes] = await Promise.allSettled([
        financialAPI.getOverview(projectId),
        financialAPI.getForecast(projectId),
        financialAPI.getRequests(projectId),
        financialAPI.getDisbursements(projectId),
        financialAPI.getAuditLog(projectId),
      ]);
      if (ovRes.status === 'fulfilled') setOverview(ovRes.value.data.data);
      if (fcRes.status === 'fulfilled') setForecast(fcRes.value.data.data);
      if (rqRes.status === 'fulfilled') setRequests(rqRes.value.data.data.requests || []);
      if (dbRes.status === 'fulfilled') setDisbursements(dbRes.value.data.data.disbursements || []);
      if (alRes.status === 'fulfilled') setAuditLog(alRes.value.data.data.logs || []);
    } catch (err) {
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleAdjustBudget = async () => {
    if (!budgetForm.total_budget) return toast.error('Enter a budget amount');
    try {
      await financialAPI.adjustBudget(projectId, budgetForm);
      toast.success('Budget updated');
      setShowBudgetModal(false);
      loadAll();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const handleCreateRequest = async () => {
    if (!reqForm.amount || !reqForm.justification) return toast.error('Amount and justification required');
    try {
      await financialAPI.createRequest(projectId, reqForm);
      toast.success('Fund request submitted');
      setShowRequestModal(false);
      setReqForm({ amount: '', category: 'General', justification: '' });
      loadAll();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const handleApprove = async () => {
    if (!showApproveModal) return;
    try {
      await financialAPI.approveRequest(projectId, showApproveModal.id, approveForm);
      toast.success('Request approved');
      setShowApproveModal(null);
      setApproveForm({ adjusted_amount: '', note: '' });
      loadAll();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const handleReject = async () => {
    if (!showRejectModal) return;
    try {
      await financialAPI.rejectRequest(projectId, showRejectModal.id, { note: rejectNote });
      toast.success('Request rejected');
      setShowRejectModal(null);
      setRejectNote('');
      loadAll();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const handleDisbursementStatus = async (id, status) => {
    try {
      await financialAPI.updateDisbursement(projectId, id, { status });
      toast.success(`Marked as ${status}`);
      loadAll();
    } catch (e) { toast.error('Failed'); }
  };

  const handleApproveAll = async () => {
    if (!window.confirm('Approve all payroll disbursements?')) return;
    try {
      const r = await financialAPI.approveAllDisbursements(projectId);
      toast.success(r.data.message);
      loadAll();
    } catch (e) { toast.error('Failed'); }
  };

  const chartData = forecast ? [
    ...forecast.actuals.map(a => ({ name: a.month, actual: a.actual })),
    ...forecast.forecast.map(f => ({ name: f.month, forecast: f.forecast })),
  ] : [];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '3px solid #ef4444', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        <p style={{ color: '#9ca3af', marginTop: 16 }}>Loading Financial Hub...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
      </div>
    </div>
  );

  const cur = overview?.currency || 'USD';

  return (
    <div style={{ padding: '20px 24px', color: '#fff', minHeight: '100%', background: '#f1f5f9' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#111827', letterSpacing: -0.5 }}>FINANCIAL HUB</div>
          <div style={{ color: '#9ca3af', fontSize: 11, letterSpacing: 3, marginTop: 2 }}>CONTROL TOWER · BUDGET · FORECASTING</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowRequestModal(true)} style={btnStyle('#1f2937')}>+ Request Fund</button>
          <button onClick={() => { setBudgetForm({ total_budget: overview?.total_budget || '', reason: '' }); setShowBudgetModal(true); }} style={btnStyle('#ef4444')}>⚙ Adjust Capital</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#e2e8f0', borderRadius: 12, padding: 4 }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: '8px 4px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: activeTab === tab ? '#fff' : 'transparent',
            color: activeTab === tab ? '#111827' : '#6b7280',
            fontWeight: 700, fontSize: 11, letterSpacing: 1,
            boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s',
          }}>{tab}</button>
        ))}
      </div>

      {activeTab === 'OVERVIEW' && (
        <div>
          {!overview ? (
            <NoBudgetPlaceholder onSetup={() => setShowBudgetModal(true)} />
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                <MetricCard label="TOTAL BUDGET" value={fmt(overview.total_budget, cur)} sub={cur} />
                <MetricCard label="BUDGET USED" value={fmt(overview.budget_used, cur)}
                  sub={`${overview.used_percent}% of total`}
                  progress={overview.used_percent}
                  accent={overview.used_percent > 80 ? '#ef4444' : '#22c55e'}
                />
                <MetricCard label="BURN RATE" value={fmt(overview.monthly_burn, cur)}
                  sub="per month (3-mo avg)"
                  accent="#f59e0b"
                />
                <MetricCard
                  label="RUNWAY"
                  value={overview.runway_months !== null ? `${overview.runway_months} mo` : 'N/A'}
                  sub="estimated remaining"
                  accent={overview.runway_months !== null && overview.runway_months < 3 ? '#ef4444' : '#22c55e'}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
                <MetricCard label="NET REMAINING" value={fmt(overview.remaining, cur)} sub="after all approved spend" accent="#818cf8" />
                <MetricCard
                  label="PENDING REQUESTS"
                  value={`${overview.pending_requests.count} requests`}
                  sub={`${fmt(overview.pending_requests.total, cur)} awaiting approval`}
                  accent="#fbbf24"
                />
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'REQUESTS' && (
        <div>
          <SectionHeader title="Fund Request Queue" count={requests.length} />
          {requests.length === 0 ? <Empty msg="No fund requests yet" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {requests.map(r => (
                <div key={r.id} style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <Badge status={r.status} />
                        <span style={{ color: '#9ca3af', fontSize: 11 }}>{r.category}</span>
                        <span style={{ color: '#6b7280', fontSize: 11 }}>{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{fmt(r.amount, cur)}</div>
                      {r.approved_amount && r.approved_amount !== r.amount && (
                        <div style={{ color: '#22c55e', fontSize: 12 }}>Approved: {fmt(r.approved_amount, cur)}</div>
                      )}
                      <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>{r.justification}</div>
                      <div style={{ color: '#6b7280', fontSize: 11, marginTop: 4 }}>
                        by <b style={{ color: '#d1d5db' }}>{r.requester_name}</b>
                        {r.approver_name && <> · reviewed by <b style={{ color: '#d1d5db' }}>{r.approver_name}</b></>}
                      </div>
                      {r.reviewer_note && <div style={{ color: '#6b7280', fontSize: 11, fontStyle: 'italic', marginTop: 2 }}>Note: {r.reviewer_note}</div>}
                    </div>
                    {r.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button onClick={() => { setShowApproveModal(r); setApproveForm({ adjusted_amount: r.amount, note: '' }); }} style={btnStyle('#22c55e', true)}>✓ Approve</button>
                        <button onClick={() => { setShowRejectModal(r); setRejectNote(''); }} style={btnStyle('#ef4444', true)}>✕ Reject</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'DISBURSEMENTS' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <SectionHeader title="Disbursement Ledger" count={disbursements.length} />
            <button onClick={handleApproveAll} style={btnStyle('#22c55e')}>✓ Approve All Payroll</button>
          </div>
          {disbursements.length === 0 ? <Empty msg="No disbursements yet" /> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0f1629' }}>
                    {['Recipient', 'Category', 'Amount', 'Description', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#6b7280', fontSize: 10, letterSpacing: 1, fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {disbursements.map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={tdStyle}><span style={{ color: '#d1d5db', fontWeight: 600 }}>{d.recipient_name || '—'}</span></td>
                      <td style={tdStyle}><span style={{ color: '#9ca3af', fontSize: 12 }}>{d.category}</span></td>
                      <td style={tdStyle}><span style={{ color: '#fff', fontWeight: 700 }}>{fmt(d.amount, cur)}</span></td>
                      <td style={{ ...tdStyle, maxWidth: 200 }}><span style={{ color: '#9ca3af', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{d.description || '—'}</span></td>
                      <td style={tdStyle}><Badge status={d.status} /></td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {d.status === 'approved' && (
                            <button onClick={() => handleDisbursementStatus(d.id, 'paid')} style={btnStyle('#818cf8', true)}>Mark Paid</button>
                          )}
                          {d.status === 'scheduled' && (
                            <button onClick={() => handleDisbursementStatus(d.id, 'approved')} style={btnStyle('#22c55e', true)}>Approve</button>
                          )}
                          {['approved', 'scheduled'].includes(d.status) && (
                            <button onClick={() => handleDisbursementStatus(d.id, 'cancelled')} style={btnStyle('#ef4444', true)}>Cancel</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'FORECAST' && (
        <div>
          <SectionHeader title="Operational Spend Forecast" />
          {!forecast || (forecast.actuals.length === 0 && forecast.forecast.length === 0) ? (
            <Empty msg="No spend data yet — approve disbursements to see trends" />
          ) : (
            <>
              <div style={{ ...cardStyle, marginBottom: 16 }}>
                <div style={{ color: '#9ca3af', fontSize: 11, letterSpacing: 1, marginBottom: 16 }}>MONTHLY ACTUAL vs FORECAST</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff' }}
                      formatter={(v, name) => [fmt(v, cur), name === 'actual' ? 'Actual' : 'Forecast']}
                    />
                    <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 11 }} />
                    <Bar dataKey="actual" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="forecast" fill="#818cf8" radius={[4, 4, 0, 0]} opacity={0.6} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <MetricCard label="AVG MONTHLY BURN" value={fmt(forecast.avg_monthly_burn, cur)} sub="last 3 months" accent="#f59e0b" />
                {overview && <MetricCard label="ESTIMATED RUNWAY" value={overview.runway_months !== null ? `${overview.runway_months} months` : 'N/A'} sub="at current burn rate" accent="#22c55e" />}
                {overview && <MetricCard label="REMAINING BUDGET" value={fmt(overview.remaining, cur)} accent="#818cf8" />}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'AUDIT' && (
        <div>
          <SectionHeader title="Audit Trail" count={auditLog.length} />
          {auditLog.length === 0 ? <Empty msg="No audit records yet" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {auditLog.map(log => (
                <div key={log.id} style={{ ...cardStyle, padding: '12px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ color: '#ef4444', fontSize: 10, fontWeight: 700, letterSpacing: 1, minWidth: 160 }}>{log.action.replace(/_/g, ' ')}</span>
                      <span style={{ color: '#d1d5db', fontSize: 13 }}>by <b>{log.actor_name}</b></span>
                      {log.amount > 0 && <span style={{ color: '#22c55e', fontWeight: 700 }}>{fmt(log.amount, cur)}</span>}
                      {log.note && <span style={{ color: '#6b7280', fontSize: 12, fontStyle: 'italic' }}>— {log.note}</span>}
                    </div>
                    <span style={{ color: '#4b5563', fontSize: 11 }}>{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showBudgetModal} onClose={() => setShowBudgetModal(false)} title="⚙ ADJUST CAPITAL">
        <FieldLabel>Total Budget ({cur})</FieldLabel>
        <ModalInput type="number" value={budgetForm.total_budget} onChange={e => setBudgetForm(p => ({ ...p, total_budget: e.target.value }))} placeholder="e.g. 1250000" />
        <FieldLabel>Reason</FieldLabel>
        <ModalTextarea value={budgetForm.reason} onChange={e => setBudgetForm(p => ({ ...p, reason: e.target.value }))} placeholder="e.g. Scope expansion Q3" />
        <ModalBtn onClick={handleAdjustBudget}>✦ COMMIT OVERRIDE</ModalBtn>
      </Modal>

      <Modal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} title="+ REQUEST FUND">
        <FieldLabel>Amount ({cur})</FieldLabel>
        <ModalInput type="number" value={reqForm.amount} onChange={e => setReqForm(p => ({ ...p, amount: e.target.value }))} placeholder="e.g. 50000" />
        <FieldLabel>Category</FieldLabel>
        <ModalSelect value={reqForm.category} onChange={e => setReqForm(p => ({ ...p, category: e.target.value }))}>
          {['General', 'Marketing', 'Infrastructure', 'Development', 'Team Bonus', 'Operations', 'R&D'].map(c => <option key={c}>{c}</option>)}
        </ModalSelect>
        <FieldLabel>Justification</FieldLabel>
        <ModalTextarea value={reqForm.justification} onChange={e => setReqForm(p => ({ ...p, justification: e.target.value }))} placeholder="Describe why this fund is needed..." />
        <ModalBtn onClick={handleCreateRequest}>✦ SUBMIT REQUEST</ModalBtn>
      </Modal>

      <Modal isOpen={!!showApproveModal} onClose={() => setShowApproveModal(null)} title="✓ APPROVE REQUEST">
        {showApproveModal && (
          <>
            <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 16 }}>Original: <b style={{ color: '#fff' }}>{fmt(showApproveModal.amount, cur)}</b> · {showApproveModal.justification}</div>
            <FieldLabel>Adjusted Amount ({cur})</FieldLabel>
            <ModalInput type="number" value={approveForm.adjusted_amount} onChange={e => setApproveForm(p => ({ ...p, adjusted_amount: e.target.value }))} />
            <FieldLabel>Note (optional)</FieldLabel>
            <ModalTextarea value={approveForm.note} onChange={e => setApproveForm(p => ({ ...p, note: e.target.value }))} placeholder="Approval note..." />
            <ModalBtn onClick={handleApprove} color="#22c55e">✓ CONFIRM APPROVAL</ModalBtn>
          </>
        )}
      </Modal>

      <Modal isOpen={!!showRejectModal} onClose={() => setShowRejectModal(null)} title="✕ REJECT REQUEST">
        {showRejectModal && (
          <>
            <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 16 }}>Request: <b style={{ color: '#fff' }}>{fmt(showRejectModal.amount, cur)}</b> · {showRejectModal.justification}</div>
            <FieldLabel>Reason for Rejection</FieldLabel>
            <ModalTextarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="Explain why this request is rejected..." />
            <ModalBtn onClick={handleReject} color="#ef4444">✕ CONFIRM REJECTION</ModalBtn>
          </>
        )}
      </Modal>

      <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
    </div>
  );
}

const cardStyle = {
  background: '#0f1629',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 14,
  padding: '18px 20px',
};

const tdStyle = {
  padding: '12px 14px',
  background: 'rgba(15,22,41,0.7)',
};

const btnStyle = (bg = '#1f2937', small = false) => ({
  background: bg,
  border: 'none', borderRadius: 10,
  padding: small ? '6px 14px' : '10px 20px',
  color: '#fff', fontWeight: 700,
  fontSize: small ? 11 : 12,
  letterSpacing: 1, cursor: 'pointer',
});

const SectionHeader = ({ title, count }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
    <h2 style={{ color: '#111827', fontSize: 16, fontWeight: 800, margin: 0 }}>{title}</h2>
    {count !== undefined && (
      <span style={{ background: '#ef4444', color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{count}</span>
    )}
  </div>
);

const Empty = ({ msg }) => (
  <div style={{ textAlign: 'center', padding: '48px 0', color: '#6b7280' }}>
    <div style={{ fontSize: 36, marginBottom: 10 }}>💳</div>
    <div style={{ fontWeight: 600 }}>{msg}</div>
  </div>
);

const NoBudgetPlaceholder = ({ onSetup }) => (
  <div style={{ textAlign: 'center', padding: '80px 0' }}>
    <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
    <div style={{ color: '#374151', fontWeight: 800, fontSize: 18, marginBottom: 6 }}>No budget configured</div>
    <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>Set up a total budget to start tracking financials</div>
    <button onClick={onSetup} style={btnStyle('#ef4444')}>⚙ Set Up Budget</button>
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 32, width: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 900, letterSpacing: 1 }}>{title}</div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', color: '#9ca3af', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
};

const FieldLabel = ({ children }) => <div style={{ color: '#6b7280', fontSize: 11, letterSpacing: 1, marginBottom: 6 }}>{children}</div>;
const ModalInput = (props) => <input {...props} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 14 }} />;
const ModalTextarea = (props) => <textarea {...props} rows={3} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 14 }} />;
const ModalSelect = ({ children, ...props }) => <select {...props} style={{ width: '100%', background: '#1a2340', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none', marginBottom: 14 }}>{children}</select>;
const ModalBtn = ({ children, onClick, color = '#ef4444' }) => <button onClick={onClick} style={{ width: '100%', background: `linear-gradient(135deg, ${color}, ${color}cc)`, border: 'none', borderRadius: 12, padding: 14, color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: 1.5, cursor: 'pointer', marginTop: 4 }}>{children}</button>;