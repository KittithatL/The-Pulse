import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function SecuritySettings() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState("idle");
  const [qrData, setQrData] = useState(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [showDisable, setShowDisable] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(user?.twofa_enabled || false);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [qrImageUrl, setQrImageUrl] = useState("");

  useEffect(() => {
    setTwoFAEnabled(user?.twofa_enabled || false);
  }, [user]);

  useEffect(() => {
    authAPI.getLoginHistory()
      .then(r => setLogs(r.data.data.logs || []))
      .catch(() => {})
      .finally(() => setLogsLoading(false));
  }, []);

  useEffect(() => {
    if (qrData?.otpauth_url) {
      const encoded = encodeURIComponent(qrData.otpauth_url);
      setQrImageUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`);
    }
  }, [qrData]);

  const handleSetup2FA = async () => {
    setStep("loading");
    try {
      const res = await authAPI.setup2FA();
      setQrData(res.data.data);
      setStep("qr");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to setup 2FA");
      setStep("idle");
    }
  };

  const handleVerify = async () => {
    if (verifyCode.length !== 6) { toast.error("Enter the 6-digit code"); return; }
    try {
      await authAPI.verify2FA(verifyCode);
      await refreshUser();
      setTwoFAEnabled(true);
      setStep("done");
      toast.success("2FA enabled successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid code");
    }
  };

  const handleDisable = async () => {
    if (!disablePassword) { toast.error("Enter your password"); return; }
    try {
      await authAPI.disable2FA(disablePassword);
      await refreshUser();
      setTwoFAEnabled(false);
      setShowDisable(false);
      setDisablePassword("");
      setStep("idle");
      toast.success("2FA disabled");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid password");
    }
  };

  const statusColor = {
    SUCCESS: "#22c55e", success: "#22c55e",
    FAILED: "#ef4444", failed: "#ef4444",
    failed_wrong_password: "#f59e0b",
    failed_2fa: "#f59e0b",
    BLOCKED: "#ef4444", blocked: "#ef4444",
    failed_user_not_found: "#6b7280"
  };

  const statusLabel = {
    SUCCESS: "✓ Success", success: "✓ Success",
    FAILED: "✗ Failed", failed: "✗ Failed",
    failed_wrong_password: "✗ Wrong Password",
    failed_2fa: "✗ Wrong 2FA Code",
    BLOCKED: "🔒 Blocked", blocked: "🔒 Blocked",
    failed_user_not_found: "✗ User Not Found"
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Bangkok"
    });
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 24px", color: "#0f172a" }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 13, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>
          ← BACK
        </button>
        <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5 }}>Security Settings</div>
        <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>Manage your authentication and account protection</div>
      </div>

      {/* 2FA SECTION */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 28, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Two-Factor Authentication (2FA)</div>
            <div style={{ color: "#64748b", fontSize: 13 }}>Add an extra layer of security using Google Authenticator or Microsoft Authenticator.</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: twoFAEnabled ? "#22c55e" : "#94a3b8" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: twoFAEnabled ? "#22c55e" : "#94a3b8" }}>
              {twoFAEnabled ? "ENABLED" : "DISABLED"}
            </span>
          </div>
        </div>

        {step === "idle" && !twoFAEnabled && (
          <button onClick={handleSetup2FA}
            style={{ background: "#0f172a", border: "none", borderRadius: 10, padding: "12px 24px", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", letterSpacing: 0.5 }}>
            🔐 Enable 2FA
          </button>
        )}

        {step === "loading" && (
          <div style={{ color: "#94a3b8", fontSize: 13 }}>Setting up...</div>
        )}

        {step === "qr" && qrData && (
          <div>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: "#64748b", marginBottom: 12 }}>STEP 1 — SCAN QR CODE</div>
              <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ background: "#fff", padding: 12, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                  {qrImageUrl
                    ? <img src={qrImageUrl} alt="QR Code" width={180} height={180} style={{ display: "block" }} />
                    : <div style={{ width: 180, height: 180, background: "#f1f5f9", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 12 }}>Loading QR...</div>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ color: "#475569", fontSize: 13, lineHeight: 1.6, margin: "0 0 12px" }}>
                    Open <b>Google Authenticator</b> or <b>Microsoft Authenticator</b> and scan this QR code.
                  </p>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6, fontWeight: 700 }}>OR ENTER SECRET MANUALLY:</div>
                  <div style={{ background: "#1e293b", color: "#e2e8f0", padding: "8px 14px", borderRadius: 8, fontFamily: "monospace", fontSize: 13, letterSpacing: 2, wordBreak: "break-all" }}>
                    {qrData.secret}
                  </div>
                  <button onClick={() => { navigator.clipboard?.writeText(qrData.secret); toast.success("Secret copied!"); }}
                    style={{ marginTop: 8, background: "none", border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 12px", fontSize: 11, color: "#64748b", cursor: "pointer", fontWeight: 600 }}>
                    Copy Secret
                  </button>
                </div>
              </div>
            </div>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: "#64748b", marginBottom: 12 }}>STEP 2 — VERIFY CODE</div>
              <p style={{ color: "#475569", fontSize: 13, margin: "0 0 12px" }}>Enter the 6-digit code shown in your authenticator app to confirm setup.</p>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input
                  value={verifyCode}
                  onChange={e => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={e => e.key === "Enter" && handleVerify()}
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  style={{ width: 140, padding: "12px 16px", border: "2px solid #e2e8f0", borderRadius: 10, fontSize: 22, fontWeight: 800, letterSpacing: "0.3em", textAlign: "center", outline: "none", color: "#0f172a" }}
                />
                <button onClick={handleVerify}
                  style={{ background: "#ef4444", border: "none", borderRadius: 10, padding: "12px 24px", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
                  Verify & Activate
                </button>
                <button onClick={() => { setStep("idle"); setQrData(null); setVerifyCode(""); }}
                  style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#94a3b8", cursor: "pointer", fontWeight: 600 }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {(step === "done" || (step === "idle" && twoFAEnabled)) && (
          <div>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <div>
                <div style={{ fontWeight: 700, color: "#15803d", fontSize: 14 }}>2FA is active</div>
                <div style={{ color: "#16a34a", fontSize: 12 }}>Your account is protected with two-factor authentication.</div>
              </div>
            </div>

            {showDisable ? (
              <div style={{ background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", marginBottom: 8 }}>⚠ Disable 2FA</div>
                <p style={{ color: "#7f1d1d", fontSize: 12, margin: "0 0 12px" }}>Enter your password to confirm. This will remove 2FA protection from your account.</p>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input type="password" value={disablePassword} onChange={e => setDisablePassword(e.target.value)}
                    placeholder="Your password"
                    style={{ flex: 1, padding: "10px 14px", border: "1.5px solid #fca5a5", borderRadius: 8, fontSize: 14, outline: "none" }} />
                  <button onClick={handleDisable}
                    style={{ background: "#ef4444", border: "none", borderRadius: 8, padding: "10px 20px", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
                    Disable
                  </button>
                  <button onClick={() => { setShowDisable(false); setDisablePassword(""); }}
                    style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 16px", fontSize: 13, color: "#94a3b8", cursor: "pointer", fontWeight: 600 }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowDisable(true)}
                style={{ background: "none", border: "1px solid #fca5a5", borderRadius: 8, padding: "8px 18px", color: "#ef4444", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                Disable 2FA
              </button>
            )}
          </div>
        )}
      </div>

      {/* LOGIN HISTORY */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 28 }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Login History</div>
        <div style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>Recent sign-in activity for your account.</div>

        {logsLoading ? (
          <div style={{ color: "#94a3b8", fontSize: 13, padding: "20px 0" }}>Loading...</div>
        ) : logs.length === 0 ? (
          <div style={{ color: "#94a3b8", fontSize: 13, padding: "20px 0", textAlign: "center" }}>No login history yet</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {logs.map((log, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor[log.status] || "#94a3b8", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: statusColor[log.status] || "#64748b" }}>
                      {statusLabel[log.status] || log.status}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                      IP: {log.ip_address || "unknown"}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "right" }}>
                  {formatDate(log.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}