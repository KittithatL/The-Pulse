// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function Dashboard() {
  // เริ่มต้น Loading เป็น true เพื่อรอการดึงข้อมูล
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [aiBriefing, setAiBriefing] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState(null);

  // ✅ ตั้งค่าเริ่มต้นเป็น 0 ทั้งหมด (เลิกจำลอง 15)
  const [stats, setStats] = useState({
    learningCapacity: 0, 
    cycle: 1,
    satisfactionScore: 0,
    criticalNodes: 0,
    activeRisks: 0,
    businessValue: 0,
    burnoutRisk: false
  });

  // --- ส่วนดึงข้อมูลจาก Backend (Real API) ---
  useEffect(() => {
    const API_URL = "http://localhost:8000/api/dashboard/summary"; 

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // ยิง Request ไปที่ Backend จริง
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Failed to connect to backend");
        }

        const data = await response.json();

        // อัปเดตข้อมูลจริงจากฐานข้อมูล
        setStats({
            learningCapacity: data.learningCapacity || 0,
            cycle: data.cycle || 1,
            satisfactionScore: data.satisfactionScore || 0,
            burnoutRisk: data.burnoutRisk || false,
            criticalNodes: data.criticalNodes || 0,
            activeRisks: data.activeRisks || 0,
            businessValue: data.businessValue || 0
        });
        
        setAiBriefing(data.aiSummary || "No briefing available.");

        // Set Emoji ตามค่าที่บันทึกไว้ (ถ้ามี)
        if (data.satisfactionScore > 0) {
             if (data.satisfactionScore < 2.0) setSelectedEmoji('sad');
             else if (data.satisfactionScore < 3.5) setSelectedEmoji('neutral');
             else setSelectedEmoji('happy');
        } else {
             setSelectedEmoji(null);
        }
        
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(true); // เกิดข้อผิดพลาด (เช่น ไม่ได้เปิด Backend)
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // --- ฟังก์ชันกดปุ่ม (Frontend Interaction) ---
  const handleCheckIn = (mood) => {
    // 1. กดซ้ำเพื่อยกเลิก
    if (selectedEmoji === mood) {
        setSelectedEmoji(null);
        setStats(prev => ({
            ...prev,
            satisfactionScore: 0,
            burnoutRisk: false
        }));
        return; 
    }

    // 2. กดปุ่มใหม่
    setSelectedEmoji(mood);
    
    let newScore = 0;
    let isBurnout = false;

    if (mood === 'sad') {
        newScore = 1.7;  
        isBurnout = true;
    } else if (mood === 'neutral') {
        newScore = 2.2;  
        isBurnout = true;
    } else if (mood === 'happy') {
        newScore = 3.5;  
        isBurnout = false;
    }

    setStats(prev => ({
        ...prev,
        satisfactionScore: newScore,
        burnoutRisk: isBurnout
    }));
    
    // (Optional) ตรงนี้สามารถเพิ่ม fetch POST เพื่อส่งค่ากลับไปบันทึกที่ Backend ได้
  };

  // Helper เลือกสี
  const getProgressBarColor = () => {
      if (!selectedEmoji) return "bg-gray-200"; 
      if (selectedEmoji === 'happy') return "bg-[#22C55E]"; 
      return "bg-[#FF2B2B]"; 
  };

  const getScoreColor = () => {
      if (!selectedEmoji) return "text-gray-300"; 
      if (selectedEmoji === 'happy') return "text-[#22C55E]";
      return "text-[#FF2B2B]";
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FC] font-sans text-[#0B1221]">
      <Sidebar 
        cycle={stats.cycle} 
        progress={stats.learningCapacity} // ใช้ learningCapacity เป็น progress bar ของ sidebar
      />

      <div className="flex-1 flex flex-col ml-72">
        <Topbar />

        <main className="px-10 pb-10 space-y-6">
          
          {/* --- PAGE HEADER --- */}
          <div className="flex items-end justify-between mb-2">
              <h1 className="text-3xl font-black tracking-tight uppercase">Dashboard</h1>
              
              <div className="flex gap-3">
                  {/* ปุ่มด้านบน: แสดง Learning Capacity */}
                  <button className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wide hover:bg-blue-100 transition shadow-sm border border-blue-100">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                      Learning Capacity: {loading || error ? "-" : `${stats.learningCapacity}%`}
                  </button>
                  <button className="bg-white text-gray-500 px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border border-gray-200 shadow-sm hover:text-gray-800 transition">
                      Cycle {stats.cycle}
                  </button>
              </div>
          </div>

          {/* --- MAIN CARDS SECTION --- */}
          <div className="grid grid-cols-12 gap-6">
            
            {/* 1. GEMINI AI BRIEFING CARD */}
            <div className="col-span-12 lg:col-span-8 bg-[#0B1221] rounded-[32px] p-10 text-white relative overflow-hidden shadow-2xl flex flex-col min-h-[360px]">
                
                <div className="relative z-10 flex items-center gap-6 mb-4 flex-shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-[#240101] border border-[#FF2B2B]/20 flex items-center justify-center text-[#FF2B2B] shadow-[0_0_25px_rgba(255,43,43,0.1)]">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7zM9 21h6" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-black tracking-widest uppercase">Gemini AI Briefing</h3>
                </div>

                <div className="relative z-10 flex-1 min-h-0"> 
                    {loading ? (
                        <div className="animate-pulse space-y-4 pr-16 mt-2">
                            <div className="h-4 bg-gray-700/50 rounded w-full"></div>
                            <div className="h-4 bg-gray-700/50 rounded w-11/12"></div>
                            <div className="h-4 bg-gray-700/50 rounded w-4/5"></div>
                            <p className="text-gray-500 text-sm mt-4">Connecting to AI Engine...</p>
                        </div>
                    ) : error ? (
                        <div className="pr-16 mt-2">
                             <p className="text-gray-400 italic text-lg py-1 font-serif">
                                "Waiting for connection to AI Backend System..."
                             </p>
                             <p className="text-xs text-gray-600 mt-2 font-bold uppercase tracking-wide">
                                System offline or unreachable.
                             </p>
                        </div>
                    ) : (
                        <div className="h-[180px] overflow-y-auto pr-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            <p className="text-gray-300 leading-relaxed text-lg font-medium italic pr-4 font-serif tracking-wide opacity-90 animate-fade-in whitespace-pre-line">
                                "{aiBriefing}"
                            </p>
                        </div>
                    )}
                </div>

                <div className="absolute -top-20 -right-20 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]"></div>
            </div>

            {/* 2. CHECK-IN CARD */}
            <div className="col-span-12 lg:col-span-4 bg-white rounded-[32px] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-white flex flex-col justify-between relative">
                
                <button className={`absolute top-8 right-8 ${!selectedEmoji ? "text-gray-300" : getScoreColor()} hover:scale-110 transition-transform z-10`}>
                     <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </button>

                <div className="bg-[#F8F9FC] rounded-[32px] p-6 mb-4 flex flex-col items-center justify-center w-full mt-10">
                   
                   <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6 text-center">
                       Check-In (Daily)
                   </h4>
                   
                   <div className="flex items-center justify-center gap-4 w-full">
                        {/* SAD */}
                        <button 
                            onClick={() => handleCheckIn('sad')}
                            className={`w-14 h-14 rounded-lg flex items-center justify-center text-3xl shadow-sm border transition-all duration-300
                                ${selectedEmoji === 'sad' 
                                    ? "bg-[#FF0000] text-white border-[#FF0000] shadow-red-200 scale-105"
                                    : "bg-white text-gray-300 border-gray-50 hover:border-gray-200 hover:text-gray-400"
                                }`}
                        >
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </button>

                        {/* NEUTRAL */}
                        <button 
                            onClick={() => handleCheckIn('neutral')}
                            className={`w-14 h-14 rounded-lg flex items-center justify-center text-3xl shadow-sm border transition-all duration-300
                                ${selectedEmoji === 'neutral' 
                                    ? "bg-[#E68A2E] text-white border-[#E68A2E] shadow-orange-200 scale-105"
                                    : "bg-white text-gray-300 border-gray-50 hover:border-gray-200 hover:text-gray-400"
                                }`}
                        >
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </button>

                        {/* HAPPY */}
                        <button 
                            onClick={() => handleCheckIn('happy')}
                            className={`w-14 h-14 rounded-lg flex items-center justify-center text-3xl shadow-sm border transition-all duration-300
                                ${selectedEmoji === 'happy' 
                                    ? "bg-[#22C55E] text-white border-[#22C55E] shadow-green-200 scale-105"
                                    : "bg-white text-gray-300 border-gray-50 hover:border-gray-200 hover:text-gray-400"
                                }`}
                        >
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </button>
                   </div>
                </div>

                <div className="space-y-4 mt-2">
                    <div className="flex justify-between items-end px-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Satisfaction Score</span>
                        <span className={`text-xl font-black ${getScoreColor()}`}>
                            {loading || error || !selectedEmoji ? "--" : `${stats.satisfactionScore}/5`}
                        </span>
                    </div>
                    
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div 
                            className={`h-2 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-all duration-1000 ease-out ${getProgressBarColor()}`}
                            style={{ width: (loading || error || !selectedEmoji) ? '0%' : `${(stats.satisfactionScore / 5) * 100}%` }}
                        ></div>
                    </div>

                    {selectedEmoji && stats.burnoutRisk && !loading && !error && (
                        <div className="mt-4 py-3 px-4 bg-[#FFF5F5] rounded-xl flex items-center gap-3 text-[#FF2B2B] border border-red-50 animate-pulse-slow">
                            <div className="p-1 rounded bg-white border border-[#FF2B2B]/20">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Burn Out Risk Detected</span>
                        </div>
                    )}
                </div>
            </div>
          </div>

         {/* --- BOTTOM STATS CARDS --- */}
         <div className="grid grid-cols-4 gap-6">
            
            {/* 1. CRITICAL NODES */}
            <div className="bg-white rounded-[32px] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between border border-white min-h-[240px]">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#FFF6F0] text-[#FF8A48] flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                    <div>
                        <p className="text-[12px] text-[#94A3B8] font-bold uppercase tracking-[0.15em] leading-tight">CRITICAL NODES</p>
                        <p className="text-[12px] text-[#94A3B8] font-bold uppercase tracking-[0.15em]">BUS FACTOR</p>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    {/* ✅ ปรับความบางของขีดผ่านเงื่อนไข */}
                    <p className={`text-7xl ${loading || error ? "font-light" : "font-black"} text-[#0B1221] tracking-tighter`}>
                        {loading || error ? "-" : stats.criticalNodes}
                    </p>
                </div>
            </div>
            
            {/* 2. ALLOCATION */}
            <div className="bg-white rounded-[32px] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between border border-white min-h-[240px]">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#F0F6FF] text-[#4891FF] flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    </div>
                    <div>
                        <p className="text-[12px] text-[#94A3B8] font-bold uppercase tracking-[0.15em] leading-tight">ALLOCATION</p>
                        <p className="text-[12px] text-[#94A3B8] font-bold uppercase tracking-[0.15em]">LEARNING CAPACITY</p>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <p className={`text-7xl ${loading || error ? "font-light" : "font-black"} text-[#0B1221] tracking-tighter`}>
                        {loading || error ? "-" : `${stats.learningCapacity}%`}
                    </p>
                </div>
            </div>

            {/* 3. 4 HIGH IMPACT */}
            <div className="bg-white rounded-[32px] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between border border-white min-h-[240px]">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#FFF0F0] text-[#FF2B2B] flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <div>
                        <p className="text-[12px] text-[#94A3B8] font-bold uppercase tracking-[0.15em] leading-tight">4 HIGH IMPACT</p>
                        <p className="text-[12px] text-[#94A3B8] font-bold uppercase tracking-[0.15em]">ACTIVE RISKS</p>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <p className={`text-7xl ${loading || error ? "font-light" : "font-black"} text-[#0B1221] tracking-tighter`}>
                        {loading || error ? "-" : stats.activeRisks}
                    </p>
                </div>
            </div>
            
            {/* 4. ROI PROGRESS */}
            <div className="bg-white rounded-[32px] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between border border-white min-h-[240px]">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#F0FFF6] text-[#00C46B] flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                    </div>
                    <div>
                        <p className="text-[12px] text-[#94A3B8] font-bold uppercase tracking-[0.15em] leading-tight">ROI PROGRESS</p>
                        <p className="text-[12px] text-[#94A3B8] font-bold uppercase tracking-[0.15em]">BUSINESS VALUE</p>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <p className={`text-7xl ${loading || error ? "font-light" : "font-black"} text-[#0B1221] tracking-tighter`}>
                        {loading || error ? "-" : `${stats.businessValue}%`}
                    </p>
                </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}