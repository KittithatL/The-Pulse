import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import rocketImg from "../assets/Group 35.png";
import logoPImg from "../assets/Group 36.png";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    emailOrUsername: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(form);

    if (result.success) {
      navigate("/projects");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="mx-auto grid min-h-screen w-full max-w-[1400px] grid-cols-1 lg:grid-cols-2">

        {/* ================= LEFT : FORM ================= */}
        <div className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">

            {/* Brand */}
            <div className="mb-10 flex items-center gap-4">
              <img
                src={logoPImg}
                alt="The Pulse Logo"
                className="w-[105px] h-[105px] object-contain"
              />

              <div className="pt-1">
                <div className="text-4xl font-extrabold italic tracking-tight text-black">
                  The Pulse
                </div>
                <div className="mt-1 text-xs font-extrabold tracking-[0.22em] text-slate-400">
                  SMARTER PROJECT DNA
                </div>
              </div>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-black sm:text-5xl">
              Login to The Pulse
            </h1>
            <p className="mt-2 text-base font-semibold text-slate-400">
              Measure the heartbeat of your projects.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">

              {/* Email / Username */}
              <div>
                <label className="text-sm font-extrabold tracking-[0.18em] text-slate-400">
                  EMAIL OR USERNAME
                </label>

                <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-100">
                    <svg viewBox="0 0 24 24" className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 6h16v12H4z" />
                      <path d="m22 6-10 7L2 6" />
                    </svg>
                  </div>

                  <input
                    type="text"
                    name="emailOrUsername"
                    value={form.emailOrUsername}
                    onChange={handleChange}
                    placeholder="jira.pulse@nexus.com"
                    required
                    className="w-full bg-transparent text-lg font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-extrabold tracking-[0.18em] text-slate-400">
                    PASSWORD
                  </label>

                  <button
                    type="button"
                    className="text-xs font-extrabold tracking-[0.18em] text-red-600 hover:opacity-80"
                  >
                    FORGOT PASSWORD?
                  </button>
                </div>

                <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-100">
                    <svg viewBox="0 0 24 24" className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M7 11V8a5 5 0 0 1 10 0v3" />
                      <path d="M6 11h12v10H6z" />
                    </svg>
                  </div>

                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="w-full bg-transparent text-lg font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-3 rounded-full bg-red-600 py-5 text-xl font-extrabold text-white shadow-[0_18px_40px_rgba(255,0,0,0.35)] hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Initialize Session"}
              </button>

              {/* Sign up */}
              <div className="pt-2 text-center text-sm font-semibold text-slate-400">
                No system access?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="font-extrabold text-red-600 hover:opacity-80"
                >
                  Sign up
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ================= RIGHT : HERO ================= */}
        <div className="relative hidden items-center justify-center overflow-hidden bg-[#070D18] lg:flex">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B1426] via-[#070D18] to-[#060A12]" />

          <div className="relative flex w-full max-w-xl flex-col items-center px-10 text-center">
            <div className="relative mb-10">
              <img
                src={rocketImg}
                alt="Rocket"
                className="w-[203px] h-[208px] object-contain"
              />
            </div>

            <h2 className="text-6xl font-extrabold leading-[1.05] tracking-tight text-white">
              Measure the <br /> heartbeat of your
            </h2>

            <div className="mt-6 text-6xl font-extrabold tracking-tight">
              <span className="text-red-600">Projects</span>
              <span className="text-white">.</span>
              <div className="mx-auto mt-2 h-[3px] w-44 bg-red-600" />
            </div>

            <p className="mt-10 max-w-md text-base font-semibold text-slate-400">
              The high-fidelity SaaS dashboard for teams that value transparency,
              ROT, and team pulse.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
