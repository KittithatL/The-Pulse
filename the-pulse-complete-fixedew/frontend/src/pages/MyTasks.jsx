import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, Calendar, ExternalLink } from 'lucide-react';
import { taskAPI } from '../services/api'; 
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const MyTasks = ({ searchQuery = '' }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getMyTasks();
      
      // ✅ ดึงจาก response.data.data.tasks ตามโครงสร้างที่กูแก้ให้ใน Controller
      if (response.data?.success) {
        setTasks(response.data.data.tasks || []);
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      toast.error("COMMUNICATION ERROR: Unable to reach base.");
    } finally {
      setLoading(false); 
    }
  };

  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (filterStatus !== 'all') {
      result = result.filter(t => t.status === filterStatus);
    }

    const q = (searchQuery || '').trim().toLowerCase();
    if (q) {
      result = result.filter(t => 
        // ✅ เปลี่ยนจาก title เป็น name
        (t.name || '').toLowerCase().includes(q) ||
        (t.project_name || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [tasks, searchQuery, filterStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-black italic uppercase">Scanning your missions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 italic tracking-tighter uppercase">MY MISSIONS</h1>
          <p className="text-red-600 text-xs font-black tracking-widest uppercase">Assigned Tasks Analysis</p>
        </div>

        <div className="flex bg-gray-200 p-1 rounded-2xl w-full md:w-auto shadow-inner">
          {['all', 'todo', 'doing', 'done'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={[
                'flex-1 md:flex-none px-6 py-2 rounded-xl text-[10px] font-black transition-all uppercase',
                filterStatus === status 
                  ? 'bg-white text-red-600 shadow-md transform scale-105' 
                  : 'text-gray-500 hover:text-gray-800'
              ].join(' ')}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full bg-gray-50 border-4 border-double border-gray-200 rounded-[2rem] py-32 text-center">
            <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 font-black italic uppercase tracking-widest">NO MISSIONS FOUND IN THIS SECTOR</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.task_id} // ✅ เปลี่ยนจาก task.id เป็น task_id
              className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden hover:border-red-600 transition-all group relative"
            >
              {/* Project Tag */}
              <div className="bg-black text-white px-5 py-2 text-[9px] font-black flex justify-between items-center tracking-widest uppercase">
                <span className="truncate mr-4">PROJ // {task.project_name}</span>
                <span className={`px-2 py-0.5 rounded-full ${
                  task.status === 'done' ? 'bg-green-500' : 
                  task.status === 'doing' ? 'bg-orange-500' : 'bg-red-600'
                }`}>
                  {task.status}
                </span>
              </div>

              <div className="p-7">
                <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight uppercase italic group-hover:text-red-600 transition-colors">
                  {task.name} {/* ✅ เปลี่ยนจาก task.title เป็น task.name */}
                </h3>
                
                <p className="text-xs text-gray-500 font-bold italic mb-6 line-clamp-2 h-8">
                  {task.description || 'NO ADDITIONAL BRIEFING PROVIDED.'}
                </p>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase">
                    <Calendar className="w-4 h-4 text-red-600" />
                    <span>Deadline: {task.deadline ? format(new Date(task.deadline), 'dd.MM.yyyy') : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase">
                    <Clock className="w-4 h-4 text-red-600" />
                    <span>Updated: {task.updated_at ? format(new Date(task.updated_at), 'dd.MM.yyyy') : 'N/A'}</span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-5 border-t border-gray-50 flex justify-between items-center">
                   <div className="w-9 h-9 rounded-full border-2 border-white bg-black flex items-center justify-center text-[10px] text-white font-black shadow-lg">
                     ME
                   </div>
                   
                   <button
                    onClick={() => navigate(`/projects/${task.project_id}/tasks`)}
                    className="flex items-center gap-2 text-[10px] font-black text-red-600 hover:tracking-widest transition-all uppercase"
                  >
                    DEPLOY TO PROJECT <ExternalLink className="w-3 h-3" />
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