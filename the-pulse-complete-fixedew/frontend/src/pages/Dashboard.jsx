import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dashboardAPI, projectAPI } from "../services/api";
import { 
  Activity, TrendingUp, CheckCircle2, AlertTriangle, 
  Cpu, Calendar, CloudLightning, ShieldAlert, 
  Server, Zap, RefreshCw, BarChart3
} from "lucide-react";
import toast from "react-hot-toast";

const Dashboard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  // --- States ---
  const [data, setData] = useState(null);
  const [infra, setInfra] = useState([]);
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingMood, setSubmittingMood] = useState(false);

  // --- Sync Data Function ---
  const syncCommandCenter = useCallback(async (targetId) => {
    if (!targetId) return;
    setLoading(true);
    try {
      // ยิงพร้อมกัน 3 ท่อเพื่อให้ข้อมูลแน่น!
      const [overviewRes, infraRes, risksRes] = await Promise.all([
        dashboardAPI.getOverview(targetId),
        dashboardAPI.getInfrastructure(targetId),
        dashboardAPI.getRisks(targetId)
      ]);

      setData(overviewRes.data.data);
      setInfra(infraRes.data.data.components || []);
      setRisks(risksRes.data.data.alerts || []);
      setError(null);
    } catch (err) {
      console.error("Critical Sync Failure:", err);
      setError(err.response?.data?.message || "COMMUNICATION LOST: Check Backend Uplink.");
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
          if (res.data.data?.length > 0) {
            navigate(`/dashboard/${res.data.data[0].id}`, { replace: true });
          } else {
            setError("NO PROJECTS DETECTED. SYSTEM HALTED.");
            setLoading(false);
          }
        } catch (err) {
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
      await dashboardAPI.submitMood(projectId, { sentiment_score: score });
      toast.success("SENTIMENT SYNCED");
      syncCommandCenter(projectId);
    } catch (err) {
      toast.error("TRANSMISSION FAILED");
    } finally {
      setSubmittingMood(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const { project, ai_briefing, completion, team_mood, efficiency, risk_level, learning_capacity } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 🚀 Header: Tactical ID */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-xl text-white shadow-lg shadow-red-200">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <h1 className="text-6xl font-black italic tracking-tighter uppercase text-slate-900 leading-none">
              {project?.name}
            </h1>
          </div>
          <p className="text-slate-400 font-black text-[10px] tracking-[0.4em] uppercase">
            Operational Status: <span className="text-green-500 underline">Active_Uplink</span>
          </p>
        </div>
        
        <div className="flex gap-4">
          <HeaderBadge label="Deadline" value={learning_capacity?.due_date ? new Date(learning_capacity.due_date).toLocaleDateString() : 'N/A'} icon={<Calendar />} />
          <HeaderBadge label="Capacity" value={`${learning_capacity?.percentage}%`} icon={<BarChart3 />} color="text-blue-600" />
        </div>
      </div>

      {/* 🤖 Row 1: AI Analysis & Risk Sentinel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group border border-slate-800">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <CloudLightning className="w-4 h-4 text-red-500 animate-pulse" />
              <h3 className="text-red-500 font-black text-xs tracking-widest uppercase">AI Tactical Briefing</h3>
            </div>
            <p className="text-3xl font-medium leading-tight italic text-slate-200">
              "{ai_briefing || 'Initializing neural analysis...'}"
            </p>
          </div>
          <div className="absolute -right-20 -bottom-20 opacity-5 text-[25rem] font-black italic uppercase select-none">AI</div>
        </div>

        <div className={`rounded-[3rem] p-10 border-4 shadow-2xl flex flex-col justify-center items-center text-center transition-all duration-500 ${getRiskStyles(risk_level)}`}>
          <ShieldAlert className="w-16 h-16 mb-4 opacity-30" />
          <h3 className="font-black text-xs tracking-widest uppercase mb-2 opacity-60">Risk Sentinel</h3>
          <p className="text-5xl font-black uppercase tracking-tighter italic">{risk_level || 'Safe'}</p>
        </div>
      </div>

      {/* 📊 Row 2: KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard label="Task Completion" value={`${completion?.percentage}%`} sub={`${completion?.completed_tasks}/${completion?.total_tasks} Tasks Finalized`} icon={<CheckCircle2 />} />
        <StatCard label="Execution Efficiency" value={`${efficiency?.percentage}%`} sub="Target: 95.0%+" icon={<TrendingUp />} />
        
        {/* Team Sentiment Display */}
        <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl flex flex-col items-center justify-center space-y-6 hover:border-red-500 transition-all">
          <p className="text-slate-400 font-black text-[10px] tracking-widest uppercase">Team Sentiment Sync</p>
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map(score => (
              <button key={score} onClick={() => handleMoodSubmit(score)} className="text-3xl hover:scale-150 transition-all p-2 bg-slate-50 rounded-2xl grayscale hover:grayscale-0">
                {getMoodEmoji(score)}
              </button>
            ))}
          </div>
          <div className="text-center pt-2 border-t w-full">
            <p className="text-4xl font-black text-slate-900">{team_mood?.score}<span className="text-lg text-slate-300">/5.0</span></p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{team_mood?.total_responses} Logs Received</p>
          </div>
        </div>
      </div>

      {/* 🛠 Row 3: Infrastructure & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Infrastructure Health (Perfect for your ESP32 Project) */}
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
                  <div className={`w-2 h-2 rounded-full ${item.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="font-bold text-slate-700 uppercase text-xs">{item.component_name}</span>
                </div>
                <span className="font-mono text-[10px] text-slate-400">LATENCY: {item.latency}ms</span>
              </div>
            )) : <p className="text-center text-slate-400 italic text-sm py-10">No hardware components linked.</p>}
          </div>
        </div>

        {/* Recent Risk Feed */}
        <div className="bg-slate-50 rounded-[3rem] p-10 border border-slate-200">
          <div className="flex items-center gap-3 mb-8 text-red-600">
            <ShieldAlert className="w-6 h-6" />
            <h3 className="font-black italic uppercase tracking-tighter text-2xl">Recent Alerts</h3>
          </div>
          <div className="space-y-4">
            {risks.length > 0 ? risks.map((risk, idx) => (
              <div key={idx} className="bg-white p-5 rounded-3xl shadow-sm border-l-4 border-red-500 flex justify-between items-start gap-4">
                <div>
                  <p className="font-black text-[10px] uppercase text-red-500 mb-1">{risk.severity} Severity</p>
                  <p className="font-bold text-slate-800 text-sm leading-tight">{risk.message}</p>
                </div>
                <span className="text-[9px] font-black text-slate-300 uppercase shrink-0">{new Date(risk.created_at).toLocaleTimeString()}</span>
              </div>
            )) : <p className="text-center text-slate-400 italic text-sm py-10">Airspace is clear. No risks detected.</p>}
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

// --- Style Helpers ---
const getRiskStyles = (level) => {
  switch (level?.toLowerCase()) {
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