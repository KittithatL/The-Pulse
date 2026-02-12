import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, ArrowLeft, Trash2, X, GripVertical, Save, User, Clock } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { taskAPI, projectAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

// --- HELPERS ---
const STATUS_COLS = [
  { key: 'todo', label: 'TO DO' },
  { key: 'doing', label: 'IN PROGRESS' },
  { key: 'review', label: 'REVIEW' },
  { key: 'done', label: 'DONE' },
];

const prettyDate = (d) => (d ? new Date(d).toISOString().split('T')[0] : '');
const parseChecklist = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return String(val).split('\n').filter(Boolean).map(t => ({ text: t, done: false })); }
};
const stringifyChecklist = (items) => JSON.stringify(items || []);

const ProjectTasks = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // FORM STATES
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    status: 'todo',
    start_at: '',
    deadline: '',
    dorItems: [],
    dodItems: [],
    assigned_to: '',
  });

  const [showDetail, setShowDetail] = useState(false);
  const [detailTask, setDetailTask] = useState(null);
  const [savingDetail, setSavingDetail] = useState(false);
  const [detailForm, setDetailForm] = useState({
    name: '',
    description: '',
    status: 'todo',
    start_at: '',
    deadline: '',
    dorItems: [],
    dodItems: [],
    assigned_to: '',
  });

  const isOwner = useMemo(() => {
    if (!user || !project) return false;
    const ownerId = project.created_by || project.owner_id;
    return String(ownerId) === String(user.id);
  }, [user, project]);

  const canEditOrMove = (task) => isOwner || (user && String(task?.assigned_to) === String(user.id));

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
      toast.error('Failed to load project tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [projectId]);

  // ✅ แก้ไข:assigned_to ส่งเป็น String (UUID) ห้ามใช้ Number()
  const normalizePayload = (form) => ({
    name: form.name?.trim(),
    description: form.description?.trim() || null,
    status: form.status || 'todo',
    start_at: form.start_at || null,
    deadline: form.deadline || null,
    dor: stringifyChecklist(form.dorItems),
    dod: stringifyChecklist(form.dodItems),
    assigned_to: form.assigned_to || null, 
  });

  const openDetail = (task) => {
    setDetailTask(task);
    setDetailForm({
      name: task.name || '',
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

  const createTask = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) return toast.error('Task name is required');
    setCreating(true);
    try {
      await taskAPI.createTask(projectId, normalizePayload(createForm));
      toast.success('Task created');
      setShowCreate(false);
      setCreateForm({ name: '', description: '', status: 'todo', start_at: '', deadline: '', dorItems: [], dodItems: [], assigned_to: '' });
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create task');
    } finally { setCreating(false); }
  };

  const saveDetail = async (e) => {
    e.preventDefault();
    if (!detailTask) return;
    setSavingDetail(true);
    try {
      const id = detailTask.task_id || detailTask.id;
      await taskAPI.updateTask(id, normalizePayload(detailForm));
      toast.success('Task updated');
      setShowDetail(false);
      fetchAll();
    } catch (err) {
      toast.error('Failed to update task');
    } finally { setSavingDetail(false); }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const task = tasks.find(t => (t.task_id || t.id) === draggableId);
    if (!canEditOrMove(task)) return toast.error('Permission denied');

    const newStatus = destination.droppableId;
    const updatedTasks = tasks.map(t => 
      (t.task_id || t.id) === draggableId ? { ...t, status: newStatus } : t
    );
    setTasks(updatedTasks);

    try {
      await taskAPI.updateTask(draggableId, { status: newStatus });
    } catch (err) {
      toast.error('Failed to move task');
      fetchAll();
    }
  };

  const grouped = useMemo(() => {
    return tasks.reduce((acc, t) => {
      const s = t.status || 'todo';
      if (!acc[s]) acc[s] = [];
      acc[s].push(t);
      return acc;
    }, {});
  }, [tasks]);

  if (loading) return <div className="p-10 font-black italic">LOADING ASSETS...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <button onClick={() => navigate('/projects')} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-800">
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </button>
          <h1 className="mt-2 text-3xl font-black text-gray-800 italic uppercase">
            {project?.name || `PROJECT #${projectId}`}
          </h1>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-5 py-3 rounded-xl bg-red-600 text-white font-black shadow-lg hover:bg-red-700 transition-all">
          <Plus className="w-5 h-5 inline mr-1" /> NEW TASK
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {STATUS_COLS.map((col) => (
            <div key={col.key} className="bg-slate-100/50 rounded-2xl border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white">
                <p className="font-black text-xs tracking-widest text-slate-500">{col.label}</p>
                <span className="bg-slate-200 px-2 py-0.5 rounded text-[10px] font-black">{(grouped[col.key] || []).length}</span>
              </div>
              <Droppable droppableId={col.key}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="p-3 space-y-3 flex-1 overflow-y-auto">
                    {(grouped[col.key] || []).map((t, index) => (
                      <Draggable key={t.task_id || t.id} draggableId={t.task_id || t.id} index={index} isDragDisabled={!canEditOrMove(t)}>
                        {(dProvided) => (
                          <div 
                            ref={dProvided.innerRef} 
                            {...dProvided.draggableProps} 
                            {...dProvided.dragHandleProps}
                            onClick={() => openDetail(t)}
                            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                          >
                            <div className="flex justify-between items-start gap-2 mb-2">
                               <p className="font-bold text-gray-800 text-sm uppercase leading-tight">{t.name}</p>
                               <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-2 mb-3">{t.description || 'No description'}</p>
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400">
                               <User className="w-3 h-3" />
                               <span>{t.assigned_username || 'UNASSIGNED'}</span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* CREATE MODAL */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl">
            <h2 className="text-2xl font-black italic mb-6">INITIALIZE NEW TASK</h2>
            <form onSubmit={createTask} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">Task Name *</label>
                  <input value={createForm.name} onChange={(e) => setCreateForm(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-red-600" required />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">Assign To</label>
                  <select value={createForm.assigned_to} onChange={(e) => setCreateForm(p => ({ ...p, assigned_to: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold bg-slate-50">
                    <option value="">— Unassigned —</option>
                    {members.map(m => <option key={m.user_id} value={m.user_id}>{(m.name || m.username || '').toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={creating} className="w-full bg-red-600 text-white font-black py-4 rounded-2xl hover:bg-red-700 shadow-xl transition-all">
                {creating ? 'SYNCING...' : 'CONFIRM CREATE'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL มึงสามารถก็อปส่วน Detail ด้านบนมาใส่ตรงนี้ได้เลยโดยเปลี่ยน detailForm ให้ตรงกัน */}
    </div>
  );
};

export default ProjectTasks;