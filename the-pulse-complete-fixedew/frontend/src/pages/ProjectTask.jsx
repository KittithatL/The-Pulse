import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Search, MoreHorizontal, Clock, X, GripVertical } from 'lucide-react';
import { taskAPI } from '../services/api'; 
import toast from 'react-hot-toast';

const ProjectTasks = () => {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '', description: '', status: 'todo', priority: 'medium', deadline: ''
  });
  
  // Columns Config
  const columns = {
    todo: { id: 'todo', title: 'TO DO', countColor: 'bg-gray-200 text-gray-700' },
    doing: { id: 'doing', title: 'IN PROCESS', countColor: 'bg-orange-100 text-orange-600' },
    review: { id: 'review', title: 'REVIEW', countColor: 'bg-purple-100 text-purple-600' },
    done: { id: 'done', title: 'DONE', countColor: 'bg-green-100 text-green-600' }
  };

  useEffect(() => { fetchTasks(); }, [projectId]);

  const fetchTasks = async () => {
    try {
      const res = await taskAPI.getTasks(projectId);
      if (res.data?.success) {
        setTasks(res.data.data.tasks || res.data.data || []);
      }
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) return toast.error("Task name is required");
    setCreating(true);
    try {
      await taskAPI.createTask(projectId, createForm);
      toast.success("Task Created!");
      setShowCreate(false);
      setCreateForm({ name: '', description: '', status: 'todo', priority: 'medium', deadline: '' });
      fetchTasks();
    } catch (err) { toast.error("Failed to create task"); } 
    finally { setCreating(false); }
  };

  // --- ✋ DRAG AND DROP LOGIC ---
  
  const onDragStart = (e, taskId) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = async (e, newStatus) => {
    const taskId = e.dataTransfer.getData("taskId");
    
    // Optimistic Update
    const originalTasks = [...tasks];
    const updatedTasks = tasks.map(task => {
      if (task.id.toString() === taskId) {
        return { ...task, status: newStatus };
      }
      return task;
    });
    setTasks(updatedTasks);

    // API Call
    try {
      await taskAPI.updateTaskStatus(taskId, { status: newStatus });
      toast.success(`Moved to ${newStatus.toUpperCase()}`);
    } catch (err) {
      console.error("Move failed", err);
      toast.error("Failed to move task");
      setTasks(originalTasks);
    }
  };

  // --- Helpers ---
  const getPriorityStyle = (p) => {
    switch (p?.toLowerCase()) {
      case 'critical': return 'bg-red-50 text-red-600 border-red-100';
      case 'high': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'medium': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse">LOADING BOARD...</div>;

  return (
    <div className="min-h-screen bg-[#F8F9FD] p-6 md:p-10 font-sans relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">PROJECT TASKS</h1>
          <p className="text-green-500 font-bold text-xs tracking-widest uppercase flex items-center gap-2">
             ● LIVE BOARD VIEW
          </p>
        </div>
        <div className="flex gap-3">
           <button onClick={() => setShowCreate(true)} className="bg-black text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg uppercase tracking-wider flex items-center gap-2 hover:scale-105 transition-transform">
             <Plus className="w-4 h-4" /> New Task
           </button>
        </div>
      </div>

      {/* --- BOARD GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {Object.entries(columns).map(([colId, col]) => {
          
          // ✅ FIX: แก้ไขบรรทัดนี้ให้รองรับ Case Insensitive
          const colTasks = tasks.filter(t => t.status?.toLowerCase() === colId.toLowerCase());
          
          return (
            <div 
              key={colId} 
              className="flex flex-col h-full"
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, colId)}
            >
              <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{col.title}</h3>
                <span className={`text-[10px] font-black px-2 py-1 rounded-md ${col.countColor}`}>{colTasks.length}</span>
              </div>

              {/* Drop Zone */}
              <div className={`bg-gray-100/50 rounded-[2rem] p-2 min-h-[200px] border-2 border-transparent transition-all duration-200 ${colTasks.length === 0 ? 'border-dashed border-gray-200' : ''}`}>
                {colTasks.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-300 text-[10px] font-bold uppercase">Drop here</div>
                ) : (
                  colTasks.map((task) => (
                    <div 
                      key={task.id}
                      draggable 
                      onDragStart={(e) => onDragStart(e, task.id)}
                      className="bg-white p-5 rounded-[1.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 mb-3 border border-gray-100 group cursor-grab active:cursor-grabbing relative overflow-hidden"
                    >
                      {/* Priority Stripe */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${task.priority === 'high' ? 'bg-orange-500' : task.priority === 'critical' ? 'bg-red-600' : 'bg-transparent'}`} />

                      <div className="flex justify-between items-start mb-3 pl-2">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${getPriorityStyle(task.priority)}`}>
                          {task.priority || 'NORMAL'}
                        </span>
                        <GripVertical className="w-4 h-4 text-gray-300" />
                      </div>

                      <h4 className="text-sm font-black text-gray-900 uppercase italic mb-2 pl-2 leading-snug">{task.name}</h4>
                      
                      <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center pl-2">
                        <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[8px] font-bold">
                           {(task.assignee_username || 'UN').substring(0,2).toUpperCase()}
                        </div>
                        {task.deadline && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(task.deadline).getDate()}/{new Date(task.deadline).getMonth()+1}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">INITIATE TASK</h2>
              <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-gray-600" /></button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <input value={createForm.name} onChange={(e) => setCreateForm({...createForm, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-sm outline-none focus:border-black" placeholder="Task Name" required />
              <textarea value={createForm.description} onChange={(e) => setCreateForm({...createForm, description: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-medium text-sm outline-none focus:border-black" rows={3} placeholder="Details..." />
              <div className="grid grid-cols-2 gap-4">
                 <select value={createForm.priority} onChange={(e) => setCreateForm({...createForm, priority: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-sm"><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select>
                 <input type="date" value={createForm.deadline} onChange={(e) => setCreateForm({...createForm, deadline: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-sm" />
              </div>
              <button type="submit" disabled={creating} className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl uppercase tracking-widest shadow-lg transition-all hover:scale-[1.02]">{creating ? 'DEPLOYING...' : 'DEPLOY TASK'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectTasks;