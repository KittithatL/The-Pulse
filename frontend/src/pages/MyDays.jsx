import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, AlertTriangle, Users, Rocket, 
  ChevronRight, Zap, ShieldCheck, Activity, Brain, Target
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardAPI, taskAPI } from '../services/api';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const MyDays = () => {
  const { user } = useAuth();
  const [myTasks, setMyTasks] = useState([]);
  const [briefingData, setBriefingData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ ฟังก์ชันดึงข้อมูลทั้งหมด
  const fetchMyDayData = async () => {
    try {
      setLoading(true);
      // ดึงงาน และข้อมูลสรุปพร้อมกันเพื่อความรวดเร็ว
      const [tasksRes, briefingRes] = await Promise.all([
        taskAPI.getMyTasks(),
        dashboardAPI.getMyDayBriefing()
      ]);

      setMyTasks(tasksRes.data?.data?.tasks || []);
      
      if (briefingRes.data.success) {
        setBriefingData(briefingRes.data.data);
      }
    } catch (err) {
      console.error("Mission Briefing Failed:", err);
      toast.error("UPLINK ERROR: Failed to synchronize tactical data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyDayData();
  }, [user]);

  // ✅ ฟังก์ชันจัดการเมื่อกดติ๊กถูกงาน (Complete Task)
  const handleToggleTask = async (taskId) => {
    try {
      await taskAPI.updateTaskStatus(taskId, 'done');
      // ลบงานออกจาก List ทันทีเพื่อความสะใจ (Real-time Feel)
      setMyTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success("OBJECTIVE SECURED", {
        icon: '🚀',
        style: { background: '#0F1219', color: '#fff', border: '1px solid #EF4444' }
      });
      // ดึงข้อมูล Briefing ใหม่เพราะสถานะระบบอาจเปลี่ยน
      const briefingRes = await dashboardAPI.getMyDayBriefing();
      if (briefingRes.data.success) setBriefingData(briefingRes.data.data);
    } catch (err) {
      toast.error("ACTION FAILED: Unable to update task status");
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-[#F1F3F5]">
      <Activity className="animate-pulse text-primary mb-4" size={48} />
      <p className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-400">Synchronizing Mission Data...</p>
    </div>
  );

  return (
    <div className="flex-1 min-h-screen bg-[#F1F3F5] p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- Top Banner: MISSION CONTROL CENTER --- */}
        <div className="bg-[#0F1219] rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 opacity-80">
              <Rocket size={18} className="text-primary" />
              <span className="text-[10px] font-black tracking-[0.2em] uppercase">Mission Control Center</span>
            </div>
            <h1 className="text-7xl font-black tracking-tighter uppercase mb-2">My Day</h1>
            <p className="text-gray-400 font-bold tracking-tight">
              {format(new Date(), 'EEEE, MMMM dd')}
            </p>
          </div>
          
          {/* Pulse Status Indicator */}
          <div className="absolute right-12 top-1/2 -translate-y-1/2 bg-white/5 border border-white/10 backdrop-blur-md rounded-full px-6 py-3 flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full animate-ping ${briefingData?.system_integrity === "100%" ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div className="text-right">
              <p className="text-[8px] font-black text-gray-500 uppercase leading-none">Pulse Status</p>
              <p className="text-sm font-black uppercase tracking-tighter">
                {briefingData?.system_integrity === "100%" ? "Optimal" : "Active Risks"}
              </p>
            </div>
          </div>
        </div>

        {/* --- Top Cards Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Critical Path Card */}
          <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 flex flex-col justify-between h-80 transition-transform hover:scale-[1.02]">
            <div>
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="text-green-500" size={24} />
              </div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4">Critical Path Focus</h3>
              <p className="text-gray-400 text-sm font-medium leading-relaxed">
                You have <span className="text-black font-bold">{briefingData?.critical_tasks?.length || 0} items</span> on the critical path. 
                {briefingData?.critical_tasks?.[0] ? ` Immediate priority: ${briefingData.critical_tasks[0].title}` : ' No immediate threats detected.'}
              </p>
            </div>
            <button className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all w-fit">
              View Roadmap <ChevronRight size={14} />
            </button>
          </div>

          {/* Pairing Required Card */}
          <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 flex flex-col justify-between h-80 transition-transform hover:scale-[1.02]">
            <div>
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <Users className="text-blue-500" size={24} />
              </div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4">Pairing Required</h3>
              <p className="text-gray-400 text-sm font-medium leading-relaxed">
                {briefingData?.pairing_requests?.[0] ? (
                  <>
                    <span className="text-black font-bold">{briefingData.pairing_requests[0].user}</span> requested assistance on {briefingData.pairing_requests[0].node}. 
                    Impact: <span className="text-black font-bold">{briefingData.pairing_requests[0].weight}</span>.
                  </>
                ) : (
                  "No active pairing requests in the current sector."
                )}
              </p>
            </div>
            <button className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all w-fit">
              Start Pairing <ChevronRight size={14} />
            </button>
          </div>

          {/* Blocking Risks / Gemini Insight Stack */}
          <div className="space-y-6">
            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 relative overflow-hidden group h-[140px] flex flex-col justify-center">
              <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2">Blocking Risks</h3>
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <AlertTriangle size={100} />
              </div>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                System Integrity: {briefingData?.system_integrity || '0%'}
              </p>
            </div>

            <div className="bg-[#0F1219] rounded-[40px] p-8 text-white relative min-h-[140px]">
              <div className="flex items-center gap-2 mb-4">
                <Brain size={14} className="text-primary" />
                <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">Gemini Insight</span>
              </div>
              <div className="border-l-2 border-primary pl-4">
                <p className="text-xs font-medium italic leading-relaxed text-gray-300">
                  "{briefingData?.gemini_insight || 'Standby for tactical analysis...'}"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- Active Duty Roster (Tasks) --- */}
        <div className="pt-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Zap className="text-primary animate-pulse" />
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">Active Duty Roster</h2>
            </div>
            <div className="bg-[#0F1219] text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
              {myTasks.length} Commitments
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 pb-20">
            {myTasks.length > 0 ? myTasks.map((task) => (
              <div key={task.id} className="bg-white/80 backdrop-blur-md p-6 rounded-[30px] border border-gray-100 flex items-center justify-between group hover:bg-white transition-all shadow-sm">
                <div className="flex items-center gap-6">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      onChange={() => handleToggleTask(task.id)}
                      className="appearance-none w-8 h-8 rounded-full border-2 border-gray-200 checked:bg-primary checked:border-primary transition-all cursor-pointer hover:border-primary/50" 
                    />
                    <CheckCircle2 className="absolute text-white opacity-0 pointer-events-none transition-opacity peer-checked:opacity-100" size={16} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black tracking-tight uppercase group-hover:text-primary transition-colors">{task.title}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">PRJ // {task.project_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                   <div className="text-right">
                     <p className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Priority</p>
                     <p className={`text-xs font-black uppercase ${task.priority === 'critical' ? 'text-red-500' : 'text-gray-800'}`}>
                        {task.priority || 'Normal'}
                     </p>
                   </div>
                   <Link to={`/projects/${task.project_id}/tasks`}>
                      <div className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ChevronRight className="text-gray-300 group-hover:text-primary transition-all" />
                      </div>
                   </Link>
                </div>
              </div>
            )) : (
              <div className="text-center py-20 bg-white/50 rounded-[40px] border border-dashed border-gray-300 animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Target className="text-gray-300" size={32} />
                </div>
                <p className="text-gray-400 font-bold uppercase tracking-widest italic">All sectors clear. No active commitments found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyDays;