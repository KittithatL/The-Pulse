import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus,
  ArrowLeft,
  Trash2,
  X,
  GripVertical,
  Save,
  User,
  Clock,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { taskAPI, projectAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const STATUS_COLS = [
  { key: 'todo', label: 'TODO' },
  { key: 'doing', label: 'DOING' },
  { key: 'review', label: 'REVIEW' },
  { key: 'done', label: 'DONE' },
];

const getTaskId = (t) => String(t?.task_id ?? t?.id);
const prettyDate = (d) => (d ? String(d).slice(0, 10) : '');
const toDateOnly = (dStr) => {
  if (!dStr) return null;
  const d = new Date(String(dStr).slice(0, 10) + 'T00:00:00');
  return Number.isNaN(d.getTime()) ? null : d;
};

// ================= Checklist helpers =================
const parseChecklist = (text) => {
  const raw = String(text || '').trim();
  if (!raw) return [];
  return raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^\[(x| )\]\s*(.*)$/i);
      if (m) return { text: (m[2] || '').trim(), done: m[1].toLowerCase() === 'x' };
      return { text: line, done: false };
    })
    .filter((it) => it.text);
};

const stringifyChecklist = (items) => {
  const clean = (items || [])
    .map((it) => ({
      text: String(it?.text || '').trim(),
      done: !!it?.done,
    }))
    .filter((it) => it.text);
  if (clean.length === 0) return null;
  return clean.map((it) => `[${it.done ? 'x' : ' '}] ${it.text}`).join('\n');
};

const makeItem = (text = '') => ({ text, done: false });

const checklistSummary = (text) => {
  const items = parseChecklist(text);
  const total = items.length;
  const done = items.filter((x) => x.done).length;
  return { total, done };
};

// ================= UI: Checklist Editor =================
const ChecklistEditor = ({ label, valueItems, onChange, disabled }) => {
  const addItem = () => onChange([...(valueItems || []), makeItem('')]);

  const updateText = (idx, text) => {
    const next = (valueItems || []).map((it, i) => (i === idx ? { ...it, text } : it));
    onChange(next);
  };

  const toggleDone = (idx) => {
    const next = (valueItems || []).map((it, i) => (i === idx ? { ...it, done: !it.done } : it));
    onChange(next);
  };

  const removeItem = (idx) => {
    const next = (valueItems || []).filter((_, i) => i !== idx);
    onChange(next);
  };

  return (
    <div className="rounded-xl border border-gray-200 p-4 bg-white">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-extrabold tracking-widest text-gray-500">{label}</div>
        {!disabled && (
          <button
            type="button"
            onClick={addItem}
            className="text-xs font-bold text-primary hover:text-primary-dark"
          >
            + Add item
          </button>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {(valueItems || []).length === 0 ? (
          <div className="text-xs text-gray-400">No items</div>
        ) : (
          valueItems.map((it, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggleDone(idx)}
                className={[
                  'mt-1 h-5 w-5 rounded border flex items-center justify-center',
                  disabled ? 'opacity-60 cursor-not-allowed' : '',
                  it.done ? 'bg-primary border-primary text-white' : 'bg-white border-gray-300',
                ].join(' ')}
                title={it.done ? 'Mark as not done' : 'Mark as done'}
              >
                {it.done ? '✓' : ''}
              </button>

              <input
                value={it.text}
                disabled={disabled}
                onChange={(e) => updateText(idx, e.target.value)}
                className={[
                  'flex-1 px-3 py-2 rounded-lg border outline-none text-sm',
                  disabled ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white',
                  it.done ? 'text-gray-500 line-through' : 'text-gray-800',
                  'border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent',
                ].join(' ')}
                placeholder="Type item..."
              />

              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="p-2 rounded-lg hover:bg-red-50"
                  title="Remove"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ================= Card preview =================
const ChecklistPreview = ({ label, text }) => {
  const { done, total } = checklistSummary(text);
  if (total === 0) return null;

  return (
    <div className="mt-2 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
      <span className="text-[11px] font-extrabold tracking-widest text-gray-500">{label}</span>
      <span className="text-[11px] font-bold text-gray-600">
        {done}/{total}
      </span>
    </div>
  );
};

// ================= Deadline badge =================
const DeadlineBadge = ({ deadline }) => {
  const d = toDateOnly(deadline);
  if (!d) return null;

  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round((d.getTime() - t0.getTime()) / (1000 * 60 * 60 * 24));

  let cls =
    'bg-gray-100 text-gray-700 border-gray-200';
  let label = `DUE ${prettyDate(deadline)}`;

  if (diffDays < 0) {
    cls = 'bg-red-50 text-red-700 border-red-200';
    label = `OVERDUE ${prettyDate(deadline)}`;
  } else if (diffDays <= 2) {
    cls = 'bg-amber-50 text-amber-700 border-amber-200';
    label = `DUE SOON ${prettyDate(deadline)}`;
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-extrabold ${cls}`}>
      <Clock className="w-4 h-4" />
      <span className="tracking-widest">{label}</span>
    </div>
  );
};

const ProjectTasks = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    status: 'todo',
    start_at: '',
    deadline: '',
    dorItems: [],
    dodItems: [],
    assigned_to: '', // user_id
  });

  // Detail popup
  const [showDetail, setShowDetail] = useState(false);
  const [detailTask, setDetailTask] = useState(null);
  const [savingDetail, setSavingDetail] = useState(false);
  const [detailForm, setDetailForm] = useState({
    title: '',
    description: '',
    status: 'todo',
    start_at: '',
    deadline: '',
    dorItems: [],
    dodItems: [],
    assigned_to: '', // user_id
  });

  // ✅ owner-only permission (พยายามจับให้ได้จาก fields ที่พบบ่อย)
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
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to load project tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const grouped = useMemo(() => {
  const map = { todo: [], doing: [], review: [], done: [] };

  for (const t of tasks) {
    const s = (t.status || 'todo').toLowerCase();
    (map[s] ?? map.todo).push(t);
  }

  const toTime = (d) => (d ? new Date(d).getTime() : Number.POSITIVE_INFINITY);

  for (const k of Object.keys(map)) {
    map[k].sort((a, b) => {
      const da = toTime(a.deadline);
      const db = toTime(b.deadline);
      if (da !== db) return da - db; // ใกล้สุดก่อน
      // tie-breaker
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
      start_at: form.start_at || null,
      deadline: form.deadline || null,
      dor: stringifyChecklist(form.dorItems),
      dod: stringifyChecklist(form.dodItems),
      assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
    };

    // 🚩 ล้างทุกอย่างที่อาจเป็น ID ทิ้ง เพื่อป้องกัน Backend สับสน
    delete payload.id;
    delete payload.task_id;

    return payload;
  };

  const openDetail = (task) => {
    setDetailTask(task);
    setDetailForm({
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'todo',
      start_at: prettyDate(task.start_at),
      deadline: prettyDate(task.deadline),
      dorItems: parseChecklist(task.dor),
      dodItems: parseChecklist(task.dod),
      assigned_to: task.assigned_to ? String(task.assigned_to) : '',
    });
    setShowDetail(true);
  };

  const closeDetail = () => {
    setShowDetail(false);
    setDetailTask(null);
  };

  const saveDetail = async (e) => {
    e.preventDefault();
    if (!detailTask) return;

    if (!canEditOrMove(detailTask)) {
    toast.error('Only project owner or assignee can edit this task');
    return;
  }

    const title = (detailForm.title || '').trim();
    if (!title) return toast.error('Task title is required');

    setSavingDetail(true);
    try {
      const id = detailTask.task_id ?? detailTask.id;
      await taskAPI.updateTask(id, normalizePayload(detailForm));
      toast.success('Task saved');
      closeDetail();
      fetchAll();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to save task');
    } finally {
      setSavingDetail(false);
    }
  };

  const createTask = async (e) => {
    e.preventDefault();


    const title = (createForm.title || '').trim();
    if (!title) return toast.error('Task title is required');

    setCreating(true);
    try {
    // Backend ที่เราเขียนกันก่อนหน้าจะจัดการเรื่อง assigned_to ให้เอง
    await taskAPI.createTask(projectId, normalizePayload(createForm));
    toast.success('Task created');
    setShowCreate(false);
    
    setCreateForm({
      title: '', description: '', status: 'todo',
      start_at: '', deadline: '', dorItems: [], dodItems: [],
      assigned_to: '',
    });
    fetchAll();
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Failed to create task');
  } finally {
    setCreating(false);
  }
};

  const deleteTask = async (task) => {
    if (!canEditOrMove(task)) {
      toast.error('Only project owner or assignee can delete tasks'); // ปรับข้อความให้ตรงกับสิทธิ์ใหม่
      return;
    }

    const id = task.task_id ?? task.id;
    const ok = window.confirm(`Delete task "${task.title}" ?`);
    if (!ok) return;

    try {
      await taskAPI.deleteTask(id);
      toast.success('Task deleted');
      
      // ✅ 1. สั่งปิด Pop-up ทันที
      setShowDetail(false); 
      
      // ✅ 2. ล้างค่า Task ใน State (กัน Error จากการ Render ข้อมูลที่ถูกลบไปแล้ว)
      setDetailTask(null);

      // 3. อัปเดตรายการงานหน้าจอ
      fetchAll(); 
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to delete task');
    }
  };

  // ===== DnD helpers =====
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

  if (!canEditOrMove(draggedTask)) {
    toast.error('คุณสามารถย้ายได้เฉพาะงานที่คุณได้รับมอบหมายเท่านั้น');
    return;
  }

  const prevTasks = tasks;

    const sourceKey = source.droppableId;
    const destKey = destination.droppableId;

    const sourceList = grouped[sourceKey] ?? [];
    const destList = grouped[destKey] ?? [];

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

    const nextTasks = STATUS_COLS.flatMap((c) => newGrouped[c.key] || []);
    setTasks(nextTasks);

    try {
      if (sourceKey !== destKey) {
        await taskAPI.updateTask(draggableId, { status: destKey });
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to move task');
      setTasks(prevTasks);
    }
  };

  const assignedLabel = (task) => {
    // ถ้า backend ส่ง username มาด้วย ใช้อันนี้โชว์สวยๆ
    if (task?.assignee_username) return String(task.assignee_username).toUpperCase();

    const id = task?.assigned_to;
    if (!id) return null;

    const m = members.find((x) => String(x.user_id) === String(id));
    return m?.username ? String(m.username).toUpperCase() : `USER#${id}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </button>

          <h1 className="mt-2 text-3xl font-bold text-gray-800 italic">
            {project?.title ? project.title.toUpperCase() : `PROJECT #${projectId}`}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">{project?.description || 'No description'}</span>

            <span
              className={[
                'text-xs font-extrabold px-3 py-1 rounded-full border',
                isOwner
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-blue-50 text-blue-600 border-blue-200', // เปลี่ยนสีให้ดูมีสิทธิ์ขึ้น
              ].join(' ')}
            >
              {isOwner ? 'OWNER MODE' : 'MEMBER MODE'} {/* ✅ เปลี่ยนจาก VIEW ONLY */}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCreate(true)}
          // ✅ ปลดล็อกให้ทุกคนในโปรเจกต์กดได้
          className="px-5 py-3 rounded-lg flex items-center gap-2 transition-colors font-semibold bg-primary hover:bg-primary-dark text-white shadow-sm"
          title="New Task"
        >
          <Plus className="w-5 h-5" />
          New Task
        </button>
      </div>

      {/* Kanban with DnD */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {STATUS_COLS.map((col) => (
            <div
              key={col.key}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <p className="font-extrabold text-sm tracking-widest text-gray-700">{col.label}</p>
                <span className="text-xs font-semibold text-gray-400">{grouped[col.key].length}</span>
              </div>

              <Droppable droppableId={col.key} isDropDisabled={false}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={[
                      'p-3 space-y-3 max-h-[70vh] overflow-auto transition-colors',
                      snapshot.isDraggingOver ? 'bg-gray-50' : 'bg-white',
                    ].join(' ')}
                  >
                    {grouped[col.key].length === 0 ? (
                      <div className="text-sm text-gray-400 text-center py-6">No tasks</div>
                    ) : (
                      grouped[col.key].map((t, index) => {
                        const id = getTaskId(t);
                        const assignee = assignedLabel(t);
                        return (
                          <Draggable key={id} draggableId={id} index={index} isDragDisabled={!canEditOrMove(t)}>
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                className={[
                                  'rounded-xl border border-gray-200 p-3 bg-white',
                                  'hover:shadow-sm transition-shadow',
                                  'cursor-pointer',
                                  dragSnapshot.isDragging ? 'shadow-md ring-2 ring-primary/30' : '',
                                ].join(' ')}
                                onClick={() => openDetail(t)}
                              >
                                {/* Top row: drag handle + deadline badge */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2 min-w-0">
                                    <div
                                      {...dragProvided.dragHandleProps}
                                      onClick={(e) => e.stopPropagation()}
                                      className={[
                                        'mt-0.5 p-1 rounded-lg',
                                        // ✅ เปลี่ยนจาก isOwner เป็น canEditOrMove(t)
                                        canEditOrMove(t) ? 'hover:bg-gray-50 text-gray-400' : 'text-gray-300 cursor-not-allowed',
                                      ].join(' ')}
                                      // ✅ เปลี่ยนข้อความ Tooltip ให้สื่อความหมาย
                                      title={canEditOrMove(t) ? 'Drag to move' : 'No permission to move'}
                                    >
                                      <GripVertical className="w-4 h-4" />
                                    </div>

                                    <div className="min-w-0">
                                      <p className="font-bold text-gray-800 text-sm truncate">{t.title}</p>
                                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                        {t.description || 'No description'}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Deadline */}
                                  <div className="shrink-0">
                                    <DeadlineBadge deadline={t.deadline} />
                                  </div>
                                </div>

                                {/* Assignee (preview) */}
                                {assignee && (
                                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span className="text-[11px] font-extrabold tracking-widest text-gray-600">
                                      {assignee}
                                    </span>
                                  </div>
                                )}

                                {/* Preview summary only */}
                                <ChecklistPreview label="DoR" text={t.dor} />
                                <ChecklistPreview label="DoD" text={t.dod} />

                                {/* Delete */}
                                <div className="mt-3 flex justify-end">
                                  <button
                                    type="button"
                                    disabled={!canEditOrMove(t)}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteTask(t);
                                    }}
                                    className={[
                                      'p-2 rounded-lg',
                                      canEditOrMove(t) ? 'hover:bg-red-50' : 'opacity-40 cursor-not-allowed',
                                    ].join(' ')}
                                    title={!canEditOrMove(t) ? 'Owner only' : 'Delete'}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })
                    )}

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
              <button type="button" onClick={() => setShowCreate(false)}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={createTask} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">TITLE *</label>
                  <input
                    value={createForm.title}
                    // disabled={!isOwner}
                    onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">ASSIGN TO</label>
                  <select
                    value={createForm.assigned_to || ''} // ✅ เปลี่ยนจาก detailForm เป็น createForm
                    disabled={!isOwner} // ✅ Member จะเลือกไม่ได้ (Backend จะล็อกให้เป็นตัวเองอัตโนมัติ)
                    onChange={(e) => setCreateForm(p => ({ ...p, assigned_to: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white disabled:bg-gray-100"
                  >
                    <option value="">— Assign to Myself —</option>
                    {members.map((m) => (
                      <option key={m.user_id} value={String(m.user_id)}>
                        {(m.username || '').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">DESCRIPTION</label>
                <textarea
                  value={createForm.description}
                  // disabled={!isOwner}
                  onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">START</label>
                  <input
                    type="date"
                    value={createForm.start_at}
                    // disabled={!isOwner}
                    onChange={(e) => setCreateForm((p) => ({ ...p, start_at: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">DEADLINE</label>
                  <input
                    type="date"
                    value={createForm.deadline}
                    // disabled={!isOwner}
                    onChange={(e) => setCreateForm((p) => ({ ...p, deadline: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50"
                  />
                </div>
              </div>

              {/* Assign */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">ASSIGN TO</label>
                <select
                  value={detailForm.assigned_to || ''}
                  disabled={!isOwner}
                  onChange={(e) => setDetailForm(p => ({ ...p, assigned_to: e.target.value }))}
                  className="..."
                >
                  <option value="">— Unassigned —</option>
                  {members.map((m) => (
                    <option key={m.user_id} value={String(m.user_id)}>
                      {(m.username || '').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChecklistEditor
                  label="DoR (Definition of Ready)"
                  valueItems={createForm.dorItems}
                  onChange={(dorItems) => setCreateForm((p) => ({ ...p, dorItems }))}
                  disabled={!isOwner}
                />
                <ChecklistEditor
                  label="DoD (Definition of Done)"
                  valueItems={createForm.dodItems}
                  onChange={(items) => setDetailForm(p => ({ ...p, dodItems: items }))}
                  disabled={!isOwner} 
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg disabled:opacity-60"
              >
                {creating ? 'Creating...' : 'Create Task'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Detail Popup (View/Edit) */}
      {showDetail && detailTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-extrabold italic truncate">
                  TASK #{getTaskId(detailTask)} — DETAILS
                </h2>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <DeadlineBadge deadline={detailForm.deadline} />
                  <span
                    className={[
                      'text-xs font-extrabold px-3 py-1 rounded-full border',
                      isOwner
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200',
                    ].join(' ')}
                  >
                    {isOwner ? 'EDIT ENABLED' : 'VIEW ONLY'}
                  </span>
                </div>
              </div>

              <button type="button" onClick={closeDetail}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={saveDetail} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">TITLE *</label>
                  <input
                    value={detailForm.title}
                    disabled={!canEditOrMove(detailTask)}
                    onChange={(e) => setDetailForm((p) => ({ ...p, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">STATUS</label>
                  <select
                    value={detailForm.status}
                    disabled={!canEditOrMove(detailTask)}
                    onChange={(e) => setDetailForm((p) => ({ ...p, status: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white disabled:bg-gray-50"
                  >
                    {STATUS_COLS.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assign */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">ASSIGN TO</label>
                <select
                  value={detailForm.assigned_to}
                  disabled={!isOwner}
                  onChange={(e) => setDetailForm((p) => ({ ...p, assigned_to: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white disabled:bg-gray-50"
                >
                  <option value="">— Unassigned —</option>
                  {members.map((m) => (
                    <option key={m.user_id} value={String(m.user_id)}>
                      {(m.username || '').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">DESCRIPTION</label>
                <textarea
                  value={detailForm.description}
                  disabled={!isOwner}
                  onChange={(e) => setDetailForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">START</label>
                  <input
                    type="date"
                    value={detailForm.start_at}
                    disabled={!isOwner}
                    onChange={(e) => setDetailForm((p) => ({ ...p, start_at: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">DEADLINE</label>
                  <input
                    type="date"
                    value={detailForm.deadline}
                    disabled={!isOwner}
                    onChange={(e) => setDetailForm((p) => ({ ...p, deadline: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChecklistEditor
                  label="DoR (Definition of Ready)"
                  valueItems={detailForm.dorItems}
                  onChange={(dorItems) => setDetailForm((p) => ({ ...p, dorItems }))}
                  disabled={!canEditOrMove(detailTask)}
                />
                <ChecklistEditor
                  label="DoD (Definition of Done)"
                  valueItems={detailForm.dodItems}
                  onChange={(dodItems) => setDetailForm((p) => ({ ...p, dodItems }))}
                  disabled={!isOwner}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={savingDetail || !canEditOrMove(detailTask)}
                  className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {savingDetail ? 'Saving...' : 'Save'}
                </button>

                <button
                  type="button"
                  onClick={closeDetail}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg"
                >
                  Close
                </button>
              </div>
            </form>

            <div className="mt-4">
              <button
                type="button"
                disabled={!canEditOrMove(detailTask)}
                onClick={() => {
                  deleteTask(detailTask);
                }}
                className={[
                  'text-sm font-bold',
                  canEditOrMove(detailTask) ? 'text-red-600 hover:text-red-700' : 'text-gray-400 cursor-not-allowed',
                ].join(' ')}
              >
                Delete this task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectTasks;
