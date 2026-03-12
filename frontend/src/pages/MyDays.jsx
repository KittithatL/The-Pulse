import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, AlertTriangle, Users, Rocket, 
  ChevronRight, Zap, ShieldCheck, Activity, Brain, Target,
  X, Clock, Flag, ArrowRight, UserCheck, UserX, ChevronDown,
  Layers, AlertCircle, Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardAPI, taskAPI } from '../services/api';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────
   MODAL: Critical Path
───────────────────────────────────────── */
const CriticalPathModal = ({ tasks = [], onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-[#0F1219] rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500/20 rounded-xl flex items-center justify-center">
            <ShieldCheck size={16} className="text-green-400" />
          </div>
          <div>
            <p className="text-[9px] font-black tracking-[0.25em] text-gray-500 uppercase">Mission Critical</p>
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Critical Path</h2>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X size={16} className="text-gray-400" />
        </button>
      </div>

      {/* Task List */}
      <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto scrollbar-hide">
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="text-green-500/40 mx-auto mb-3" size={40} />
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">No Critical Threats</p>
          </div>
        ) : tasks.map((task, i) => (
          <div key={task.id || i} className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-5 transition-all group">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                  i === 0 ? 'bg-red-500/20' : 'bg-amber-500/20'
                }`}>
                  <Flag size={12} className={i === 0 ? 'text-red-400' : 'text-amber-400'} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">{task.title}</p>
                  {task.project_name && (
                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-bold">
                      PRJ // {task.project_name}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                {task.due_date && (
                  <div className="flex items-center gap-1 text-[10px] text-red-400 font-bold">
                    <Clock size={10} />
                    <span>{format(new Date(task.due_date), 'MMM dd')}</span>
                  </div>
                )}
                <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${
                  i === 0 ? 'text-red-400' : 'text-amber-400'
                }`}>
                  {i === 0 ? 'IMMEDIATE' : 'HIGH'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-8 py-5 border-t border-white/10">
        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center">
          {tasks.length} items on critical path
        </p>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────
   MODAL: Pairing Required
───────────────────────────────────────── */
const PairingModal = ({ requests = [], onClose, onAccept, onDecline }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-[#0F1219] rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <Users size={16} className="text-blue-400" />
          </div>
          <div>
            <p className="text-[9px] font-black tracking-[0.25em] text-gray-500 uppercase">Collaboration</p>
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Pairing Requests</h2>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X size={16} className="text-gray-400" />
        </button>
      </div>

      <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto scrollbar-hide">
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <Users className="text-blue-500/30 mx-auto mb-3" size={40} />
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">No Pending Requests</p>
          </div>
        ) : requests.map((req, i) => (
          <div key={req.id || i} className="bg-white/5 border border-white/10 rounded-2xl p-5">
            {/* User info */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-black text-sm shadow-lg">
                {(req.user || 'U')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{req.user || 'Unknown'}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                  {req.node || req.project_name || 'Unspecified Node'}
                </p>
              </div>
              <div className="ml-auto">
                <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wider ${
                  req.weight === 'High' || req.weight === 'critical'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {req.weight || 'Normal'}
                </span>
              </div>
            </div>

            {req.message && (
              <p className="text-xs text-gray-400 italic leading-relaxed mb-4 border-l-2 border-blue-500/40 pl-3">
                "{req.message}"
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => onAccept?.(req)}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl transition-all"
              >
                <UserCheck size={14} /> Accept
              </button>
              <button
                onClick={() => onDecline?.(req)}
                className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl transition-all"
              >
                <UserX size={14} /> Decline
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="px-8 py-5 border-t border-white/10">
        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center">
          {requests.length} pairing request{requests.length !== 1 ? 's' : ''} pending
        </p>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────
   MAIN: MyDays
───────────────────────────────────────── */
const MyDays = () => {
  const { user } = useAuth();
  const [myTasks, setMyTasks] = useState([]);
  const [briefingData, setBriefingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false); // Guard against double-calls

  // Modal states
  const [showCriticalModal, setShowCriticalModal] = useState(false);
  const [showPairingModal, setShowPairingModal] = useState(false);
  const [pairingRequests, setPairingRequests] = useState([]);

  const fetchMyDayData = async () => {
    if (isFetching) return; // Stop if a request is already in flight
    
    try {
      setIsFetching(true);
      // We only show the full-screen loader on the FIRST load
      if (!briefingData) setLoading(true); 

      const [tasksRes, briefingRes] = await Promise.all([
        taskAPI.getMyTasks(),
        dashboardAPI.getMyDayBriefing()
      ]);

      if (tasksRes.data?.success) {
        setMyTasks(tasksRes.data.data.tasks || []);
      }
      
      if (briefingRes.data?.success) {
        setBriefingData(briefingRes.data.data);
        setPairingRequests(briefingRes.data.data?.pairing_requests || []);
      }
    } catch (err) {
      console.error("Mission Briefing Failed:", err);
      // Only toast on hard failure, not 429s handled by backend
      if (err.response?.status === 500) {
        toast.error("UPLINK ERROR: Tactical synchronization failed");
      }
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  // ✅ FIXED: Only re-run if the specific ID changes, not the whole user object
  useEffect(() => {
    if (user?.id) {
      fetchMyDayData();
    }
  }, [user?.id]); 

  const handleToggleTask = async (taskId) => {
    try {
      // Optimistic Update: Remove from UI immediately
      setMyTasks(prev => prev.filter(t => t.id !== taskId));
      
      await taskAPI.updateTaskStatus(taskId, 'done');
      toast.success("OBJECTIVE SECURED", { icon: '🚀' });

      // Refresh briefing in background without full-page loading
      const briefingRes = await dashboardAPI.getMyDayBriefing();
      if (briefingRes.data.success) setBriefingData(briefingRes.data.data);
    } catch (err) {
      toast.error("ACTION FAILED: Could not sync status");
      fetchMyDayData(); // Rollback/Refetch on error
    }
  };

  // ─── Pairing handlers ───
  const handleAcceptPairing = async (req) => {
    try {
      if (dashboardAPI.acceptPairingRequest) {
        await dashboardAPI.acceptPairingRequest(req.id);
      }
      setPairingRequests(prev => prev.filter(r => r.id !== req.id));
      toast.success(`PAIRING ACCEPTED: ${req.user}`, {
        icon: '🤝',
        style: { background: '#0F1219', color: '#fff', border: '1px solid #3B82F6' }
      });
      if (pairingRequests.length <= 1) setShowPairingModal(false);
    } catch (err) {
      toast.error("Failed to accept pairing request");
    }
  };

  const handleDeclinePairing = async (req) => {
    try {
      if (dashboardAPI.declinePairingRequest) {
        await dashboardAPI.declinePairingRequest(req.id);
      }
      setPairingRequests(prev => prev.filter(r => r.id !== req.id));
      toast.success(`Request declined`);
      if (pairingRequests.length <= 1) setShowPairingModal(false);
    } catch (err) {
      toast.error("Failed to decline pairing request");
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-[#F1F3F5]">
      <Activity className="animate-pulse text-primary mb-4" size={48} />
      <p className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-400">Synchronizing Mission Data...</p>
    </div>
  );

  const criticalTasks = briefingData?.critical_tasks || [];
  const systemOk = briefingData?.system_integrity === "100%";

  return (
    <>
      <div className="flex-1 min-h-screen bg-[#F1F3F5] p-8 font-sans">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* ── BANNER ── */}
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
            <div className="absolute right-12 top-1/2 -translate-y-1/2 bg-white/5 border border-white/10 backdrop-blur-md rounded-full px-6 py-3 flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full animate-ping ${systemOk ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div className="text-right">
                <p className="text-[8px] font-black text-gray-500 uppercase leading-none">Pulse Status</p>
                <p className="text-sm font-black uppercase tracking-tighter">
                  {systemOk ? "Optimal" : "Active Risks"}
                </p>
              </div>
            </div>
          </div>

          {/* ── TOP CARDS ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Critical Path Card */}
            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 flex flex-col justify-between h-80 transition-transform hover:scale-[1.02]">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="text-green-500" size={24} />
                  </div>
                  {criticalTasks.length > 0 && (
                    <span className="bg-red-50 text-red-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                      {criticalTasks.length} Active
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-3">Critical Path Focus</h3>

                {/* Preview list — up to 2 items */}
                {criticalTasks.length > 0 ? (
                  <div className="space-y-2">
                    {criticalTasks.slice(0, 2).map((t, i) => (
                      <div key={t.id || i} className="flex items-start gap-2">
                        <Flag size={10} className={`mt-1 shrink-0 ${i === 0 ? 'text-red-500' : 'text-amber-400'}`} />
                        <p className="text-sm text-gray-600 font-semibold leading-tight line-clamp-1">{t.title}</p>
                      </div>
                    ))}
                    {criticalTasks.length > 2 && (
                      <p className="text-[10px] text-gray-400 font-bold pl-4">+{criticalTasks.length - 2} more</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm font-medium leading-relaxed">
                    No immediate threats detected. All sectors nominal.
                  </p>
                )}
              </div>

              <button
                onClick={() => setShowCriticalModal(true)}
                className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all w-fit"
              >
                View Roadmap <ChevronRight size={14} />
              </button>
            </div>

            {/* Pairing Required Card */}
            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 flex flex-col justify-between h-80 transition-transform hover:scale-[1.02]">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                    <Users className="text-blue-500" size={24} />
                  </div>
                  {pairingRequests.length > 0 && (
                    <span className="bg-blue-50 text-blue-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">
                      {pairingRequests.length} Pending
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-3">Pairing Required</h3>

                {pairingRequests.length > 0 ? (
                  <div className="space-y-3">
                    {pairingRequests.slice(0, 2).map((req, i) => (
                      <div key={req.id || i} className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-2.5">
                        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-black text-xs shrink-0">
                          {(req.user || 'U')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-800 leading-none">{req.user}</p>
                          <p className="text-[10px] text-gray-400 font-medium truncate mt-0.5">{req.node || req.project_name}</p>
                        </div>
                        <span className={`ml-auto text-[9px] font-black px-2 py-0.5 rounded-full uppercase shrink-0 ${
                          req.weight === 'High' || req.weight === 'critical'
                            ? 'bg-red-100 text-red-500'
                            : 'bg-blue-100 text-blue-500'
                        }`}>
                          {req.weight}
                        </span>
                      </div>
                    ))}
                    {pairingRequests.length > 2 && (
                      <p className="text-[10px] text-gray-400 font-bold pl-1">+{pairingRequests.length - 2} more requests</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm font-medium leading-relaxed">
                    No active pairing requests in the current sector.
                  </p>
                )}
              </div>

              <button
                onClick={() => setShowPairingModal(true)}
                className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all w-fit"
              >
                {pairingRequests.length > 0 ? 'Review Requests' : 'Start Pairing'} <ChevronRight size={14} />
              </button>
            </div>

            {/* Blocking Risks + Gemini Insight */}
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
                  <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">AI Insight</span>
                </div>
                <div className="border-l-2 border-primary pl-4">
                  <p className="text-xs font-medium italic leading-relaxed text-gray-300">
                    "{briefingData?.gemini_insight || 'Standby for tactical analysis...'}"
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── ACTIVE DUTY ROSTER ── */}
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

      {/* ── MODALS ── */}
      {showCriticalModal && (
        <CriticalPathModal
          tasks={criticalTasks}
          onClose={() => setShowCriticalModal(false)}
        />
      )}

      {showPairingModal && (
        <PairingModal
          requests={pairingRequests}
          onClose={() => setShowPairingModal(false)}
          onAccept={handleAcceptPairing}
          onDecline={handleDeclinePairing}
        />
      )}
    </>
  );
};

export default MyDays;