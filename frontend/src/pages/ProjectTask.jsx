import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus, ArrowLeft, Trash2, X, GripVertical, Save,
  User, Clock, Users, Send, ChevronDown, Link2,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { taskAPI, projectAPI, pairingAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const STATUS_COLS = [
  { key: 'todo',   label: 'TODO' },
  { key: 'doing',  label: 'DOING' },
  { key: 'review', label: 'REVIEW' },
  { key: 'done',   label: 'DONE' },
];

const getTaskId   = (t) => String(t?.task_id ?? t?.id);
const prettyDate  = (d) => { if (!d) return ''; return String(d).split('T')[0].split(' ')[0]; };
const toDateOnly  = (dStr) => {
  if (!dStr) return null;
  const d = new Date(String(dStr).split('T')[0] + 'T00:00:00');
  return Number.isNaN(d.getTime()) ? null : d;
};

// ─── Checklist helpers ───
const parseChecklist = (text) => {
  const raw = String(text || '').trim();
  if (!raw) return [];
  return raw.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
    const m = line.match(/^\[(x| )\]\s*(.*)$/i);
    if (m) return { text: (m[2] || '').trim(), done: m[1].toLowerCase() === 'x' };
    return { text: line, done: false };
  }).filter(it => it.text);
};
const stringifyChecklist = (items) => {
  const clean = (items || []).map(it => ({ text: String(it?.text || '').trim(), done: !!it?.done })).filter(it => it.text);
  if (clean.length === 0) return null;
  return clean.map(it => `[${it.done ? 'x' : ' '}] ${it.text}`).join('\n');
};
const makeItem = (text = '') => ({ text, done: false });
const checklistSummary = (text) => {
  const items = parseChecklist(text);
  return { total: items.length, done: items.filter(x => x.done).length };
};

// ─── ChecklistEditor ───
const ChecklistEditor = ({ label, valueItems, onChange, disabled }) => {
  const addItem = () => onChange([...(valueItems || []), makeItem('')]);
  const updateText = (idx, text) => onChange((valueItems || []).map((it, i) => i === idx ? { ...it, text } : it));
  const toggleDone = (idx) => onChange((valueItems || []).map((it, i) => i === idx ? { ...it, done: !it.done } : it));
  const removeItem = (idx) => onChange((valueItems || []).filter((_, i) => i !== idx));

  return (
    <div className="rounded-xl border border-gray-200 p-4 bg-white">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-extrabold tracking-widest text-gray-500">{label}</div>
        {!disabled && <button type="button" onClick={addItem} className="text-xs font-bold text-primary hover:text-primary-dark">+ Add item</button>}
      </div>
      <div className="mt-3 space-y-2">
        {(valueItems || []).length === 0 ? <div className="text-xs text-gray-400">No items</div> :
          valueItems.map((it, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <button type="button" disabled={disabled} onClick={() => toggleDone(idx)}
                className={['mt-1 h-5 w-5 rounded border flex items-center justify-center', disabled ? 'opacity-60 cursor-not-allowed' : '', it.done ? 'bg-primary border-primary text-white' : 'bg-white border-gray-300'].join(' ')}>
                {it.done ? '✓' : ''}
              </button>
              <input value={it.text} disabled={disabled} onChange={e => updateText(idx, e.target.value)}
                className={['flex-1 px-3 py-2 rounded-lg border outline-none text-sm', disabled ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white', it.done ? 'text-gray-500 line-through' : 'text-gray-800', 'border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent'].join(' ')}
                placeholder="Type item..." />
              {!disabled && <button type="button" onClick={() => removeItem(idx)} className="p-2 rounded-lg hover:bg-red-50"><X className="w-4 h-4 text-red-500" /></button>}
            </div>
          ))
        }
      </div>
    </div>
  );
};

const ChecklistPreview = ({ label, text }) => {
  const { done, total } = checklistSummary(text);
  if (total === 0) return null;
  return (
    <div className="mt-2 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
      <span className="text-[11px] font-extrabold tracking-widest text-gray-500">{label}</span>
      <span className="text-[11px] font-bold text-gray-600">{done}/{total}</span>
    </div>
  );
};

const DeadlineBadge = ({ deadline }) => {
  const d = toDateOnly(deadline);
  if (!d) return null;
  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round((d.getTime() - t0.getTime()) / (1000 * 60 * 60 * 24));
  let cls = 'bg-gray-100 text-gray-700 border-gray-200';
  let label = `DUE ${prettyDate(deadline)}`;
  if (diffDays < 0) { cls = 'bg-red-50 text-red-700 border-red-200'; label = `OVERDUE ${prettyDate(deadline)}`; }
  else if (diffDays <= 2) { cls = 'bg-amber-50 text-amber-700 border-amber-200'; label = `DUE SOON ${prettyDate(deadline)}`; }
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-extrabold ${cls}`}>
      <Clock className="w-4 h-4" />
      <span className="tracking-widest">{label}</span>
    </div>
  );
};

// helper: ดึง pairs ของ task นั้น
const getTaskPairs = (pairs, taskId) =>
  pairs.filter(p => String(p.task_id) === String(taskId));

// ─────────────────────────────────────────────────────────
// PAIR REQUEST MODAL
// ─────────────────────────────────────────────────────────
const PairRequestModal = ({ task, members, currentUserId, onClose, onSent }) => {
  const [targetId, setTargetId] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const eligibleMembers = members.filter(m => String(m.user_id) !== String(currentUserId));

  const handleSend = async () => {
    if (!targetId) return toast.error('Please select a teammate');
    setSending(true);
    try {
      await pairingAPI.sendRequest({
        task_id: getTaskId(task),
        target_id: Number(targetId),
        message: message.trim() || undefined,
      });
      toast.success('Pairing request sent! 🤝', {
        style: { background: '#0F1219', color: '#fff', border: '1px solid #3B82F6' }
      });
      onSent?.();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to send request';
      if (err?.response?.status === 409) toast.error('Request already sent to this person');
      else toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0F1219] rounded-[28px] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-7 py-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black tracking-[0.25em] text-gray-500 uppercase mb-1">Request Help</p>
            <h2 className="text-base font-black text-white uppercase tracking-tight">Pair on Task</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        <div className="p-7 space-y-5">
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Task</p>
            <p className="text-sm font-bold text-white leading-tight">{task.title}</p>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Request help from</label>
            <div className="relative">
              <select value={targetId} onChange={e => setTargetId(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="" className="bg-gray-900">— Select teammate —</option>
                {eligibleMembers.map(m => (
                  <option key={m.user_id} value={String(m.user_id)} className="bg-gray-900">
                    {(m.username || '').toUpperCase()}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
              Message <span className="text-gray-600">(optional)</span>
            </label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
              placeholder="Describe what you need help with..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <button onClick={handleSend} disabled={sending || !targetId}
            className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-black text-[11px] uppercase tracking-widest py-3.5 rounded-xl transition-all">
            <Send size={14} />
            {sending ? 'Sending...' : 'Send Pairing Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────
const ProjectTasks = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject]   = useState(null);
  const [members, setMembers]   = useState([]);
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating]     = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '', description: '', status: 'todo', priority: 'medium',
    start_at: '', deadline: '', dorItems: [], dodItems: [], assigned_to: '',
  });

  const [showDetail, setShowDetail]     = useState(false);
  const [detailTask, setDetailTask]     = useState(null);
  const [savingDetail, setSavingDetail] = useState(false);
  const [detailForm, setDetailForm]     = useState({
    title: '', description: '', status: 'todo', priority: 'medium',
    start_at: '', deadline: '', dorItems: [], dodItems: [], assigned_to: '',
  });

  const [pairTask, setPairTask] = useState(null);
  const [pairs, setPairs]       = useState([]);

  // ── fetch pairs ──
  const fetchPairs = async () => {
    try {
      const res = await pairingAPI.getMyPairs();
      const all = res.data?.data?.pairs || [];
      setPairs(all.filter(p => String(p.project_id) === String(projectId)));
    } catch { setPairs([]); }
  };

  const isOwner = useMemo(() => {
    if (!user || !project) return false;
    const createdBy = project.created_by ?? project.creator_id ?? project.owner_id ?? null;
    if (createdBy != null && String(createdBy) === String(user.id)) return true;
    const creatorUsername = project.creator_username ?? project.creator?.username ?? null;
    if (creatorUsername && user.username && String(creatorUsername) === String(user.username)) return true;
    return false;
  }, [user, project]);

  const canEditOrMove = (task) => {
    if (isOwner) return true;
    if (!user || !task) return false;
    return String(task.assigned_to) === String(user.id);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, tRes, mRes] = await Promise.all([
        projectAPI.getProject(projectId),
        taskAPI.getTasks(projectId),
        projectAPI.getMembers(projectId),
      ]);
      setProject(pRes?.data?.data?.project ?? null);
      setTasks(tRes?.data?.data?.tasks ?? []);
      setMembers(mRes?.data?.data?.members ?? []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load project tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); fetchPairs(); }, [projectId]);

  const grouped = useMemo(() => {
    const map = { todo: [], doing: [], review: [], done: [] };
    for (const t of tasks) {
      const s = (t.status || 'todo').toLowerCase();
      (map[s] ?? map.todo).push(t);
    }
    const toTime = (d) => (d ? new Date(d).getTime() : Number.POSITIVE_INFINITY);
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => {
        const da = toTime(a.deadline), db = toTime(b.deadline);
        if (da !== db) return da - db;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }
    return map;
  }, [tasks]);

  const normalizePayload = (form) => {
    const payload = {
      title: form.title?.trim(),
      description: form.description?.trim() || null,
      status: form.status || 'todo',
      dor: stringifyChecklist(form.dorItems),
      dod: stringifyChecklist(form.dodItems),
      assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
      priority: form.priority || 'medium',
    };
    if (form.start_at) payload.start_at = form.start_at.slice(0, 10);
    if (form.deadline) payload.deadline = form.deadline.slice(0, 10);
    delete payload.id; delete payload.task_id;
    return payload;
  };

  const openDetail = (task) => {
    setDetailTask(task);
    setDetailForm({
      title: task.title || '', description: task.description || '',
      status: task.status || 'todo', start_at: prettyDate(task.start_at),
      deadline: prettyDate(task.deadline), dorItems: parseChecklist(task.dor),
      dodItems: parseChecklist(task.dod),
      assigned_to: task.assigned_to ? String(task.assigned_to) : '',
      priority: task.priority || 'medium',
    });
    setShowDetail(true);
  };

  const closeDetail = () => { setShowDetail(false); setDetailTask(null); };

  const saveDetail = async (e) => {
    e.preventDefault();
    if (!detailTask) return;
    if (!canEditOrMove(detailTask)) { toast.error('Only project owner or assignee can edit this task'); return; }
    const title = (detailForm.title || '').trim();
    if (!title) return toast.error('Task title is required');
    setSavingDetail(true);
    try {
      const id = detailTask.task_id ?? detailTask.id;
      await taskAPI.updateTask(id, normalizePayload(detailForm));
      toast.success('Task saved');
      closeDetail(); fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save task');
    } finally { setSavingDetail(false); }
  };

  const createTask = async (e) => {
    e.preventDefault();
    const title = (createForm.title || '').trim();
    if (!title) return toast.error('Task title is required');
    setCreating(true);
    try {
      await taskAPI.createTask(projectId, normalizePayload(createForm));
      toast.success('Task created');
      setShowCreate(false);
      setCreateForm({ title: '', description: '', status: 'todo', start_at: '', deadline: '', dorItems: [], dodItems: [], assigned_to: '', priority: 'medium' });
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create task');
    } finally { setCreating(false); }
  };

  const deleteTask = async (task) => {
    if (!canEditOrMove(task)) { toast.error('Only project owner or assignee can delete tasks'); return; }
    const id = task.task_id ?? task.id;
    if (!window.confirm(`Delete task "${task.title}" ?`)) return;
    try {
      await taskAPI.deleteTask(id);
      toast.success('Task deleted');
      setShowDetail(false); setDetailTask(null); fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete task');
    }
  };

  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  const move = (source, destination, droppableSource, droppableDestination) => {
    const sourceClone = Array.from(source);
    const destClone = Array.from(destination);
    const [removed] = sourceClone.splice(droppableSource.index, 1);
    destClone.splice(droppableDestination.index, 0, removed);
    return { sourceClone, destClone, movedTask: removed };
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const draggedTask = tasks.find(t => getTaskId(t) === draggableId);
    if (!canEditOrMove(draggedTask)) { toast.error('คุณสามารถย้ายได้เฉพาะงานที่คุณได้รับมอบหมายเท่านั้น'); return; }
    const prevTasks = tasks;
    const sourceKey = source.droppableId, destKey = destination.droppableId;
    const sourceList = grouped[sourceKey] ?? [], destList = grouped[destKey] ?? [];
    let newGrouped = { ...grouped };
    if (sourceKey === destKey) {
      newGrouped[sourceKey] = reorder(sourceList, source.index, destination.index);
    } else {
      const { sourceClone, destClone, movedTask } = move(sourceList, destList, source, destination);
      const updatedMoved = { ...movedTask, status: destKey };
      destClone[destination.index] = updatedMoved;
      newGrouped[sourceKey] = sourceClone;
      newGrouped[destKey] = destClone;
    }
    const nextTasks = STATUS_COLS.flatMap(c => newGrouped[c.key] || []);
    setTasks(nextTasks);
    try {
      if (sourceKey !== destKey) await taskAPI.updateTask(draggableId, { status: destKey });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to move task');
      setTasks(prevTasks);
    }
  };

  const assignedLabel = (task) => {
    if (task?.assignee_username) return String(task.assignee_username).toUpperCase();
    const id = task?.assigned_to;
    if (!id) return null;
    const m = members.find(x => String(x.user_id) === String(id));
    return m?.username ? String(m.username).toUpperCase() : `USER#${id}`;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[70vh]">
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-gray-600">Loading tasks...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button type="button" onClick={() => navigate('/projects')} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-800">
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </button>
          <h1 className="mt-2 text-3xl font-bold text-gray-800 italic">
            {project?.title ? project.title.toUpperCase() : `PROJECT #${projectId}`}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">{project?.description || 'No description'}</span>
            <span className={['text-xs font-extrabold px-3 py-1 rounded-full border', isOwner ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-600 border-blue-200'].join(' ')}>
              {isOwner ? 'OWNER MODE' : 'MEMBER MODE'}
            </span>
          </div>
        </div>
        <button type="button" onClick={() => setShowCreate(true)} className="px-5 py-3 rounded-lg flex items-center gap-2 transition-colors font-semibold bg-primary hover:bg-primary-dark text-white shadow-sm">
          <Plus className="w-5 h-5" /> New Task
        </button>
      </div>

      {/* Kanban */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {STATUS_COLS.map(col => (
            <div key={col.key} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <p className="font-extrabold text-sm tracking-widest text-gray-700">{col.label}</p>
                <span className="text-xs font-semibold text-gray-400">{grouped[col.key].length}</span>
              </div>
              <Droppable droppableId={col.key}>
                {(provided, snapshot) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}
                    className={['p-3 space-y-3 max-h-[70vh] overflow-auto transition-colors', snapshot.isDraggingOver ? 'bg-gray-50' : 'bg-white'].join(' ')}>
                    {grouped[col.key].length === 0
                      ? <div className="text-sm text-gray-400 text-center py-6">No tasks</div>
                      : grouped[col.key].map((t, index) => {
                        const id = getTaskId(t);
                        const assignee = assignedLabel(t);
                        const isAssignedToMe = String(t.assigned_to) === String(user?.id);
                        return (
                          <Draggable key={id} draggableId={id} index={index} isDragDisabled={!canEditOrMove(t)}>
                            {(dragProvided, dragSnapshot) => (
                              <div ref={dragProvided.innerRef} {...dragProvided.draggableProps}
                                className={['rounded-xl border border-gray-200 p-3 bg-white hover:shadow-sm transition-shadow cursor-pointer', dragSnapshot.isDragging ? 'shadow-md ring-2 ring-primary/30' : ''].join(' ')}
                                onClick={() => openDetail(t)}>

                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2 min-w-0">
                                    <div {...dragProvided.dragHandleProps} onClick={e => e.stopPropagation()}
                                      className={['mt-0.5 p-1 rounded-lg', canEditOrMove(t) ? 'hover:bg-gray-50 text-gray-400' : 'text-gray-300 cursor-not-allowed'].join(' ')}>
                                      <GripVertical className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-bold text-gray-800 text-sm truncate">{t.title}</p>
                                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.description || 'No description'}</p>
                                    </div>
                                  </div>
                                  <div className="shrink-0"><DeadlineBadge deadline={t.deadline} /></div>
                                </div>

                                {assignee && (
                                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span className="text-[11px] font-extrabold tracking-widest text-gray-600">{assignee}</span>
                                  </div>
                                )}

                                {/* ✅ Active Pairs on this task */}
                                {getTaskPairs(pairs, id).map(pair => (
                                  <div key={pair.id} className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1">
                                    <Link2 className="w-3 h-3 text-purple-400" />
                                    <span className="text-[11px] font-extrabold tracking-widest text-purple-600">
                                      {pair.partner_name?.toUpperCase()}
                                    </span>
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                                      pair.direction === 'outgoing' ? 'bg-blue-100 text-blue-500' : 'bg-green-100 text-green-500'
                                    }`}>
                                      {pair.direction === 'outgoing' ? '→' : '←'}
                                    </span>
                                  </div>
                                ))}

                                <ChecklistPreview label="DoR" text={t.dor} />
                                <ChecklistPreview label="DoD" text={t.dod} />

                                <div className="mt-3 flex items-center justify-between">
                                  {isAssignedToMe && col.key !== 'done' && (
                                    <button type="button"
                                      onClick={e => { e.stopPropagation(); setPairTask(t); }}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 text-[10px] font-black uppercase tracking-widest transition-all">
                                      <Users className="w-3.5 h-3.5" /> Pair
                                    </button>
                                  )}
                                  <div className="ml-auto">
                                    <button type="button" disabled={!canEditOrMove(t)}
                                      onClick={e => { e.stopPropagation(); deleteTask(t); }}
                                      className={['p-2 rounded-lg', canEditOrMove(t) ? 'hover:bg-red-50' : 'opacity-40 cursor-not-allowed'].join(' ')}>
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })
                    }
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold italic">CREATE TASK</h2>
              <button type="button" onClick={() => setShowCreate(false)}><X className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
            </div>
            <form onSubmit={createTask} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">TITLE *</label>
                  <input value={createForm.title} onChange={e => setCreateForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">PRIORITY</label>
                  <select value={createForm.priority} onChange={e => setCreateForm(p => ({ ...p, priority: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white">
                    <option value="low">LOW</option><option value="medium">MEDIUM</option>
                    <option value="high">HIGH</option><option value="critical">CRITICAL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">ASSIGN TO</label>
                  <select value={createForm.assigned_to || ''} disabled={!isOwner}
                    onChange={e => setCreateForm(p => ({ ...p, assigned_to: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white disabled:bg-gray-100">
                    <option value="">— Assign to Myself —</option>
                    {members.map(m => <option key={m.user_id} value={String(m.user_id)}>{(m.username || '').toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">DESCRIPTION</label>
                <textarea value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" rows={3} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">START</label>
                  <input type="date" value={createForm.start_at} onChange={e => setCreateForm(p => ({ ...p, start_at: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">DEADLINE</label>
                  <input type="date" value={createForm.deadline} onChange={e => setCreateForm(p => ({ ...p, deadline: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChecklistEditor label="DoR (Definition of Ready)" valueItems={createForm.dorItems}
                  onChange={dorItems => setCreateForm(p => ({ ...p, dorItems }))} disabled={!isOwner} />
                <ChecklistEditor label="DoD (Definition of Done)" valueItems={createForm.dodItems}
                  onChange={dodItems => setCreateForm(p => ({ ...p, dodItems }))} disabled={!isOwner} />
              </div>
              <button type="submit" disabled={creating} className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg disabled:opacity-60">
                {creating ? 'Creating...' : 'Create Task'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Detail Popup */}
      {showDetail && detailTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-extrabold italic truncate">TASK #{getTaskId(detailTask)} — DETAILS</h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <DeadlineBadge deadline={detailForm.deadline} />
                  <span className={['text-xs font-extrabold px-3 py-1 rounded-full border', isOwner ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'].join(' ')}>
                    {isOwner ? 'EDIT ENABLED' : 'VIEW ONLY'}
                  </span>
                </div>
              </div>
              <button type="button" onClick={closeDetail}><X className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
            </div>

            <form onSubmit={saveDetail} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">TITLE *</label>
                  <input value={detailForm.title} disabled={!canEditOrMove(detailTask)}
                    onChange={e => setDetailForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">PRIORITY</label>
                  <select value={detailForm.priority} onChange={e => setDetailForm(p => ({ ...p, priority: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white">
                    <option value="low">LOW</option><option value="medium">MEDIUM</option>
                    <option value="high">HIGH</option><option value="critical">CRITICAL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">STATUS</label>
                  <select value={detailForm.status} disabled={!canEditOrMove(detailTask)}
                    onChange={e => setDetailForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white disabled:bg-gray-50">
                    {STATUS_COLS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">ASSIGN TO</label>
                <select value={detailForm.assigned_to} disabled={!isOwner}
                  onChange={e => setDetailForm(p => ({ ...p, assigned_to: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white disabled:bg-gray-50">
                  {members.map(m => <option key={m.user_id} value={String(m.user_id)}>{(m.username || '').toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">DESCRIPTION</label>
                <textarea value={detailForm.description} disabled={!isOwner}
                  onChange={e => setDetailForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50" rows={4} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">START</label>
                  <input type="date" value={detailForm.start_at} disabled={!isOwner}
                    onChange={e => setDetailForm(p => ({ ...p, start_at: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">DEADLINE</label>
                  <input type="date" value={detailForm.deadline} disabled={!isOwner}
                    onChange={e => setDetailForm(p => ({ ...p, deadline: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50" />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChecklistEditor label="DoR (Definition of Ready)" valueItems={detailForm.dorItems}
                  onChange={dorItems => setDetailForm(p => ({ ...p, dorItems }))} disabled={!canEditOrMove(detailTask)} />
                <ChecklistEditor label="DoD (Definition of Done)" valueItems={detailForm.dodItems}
                  onChange={dodItems => setDetailForm(p => ({ ...p, dodItems }))} disabled={!isOwner} />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button type="submit" disabled={savingDetail || !canEditOrMove(detailTask)}
                  className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg disabled:opacity-60 inline-flex items-center justify-center gap-2">
                  <Save className="w-5 h-5" /> {savingDetail ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={closeDetail} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg">Close</button>
              </div>
            </form>

            <div className="mt-4 flex items-center justify-between">
              <button type="button" disabled={!canEditOrMove(detailTask)} onClick={() => deleteTask(detailTask)}
                className={['text-sm font-bold', canEditOrMove(detailTask) ? 'text-red-600 hover:text-red-700' : 'text-gray-400 cursor-not-allowed'].join(' ')}>
                Delete this task
              </button>
              {String(detailTask.assigned_to) === String(user?.id) && detailTask.status !== 'done' && (
                <button type="button" onClick={() => { closeDetail(); setTimeout(() => setPairTask(detailTask), 100); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 text-xs font-black uppercase tracking-widest transition-all">
                  <Users className="w-4 h-4" /> Request Pairing
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pair Request Modal */}
      {pairTask && (
        <PairRequestModal task={pairTask} members={members} currentUserId={user?.id}
          onClose={() => setPairTask(null)} onSent={() => {}} />
      )}
    </div>
  );
};

export default ProjectTasks;