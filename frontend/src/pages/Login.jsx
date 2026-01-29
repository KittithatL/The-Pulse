import React from "react";
import rocket from "../assets/react.svg"; // ถ้ามีไอคอนอื่นก็เปลี่ยนได้

export default function Login() {
  return (
    <div className="min-h-screen w-full">
      {/* 1 คอลัมน์บนมือถือ, 2 คอลัมน์บนจอใหญ่ */}
      <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
        {/* LEFT (White) - ต้องกินครึ่งจอ */}
        <section className="relative flex w-full items-center justify-center bg-[#F3F4F6] px-6 py-10 lg:px-16">
          <div className="w-full max-w-[520px]">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E84B4B] text-white shadow-sm">
                <span className="text-xl font-bold">P</span>
              </div>
              <div>
                <div className="text-[28px] font-semibold leading-none text-[#111827]">
                  The Pulse
                </div>
                <div className="mt-1 text-[11px] tracking-[0.2em] text-[#6B7280]">
                  SMARTER PROJECT DNA
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="mt-10 text-[clamp(28px,3vw,40px)] font-semibold leading-tight text-[#111827]">
              Login to The Pulse
            </h1>
            <p className="mt-2 text-[clamp(14px,1.2vw,16px)] text-[#6B7280]">
              Measure the heartbeat of your projects.
            </p>

            {/* Form */}
            <div className="mt-8 space-y-5">
              <div>
                <label className="text-[12px] font-semibold tracking-widest text-[#6B7280]">
                  EMAIL ADDRESS
                </label>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
                  <span className="text-[#9CA3AF]">✉️</span>
                  <input
                    type="email"
                    placeholder="jira.pulse@nexus.com"
                    className="w-full bg-transparent text-[15px] text-[#111827] outline-none placeholder:text-[#9CA3AF]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-semibold tracking-widest text-[#6B7280]">
                    SECURITY PIN
                  </label>
                  <button className="text-[12px] font-semibold text-[#E84B4B] hover:underline">
                    FORGOT PIN?
                  </button>
                </div>

                <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
                  <span className="text-[#9CA3AF]">🔒</span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-transparent text-[15px] text-[#111827] outline-none placeholder:text-[#9CA3AF]"
                  />
                </div>
              </div>

              <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#E84B4B] py-4 text-[16px] font-semibold text-white shadow-[0_10px_30px_rgba(232,75,75,0.35)] hover:brightness-105 active:brightness-95">
                <span>🔒</span>
                Initialize Session
              </button>

              <p className="text-center text-[13px] text-[#6B7280]">
                No system access?{" "}
                <button className="font-semibold text-[#E84B4B] hover:underline">
                  Sign up
                </button>
              </p>
            </div>
          </div>
        </section>

        {/* RIGHT (Dark) - ต้องกินครึ่งจอ */}
        <section className="relative flex w-full items-center justify-center bg-[#0B0F14] px-6 py-10 lg:px-16">
          <div className="w-full max-w-[560px]">
            {/* Icon block */}
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#141A22] shadow-sm">
                <img src={rocket} alt="icon" className="h-8 w-8 opacity-90" />
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1FD16A] text-[12px] font-bold text-white">
                ✓
              </div>
            </div>

            <h2 className="text-[clamp(34px,3.2vw,56px)] font-extrabold leading-[1.05] text-white">
              Measure the heartbeat of your{" "}
              <span className="text-[#E84B4B] underline decoration-[#E84B4B] decoration-[6px] underline-offset-[10px]">
                Projects.
              </span>
            </h2>

            <p className="mt-6 max-w-[520px] text-[clamp(14px,1.2vw,16px)] leading-relaxed text-[#C7CBD1]">
              The high-fidelity SaaS dashboard for teams that value transparency,
              ROT, and team pulse.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}