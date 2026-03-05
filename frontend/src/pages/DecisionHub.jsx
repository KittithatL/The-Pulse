import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { decisionAPI, projectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['ALL', 'Technical', 'Business', 'UIUX'];
const STATUSES   = ['ALL', 'proposed', 'under_review', 'approved', 'rejected', 'superseded'];
const PERIODS    = ['ALL', 'Q1', 'Q2', 'Q3', 'Q4', 'MONTH'];
const IMPACTS    = ['low', 'medium', 'high', 'critical'];

const STATUS_STYLE = {
  proposed:     { bg: '#fff8e1', color: '#b45309', border: '#fbbf24' },
  under_review: { bg: '#eff6ff', color: '#1d4ed8', border: '#60a5fa' },
  approved:     { bg: '#f0fdf4', color: '#15803d', border: '#4ade80' },
  rejected:     { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' },
  superseded:   { bg: '#faf5ff', color: '#7c3aed', border: '#c4b5fd' },
};

const IMPACT_STYLE = {
  low:      { bg: '#f3f4f6', color: '#6b7280', border: '#d1d5db' },
  medium:   { bg: '#eff6ff', color: '#2563eb', border: '#93c5fd' },
  high:     { bg: '#fff7ed', color: '#c2410c', border: '#fb923c' },
  critical: { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLE[status] || STATUS_STYLE.proposed;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
      {status?.replace('_', ' ')}
    </span>
  );
};

const ImpactBadge = ({ impact }) => {
  const s = IMPACT_STYLE[impact] || IMPACT_STYLE.medium;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
      IMPACT: {impact?.toUpperCase()}
    </span>
  );
};

function LogDecisionModal({ isOpen, onClose, onSave, members, editDecision }) {
  const init = { title: '', category: 'Technical', impact: 'medium', status: 'proposed', rationale: '', trade_offs: '', jira_link: '', confluence_link: '', stakeholder_ids: [] };
  const [form, setForm] = useState(init);

  useEffect(() => {
    if (editDecision) {
      setForm({
        title: editDecision.title || '',
        category: editDecision.category || 'Technical',
        impact: editDecision.impact || 'medium',
        status: editDecision.status || 'proposed',
        rationale: editDecision.rationale || '',
        trade_offs: editDecision.trade_offs || '',
        jira_link: editDecision.jira_link || '',
        confluence_link: editDecision.confluence_link || '',
        stakeholder_ids: (editDecision.stakeholders || []).map(s => s.user_id),
      });
    } else {
      setForm(init);
    }
  }, [editDecision, isOpen]);

  if (!isOpen) return null;
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleStakeholder = (uid) => {
    setForm(p => ({
      ...p,
      stakeholder_ids: p.stakeholder_ids.includes(uid)
        ? p.stakeholder_ids.filter(id => id !== uid)
        : [...p.stakeholder_ids, uid],
    }));
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:20, padding:36, width:580, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.2)' }} onClick={e=>e.stopPropagation()}>
     
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
          <div>
            <div style={{ color:'#ef4444', fontSize:11, letterSpacing:2, fontWeight:700 }}>DECISION HUB</div>
            <div style={{ fontSize:22, fontWeight:900, color:'#111827' }}>{editDecision ? 'EDIT DECISION' : 'LOG DECISION'}</div>
          </div>
          <button onClick={onClose} style={{ background:'#f3f4f6', border:'none', width:34, height:34, borderRadius:'50%', cursor:'pointer', fontSize:18, color:'#6b7280' }}>✕</button>
        </div>

   
        <FLabel>Decision Title *</FLabel>
        <FInput value={form.title} onChange={e=>set('title',e.target.value)} placeholder="e.g. Migrate to Edge Runtime for lower latency" />

        
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <FLabel>Category</FLabel>
            <FSelect value={form.category} onChange={e=>set('category',e.target.value)}>
              {['Technical','Business','UIUX'].map(c=><option key={c}>{c}</option>)}
            </FSelect>
          </div>
          <div>
            <FLabel>Impact Level</FLabel>
            <FSelect value={form.impact} onChange={e=>set('impact',e.target.value)}>
              {IMPACTS.map(i=><option key={i} value={i}>{i.toUpperCase()}</option>)}
            </FSelect>
          </div>
        </div>

      
        <FLabel>Status</FLabel>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
          {STATUSES.filter(s=>s!=='ALL').map(s=>(
            <button key={s} onClick={()=>set('status',s)} style={{
              padding:'6px 14px', borderRadius:20, border:`1.5px solid ${form.status===s?'#1f2937':'#e5e7eb'}`,
              background: form.status===s?'#1f2937':'#f9fafb',
              color: form.status===s?'#fff':'#6b7280',
              fontWeight:700, fontSize:11, letterSpacing:0.5, cursor:'pointer', textTransform:'uppercase',
            }}>{s.replace('_',' ')}</button>
          ))}
        </div>

 
        <FLabel>Rationale & Strategic Context</FLabel>
        <FTextarea value={form.rationale} onChange={e=>set('rationale',e.target.value)} placeholder="Explain the 'why' behind this decision..." rows={4} />

      
        <FLabel>Trade-offs Considered</FLabel>
        <FTextarea value={form.trade_offs} onChange={e=>set('trade_offs',e.target.value)} placeholder="What are we giving up to make this decision?" rows={3} />

  
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <FLabel>Jira Link</FLabel>
            <FInput value={form.jira_link} onChange={e=>set('jira_link',e.target.value)} placeholder="JIRA-XXX or URL" />
          </div>
          <div>
            <FLabel>Confluence Spec</FLabel>
            <FInput value={form.confluence_link} onChange={e=>set('confluence_link',e.target.value)} placeholder="Confluence page URL" />
          </div>
        </div>

     
        <FLabel>Stakeholders</FLabel>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:20 }}>
          {members.map(m=>(
            <button key={m.user_id} onClick={()=>toggleStakeholder(m.user_id)} style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'6px 12px', borderRadius:20,
              border:`1.5px solid ${form.stakeholder_ids.includes(m.user_id)?'#ef4444':'#e5e7eb'}`,
              background: form.stakeholder_ids.includes(m.user_id)?'#fef2f2':'#f9fafb',
              color: form.stakeholder_ids.includes(m.user_id)?'#ef4444':'#6b7280',
              fontWeight:600, fontSize:12, cursor:'pointer',
            }}>
              <Avatar name={m.username} size={20} />
              {m.username}
            </button>
          ))}
        </div>

    
        <button onClick={()=>{ if(form.title.trim()) onSave(form); else toast.error('Title required'); }} style={{ width:'100%', background:'#ef4444', border:'none', borderRadius:12, padding:14, color:'#fff', fontSize:13, fontWeight:800, letterSpacing:1.5, cursor:'pointer' }}>
          ✦ {editDecision ? 'UPDATE DECISION' : 'COMMIT DECISION'}
        </button>
      </div>
    </div>
  );
}

function StrategyReportModal({ isOpen, onClose, report }) {
  if (!isOpen || !report) return null;
  const { stats, insight, latest_decisions } = report;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:'#0f1629', border:'1px solid rgba(255,255,255,0.1)', borderRadius:24, padding:36, width:600, maxHeight:'85vh', overflowY:'auto', color:'#fff' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div>
            <div style={{ color:'#ef4444', fontSize:11, letterSpacing:2, fontWeight:700 }}>✦ AI STRATEGY REPORT</div>
            <div style={{ fontSize:20, fontWeight:900 }}>DECISION INTELLIGENCE</div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.07)', border:'none', color:'#9ca3af', width:32, height:32, borderRadius:'50%', cursor:'pointer' }}>✕</button>
        </div>


        <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:12, padding:16, marginBottom:24 }}>
          <div style={{ color:'#ef4444', fontSize:10, letterSpacing:2, fontWeight:700, marginBottom:6 }}>STRATEGIC INSIGHT</div>
          <div style={{ color:'#d1d5db', fontSize:13, lineHeight:1.6 }}>{insight}</div>
        </div>


        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
          {[
            { label:'TOTAL', val: stats.total },
            { label:'APPROVED', val: stats.approved, color:'#22c55e' },
            { label:'PENDING REVIEW', val: stats.under_review, color:'#fbbf24' },
            { label:'PROPOSED', val: stats.proposed, color:'#60a5fa' },
            { label:'REJECTED', val: stats.rejected, color:'#f87171' },
            { label:'HIGH IMPACT', val: stats.high_impact, color:'#fb923c' },
          ].map(s=>(
            <div key={s.label} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'14px 16px' }}>
              <div style={{ color:'#6b7280', fontSize:9, letterSpacing:1.5, marginBottom:4 }}>{s.label}</div>
              <div style={{ color: s.color||'#fff', fontSize:26, fontWeight:900 }}>{s.val}</div>
            </div>
          ))}
        </div>

       
        <div style={{ marginBottom:24 }}>
          <div style={{ color:'#9ca3af', fontSize:10, letterSpacing:1, marginBottom:6 }}>APPROVAL RATE</div>
          <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:6, height:8, overflow:'hidden' }}>
            <div style={{ background:'linear-gradient(90deg,#22c55e,#16a34a)', width:`${stats.approval_rate}%`, height:'100%', borderRadius:6 }} />
          </div>
          <div style={{ color:'#22c55e', fontSize:12, marginTop:4, fontWeight:700 }}>{stats.approval_rate}%</div>
        </div>

    
        <div style={{ marginBottom:24 }}>
          <div style={{ color:'#9ca3af', fontSize:10, letterSpacing:1, marginBottom:10 }}>BY CATEGORY</div>
          <div style={{ display:'flex', gap:10 }}>
            {Object.entries(stats.by_category).map(([cat,cnt])=>(
              <div key={cat} style={{ flex:1, background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'10px 14px' }}>
                <div style={{ color:'#6b7280', fontSize:10 }}>{cat}</div>
                <div style={{ color:'#fff', fontSize:20, fontWeight:800 }}>{cnt}</div>
              </div>
            ))}
          </div>
        </div>

   
        <div>
          <div style={{ color:'#9ca3af', fontSize:10, letterSpacing:1, marginBottom:10 }}>LATEST DECISIONS</div>
          {latest_decisions.map((d,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color:'#d1d5db', fontSize:12 }}>{d.title}</div>
              <StatusBadge status={d.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DecisionCard({ decision, onEdit, onArchive, onSelect, isSelected, currentUserId }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div
      style={{
        background: isSelected ? '#fafafa' : '#fff',
        border: `1px solid ${isSelected ? '#e5e7eb' : '#f3f4f6'}`,
        borderLeft: isSelected ? '3px solid #ef4444' : '3px solid transparent',
        borderRadius: 16,
        padding: '24px 28px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        marginBottom: 12,
      }}
      onClick={() => onSelect(decision)}
    >
      
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ background:'#111827', color:'#fff', borderRadius:8, padding:'3px 10px', fontSize:12, fontWeight:800, letterSpacing:0.5 }}>#{decision.code}</span>
          <StatusBadge status={decision.status} />
          <ImpactBadge impact={decision.impact} />
          <span style={{ background:'#f3f4f6', color:'#6b7280', borderRadius:12, padding:'3px 10px', fontSize:11, fontWeight:600 }}>{decision.category}</span>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexShrink:0 }}>
 
          <button style={{ background:'none', border:'none', color:'#9ca3af', cursor:'pointer', fontSize:14, padding:4 }} onClick={e=>{e.stopPropagation(); toast('Notifications toggled');}}>🔔</button>

          <div style={{ position:'relative' }} ref={menuRef}>
            <button style={{ background:'none', border:'none', color:'#9ca3af', cursor:'pointer', fontSize:18, padding:4 }} onClick={e=>{e.stopPropagation(); setMenuOpen(v=>!v);}}>⋮</button>
            {menuOpen && (
              <div style={{ position:'absolute', right:0, top:28, background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', zIndex:100, minWidth:180, overflow:'hidden' }}>
                {[
                  { label:'✎  Edit Decision', action:()=>{onEdit(decision); setMenuOpen(false);} },
                  { label:'🔗 Copy Link', action:()=>{ navigator.clipboard?.writeText(window.location.href + '?d=' + decision.id); toast.success('Link copied'); setMenuOpen(false); } },
                  { label:'🗃  Archive', action:()=>{onArchive(decision.id); setMenuOpen(false);}, danger: true },
                ].map(item=>(
                  <button key={item.label} onClick={e=>{e.stopPropagation(); item.action();}} style={{ display:'block', width:'100%', padding:'11px 16px', background:'none', border:'none', textAlign:'left', fontSize:13, color: item.danger?'#dc2626':'#374151', cursor:'pointer', fontWeight:500 }}>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>


      <h3 style={{ fontSize:20, fontWeight:800, color:'#111827', margin:'0 0 16px', lineHeight:1.3 }}>{decision.title}</h3>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:24 }}>

        <div>

          {decision.comment_count > 0 && (
            <div style={{ color:'#9ca3af', fontSize:12, marginBottom:10, display:'flex', alignItems:'center', gap:4 }}>
              💬 {decision.comment_count} comment{decision.comment_count>1?'s':''}
            </div>
          )}

   
          {decision.rationale && (
            <div style={{ background:'#f8fafc', border:'1px solid #f1f5f9', borderRadius:12, padding:'14px 18px', marginBottom:12 }}>
              <div style={{ color:'#94a3b8', fontSize:10, letterSpacing:2, fontWeight:700, marginBottom:8 }}>RATIONALE & STRATEGIC CONTEXT</div>
              <div style={{ color:'#475569', fontSize:13, lineHeight:1.6, whiteSpace:'pre-wrap' }}>{decision.rationale}</div>
            </div>
          )}

    
          {decision.trade_offs && (
            <div style={{ background:'#fffbeb', border:'1px solid #fef3c7', borderRadius:12, padding:'14px 18px' }}>
              <div style={{ color:'#92400e', fontSize:10, letterSpacing:2, fontWeight:700, marginBottom:8 }}>⚠ TRADE-OFFS CONSIDERED</div>
              <div style={{ color:'#78350f', fontSize:13, lineHeight:1.6, whiteSpace:'pre-wrap' }}>{decision.trade_offs}</div>
            </div>
          )}
        </div>


        <div>
          
          {decision.stakeholders?.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={{ color:'#94a3b8', fontSize:10, letterSpacing:2, fontWeight:700, marginBottom:10 }}>STAKEHOLDERS</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {decision.stakeholders.map(s=>(
                  <div key={s.user_id} style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <Avatar name={s.username} size={28} />
                    <span style={{ color:'#374151', fontSize:13, fontWeight:500 }}>{s.username}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          
          {(decision.jira_link || decision.confluence_link) && (
            <div style={{ marginBottom:20 }}>
              <div style={{ color:'#94a3b8', fontSize:10, letterSpacing:2, fontWeight:700, marginBottom:10 }}>LINKED CONTEXT</div>
              {decision.jira_link && (
                <a href={decision.jira_link.startsWith('http')?decision.jira_link:`#`} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, marginBottom:8, textDecoration:'none', color:'#dc2626', fontSize:12, fontWeight:600 }}>
                  ⚡ {decision.jira_link.length > 30 ? decision.jira_link.substring(0,30)+'…' : decision.jira_link} ↗
                </a>
              )}
              {decision.confluence_link && (
                <a href={decision.confluence_link.startsWith('http')?decision.confluence_link:`#`} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:10, textDecoration:'none', color:'#0369a1', fontSize:12, fontWeight:600 }}>
                  📊 CONFLUENCE SPEC ↗
                </a>
              )}
            </div>
          )}


          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Avatar name={decision.creator_name} size={28} />
            <div>
              <div style={{ color:'#374151', fontSize:12, fontWeight:600 }}>{decision.creator_name === 'You' || decision.creator_id === currentUserId ? 'You' : decision.creator_name}</div>
              <div style={{ color:'#9ca3af', fontSize:11 }}>Logged: {new Date(decision.created_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidePanel({ decision, projectId, currentUserId, onClose, onUpdate }) {
  const [tab, setTab] = useState('COMMENTS');
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!decision) return;
    setLoading(true);
    decisionAPI.getDecision(projectId, decision.id)
      .then(r => {
        setComments(r.data.data.comments);
        setActivity(r.data.data.activity);
      })
      .catch(() => toast.error('Failed to load details'))
      .finally(() => setLoading(false));
  }, [decision, projectId]);

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    try {
      const r = await decisionAPI.addComment(projectId, decision.id, newComment.trim());
      setComments(p => [...p, r.data.data.comment]);
      setNewComment('');
      onUpdate();
    } catch { toast.error('Failed to send comment'); }
  };

  const handleDeleteComment = async (cId) => {
    try {
      await decisionAPI.deleteComment(projectId, cId);
      setComments(p => p.filter(c => c.id !== cId));
    } catch { toast.error('Failed to delete'); }
  };

  const handleReaction = async (emoji) => {
    try {
      await decisionAPI.toggleReaction(projectId, decision.id, emoji);
      onUpdate();
    } catch { toast.error('Failed'); }
  };

  if (!decision) return null;

  return (
    <div style={{ width:360, flexShrink:0, background:'#fff', border:'1px solid #f1f5f9', borderRadius:20, display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>

      <div style={{ padding:'18px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:11, color:'#9ca3af', letterSpacing:1 }}>#{decision.code}</div>
          <div style={{ fontSize:14, fontWeight:800, color:'#111827', maxWidth:240, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{decision.title}</div>
        </div>
        <button onClick={onClose} style={{ background:'#f3f4f6', border:'none', width:30, height:30, borderRadius:'50%', cursor:'pointer', color:'#6b7280' }}>✕</button>
      </div>


      <div style={{ display:'flex', borderBottom:'1px solid #f1f5f9' }}>
        {['COMMENTS','ACTIVITY'].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            flex:1, padding:'12px', border:'none', background:'none', cursor:'pointer',
            fontWeight:700, fontSize:11, letterSpacing:1,
            color: tab===t?'#111827':'#9ca3af',
            borderBottom: tab===t?'2px solid #ef4444':'2px solid transparent',
          }}>{t}</button>
        ))}
      </div>


      <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:'#9ca3af' }}>Loading...</div>
        ) : tab === 'COMMENTS' ? (
          <div>
            {comments.length === 0
              ? <div style={{ textAlign:'center', color:'#9ca3af', padding:'32px 0', fontSize:13 }}>No comments yet. Start the discussion.</div>
              : comments.map(c=>(
                <div key={c.id} style={{ marginBottom:16 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <Avatar name={c.username} size={26} />
                      <span style={{ fontSize:12, fontWeight:600, color:'#374151' }}>{c.username}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ color:'#9ca3af', fontSize:11 }}>{new Date(c.created_at).toLocaleDateString()}</span>
                      {c.user_id === currentUserId && (
                        <button onClick={()=>handleDeleteComment(c.id)} style={{ background:'none', border:'none', color:'#fca5a5', cursor:'pointer', fontSize:12 }}>✕</button>
                      )}
                    </div>
                  </div>
                  <div style={{ background:'#f8fafc', borderRadius:10, padding:'10px 14px', color:'#475569', fontSize:13, lineHeight:1.6 }}>{c.content}</div>
                </div>
              ))
            }
          </div>
        ) : (
          <div>
            {activity.length === 0
              ? <div style={{ textAlign:'center', color:'#9ca3af', padding:'32px 0', fontSize:13 }}>No activity yet</div>
              : activity.map((a,i)=>(
                <div key={i} style={{ display:'flex', gap:10, marginBottom:14, paddingBottom:14, borderBottom:'1px solid #f8fafc' }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:'#ef4444', flexShrink:0, marginTop:5 }} />
                  <div>
                    <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:2 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:'#374151' }}>{a.username}</span>
                      <span style={{ fontSize:10, color:'#ef4444', fontWeight:700, background:'#fef2f2', padding:'1px 6px', borderRadius:4 }}>{a.action.replace(/_/g,' ')}</span>
                    </div>
                    {a.detail && <div style={{ color:'#9ca3af', fontSize:12 }}>{a.detail}</div>}
                    <div style={{ color:'#d1d5db', fontSize:11, marginTop:2 }}>{new Date(a.created_at).toLocaleString()}</div>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>


      <div style={{ padding:'12px 20px', borderTop:'1px solid #f1f5f9', display:'flex', gap:10, alignItems:'center' }}>
        {[{emoji:'👍',type:'up'},{emoji:'👎',type:'down'},{emoji:'🔥',type:'fire'},{emoji:'💡',type:'idea'}].map(r=>{
          const count = (decision.reactions||[]).filter(rx=>rx.type===r.type).length;
          return (
            <button key={r.type} onClick={()=>handleReaction(r.type)} style={{ background:'#f3f4f6', border:'1px solid #e5e7eb', borderRadius:20, padding:'4px 12px', cursor:'pointer', fontSize:13, display:'flex', gap:4, alignItems:'center' }}>
              {r.emoji} {count > 0 && <span style={{ fontSize:11, color:'#6b7280', fontWeight:700 }}>{count}</span>}
            </button>
          );
        })}
      </div>


      {tab === 'COMMENTS' && (
        <div style={{ padding:'12px 20px', borderTop:'1px solid #f1f5f9', display:'flex', gap:8 }}>
          <input
            value={newComment}
            onChange={e=>setNewComment(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault(); handleSendComment();} }}
            placeholder="Strategic Audit..."
            style={{ flex:1, background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:10, padding:'9px 14px', fontSize:13, outline:'none', color:'#374151' }}
          />
          <button onClick={handleSendComment} style={{ background:'#ef4444', border:'none', borderRadius:10, padding:'9px 16px', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:12 }}>Send</button>
        </div>
      )}
    </div>
  );
}

const COLORS = ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899'];
function Avatar({ name = '?', size = 32 }) {
  const color = COLORS[(name.charCodeAt(0)||0) % COLORS.length];
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:color, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:size*0.4, flexShrink:0 }}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

function Pill({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding:'6px 16px', borderRadius:20, border:`1.5px solid ${active?'#1f2937':'#e5e7eb'}`,
      background: active?'#1f2937':'#fff', color: active?'#fff':'#6b7280',
      fontWeight:700, fontSize:11, letterSpacing:0.5, cursor:'pointer', transition:'all 0.15s',
    }}>{label.replace('_',' ').toUpperCase()}</button>
  );
}

export default function DecisionHub() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [decisions, setDecisions] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDecision, setSelectedDecision] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editDecision, setEditDecision] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);


  const [keyword, setKeyword] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPeriod, setFilterPeriod] = useState('ALL');
  const [viewMode, setViewMode] = useState('DECISIONS'); // DECISIONS | HISTORY


  useEffect(() => {
    if (!projectId) {
      projectAPI.getProjects().then(r => {
        const p = r.data.data?.projects || [];
        if (p.length > 0) navigate(`/dashboard/${p[0].project_id}/decisions`, { replace:true });
        else navigate('/projects', { replace:true });
      }).catch(() => navigate('/projects', { replace:true }));
    }
  }, [projectId, navigate]);

  const loadDecisions = useCallback(async () => {
    if (!projectId) return;
    try {
      const params = {};
      if (filterCategory !== 'ALL') params.category = filterCategory;
      if (filterStatus !== 'ALL') params.status = filterStatus;
      if (filterPeriod !== 'ALL') params.period = filterPeriod;
      if (keyword) params.keyword = keyword;

      const [decRes, memRes] = await Promise.all([
        decisionAPI.getDecisions(projectId, params),
        projectAPI.getMembers(projectId),
      ]);
      setDecisions(decRes.data.data.decisions || []);
      setMembers(memRes.data.data.members || []);
    } catch { toast.error('Failed to load decisions'); }
    finally { setLoading(false); }
  }, [projectId, filterCategory, filterStatus, filterPeriod, keyword]);

  useEffect(() => { loadDecisions(); }, [loadDecisions]);


  useEffect(() => {
    const t = setTimeout(() => loadDecisions(), 400);
    return () => clearTimeout(t);
  }, [keyword]);

  const handleSaveDecision = async (form) => {
    try {
      if (editDecision) {
        await decisionAPI.updateDecision(projectId, editDecision.id, form);
        toast.success('Decision updated!');
      } else {
        await decisionAPI.createDecision(projectId, form);
        toast.success('Decision logged!');
      }
      setShowModal(false);
      setEditDecision(null);
      loadDecisions();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to save'); }
  };

  const handleArchive = async (id) => {
    if (!window.confirm('Archive this decision?')) return;
    try {
      await decisionAPI.archiveDecision(projectId, id);
      toast.success('Decision archived');
      if (selectedDecision?.id === id) setSelectedDecision(null);
      loadDecisions();
    } catch { toast.error('Failed to archive'); }
  };

  const handleReport = async () => {
    setReportLoading(true);
    try {
      const r = await decisionAPI.getReport(projectId);
      setReport(r.data.data);
      setShowReport(true);
    } catch { toast.error('Failed to generate report'); }
    finally { setReportLoading(false); }
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:400 }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:48, height:48, border:'3px solid #ef4444', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto' }} />
        <p style={{ color:'#9ca3af', marginTop:16 }}>Loading Decision Hub...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#f8fafc' }}>
      
      <div style={{ padding:'24px 32px 0', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:24 }}>
          <div>
            <div style={{ fontSize:36, fontWeight:900, color:'#0f172a', letterSpacing:-1, fontStyle:'italic' }}>DECISION HUB</div>
            <div style={{ color:'#94a3b8', fontSize:11, letterSpacing:3, marginTop:2 }}>SOURCE OF TRUTH FOR STRATEGIC CHOICES</div>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <button
              onClick={handleReport}
              disabled={reportLoading}
              style={{ background:'#1f2937', border:'none', borderRadius:12, padding:'12px 22px', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}
            >
              ✦ {reportLoading ? 'Generating...' : 'AI Strategy Report'}
            </button>
            <button
              onClick={() => { setEditDecision(null); setShowModal(true); }}
              style={{ background:'#ef4444', border:'none', borderRadius:12, padding:'12px 22px', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}
            >
              + Log Decision
            </button>
          </div>
        </div>

  
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:20, padding:'20px 24px', marginBottom:0 }}>

          <div style={{ display:'flex', gap:12, marginBottom:16 }}>
            <div style={{ flex:1, position:'relative' }}>
              <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#9ca3af', fontSize:16 }}>🔍</span>
              <input
                value={keyword}
                onChange={e=>setKeyword(e.target.value)}
                placeholder="Filter decisions by keyword..."
                style={{ width:'100%', background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:12, padding:'11px 14px 11px 42px', fontSize:13, outline:'none', color:'#374151', boxSizing:'border-box' }}
              />
            </div>
            <div style={{ display:'flex', background:'#f3f4f6', borderRadius:12, padding:4, gap:2 }}>
              {['DECISIONS','HISTORY'].map(v=>(
                <button key={v} onClick={()=>setViewMode(v)} style={{ padding:'8px 16px', borderRadius:10, border:'none', cursor:'pointer', fontWeight:700, fontSize:11, letterSpacing:1, background:viewMode===v?'#1f2937':'transparent', color:viewMode===v?'#fff':'#9ca3af' }}>{v}</button>
              ))}
            </div>
          </div>

          
          <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}>
            {CATEGORIES.map(c=>(
              <Pill key={c} label={c} active={filterCategory===c} onClick={()=>setFilterCategory(c)} />
            ))}
            <div style={{ width:1, background:'#e5e7eb', margin:'0 4px' }} />
            {STATUSES.map(s=>(
              <Pill key={s} label={s} active={filterStatus===s} onClick={()=>setFilterStatus(s)} />
            ))}
          </div>

          
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {PERIODS.map(p=>(
              <button key={p} onClick={()=>setFilterPeriod(p)} style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'5px 14px', borderRadius:20, border:`1.5px solid ${filterPeriod===p?'#1f2937':'#e5e7eb'}`,
                background: filterPeriod===p?'#1f2937':'#fff',
                color: filterPeriod===p?'#fff':'#6b7280',
                fontWeight:700, fontSize:11, cursor:'pointer',
              }}>📅 {p}</button>
            ))}
          </div>
        </div>
      </div>

  
      <div style={{ display:'flex', flex:1, gap:0, overflow:'hidden', padding:'16px 32px 24px' }}>
      
        <div style={{ flex:1, overflowY:'auto', paddingRight: selectedDecision?16:0 }}>
          {decisions.length === 0 ? (
            <div style={{ textAlign:'center', padding:'80px 0' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🎯</div>
              <div style={{ color:'#374151', fontWeight:800, fontSize:18, marginBottom:6 }}>No decisions found</div>
              <div style={{ color:'#9ca3af', fontSize:13, marginBottom:20 }}>Log your first strategic decision to start building your source of truth</div>
              <button onClick={()=>{setEditDecision(null); setShowModal(true);}} style={{ background:'#ef4444', border:'none', borderRadius:12, padding:'12px 24px', color:'#fff', fontWeight:700, cursor:'pointer' }}>+ Log Decision</button>
            </div>
          ) : (
            decisions.map(d=>(
              <DecisionCard
                key={d.id}
                decision={d}
                onEdit={(dec)=>{ setEditDecision(dec); setShowModal(true); }}
                onArchive={handleArchive}
                onSelect={(dec)=>setSelectedDecision(prev=>prev?.id===dec.id?null:dec)}
                isSelected={selectedDecision?.id===d.id}
                currentUserId={user?.id}
              />
            ))
          )}
        </div>

        
        {selectedDecision && (
          <SidePanel
            decision={selectedDecision}
            projectId={projectId}
            currentUserId={user?.id}
            onClose={()=>setSelectedDecision(null)}
            onUpdate={()=>{ loadDecisions(); }}
          />
        )}
      </div>

    
      <LogDecisionModal
        isOpen={showModal}
        onClose={()=>{ setShowModal(false); setEditDecision(null); }}
        onSave={handleSaveDecision}
        members={members}
        editDecision={editDecision}
      />

      <StrategyReportModal
        isOpen={showReport}
        onClose={()=>setShowReport(false)}
        report={report}
      />

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const FLabel = ({children})=><div style={{color:'#374151',fontSize:12,fontWeight:700,marginBottom:6,marginTop:2}}>{children}</div>;
const FInput = (props)=><input {...props} style={{width:'100%',background:'#f8fafc',border:'1px solid #e5e7eb',borderRadius:10,padding:'10px 14px',fontSize:13,outline:'none',color:'#374151',boxSizing:'border-box',marginBottom:14}} />;
const FTextarea = ({rows=3,...props})=><textarea {...props} rows={rows} style={{width:'100%',background:'#f8fafc',border:'1px solid #e5e7eb',borderRadius:10,padding:'10px 14px',fontSize:13,outline:'none',color:'#374151',boxSizing:'border-box',marginBottom:14,resize:'vertical'}} />;
const FSelect = ({children,...props})=><select {...props} style={{width:'100%',background:'#f8fafc',border:'1px solid #e5e7eb',borderRadius:10,padding:'10px 14px',fontSize:13,outline:'none',color:'#374151',marginBottom:14,boxSizing:'border-box'}}>{children}</select>;