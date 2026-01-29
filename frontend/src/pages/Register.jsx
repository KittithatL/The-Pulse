// src/pages/Register.jsx
import RegisterForm from "../components/RegisterForm";
import rocketImg from "../assets/rocket.png"; // <--- 1. เพิ่มบรรทัดนี้ (เช็ค path ให้ถูกนะครับ)

export default function Register() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 font-sans">
      
      {/* LEFT PANEL */}
      <div className="flex items-center justify-center bg-white p-6 lg:p-12 relative z-10">
        <RegisterForm />
      </div>

      {/* RIGHT PANEL */}
      <div className="hidden lg:flex flex-col justify-center items-center px-12 relative overflow-hidden bg-[#0B1221]">
        
        {/* Background Gradient Spot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[100px] pointer-events-none"></div>

        {/* CONTENT WRAPPER */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
          
          {/* ROCKET ICON GRAPHIC */}
          <div className="relative mb-12">
            {/* Dark Card Container (กล่องสี่เหลี่ยมขอบมน สีดำ) */}
            <div className="w-[120px] h-[120px] bg-[#1E2330] rounded-[28px] shadow-2xl flex items-center justify-center border border-white/5">
                
                {/* --- 2. แก้ตรงนี้: เอารูป PNG มาใส่แทน SVG --- */}
                <img 
                  src={rocketImg} 
                  alt="Rocket Pulse" 
                  className="w-[70px] h-[70px] object-contain" 
                />

            </div>

            {/* Shield Check Badge (โล่ติ๊กถูกสีเขียว - คงเดิม) */}
            <div className="absolute -top-3 -right-3 w-10 h-10 bg-[#00C46B] rounded-xl flex items-center justify-center shadow-lg border-2 border-[#0B1221]">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-5xl font-extrabold text-white leading-[1.15] mb-6">
            Measure the<br/>
            heartbeat of your<br/>
            {/* Projects with red underline style */}
            <span className="relative inline-block mt-1">
              <span className="relative z-10 text-[#FF2B2B]">Projects.</span>
              <span className="absolute left-0 bottom-1 w-full h-[3px] bg-[#FF2B2B] rounded-full"></span>
            </span>
          </h2>

          {/* Description */}
          <p className="text-slate-400 text-lg leading-relaxed max-w-md mx-auto">
            The high-fidelity SaaS dashboard for teams that value transparency, ROT, and team pulse.
          </p>

        </div>
      </div>
    </div>
  );
}