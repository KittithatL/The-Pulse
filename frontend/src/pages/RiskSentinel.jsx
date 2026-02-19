import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldAlert, Download, Clock, CheckCircle2, AlertTriangle, FileText, Zap } from 'lucide-react';
import { dashboardAPI } from '../services/api';

const RiskSentinel = () => {
  const { projectId } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    matrixData: [],
    busFactor: { factor: 0, holders: [], message: 'Analyzing data...' },
    mitigationTasks: []
  });
  const [activeThreat, setActiveThreat] = useState(null);

  useEffect(() => {
    const fetchRiskData = async () => {
      try {
        const res = await dashboardAPI.getRiskSentinel(projectId);
        if (res.data?.success) {
          setData(res.data.data);
          // ตั้งค่าภัยคุกคามปัจจุบันเป็นจุดแรกสุด (ถ้ามี)
          if (res.data.data.matrixData.length > 0) {
            setActiveThreat(res.data.data.matrixData[0]);
          } else {
            setActiveThreat(null);
          }
        }
      } catch (err) {
        console.error("Failed to load risk data", err);
      } finally {
        setLoading(false);
      }
    };
    if (projectId) fetchRiskData();
  }, [projectId]);

  if (loading) return <div className="p-10 text-center animate-pulse font-black uppercase tracking-widest text-slate-400">Scanning Systems...</div>;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto font-sans animate-in fade-in duration-500">
      
      {/* 🚀 Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">RISK SENTINEL</h1>
          <p className="text-slate-400 font-bold text-[10px] tracking-widest uppercase mt-1">
            THREAT MATRIX & MITIGATION TRACKING
          </p>
        </div>
      </div>

      {/* 🧩 Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 📉 Left Col: Matrix */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl relative">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black italic uppercase tracking-tight text-slate-900">IMPACT VS PROBABILITY MATRIX</h2>
            <ShieldAlert className="w-5 h-5 text-red-500 opacity-50" />
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-8">HOVER POINTS TO VIEW THREATS</p>

          <div className="w-full aspect-square max-h-[450px] border-l-4 border-b-4 border-slate-900 bg-slate-50 rounded-tr-3xl relative p-4 mb-8">
            <div className="absolute -left-12 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-black tracking-widest uppercase text-slate-400">IMPACT</div>
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[10px] font-black tracking-widest uppercase text-slate-400">LIKELIHOOD</div>

            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-5 pointer-events-none rounded-tr-3xl overflow-hidden">
              <div className="bg-orange-500"></div>
              <div className="bg-red-600"></div>
              <div className="bg-green-500"></div>
              <div className="bg-yellow-400"></div>
            </div>

            {/* แสดงจุดบนกราฟจาก DATABASE ของจริง */}
            {data.matrixData.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-bold italic uppercase">
                NO ACTIVE TASKS FOUND
              </div>
            )}
            
            {data.matrixData.map((risk) => (
              <div 
                key={risk.id}
                onMouseEnter={() => setActiveThreat(risk)}
                className={`absolute w-4 h-4 rounded-full shadow-md cursor-pointer transition-all duration-300 ${activeThreat?.id === risk.id ? 'scale-150 ring-4 ring-red-200 bg-red-600 z-20' : 'bg-slate-800 hover:scale-125 z-10'}`}
                style={{ bottom: `${risk.impact}%`, left: `${risk.likelihood}%`, transform: 'translate(-50%, 50%)' }}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[150px] bg-slate-900 text-white text-[9px] font-bold p-2 rounded-lg opacity-0 hover:opacity-100 transition-opacity pointer-events-none z-30 text-center leading-tight hidden md:block">
                  {risk.name}
                </div>
              </div>
            ))}
          </div>

          {/* Active Threat Banner */}
          {activeThreat ? (
            <div className="bg-slate-900 text-white p-5 rounded-2xl flex items-center justify-between shadow-lg">
               <div>
                 <p className="text-red-500 font-black text-[9px] tracking-widest uppercase mb-1">SELECTED TASK (IMPACT:{activeThreat.impact}% / RISK:{activeThreat.likelihood}%)</p>
                 <h3 className="font-bold text-lg leading-none uppercase">{activeThreat.name}</h3>
               </div>
               <Zap className="w-8 h-8 text-yellow-500 opacity-20" />
            </div>
          ) : (
             <div className="bg-slate-50 text-slate-400 p-5 rounded-2xl flex items-center justify-center border border-slate-100">
               <p className="font-bold text-xs uppercase tracking-widest">NO THREAT SELECTED</p>
             </div>
          )}
        </div>

        {/* 📊 Right Col: Bus Factor & Mitigation */}
        <div className="space-y-8">
          
          {/* BUS FACTOR */}
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl">
            <h2 className="text-sm font-black italic uppercase tracking-tight text-slate-900 mb-6">BUS FACTOR</h2>
            <div className="flex items-center gap-6 mb-8">
              <div className={`w-20 h-20 rounded-full border-8 flex items-center justify-center shrink-0 ${data.busFactor.factor <= 1 && data.busFactor.factor !== 'N/A' ? 'border-red-100 border-t-red-600 text-red-600' : 'border-green-100 border-t-green-500 text-green-600'}`}>
                <span className="text-3xl font-black">{data.busFactor.factor}</span>
              </div>
              <div>
                <span className={`inline-block px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded mb-2 ${data.busFactor.factor <= 1 && data.busFactor.factor !== 'N/A' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {data.busFactor.factor <= 1 && data.busFactor.factor !== 'N/A' ? 'CRITICAL RISK' : 'STABLE'}
                </span>
                <p className="text-[10px] font-medium text-slate-500 leading-relaxed italic">
                  {data.busFactor.message}
                </p>
              </div>
            </div>
          </div>

          {/* MITIGATION TASKS */}
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl">
            <h2 className="text-sm font-black italic uppercase tracking-tight text-slate-900 mb-6">ACTIVE CRITICAL TASKS</h2>
            <div className="space-y-4">
              {data.mitigationTasks.length > 0 ? data.mitigationTasks.map(task => (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  {task.status.toLowerCase() === 'done' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <Clock className="w-5 h-5 text-orange-400 shrink-0 mt-0.5 animate-pulse" />
                  )}
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-900 uppercase leading-tight">{task.title}</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">OWNER: {task.assignee || 'UNASSIGNED'}</p>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-slate-400 font-bold tracking-widest uppercase text-center py-4">No critical tasks detected.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RiskSentinel;