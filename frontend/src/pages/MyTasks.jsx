import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, Calendar, ExternalLink, Search, Filter } from 'lucide-react';
import { taskAPI } from '../services/api'; // สมมติว่ามี API สำหรับดึง Task
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const MyTasks = ({ searchQuery = '' }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // all, todo, doing, done
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const fetchMyTasks = async () => {
    try {
      setLoading(true); // เริ่มต้นโหลด
      const response = await taskAPI.getMyTasks();
      
      // ตรวจสอบว่ามีข้อมูลส่งกลับมาจริงไหมก่อนเซตค่า
      if (response.data && response.data.data) {
        setTasks(response.data.data.tasks);
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      toast.error("COMMUNICATION ERROR: Unable to reach base.");
    } finally {
      // ✅ จุดตายตัว: ไม่ว่าจะสำเร็จหรือ Error ต้องปิด Loading เสมอ
      setLoading(false); 
    }
  };

  // Logic การกรองข้อมูล (Search + Status Filter)
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // กรองตาม Status
    if (filterStatus !== 'all') {
      result = result.filter(t => t.status === filterStatus);
    }

    // กรองตามการค้นหา
    const q = (searchQuery || '').trim().toLowerCase();
    if (q) {
      result = result.filter(t => 
        (t.title || '').toLowerCase().includes(q) ||
        (t.project_title || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [tasks, searchQuery, filterStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Scanning your missions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 italic tracking-tighter">MY MISSIONS</h1>
          <p className="text-gray-500 text-sm font-bold">ALL ASSIGNED TASKS ACROSS PROJECTS</p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
          {['all', 'todo', 'doing', 'done'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={[
                'flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all',
                filterStatus === status 
                  ? 'bg-white text-primary shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              ].join(' ')}
            >
              {status.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl py-20 text-center">
            <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-bold italic">NO TASKS FOUND IN THIS SECTOR</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-xl transition-all group"
            >
              {/* Project Tag Line */}
              <div className="bg-dark text-white px-4 py-1 text-[10px] font-black flex justify-between items-center tracking-widest uppercase">
                <span>PROJECT: {task.project_title}</span>
                <span className={`px-2 rounded ${
                  task.status === 'done' ? 'bg-green-500' : 
                  task.status === 'doing' ? 'bg-orange-500' : 'bg-gray-500'
                }`}>
                  {task.status}
                </span>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-extrabold text-gray-800 mb-2 leading-tight group-hover:text-primary transition-colors">
                  {task.title}
                </h3>
                
                <p className="text-sm text-gray-500 italic mb-6 line-clamp-2 h-10">
                  {task.description || 'No detailed briefing available.'}
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>DEADLINE: {task.deadline ? format(new Date(task.deadline), 'MMM dd, yyyy') : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>STATUS: {task.status?.toUpperCase()}</span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                   <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-primary flex items-center justify-center text-[10px] text-white font-bold">
                        ME
                      </div>
                   </div>
                   
                   <button
                    onClick={() => navigate(`/projects/${task.project_id}/tasks`)}
                    className="flex items-center gap-1 text-xs font-black text-primary hover:gap-2 transition-all"
                  >
                    GO TO PROJECT <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyTasks;