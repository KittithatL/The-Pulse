import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dashboardAPI, projectAPI, taskAPI } from "../services/api";
import { 
  Activity, TrendingUp, CheckCircle2, AlertTriangle, 
  Cpu, Calendar, CloudLightning, ShieldAlert, 
  Server, Zap, RefreshCw, BarChart3, Clock, Flag,
  ChevronRight, Crosshair, Radio
} from "lucide-react";
import toast from "react-hot-toast";

const Dashboard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [infra, setInfra] = useState([]);
  const [risks, setRisks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingMood, setSubmittingMood] = useState(false);

  const syncCommandCenter = useCallback(async (targetId) => {
    if (!targetId) return;
    setLoading(true);
    try {
      const [overviewRes, infraRes, risksRes, tasksRes] = await Promise.all([
        dashboardAPI.getOverview(targetId),
        dashboardAPI.getInfrastructure(targetId),
        dashboardAPI.getRisks(targetId),
        taskAPI.getTasks(targetId)
      ]);

      setData(overviewRes.data.data);
      setInfra(infraRes.data.data.components || []);
      setRisks(risksRes.data.data.alerts || []);
      setAllTasks(tasksRes.data.data.tasks || []);
      setError(null);
    } catch (err) {
      console.error("Critical Sync Failure:", err);
      setError(err.response?.data?.message || "COMMUNICATION LOST");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      if (projectId) {
        syncCommandCenter(projectId);
      } else {
        try {
          const res = await projectAPI.getProjects();
          const projects = res.data.data?.projects || [];
          if (projects.length > 0) {
            navigate(`/dashboard/${projects[0].project_id}`, { replace: true });
          } else {
            setError("NO PROJECTS DETECTED. PLEASE CREATE ONE.");
            setLoading(false);
          }
        } catch (err) {
          console.error("Dashboard Init Error:", err);
          setError("AUTH_DATABASE_UNREACHABLE");
          setLoading(false);
        }
      }
    };
    init();
  }, [projectId, syncCommandCenter, navigate]);

  const handleMoodSubmit = async (score) => {
    if (submittingMood || !projectId) return;
    setSubmittingMood(true);
    try {
      await dashboardAPI.submitMood(projectId, score);
      toast.success("SENTIMENT SYNCED");
      const overviewRes = await dashboardAPI.getOverview(projectId);
      setData(prev => ({ ...prev, team_mood: overviewRes.data.data.team_mood }));
    } catch (err) {
      const errorMsg = err.response?.data?.message || "TRANSMISSION FAILED";
      toast.error(errorMsg);
    } finally {
      setSubmittingMood(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const { project, ai_briefing, completion, team_mood, efficiency, risk_level, learning_capacity } = data || {};

  // คำนวณ Deadline ของโปรเจกต์
  const projectDeadline = learning_capacity?.due_date ? new Date(learning_capacity.due_date) : null;
  const today = new Date();
  const daysLeft = projectDeadline
    ? Math.ceil((projectDeadline - today) / (1000 * 60 * 60 * 24))
    : null;

  // แยก tasks ตาม status สำหรับ deadline breakdown
  const taskStats = {
    todo: allTasks.filter(t => t.status === 'todo').length,
    doing: allTasks.filter(t => t.status === 'doing').length,
    done: allTasks.filter(t => t.status === 'done').length,
    total: allTasks.length,
  };

  // upcoming deadlines: tasks ที่ยังไม่ done และมี deadline
  const upcomingTasks = allTasks
    .filter(t => t.status !== 'done' && t.deadline)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 🚀 Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-xl text-white shadow-lg shadow-red-200">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase text-slate-900 leading-none">
              {project?.name || "UNKNOWN_PROJECT"}
            </h1>
          </div>
          <p className="text-slate-400 font-black text-[10px] tracking-[0.4em] uppercase">
            Operational Status: <span className="text-green-500 underline">Active_Uplink</span>
          </p>
        </div>
        
        <div className="flex gap-4">
          <HeaderBadge 
            label="Deadline" 
            value={projectDeadline ? projectDeadline.toLocaleDateString() : 'N/A'} 
            icon={<Calendar />} 
          />
          <HeaderBadge 
            label="Capacity" 
            value={`${learning_capacity?.percentage || 0}%`} 
            icon={<BarChart3 />} 
            color="text-blue-600" 
          />
        </div>
      </div>

      {/* 🤖 Row 1: AI Briefing & Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group border border-slate-800">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <CloudLightning className="w-4 h-4 text-red-500 animate-pulse" />
              <h3 className="text-red-500 font-black text-xs tracking-widest uppercase">AI Tactical Briefing</h3>
            </div>
            <p className="text-2xl md:text-3xl font-medium leading-tight italic text-slate-200">
              "{ai_briefing || 'Initializing neural analysis...'}"
            </p>
          </div>
          <div className="absolute -right-20 -bottom-20 opacity-5 text-[15rem] md:text-[25rem] font-black italic uppercase select-none pointer-events-none">AI</div>
        </div>

        <div className={`rounded-[3rem] p-10 border-4 shadow-2xl flex flex-col justify-center items-center text-center transition-all duration-500 ${getRiskStyles(risk_level)}`}>
          <ShieldAlert className="w-16 h-16 mb-4 opacity-30" />
          <h3 className="font-black text-xs tracking-widest uppercase mb-2 opacity-60">Risk Sentinel</h3>
          <p className="text-5xl font-black uppercase tracking-tighter italic">{risk_level || 'Safe'}</p>
        </div>
      </div>

      {/* 📊 Row 2: KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard 
          label="Task Completion" 
          value={`${completion?.percentage || 0}%`} 
          sub={`${completion?.completed_tasks || 0} จาก ${completion?.total_tasks || 0} งานเสร็จสมบูรณ์`} 
          icon={<CheckCircle2 />} 
        />
        <StatCard 
          label="Execution Efficiency" 
          value={`${efficiency?.percentage || 0}%`} 
          sub="Target: 95.0%+" 
          icon={<TrendingUp />} 
        />
        
        {/* Team Sentiment */}
        <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl flex flex-col items-center justify-center space-y-6 hover:border-red-500 transition-all">
          <p className="text-slate-400 font-black text-[10px] tracking-widest uppercase">Team Sentiment Sync</p>
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map(score => {
              const isVoted = team_mood?.user_voted_score === score;
              const hasVotedAny = team_mood?.user_voted_score !== null;
              return (
                <button 
                  key={score} 
                  onClick={() => handleMoodSubmit(score)} 
                  disabled={submittingMood || hasVotedAny}
                  className={`text-3xl transition-all p-2 rounded-2xl border-2 
                    ${isVoted 
                      ? 'scale-125 grayscale-0 bg-red-100 border-red-500 shadow-md' 
                      : 'grayscale bg-slate-50 border-transparent'
                    } 
                    ${!hasVotedAny && 'hover:grayscale-0 hover:scale-110 hover:border-slate-200'}
                    disabled:cursor-not-allowed active:scale-95`}
                >
                  {getMoodEmoji(score)}
                </button>
              );
            })}
          </div>
          <div className="text-center pt-2 border-t w-full">
            <p className="text-4xl font-black text-slate-900">{team_mood?.score || '0.0'}<span className="text-lg text-slate-300">/5.0</span></p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{team_mood?.total_responses || 0} Logs Received</p>
          </div>
        </div>
      </div>

      {/* 🗓 Row 3: Project Deadline Tracker (NEW) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Deadline Countdown */}
        <div className={`lg:col-span-2 rounded-[3rem] p-10 shadow-xl border-4 flex flex-col justify-between relative overflow-hidden
          ${daysLeft === null ? 'bg-slate-50 border-slate-200' :
            daysLeft < 0 ? 'bg-red-600 border-red-700 text-white' :
            daysLeft <= 7 ? 'bg-orange-50 border-orange-300' :
            daysLeft <= 30 ? 'bg-amber-50 border-amber-200' :
            'bg-slate-900 border-slate-700 text-white'
          }`}>
          <div className="flex items-center gap-2 mb-6">
            <Flag className={`w-4 h-4 ${daysLeft !== null && daysLeft >= 0 && daysLeft > 7 ? 'text-red-500' : 'opacity-60'}`} />
            <h3 className={`font-black text-xs tracking-widest uppercase ${
              daysLeft !== null && daysLeft >= 0 && daysLeft > 7 ? 'text-red-500' : 'opacity-60'
            }`}>Mission Deadline</h3>
          </div>

          <div>
            {daysLeft === null ? (
              <p className="text-5xl font-black text-slate-300 italic tracking-tighter">NO ETA SET</p>
            ) : daysLeft < 0 ? (
              <>
                <p className="text-8xl font-black tracking-tighter leading-none">{Math.abs(daysLeft)}</p>
                <p className="text-lg font-black uppercase tracking-widest opacity-70 mt-2">Days Overdue</p>
              </>
            ) : daysLeft === 0 ? (
              <>
                <p className="text-6xl font-black tracking-tighter leading-none animate-pulse">TODAY</p>
                <p className="text-sm font-black uppercase tracking-widest opacity-70 mt-2">Final Hour</p>
              </>
            ) : (
              <>
                <p className={`text-8xl font-black tracking-tighter leading-none ${daysLeft <= 7 ? 'text-orange-600' : ''}`}>{daysLeft}</p>
                <p className={`text-lg font-black uppercase tracking-widest mt-2 ${daysLeft <= 7 ? 'text-orange-500' : 'opacity-60'}`}>Days Remaining</p>
              </>
            )}
            {projectDeadline && (
              <p className={`text-[10px] font-bold uppercase tracking-widest mt-4 ${daysLeft !== null && daysLeft > 7 ? 'text-slate-400' : 'opacity-50'}`}>
                Target: {projectDeadline.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>

          {/* Task breakdown bar */}
          <div className="mt-8">
            <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-white/20">
              {taskStats.total > 0 && (
                <>
                  <div className="bg-green-400 transition-all duration-700" style={{ width: `${(taskStats.done / taskStats.total) * 100}%` }} />
                  <div className="bg-blue-400 transition-all duration-700" style={{ width: `${(taskStats.doing / taskStats.total) * 100}%` }} />
                  <div className="bg-white/30 transition-all duration-700" style={{ width: `${(taskStats.todo / taskStats.total) * 100}%` }} />
                </>
              )}
            </div>
            <div className="flex justify-between mt-2 text-[9px] font-black uppercase opacity-50 tracking-widest">
              <span>✓ {taskStats.done} Done</span>
              <span>⟳ {taskStats.doing} Active</span>
              <span>○ {taskStats.todo} Pending</span>
            </div>
          </div>

          {/* Decorative */}
          <div className="absolute -right-8 -bottom-8 opacity-5 text-[12rem] font-black italic select-none pointer-events-none">T</div>
        </div>

        {/* Upcoming Task Deadlines */}
        <div className="lg:col-span-3 bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-slate-900 p-2 rounded-xl text-white">
              <Crosshair className="w-5 h-5" />
            </div>
            <h3 className="font-black italic uppercase tracking-tighter text-2xl text-slate-900">Upcoming Targets</h3>
            <span className="ml-auto px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded-full uppercase">
              {upcomingTasks.length} Tasks
            </span>
          </div>

          <div className="space-y-3">
            {upcomingTasks.length > 0 ? upcomingTasks.map((task, idx) => {
              const taskDeadline = new Date(task.deadline);
              const taskDaysLeft = Math.ceil((taskDeadline - today) / (1000 * 60 * 60 * 24));
              const isUrgent = taskDaysLeft <= 3;
              const isWarning = taskDaysLeft <= 7;

              return (
                <div key={task.task_id || task.id || idx}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all group
                    ${isUrgent ? 'bg-red-50 border-red-200' : isWarning ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-100'}`}>
                  
                  <div className={`w-1.5 h-10 rounded-full flex-shrink-0
                    ${isUrgent ? 'bg-red-500' : isWarning ? 'bg-orange-400' : 'bg-slate-300'}`} />
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-slate-800 truncate uppercase tracking-tight">{task.title}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {task.status === 'doing' ? '⟳ In Progress' : '○ Pending'}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className={`font-black text-sm ${isUrgent ? 'text-red-600' : isWarning ? 'text-orange-500' : 'text-slate-500'}`}>
                      {taskDaysLeft < 0 ? `${Math.abs(taskDaysLeft)}d overdue` :
                       taskDaysLeft === 0 ? 'TODAY' :
                       `${taskDaysLeft}d left`}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold">
                      {taskDeadline.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>
              );
            }) : (
              <div className="py-16 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-300 mx-auto mb-4" />
                <p className="text-slate-400 font-bold italic text-sm uppercase tracking-widest">All targets neutralized.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🛠 Row 4: Infrastructure & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Infrastructure Health */}
        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Server className="w-6 h-6 text-slate-900" />
              <h3 className="font-black italic uppercase tracking-tighter text-2xl">Infrastructure</h3>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-600 text-[10px] font-black rounded-full uppercase">Operational</span>
          </div>
          <div className="space-y-4">
            {infra.length > 0 ? infra.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${item.status === 'healthy' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="font-bold text-slate-700 uppercase text-xs">{item.component_name}</span>
                </div>
                <span className="font-mono text-[10px] text-slate-400">UPTIME: {item.uptime_percentage}%</span>
              </div>
            )) : <p className="text-center text-slate-400 italic text-sm py-10">No hardware components linked.</p>}
          </div>
        </div>

        {/* Recent Alerts - IMPROVED */}
        <div className="bg-slate-900 rounded-[3rem] p-10 border border-slate-800 shadow-xl relative overflow-hidden">
          {/* Decorative pulse */}
          <div className="absolute top-8 right-8">
            <div className="relative">
              <Radio className="w-5 h-5 text-red-500" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
            </div>
          </div>

          <div className="flex items-center gap-3 mb-8">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            <h3 className="font-black italic uppercase tracking-tighter text-2xl text-white">Recent Alerts</h3>
            {risks.length > 0 && (
              <span className="ml-2 px-3 py-1 bg-red-600 text-white text-[10px] font-black rounded-full uppercase animate-pulse">
                {risks.length} Active
              </span>
            )}
          </div>

          <div className="space-y-3">
            {risks.length > 0 ? risks.map((risk, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border-l-4 flex justify-between items-start gap-4 transition-all
                ${risk.severity?.toLowerCase() === 'critical' ? 'bg-red-900/50 border-red-500' :
                  risk.severity?.toLowerCase() === 'high' ? 'bg-orange-900/30 border-orange-500' :
                  risk.severity?.toLowerCase() === 'medium' ? 'bg-yellow-900/20 border-yellow-500' :
                  'bg-slate-800 border-slate-600'
                }`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full
                      ${risk.severity?.toLowerCase() === 'critical' ? 'bg-red-500 text-white' :
                        risk.severity?.toLowerCase() === 'high' ? 'bg-orange-500 text-white' :
                        risk.severity?.toLowerCase() === 'medium' ? 'bg-yellow-500 text-black' :
                        'bg-slate-600 text-slate-300'
                      }`}>
                      {risk.severity || 'LOW'}
                    </span>
                    {risk.project_name && (
                      <span className="text-[9px] text-slate-500 font-bold uppercase truncate">{risk.project_name}</span>
                    )}
                  </div>
                  <p className="font-bold text-slate-200 text-sm leading-tight">{risk.message}</p>
                </div>
                <span className="text-[9px] font-black text-slate-500 uppercase shrink-0 mt-1">
                  {new Date(risk.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )) : (
              <div className="py-16 text-center">
                <ShieldAlert className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-600 font-bold italic text-sm uppercase tracking-widest">Airspace clear.</p>
                <p className="text-slate-700 font-bold text-[10px] uppercase tracking-widest mt-1">No threats detected.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-Components ---
const StatCard = ({ label, value, sub, icon }) => (
  <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl hover:shadow-2xl transition-all group overflow-hidden relative">
    <div className="relative z-10">
      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-8 group-hover:bg-red-600 group-hover:text-white transition-all duration-500">
        {icon}
      </div>
      <p className="text-slate-400 font-black text-[10px] tracking-widest uppercase mb-2">{label}</p>
      <p className="text-6xl font-black text-slate-900 tracking-tighter mb-2">{value}</p>
      <p className="text-[10px] font-bold text-slate-400 italic uppercase">{sub}</p>
    </div>
  </div>
);

const HeaderBadge = ({ label, value, icon, color = "text-slate-900" }) => (
  <div className="bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm min-w-[140px]">
    <div className="flex items-center gap-1 text-slate-400 mb-1">
      {React.cloneElement(icon, { className: "w-3 h-3" })}
      <span className="text-[9px] font-black uppercase tracking-[0.2em]">{label}</span>
    </div>
    <p className={`text-sm font-black uppercase ${color}`}>{value}</p>
  </div>
);

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
    <RefreshCw className="w-12 h-12 text-red-600 animate-spin" />
    <p className="font-black italic text-slate-400 animate-pulse uppercase tracking-[0.5em]">Syncing Tactical Uplink...</p>
  </div>
);

const ErrorState = ({ message }) => (
  <div className="p-10 text-center flex flex-col items-center justify-center h-[80vh]">
    <div className="bg-red-50 border-4 border-red-100 p-12 rounded-[4rem] shadow-2xl max-w-lg">
      <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-6" />
      <h2 className="text-4xl font-black text-red-600 uppercase mb-4 tracking-tighter italic">System Failure</h2>
      <p className="text-slate-500 font-bold mb-10 text-xs tracking-widest leading-loose uppercase">{message}</p>
      <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-12 py-4 rounded-2xl font-black uppercase hover:bg-red-700 transition-all shadow-lg shadow-red-200">Re-init Link</button>
    </div>
  </div>
);

const getRiskStyles = (level) => {
  if (!level) return 'bg-slate-50 border-slate-100 text-slate-400';
  switch (level.toLowerCase()) {
    case 'low': return 'bg-emerald-50 border-emerald-100 text-emerald-600';
    case 'medium': return 'bg-amber-50 border-amber-100 text-amber-600';
    case 'high': return 'bg-rose-50 border-rose-200 text-rose-600';
    case 'critical': return 'bg-red-600 border-red-700 text-white animate-pulse';
    default: return 'bg-slate-50 border-slate-100 text-slate-400';
  }
};

const getMoodEmoji = (score) => {
  const emojis = { 1: '💀', 2: '😐', 3: '😊', 4: '🔥', 5: '⚡' };
  return emojis[score] || '😐';
};

export default Dashboard;