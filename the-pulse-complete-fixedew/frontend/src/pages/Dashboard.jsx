import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dashboardAPI, projectAPI } from "../services/api";
import { 
  Activity, TrendingUp, CheckCircle2, AlertTriangle, 
  Cpu, Calendar, CloudLightning, ShieldAlert, 
  Server, Zap, RefreshCw, BarChart3, RotateCcw, HardDrive
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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [submittingMood, setSubmittingMood] = useState(false);

  // --- Sync Data Function ---
  const syncCommandCenter = useCallback(async (targetId, isRefresh = false) => {
    if (!targetId) return;
    
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [overviewRes, infraRes, risksRes] = await Promise.all([
        dashboardAPI.getOverview(targetId),
        dashboardAPI.getInfrastructure(targetId),
        dashboardAPI.getRisks(targetId)
      ]);

      if (overviewRes.data.success) setData(overviewRes.data.data);
      if (infraRes.data.success) setInfra(infraRes.data.data.components || []);
      if (risksRes.data.success) setRisks(risksRes.data.data.alerts || []);
      
      setError(null);
      if (isRefresh) toast.success("SYSTEM STATUS UPDATED");

    } catch (err) {
      console.error("Sync Failure:", err);
      setError("COMMUNICATION ERROR: Unable to fetch system metrics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // --- Init ---
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
            setError("NO PROJECTS FOUND. CREATE A NEW MISSION.");
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

  // --- Handle Mood ---
  const handleMoodSubmit = async (score) => {
    if (submittingMood || !projectId) return;
    setSubmittingMood(true);
    try {
      await dashboardAPI.submitMood(projectId, { sentiment_score: score });
      toast.success("MOOD LOGGED");
      syncCommandCenter(projectId, false);
    } catch (err) {
      toast.error("Failed to log mood");
    } finally {
      setSubmittingMood(false);
    }
  };

  // --- UI Helpers ---
  const getInfraUnit = (name) => {
    if (name.includes('RAM')) return 'MB';
    if (name.includes('Uptime')) return 'HRS';
    return 'ms';
  };

  const getInfraIcon = (name) => {
    if (name.includes('Database')) return <HardDrive className="w-4 h-4 text-blue-500" />;
    if (name.includes('RAM')) return <Cpu className="w-4 h-4 text-purple-500" />;
    return <Server className="w-4 h-4 text-gray-500" />;
  };

  const getRiskStyles = (level) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'bg-emerald-50 border-emerald-100 text-emerald-600';
      case 'medium': return 'bg-amber-50 border-amber-100 text-amber-600';
      case 'high': return 'bg-orange-50 border-orange-200 text-orange-600';
      case 'critical': return 'bg-red-600 border-red-700 text-white animate-pulse shadow-red-200';
      default: return 'bg-slate-50 border-slate-100 text-slate-400';
    }
  };

  const getMoodEmoji = (score) => {
    const emojis = { 1: '💀', 2: '😩', 3: '😐', 4: '😊', 5: '🔥' };
    return emojis[score] || '😐';
  };

  // --- Render ---
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
      <RefreshCw className="w-12 h-12 text-red-600 animate-spin" />
      <p className="font-black italic text-slate-400 animate-pulse uppercase tracking-[0.5em] text-xs">Syncing System...</p>
    </div>
  );
  if (error) return (
    <div className="p-10 text-center flex flex-col items-center justify-center h-[80vh]">
      <div className="bg-red-50 border-4 border-red-100 p-12 rounded-[4rem] shadow-2xl max-w-lg">
        <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-6" />
        <h2 className="text-4xl font-black text-red-600 uppercase mb-4 tracking-tighter italic">System Failure</h2>
        <p className="text-slate-500 font-bold mb-10 text-xs tracking-widest leading-loose uppercase">{message}</p>
        <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-12 py-4 rounded-2xl font-black uppercase hover:bg-red-700 transition-all shadow-lg shadow-red-200">Re-init Link</button>
      </div>
    </div>
  );
  if (!data) return <div />; 

  const { project, ai_briefing, completion, team_mood, efficiency, risk_level, learning_capacity } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-black p-2.5 rounded-xl text-white shadow-lg shadow-gray-200">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase text-slate-900 leading-none">
              {project?.name || "UNK_PROJECT"}
            </h1>
          </div>
          <p className="text-slate-400 font-black text-[10px] tracking-[0.4em] uppercase pl-1">
            SYSTEM STATUS: <span className="text-green-500 underline decoration-2 underline-offset-4">ONLINE</span>
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm min-w-[120px]">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Calendar className="w-3 h-3" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">DEADLINE</span>
            </div>
            <p className="text-sm font-black uppercase text-slate-900">
              {learning_capacity?.due_date ? new Date(learning_capacity.due_date).toLocaleDateString('en-GB') : 'NO DATE'}
            </p>
          </div>
          <button 
            onClick={() => syncCommandCenter(projectId, true)}
            disabled={refreshing}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-black transition-all group"
            title="Check System Health"
          >
            <RotateCcw className={`w-5 h-5 text-slate-400 group-hover:text-black ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Row 1: AI & Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group border border-slate-800">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <CloudLightning className="w-4 h-4 text-yellow-400 animate-pulse" />
              <h3 className="text-yellow-400 font-black text-xs tracking-widest uppercase">AI SYSTEM ANALYSIS</h3>
            </div>
            <p className="text-2xl md:text-3xl font-medium leading-tight italic text-slate-200 font-serif">
              "{ai_briefing || 'Analyzing system parameters...'}"
            </p>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-5 text-[15rem] font-black italic uppercase select-none pointer-events-none">AI</div>
        </div>

        <div className={`rounded-[2.5rem] p-10 border-4 shadow-xl flex flex-col justify-center items-center text-center transition-all duration-500 ${getRiskStyles(risk_level)}`}>
          <ShieldAlert className="w-16 h-16 mb-4 opacity-50" />
          <h3 className="font-black text-xs tracking-widest uppercase mb-2 opacity-70">RISK LEVEL</h3>
          <p className="text-5xl font-black uppercase tracking-tighter italic">{risk_level || 'LOW'}</p>
        </div>
      </div>

      {/* Row 2: KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all group overflow-hidden relative">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-6 group-hover:bg-black group-hover:text-white transition-all duration-300">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-slate-400 font-black text-[10px] tracking-widest uppercase mb-1">COMPLETION</p>
            <p className="text-5xl font-black text-slate-900 tracking-tighter mb-2">{completion?.percentage || 0}%</p>
            <p className="text-[10px] font-bold text-slate-400 italic uppercase bg-slate-50 inline-block px-2 py-1 rounded-md">{completion?.completed_tasks}/{completion?.total_tasks} TASKS</p>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all group overflow-hidden relative">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-6 group-hover:bg-black group-hover:text-white transition-all duration-300">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-slate-400 font-black text-[10px] tracking-widest uppercase mb-1">EFFICIENCY</p>
            <p className="text-5xl font-black text-slate-900 tracking-tighter mb-2">{efficiency?.percentage || 0}%</p>
            <p className="text-[10px] font-bold text-slate-400 italic uppercase bg-slate-50 inline-block px-2 py-1 rounded-md">BASED ON VELOCITY</p>
          </div>
        </div>
        
        {/* Team Mood */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl flex flex-col items-center justify-center space-y-6 hover:border-black transition-all group">
          <p className="text-slate-400 font-black text-[10px] tracking-widest uppercase group-hover:text-black transition-colors">TEAM MORALE</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(score => (
              <button key={score} onClick={() => handleMoodSubmit(score)} className="text-2xl hover:scale-125 transition-all p-2 bg-slate-50 rounded-xl hover:bg-slate-200 grayscale hover:grayscale-0">
                {getMoodEmoji(score)}
              </button>
            ))}
          </div>
          <div className="text-center pt-4 border-t border-slate-100 w-full">
            <p className="text-4xl font-black text-slate-900">{team_mood?.score || "0.0"}<span className="text-lg text-slate-300">/5</span></p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{team_mood?.total_responses || 0} VOTES LOGGED</p>
          </div>
        </div>
      </div>

      {/* Row 3: System Health & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* System Health List */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-slate-900" />
              <h3 className="font-black italic uppercase tracking-tighter text-2xl">SYSTEM HEALTH</h3>
            </div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span><span className="text-[10px] font-black text-slate-400 uppercase">LIVE</span></div>
          </div>
          <div className="space-y-3">
            {infra.length > 0 ? infra.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full shadow-sm ${item.status === 'online' ? 'bg-green-500 shadow-green-200' : 'bg-red-500 shadow-red-200'}`} />
                  <div>
                    <div className="flex items-center gap-2">{getInfraIcon(item.component_name)}<p className="font-bold text-slate-800 uppercase text-xs tracking-wide">{item.component_name}</p></div>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5 ml-6">CHECKED: {new Date(item.updated_at || Date.now()).toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className="text-right"><span className="font-mono text-sm font-black text-slate-700">{item.latency} <span className="text-[10px] text-slate-400">{getInfraUnit(item.component_name)}</span></span></div>
              </div>
            )) : <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl"><p className="text-slate-400 italic text-sm">NO METRICS AVAILABLE</p></div>}
          </div>
        </div>

        {/* Alerts List */}
        <div className="bg-slate-50 rounded-[2.5rem] p-8 md:p-10 border border-slate-200">
          <div className="flex items-center gap-3 mb-8 text-red-600">
            <ShieldAlert className="w-6 h-6" />
            <h3 className="font-black italic uppercase tracking-tighter text-2xl">ACTIVE ALERTS</h3>
          </div>
          <div className="space-y-3">
            {risks.length > 0 ? risks.map((risk, idx) => (
              <div key={idx} className="bg-white p-5 rounded-3xl shadow-sm border-l-4 border-red-500 flex justify-between items-start gap-4 hover:translate-x-1 transition-transform">
                <div>
                  <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-3 h-3 text-red-500" /><p className="font-black text-[10px] uppercase text-red-500 tracking-wider">{risk.severity}</p></div>
                  <p className="font-bold text-slate-800 text-sm leading-tight">{risk.message}</p>
                </div>
                <span className="text-[9px] font-black text-slate-300 uppercase shrink-0 pt-1">{new Date(risk.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            )) : <div className="text-center py-10"><CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2 opacity-20" /><p className="text-slate-400 italic text-sm">ALL SYSTEMS NOMINAL</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;