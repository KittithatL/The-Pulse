import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Search, MoreHorizontal, Clock, X } from 'lucide-react';
// ✅ ใช้ taskAPI ให้ตรงกับ api.js ของคุณ
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
    name: '', 
    description: '',
    status: 'todo',
    priority: 'medium',
    deadline: ''
  });
  
  // Columns
  const columns = {
    todo: { id: 'todo', title: 'TO DO', countColor: 'bg-gray-200 text-gray-700' },
    doing: { id: 'doing', title: 'IN PROCESS', countColor: 'bg-orange-100 text-orange-600' },
    review: { id: 'review', title: 'REVIEW', countColor: 'bg-purple-100 text-purple-600' },
    done: { id: 'done', title: 'DONE', countColor: 'bg-green-100 text-green-600' }
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      // 🚩 แก้จุดที่ 1: เรียกใช้ taskAPI.getTasks (ให้ตรงกับ api.js)
      const res = await taskAPI.getTasks(projectId);
      
      if (res.data?.success) {
        // 🚩 แก้จุดที่ 2: เจาะเข้าไปเอา array ใน .tasks 
        // (Backend ส่งมาเป็น { success: true, data: { tasks: [...] } })
        const taskList = res.data.data.tasks || res.data.data || [];
        setTasks(taskList);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) return toast.error("Task name is required");

    setCreating(true);
    try {
      // เรียก API สร้างงาน
      await taskAPI.createTask(projectId, createForm);
      toast.success("Task Created!");
      
      setShowCreate(false);
      setCreateForm({ name: '', description: '', status: 'todo', priority: 'medium', deadline: '' });
      fetchTasks();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'bg-red-50 text-red-600 border border-red-100';
      case 'high': return 'bg-orange-50 text-orange-600 border border-orange-100';
      case 'medium': return 'bg-blue-50 text-blue-600 border border-blue-100';
      default: return 'bg-gray-50 text-gray-500 border border-gray-100';
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-400 font-black animate-pulse">LOADING BOARD...</div>;

  return (
    <div className="min-h-screen bg-[#F8F9FD] p-6 md:p-10 font-sans relative">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 italic uppercase tracking-tighter mb-1">
            PROJECT TASKS
          </h1>
          <p className="text-gray-400 text-xs font-bold tracking-widest uppercase flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            LIVE BOARD VIEW
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <input 
               type="text" 
               placeholder="Search task..." 
               className="pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm w-full md:w-64 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all shadow-sm"
             />
          </div>
          <button 
            onClick={() => setShowCreate(true)}
            className="bg-black hover:bg-gray-800 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg flex items-center gap-2 transition-transform hover:scale-105 uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>
      </div>

      {/* --- BOARD GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {Object.entries(columns).map(([colId, col]) => {
          // กรองงาน (ถ้า tasks เป็น null ให้ใช้ array ว่างแทน กันจอขาว)
          const colTasks = Array.isArray(tasks) ? tasks.filter(t => t.status === colId) : [];
          
          return (
            <div key={colId} className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  {col.title}
                </h3>
                <span className={`text-[10px] font-black px-2 py-1 rounded-md ${col.countColor}`}>
                  {colTasks.length}
                </span>
              </div>

              <div className="bg-gray-100/50 rounded-[2rem] p-2 min-h-[200px] border border-gray-200/50">
                {colTasks.length === 0 ? (
                  <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl m-2">
                    <span className="text-[10px] font-bold text-gray-300 uppercase">Empty</span>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="bg-white p-5 rounded-[1.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 mb-3 border border-gray-100 group cursor-pointer relative overflow-hidden"
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                        task.priority === 'high' ? 'bg-orange-500' : 
                        task.priority === 'critical' ? 'bg-red-600' : 'bg-transparent'
                      }`} />

                      <div className="flex justify-between items-start mb-3 pl-2">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${getPriorityStyle(task.priority)}`}>
                          {task.priority || 'NORMAL'}
                        </span>
                        <button className="text-gray-300 hover:text-black transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>

                      <h4 className="text-sm font-black text-gray-900 uppercase italic mb-2 leading-snug pl-2 group-hover:text-red-600 transition-colors">
                        {task.name}
                      </h4>
                      
                      <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center pl-2">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[8px] font-bold ring-2 ring-white">
                             {(task.assignee_username || task.assigned_username || 'UN').substring(0,2).toUpperCase()}
                           </div>
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

      {/* --- CREATE MODAL --- */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">INITIATE TASK</h2>
              <button onClick={() => setShowCreate(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Task Name</label>
                <input 
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-black font-bold text-sm"
                  placeholder="Operation Alpha..."
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Briefing</label>
                <textarea 
                  value={createForm.description}
                  onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-black font-medium text-sm"
                  rows={3}
                  placeholder="Mission details..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Priority</label>
                  <select 
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({...createForm, priority: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-black font-bold text-sm bg-white"
                  >
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Deadline</label>
                  <input 
                    type="date"
                    value={createForm.deadline}
                    onChange={(e) => setCreateForm({...createForm, deadline: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-black font-bold text-sm"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={creating}
                className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl uppercase tracking-widest shadow-lg shadow-red-600/30 transition-all hover:scale-[1.02] disabled:opacity-70"
              >
                {creating ? 'DEPLOYING...' : 'DEPLOY TASK'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectTasks;