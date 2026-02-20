import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, Calendar, ExternalLink, AlertTriangle, Target } from 'lucide-react';
import { taskAPI } from '../services/api';
import toast from 'react-hot-toast';
import { format, isBefore, isToday, startOfDay } from 'date-fns';
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
      console.log("RAW DATA FROM API:", response.data.data.tasks);
      if (response.data?.data?.tasks) {
        setTasks(response.data.data.tasks);
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      toast.error("COMMUNICATION ERROR: Unable to reach base.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Logic การแบ่งกลุ่มแบบใหม่: แม่นยำและรองรับความผิดพลาดของ String
  const groupedTasks = useMemo(() => {
    const now = startOfDay(new Date());
    
    // 1. กรองขั้นต้นด้วย Search และ Tab Filter
    const filtered = tasks.filter(t => {
      const s = String(t.status || '').toLowerCase().trim(); // เพิ่ม normalize
      const matchStatus = filterStatus === 'all' || s === filterStatus;
      return matchStatus;
    });

    // 2. แยกกลุ่มโดยใช้สถานะที่ Normalize แล้ว
    const groups = {
      overdue: [],
      today: [],
      active: [],
      completed: []
    };

    filtered.forEach(t => {
      const s = String(t.status || '').toLowerCase().trim();
      
      if (s === 'done') {
        groups.completed.push(t);
      } else {
        const deadlineDate = t.deadline ? new Date(t.deadline) : null;
        
        if (deadlineDate && isBefore(deadlineDate, now)) {
          groups.overdue.push(t);
        } else if (deadlineDate && isToday(deadlineDate)) {
          groups.today.push(t);
        } else {
          groups.active.push(t);
        }
      }
    });

    return groups;
  }, [tasks, searchQuery, filterStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium italic">SCANNING SECTORS...</p>
        </div>
      </div>
    );
  }

  // Helper Component สำหรับแสดง Card
  const TaskCard = ({ task, variant = 'default' }) => {
    const currentStatus = String(task.status || '').toLowerCase().trim();
    
    return (
      <div className={`bg-white rounded-2xl shadow-md border-l-4 overflow-hidden hover:shadow-xl transition-all group ${
        variant === 'danger' ? 'border-red-500' : 
        variant === 'warning' ? 'border-orange-500' : 
        variant === 'success' ? 'border-green-500' : 'border-gray-200'
      }`}>
        <div className="bg-gray-900 text-white px-4 py-1.5 text-[10px] font-black flex justify-between items-center tracking-widest">
          <span className="truncate mr-2 uppercase">PRJ // {task.project_title}</span>
          <span className={`px-2 py-0.5 rounded ${
            currentStatus === 'done' ? 'bg-green-600' : 
            currentStatus === 'doing' ? 'bg-blue-600' : 'bg-gray-600'
          }`}>
            {currentStatus.toUpperCase()}
          </span>
        </div>

        <div className="p-5">
          <h3 className="text-lg font-black text-gray-800 mb-2 leading-tight group-hover:text-primary transition-colors line-clamp-1">
            {task.title}
          </h3>
          <p className="text-xs text-gray-500 italic mb-4 line-clamp-2 h-8">
            {task.description || 'No briefing provided.'}
          </p>

          <div className="space-y-2 mb-4">
            <div className={`flex items-center gap-2 text-[11px] font-bold ${variant === 'danger' ? 'text-red-500' : 'text-gray-400'}`}>
              <Calendar className="w-3.5 h-3.5" />
              <span>DEADLINE: {task.deadline ? format(new Date(task.deadline), 'dd MMM yyyy') : 'OPEN'}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-50 flex justify-end">
            <button
              onClick={() => navigate(`/projects/${task.project_id}/tasks`)}
              className="flex items-center gap-1 text-[10px] font-black text-primary hover:tracking-widest transition-all"
            >
              GOTO PROJECT <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20 overflow-y-auto">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 italic tracking-tighter leading-none">COMMAND CENTER</h1>
          <p className="text-primary font-bold text-xs mt-2 tracking-[0.2em]">TACTICAL MISSION OVERVIEW</p>
        </div>

        <div className="flex bg-gray-200/50 p-1.5 rounded-2xl w-full md:w-auto backdrop-blur-sm">
          {['all', 'todo', 'doing', 'done'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-[10px] font-black transition-all ${
                filterStatus === s ? 'bg-white text-primary shadow-lg scale-105' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-12">
        {/* 1. OVERDUE SECTION */}
        {groupedTasks.overdue.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-red-500 p-2 rounded-lg text-white">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <h2 className="text-xl font-black italic text-red-600 tracking-tight">CRITICAL: OVERDUE</h2>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-red-100 to-transparent"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedTasks.overdue.map(t => <TaskCard key={t.id} task={t} variant="danger" />)}
            </div>
          </section>
        )}

        {/* 2. TODAY SECTION */}
        {groupedTasks.today.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-orange-500 p-2 rounded-lg text-white">
                <Clock className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black italic text-orange-600 tracking-tight">DUE WITHIN 24H</h2>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-orange-100 to-transparent"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedTasks.today.map(t => <TaskCard key={t.id} task={t} variant="warning" />)}
            </div>
          </section>
        )}

        {/* 3. ACTIVE MISSIONS */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gray-800 p-2 rounded-lg text-white">
              <Target className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black italic text-gray-800 tracking-tight">ACTIVE MISSIONS</h2>
            <div className="h-[2px] flex-1 bg-gradient-to-r from-gray-100 to-transparent"></div>
          </div>
          {groupedTasks.active.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedTasks.active.map(t => <TaskCard key={t.id} task={t} />)}
            </div>
          ) : (
            filterStatus !== 'done' && (
              <div className="py-12 border-2 border-dashed border-gray-200 rounded-3xl text-center">
                <p className="text-gray-400 font-bold italic">NO PENDING MISSIONS IN THIS SECTOR</p>
              </div>
            )
          )}
        </section>

        {/* 4. COMPLETED SECTION */}
        {groupedTasks.completed.length > 0 && (
          <section className="opacity-80 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-500 p-2 rounded-lg text-white">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black italic text-green-600 tracking-tight">MISSION ACCOMPLISHED</h2>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-green-100 to-transparent"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedTasks.completed.map(t => <TaskCard key={t.id} task={t} variant="success" />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default MyTasks;