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
            
            <div className="bg-white rounded-[32px] p-7 shadow-[0_2px_20px_rgba(0,0,0,0.02)] flex flex-col gap-2 group hover:shadow-lg transition border border-white">
                <div className="w-11 h-11 rounded-2xl bg-[#FFF6F0] text-[#FF8A48] flex items-center justify-center mb-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">CRITICAL NODES</p>
                <p className="text-3xl font-black text-[#0B1221]">{loading || error ? "-" : stats.criticalNodes}</p>
                <p className="text-[10px] text-[#FF8A48] font-bold uppercase tracking-wide mt-1">RISK FACTOR</p>
            </div>
            
            {/* การ์ด Learning Capacity: เชื่อมกับ stats.learningCapacity */}
            <div className="bg-white rounded-[32px] p-7 shadow-[0_2px_20px_rgba(0,0,0,0.02)] flex flex-col gap-2 group hover:shadow-lg transition border border-white">
                <div className="w-11 h-11 rounded-2xl bg-[#F0F6FF] text-[#4891FF] flex items-center justify-center mb-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">ALLOCATION</p>
                <p className="text-lg font-bold text-[#0B1221] leading-tight">Learning Capacity</p>
                <p className="text-3xl font-black text-[#0B1221] mt-auto">
                    {loading || error ? "-" : `${stats.learningCapacity}%`}
                </p>
                <p className="text-[#4891FF] text-[10px] font-bold uppercase tracking-wide mt-1">OPTIMIZED</p>
            </div>

            <div className="bg-white rounded-[32px] p-7 shadow-[0_2px_20px_rgba(0,0,0,0.02)] flex flex-col gap-2 group hover:shadow-lg transition border border-white">
                 <div className="w-11 h-11 rounded-2xl bg-[#FFF0F0] text-[#FF2B2B] flex items-center justify-center mb-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">4 HIGH IMPACT</p>
                <p className="text-lg font-bold text-[#0B1221] leading-tight">Active Risks</p>
                <p className="text-3xl font-black text-[#0B1221] mt-auto">{loading || error ? "-" : stats.activeRisks}</p>
            </div>
            
            <div className="bg-white rounded-[32px] p-7 shadow-[0_2px_20px_rgba(0,0,0,0.02)] flex flex-col gap-2 group hover:shadow-lg transition border border-white">
                <div className="w-11 h-11 rounded-2xl bg-[#F0FFF6] text-[#00C46B] flex items-center justify-center mb-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">ROI PROGRESS</p>
                <p className="text-lg font-bold text-[#0B1221] leading-tight">Business Value</p>
                <p className="text-3xl font-black text-[#0B1221] mt-auto">{loading || error ? "-" : `${stats.businessValue}%`}</p>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}