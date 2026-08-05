import { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { jsPDF } from "jspdf";
import "./App.css";

const SYSTEM_PROMPT = `You are an oral medicine specialist AI. Analyze the patient data and output a structured report. Keep each section concise (2-3 bullets max). You MUST complete ALL 9 sections.

Format:
1. MOST LIKELY DIAGNOSIS: [Name] (Confidence: High/Moderate/Low) - one-line reason
2. DIFFERENTIAL DIAGNOSES: 2-3 alternatives with distinguishing features
3. ULCER CATEGORY: [Benign / Infectious / Autoimmune / Pre-malignant / Malignant / Systemic / Deficiency / Iatrogenic]
4. RISK LEVEL: LOW / MODERATE / HIGH / CRITICAL - one-line justification
5. URGENCY: ROUTINE / SOON / URGENT / EMERGENCY - timeframe
6. KEY FINDINGS: 3-5 significant clinical data points
7. RED FLAGS: warning signs or "None identified"
8. RECOMMENDED ACTION: home care + specialist referral if needed
9. DISCLAIMER: "This AI screening report is for informational purposes only. Consult a licensed dental or medical professional for definitive diagnosis."

Consider: Aphthous (Minor/Major/Herpetiform), Traumatic, Herpetic, Candidal, Lichen Planus, Leukoplakia, Erythroplakia, SCC, Behcet's, Nutritional Deficiency, Drug-induced. Use plain English. Complete ALL sections.`;

const API_BASE = import.meta.env.VITE_API_URL || "https://auckland-crest-reservations-chair.trycloudflare.com";

const api = async (url, method = "GET", body = null, token = null) => {
  const headers = { 
    "Content-Type": "application/json"
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const finalUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
  const res = await fetch(finalUrl, { method, headers, body: body ? JSON.stringify(body) : null });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.msg || data.error || "Request failed");
  return data;
};

const extractMeta = (text = "") => {
  const categoryMatch = text.match(/ULCER CATEGORY:\s*([^\n]+)/i);
  const category = categoryMatch ? categoryMatch[1].trim() : "Unknown";
  const risk = text.match(/RISK LEVEL:\s*([^\n]+)/i)?.[1]?.trim() || "UNKNOWN";
  const urgency = text.match(/URGENCY:\s*([^\n]+)/i)?.[1]?.trim() || "ROUTINE";
  return { category, risk, urgency };
};

const generateMedicalPDF = ({ patientName, result, imageUrl }) => {
  try {
    const doc = new jsPDF();
    const meta = extractMeta(result);
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Header Banner
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 32, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("OUDS CLINICAL DIAGNOSTIC REPORT", 14, 18);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("AI-POWERED ORAL MEDICINE SCREENING SYSTEM", 14, 26);
    doc.text(`DATE: ${dateStr}`, 150, 26);

    // Patient Info Box
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 38, 182, 28, 3, 3, "FD");

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Patient Name: ${patientName || "Anonymous"}`, 20, 48);
    doc.text(`Risk Level: ${meta.risk}`, 20, 58);

    doc.text(`Urgency Score: ${meta.urgency}`, 110, 48);
    doc.text(`Report ID: #${Math.floor(100000 + Math.random() * 900000)}`, 110, 58);

    let currentY = 76;

    // Add Uploaded Photo if present
    if (imageUrl && imageUrl.startsWith("data:")) {
      try {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(79, 70, 229);
        doc.text("PATIENT UPLOADED ULCER PHOTO:", 14, currentY);
        currentY += 6;

        const format = imageUrl.includes("image/png") ? "PNG" : "JPEG";
        doc.addImage(imageUrl, format, 14, currentY, 48, 36);
        currentY += 42;
      } catch (err) {
        console.error("PDF Image Error:", err);
      }
    }

    // Diagnostic Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(79, 70, 229);
    doc.text("AI DIAGNOSIS & CLINICAL EVALUATION:", 14, currentY);
    currentY += 8;

    // Diagnostic Content
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);

    const cleanText = result ? result.replace(/[*#]/g, '') : "No diagnostic findings.";
    const splitText = doc.splitTextToSize(cleanText, 180);

    splitText.forEach(line => {
      if (currentY > 275) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(line, 14, currentY);
      currentY += 5;
    });

    // Medical Disclaimer Footer
    if (currentY > 265) {
      doc.addPage();
      currentY = 250;
    } else {
      currentY = Math.max(currentY + 10, 260);
    }

    doc.setDrawColor(203, 213, 225);
    doc.line(14, currentY, 196, currentY);
    currentY += 6;

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("DISCLAIMER: This report is generated by an AI screening model for informational purposes only.", 14, currentY);
    doc.text("It does not replace professional clinical evaluation. Consult a licensed Dentist or Oral Surgeon for definitive diagnosis.", 14, currentY + 4);

    doc.save(`OUDS_Report_${(patientName || "Patient").replace(/\s+/g, "_")}.pdf`);
  } catch (e) {
    console.error("PDF Generation failed:", e);
    alert("Could not generate PDF. Opening print dialog instead.");
    window.print();
  }
};

// ─── Steps Definition ─────────────────────────────────────────────────────────
const STEPS = [
  { id: "profile", title: "Patient Profile", icon: "👤" },
  { id: "habits", title: "Habits and Lifestyle", icon: "🌿" },
  { id: "medical", title: "Medical History", icon: "🏥" },
  { id: "trauma", title: "Trauma Check", icon: "⚠️" },
  { id: "ulcer_history", title: "Ulcer History", icon: "📅" },
  { id: "appearance", title: "Ulcer Appearance", icon: "🔍" },
  { id: "location", title: "Location", icon: "📍" },
  { id: "symptoms", title: "Symptoms", icon: "🩺" },
  { id: "redflags", title: "Red Flags", icon: "🚨" },
  { id: "notes", title: "Additional Notes", icon: "📝" },
];

// ─── Auth Screen ──────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const saveLogin = (data) => {
    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("user", JSON.stringify(data.user));
    onLogin(data.user, data.token);
  };

  const submit = async () => {
    if (isForgot) {
      if (!email) return setError("Please enter your email");
      setLoading(true); setError("");
      try {
        const data = await api("/api/auth/forgot-password", "POST", { email });
        if (data.needOtp) { setOtpStep(true); }
        else { setError(data.msg || "Error"); }
      } catch (err) { setError(err.message || "Failed to send reset email"); }
      setLoading(false);
      return;
    }

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await api(
        isRegister ? "/api/auth/register" : "/api/auth/login",
        "POST",
        { email, password }
      );

      if (isRegister && data.needOtp) {
        setOtpStep(true);
      } else if (data.token) {
        saveLogin(data);
      } else {
        setError(data.msg || "Something went wrong");
      }
    } catch (err) {
      setError(err.message || "Server error. Please try again.");
    }

    setLoading(false);
  };

  const verifyOtp = async () => {
    if (!otp) return setError("Please enter OTP");
    if (isForgot && !newPassword) return setError("Please enter a new password");

    setLoading(true); setError("");

    try {
      if (isForgot) {
        const data = await api("/api/auth/reset-password", "POST", { email, otp, newPassword });
        if (data.success) {
          setIsForgot(false); setOtpStep(false); setOtp(""); setNewPassword(""); setError(""); alert("Password reset successful. Please login.");
        } else { setError(data.msg || "Reset failed"); }
      } else {
        const data = await api("/api/auth/verify-otp", "POST", { email, otp });
        if (data.token) { saveLogin(data); } else { setError(data.msg || "OTP verification failed"); }
      }
    } catch (err) {
      setError(err.message || "OTP verification failed");
    }

    setLoading(false);
  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      setError("");

      const data = await api("/api/auth/google", "POST", {
        credential: credentialResponse.credential,
      });

      if (data.token) {
        saveLogin(data);
      } else {
        setError("Google login failed");
      }
    } catch (err) {
      setError(err.message || "Google login failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="auth-logo-box"><img src="/logo.png" alt="OUDS Logo" className="auth-logo-img" /></div>
        <h1>{otpStep ? (isForgot ? "Reset Password" : "Verify OTP") : isForgot ? "Reset Password" : isRegister ? "Create Account" : "Welcome Back"}</h1>
        <p>
          {otpStep
            ? `OTP sent to ${email}`
            : isForgot
              ? "Enter your email to receive a reset code"
              : isRegister
                ? "Register with email verification"
                : "Sign in to continue"}
        </p>
      </div>

      <div className="auth-card">
        {error && <div className="auth-error">{error}</div>}

        {!otpStep ? (
          <>
            <div className="auth-field">
              <label>Email</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">✉</span>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submit()}
                />
              </div>
            </div>

            {!isForgot && (
              <div className="auth-field">
                <label>Password</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">🔒</span>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && submit()}
                  />
                </div>
              </div>
            )}

            {!isForgot && !isRegister && (
              <div style={{ textAlign: "right", marginTop: "-10px", marginBottom: "15px" }}>
                <span style={{ color: "#4f46e5", fontSize: "14px", cursor: "pointer", fontWeight: 600 }} onClick={() => { setIsForgot(true); setError(""); }}>
                  Forgot Password?
                </span>
              </div>
            )}

            <button className="auth-submit" onClick={submit} disabled={loading}>
              {loading ? "Please wait..." : isForgot ? "Send Reset Code" : isRegister ? "Send OTP" : "Sign In"}
            </button>

            {!isForgot && (
              <>
                <div style={{ margin: "18px 0", textAlign: "center", color: "#888" }}>or</div>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <GoogleLogin onSuccess={handleGoogleLogin} onError={() => setError("Google login failed")} />
                </div>
              </>
            )}

            <p className="auth-switch">
              {isForgot
                ? "Remember your password?"
                : isRegister
                  ? "Already have an account?"
                  : "Don't have an account?"}
              <span
                onClick={() => {
                  if (isForgot) setIsForgot(false);
                  else setIsRegister(!isRegister);
                  setOtpStep(false);
                  setOtp("");
                  setError("");
                }}
              >
                {isForgot ? " Sign In" : isRegister ? " Sign In" : " Sign Up"}
              </span>
            </p>
          </>
        ) : (
          <>
            <div className="auth-field">
              <label>Enter OTP</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">🔐</span>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  maxLength={6}
                  onChange={e => setOtp(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && verifyOtp()}
                />
              </div>
            </div>

            {isForgot && (
              <div className="auth-field">
                <label>New Password</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">🔒</span>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && verifyOtp()}
                  />
                </div>
              </div>
            )}

            <button className="auth-submit" onClick={verifyOtp} disabled={loading}>
              {loading ? "Verifying..." : isForgot ? "Reset Password" : "Verify OTP"}
            </button>

            <p className="auth-switch">
              Wrong email?
              <span
                onClick={() => {
                  setOtpStep(false);
                  setOtp("");
                  setNewPassword("");
                  setError("");
                }}
              >
                {" "}Go Back
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Settings Screen ──────────────────────────────────────────────────────────
function SettingsScreen({ user, onBack, onLogout, darkMode, setDarkMode, fontSize, setFontSize, notifications, setNotifications, language, setLanguage }) {
  return (
    <div className="step-page">
      <div className="step-header">
        <button className="step-back" onClick={onBack}>‹</button>
        <div>
          <div className="step-title">Settings</div>
          <div className="step-sub">Customize your experience</div>
        </div>
      </div>

      <div className="settings-body">

        {/* Profile Card */}
        <div className="settings-card">
          <div className="settings-card-title">👤 Profile</div>
          <div className="settings-profile-row">
            <div className="settings-avatar">👤</div>
            <div>
              <div className="settings-profile-email">{user.email}</div>
              <div className="settings-profile-id">User ID: {user._id?.slice(-8) || "N/A"}</div>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="settings-card">
          <div className="settings-card-title">🎨 Appearance</div>

          <div className="settings-row">
            <div className="settings-row-left">
              <span className="settings-icon">🌙</span>
              <div>
                <div className="settings-label">Dark Mode</div>
                <div className="settings-desc">Switch to dark theme</div>
              </div>
            </div>
            <div className={`settings-toggle ${darkMode ? "on" : ""}`} onClick={() => setDarkMode(d => !d)}>
              <div className="settings-knob" />
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-left">
              <span className="settings-icon">🔤</span>
              <div>
                <div className="settings-label">Font Size</div>
                <div className="settings-desc">Adjust text size</div>
              </div>
            </div>
            <select className="settings-select" value={fontSize} onChange={e => setFontSize(e.target.value)}>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>

        {/* Preferences */}
        <div className="settings-card">
          <div className="settings-card-title">⚙️ Preferences</div>

          <div className="settings-row">
            <div className="settings-row-left">
              <span className="settings-icon">🔔</span>
              <div>
                <div className="settings-label">Notifications</div>
                <div className="settings-desc">Enable app notifications</div>
              </div>
            </div>
            <div className={`settings-toggle ${notifications ? "on" : ""}`} onClick={() => setNotifications(n => !n)}>
              <div className="settings-knob" />
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-left">
              <span className="settings-icon">🌐</span>
              <div>
                <div className="settings-label">Language</div>
                <div className="settings-desc">Select display language</div>
              </div>
            </div>
            <select className="settings-select" value={language} onChange={e => setLanguage(e.target.value)}>
              <option value="en">English</option>
              <option value="ta">Tamil</option>
              <option value="te">Telugu</option>
              <option value="hi">Hindi</option>
            </select>
          </div>
        </div>

        {/* About */}
        <div className="settings-card">
          <div className="settings-card-title">ℹ️ About</div>
          <div className="settings-row">
            <div className="settings-row-left">
              <span className="settings-icon">📱</span>
              <div>
                <div className="settings-label">App Version</div>
                <div className="settings-desc">OUDS v1.0.0</div>
              </div>
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-left">
              <span className="settings-icon">🔒</span>
              <div>
                <div className="settings-label">Privacy Policy</div>
                <div className="settings-desc">View our privacy policy</div>
              </div>
            </div>
            <span style={{ color: "#9ca3af", fontSize: 18 }}>›</span>
          </div>
          <div className="settings-row">
            <div className="settings-row-left">
              <span className="settings-icon">📄</span>
              <div>
                <div className="settings-label">Terms of Service</div>
                <div className="settings-desc">View terms and conditions</div>
              </div>
            </div>
            <span style={{ color: "#9ca3af", fontSize: 18 }}>›</span>
          </div>
        </div>

        {/* Logout */}
        <div className="settings-card">
          <button className="settings-logout-btn" onClick={onLogout}>🚪 Logout</button>
        </div>

      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ user, onStart, onHistory, onLogout, onSettings }) {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="dashboard-page" onClick={() => setShowProfile(false)}>
      <div className="dash-header">
        <div className="dash-brand">
          <div className="dash-logo"><img src="/logo.png" alt="OUDS Logo" className="dash-logo-img" /></div>
          <div>
            <div className="dash-brand-name">OUDS</div>
            <div className="dash-brand-sub">Dashboard</div>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <button className="dash-avatar" onClick={e => { e.stopPropagation(); setShowProfile(p => !p); }} title="Profile">👤</button>
          {showProfile && (
            <div className="profile-dropdown" onClick={e => e.stopPropagation()}>
              <div className="profile-avatar-big">👤</div>
              <div className="profile-email">{user.email}</div>
              <div className="profile-id">ID: {user._id?.slice(-8) || "N/A"}</div>
              <div className="profile-divider" />
              <button className="profile-settings-btn" onClick={() => { setShowProfile(false); onSettings(); }}>⚙️ Settings</button>
              <button className="profile-logout-btn" onClick={onLogout}>🚪 Logout</button>
            </div>
          )}
        </div>
      </div>

      <div className="dash-welcome">
        <div className="dash-welcome-text">
          <h2>Welcome back!</h2>
          <p>Ready to start a new oral ulcer assessment?</p>
        </div>
        <button className="dash-start-btn" onClick={onStart}>+ Start New Assessment</button>
      </div>

      <div className="dash-body">
        <div className="dash-section">
          <h3>Quick Actions</h3>
          <div className="dash-actions">
            <div className="dash-action-card" onClick={onHistory}>
              <div className="dash-action-icon blue">📄</div>
              <span>History</span>
            </div>
            <div className="dash-action-card" onClick={onSettings}>
              <div className="dash-action-icon purple">⚙️</div>
              <span>Settings</span>
            </div>
          </div>
        </div>

        <div className="dash-notice">
          <strong>Important Notice</strong>
          <p>This app is a screening tool. Always consult a healthcare professional for proper diagnosis and treatment.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Step Screen ──────────────────────────────────────────────────────────────
function StepScreen({ step, total, title, onBack, onContinue, children, isValid, showError }) {
  const progress = ((step) / total) * 100;
  return (
    <div className="step-page">
      <div className="step-header">
        <button className="step-back" onClick={onBack}>‹</button>
        <div>
          <div className="step-title">{title}</div>
          <div className="step-sub">Step {step} of {total}</div>
        </div>
      </div>
      <div className="step-progress"><div className="step-progress-fill" style={{ width: `${progress}%` }} /></div>
      <div className="step-content">
        {children}
        {showError && !isValid && (
          <div className="validation-error">⚠️ Please fill in all required fields before continuing.</div>
        )}
      </div>
      <div className="step-footer">
        <button className="step-continue" onClick={onContinue}>
          {step === total ? "Submit & Analyze" : "Continue"}
        </button>
      </div>
    </div>
  );
}

// ─── Info Box ─────────────────────────────────────────────────────────────────
function InfoBox({ text }) {
  return (
    <div className="info-box">
      <span className="info-icon">ℹ</span>
      <p>{text}</p>
    </div>
  );
}

// ─── Form Components ──────────────────────────────────────────────────────────
function FormCard({ title, icon, children }) {
  return (
    <div className="form-card">
      {title && <div className="form-card-title"><span>{icon}</span> {title}</div>}
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="step-field">
      <label>{label}</label>
      {children}
    </div>
  );
}

function Select({ value, onChange, options, placeholder = "Select" }) {
  return (
    <select className="step-select" value={value || ""} onChange={e => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return <input className="step-input" type={type} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} />;
}

function RadioGroup({ value, onChange, options }) {
  return (
    <div className="radio-row">
      {options.map(o => (
        <button key={o} className={`radio-pill ${value === o ? "active" : ""}`} onClick={() => onChange(o)}>{o}</button>
      ))}
    </div>
  );
}

function YesNo({ value, onChange }) {
  return (
    <div className="radio-row">
      <button className={`radio-pill ${value === true ? "active" : ""}`} onClick={() => onChange(true)}>Yes</button>
      <button className={`radio-pill ${value === false ? "active" : ""}`} onClick={() => onChange(false)}>No</button>
    </div>
  );
}

// Inline Yes/No row - question on left, buttons on right
function YesNoField({ label, value, onChange }) {
  return (
    <div className="yesno-row">
      <span className="yesno-label">{label}</span>
      <div className="yesno-btns">
        <button className={`radio-pill sm ${value === true ? "active" : ""}`} onClick={() => onChange(true)}>Yes</button>
        <button className={`radio-pill sm ${value === false ? "active" : ""}`} onClick={() => onChange(false)}>No</button>
      </div>
    </div>
  );
}

function Slider({ value, onChange }) {
  return (
    <div className="slider-wrap">
      <input type="range" min={0} max={10} value={value || 0} onChange={e => onChange(Number(e.target.value))} className="ouds-slider" />
      <div className="slider-labels">
        <span>0 - No pain</span>
        <span style={{ fontWeight: 700, color: "#4F46E5" }}>{value || 0}/10</span>
        <span>10 - Worst</span>
      </div>
    </div>
  );
}

function FormattedAIReport({ text }) {
  if (!text) return null;

  // Clean markdown bold markers for readable display if unparsed
  const cleanText = text.replace(/\*\*/g, '');
  const lines = cleanText.split("\n");
  const blocks = [];
  let currentBlock = { title: "", content: [] };

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "---") return;

    const headerMatch = trimmed.match(/^(\d+\.\s*)?(MOST LIKELY DIAGNOSIS|DIFFERENTIAL DIAGNOSES|RISK LEVEL|URGENCY|KEY FINDINGS|RED FLAGS|RECOMMENDED ACTION|RECOMMENDED ACTIONS|DISCLAIMER)[:\s*]*/i);

    if (headerMatch && trimmed.length < 80) {
      if (currentBlock.content.length > 0 || currentBlock.title) {
        blocks.push(currentBlock);
      }
      currentBlock = { title: trimmed.replace(/[*#]/g, '').trim(), content: [] };
    } else {
      currentBlock.content.push(trimmed.replace(/^[-*•]\s*/, ''));
    }
  });
  if (currentBlock.content.length > 0 || currentBlock.title) {
    blocks.push(currentBlock);
  }

  if (blocks.length <= 1) {
    return <div className="result-text">{cleanText}</div>;
  }

  return (
    <div className="report-sections-list">
      {blocks.map((block, idx) => {
        const titleLower = block.title.toLowerCase();
        let sectionClass = "report-section-default";
        let icon = "📋";

        if (titleLower.includes("likely diagnosis")) { sectionClass = "report-section-primary"; icon = "🩺"; }
        else if (titleLower.includes("differential")) { sectionClass = "report-section-info"; icon = "🔍"; }
        else if (titleLower.includes("red flag")) { sectionClass = "report-section-danger"; icon = "🚨"; }
        else if (titleLower.includes("recommend") || titleLower.includes("action")) { sectionClass = "report-section-success"; icon = "💡"; }
        else if (titleLower.includes("finding")) { sectionClass = "report-section-warning"; icon = "🔎"; }
        else if (titleLower.includes("disclaimer")) { sectionClass = "report-section-muted"; icon = "⚠️"; }

        return (
          <div key={idx} className={`report-section-card ${sectionClass}`}>
            {block.title && (
              <div className="report-section-header">
                <span className="report-section-icon">{icon}</span>
                <h4>{block.title}</h4>
              </div>
            )}
            <ul className="report-section-bullets">
              {block.content.map((item, itemIdx) => (
                <li key={itemIdx}>{item}</li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

// ─── Result Screen ────────────────────────────────────────────────────────────
function ResultScreen({ recordId, result, patientName, imageUrl, onBack, onDashboard }) {
  const meta = extractMeta(result);
  const [chat, setChat] = useState([{ role: "ai", content: "Analysis complete! Feel free to ask any follow-up questions." }]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [doctorEmail, setDoctorEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);

  const sendEmail = async () => {
    if (!doctorEmail) return alert("Please enter an email");
    setEmailSending(true);
    try {
      const data = await api("/api/ulcer/email-report", "POST", { recordId, targetEmail: doctorEmail }, sessionStorage.getItem("token"));
      if (data.success) { alert("Email sent successfully!"); setShowEmailDialog(false); setDoctorEmail(""); }
      else { alert(data.error || "Failed to send email"); }
    } catch (e) { alert(e.message); }
    setEmailSending(false);
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim(); setChatInput("");
    const newChat = [...chat, { role: "user", content: msg }];
    setChat(newChat); setChatLoading(true);
    try {
      const history = newChat.map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content }));
      history[0] = { role: "user", content: `[Analysis: ${result}]\n\nQuestion: ${history[0].content}` };
      const data = await api("/api/ulcer/analyze", "POST", {
        messages: history, systemPrompt: SYSTEM_PROMPT,
        symptoms: {}, patientName, saveRecord: false,
      }, sessionStorage.getItem("token"));
      setChat(prev => [...prev, { role: "ai", content: data.result || "Error." }]);
    } catch (err) { setChat(prev => [...prev, { role: "ai", content: err.message || "Error — please retry." }]); }
    setChatLoading(false);
  };

  return (
    <div className="result-page">
      <div className="step-header">
        <button className="step-back" onClick={onBack}>‹</button>
        <div>
          <div className="step-title">AI Diagnosis Result</div>
          <div className="step-sub">👤 {patientName}</div>
        </div>
      </div>

      <div className="result-body">
        <div className="result-card">
          <div className="result-card-title">🤖 Assessment Report</div>
          <div className="result-meta-row">
            <span className="category-badge">Type: {meta.category}</span>
            <span className={`risk-badge ${String(meta.risk).toLowerCase()}`}>Risk: {meta.risk}</span>
            <span className="urgency-badge">Urgency: {meta.urgency}</span>
            <button className="btn-small-primary" onClick={() => generateMedicalPDF({ patientName, result, imageUrl })}>📄 Download PDF Report</button>
            {recordId && <button className="btn-small-primary" onClick={() => setShowEmailDialog(true)} style={{ marginLeft: "8px", background: "#4f46e5", border: "1px solid #4f46e5" }}>✉️ Email to Doctor</button>}
          </div>
          <div className="result-success">
            <span className="result-check">✅</span>
            <div>
              <strong>Analysis Complete</strong>
              <p>Your comprehensive assessment has been analyzed</p>
            </div>
          </div>
          {imageUrl && (
            <div className="result-uploaded-photo">
              <div className="photo-preview-title">📷 Uploaded Ulcer Photo</div>
              <img src={imageUrl} alt="Uploaded Ulcer" className="result-photo-thumb" />
            </div>
          )}
          <FormattedAIReport text={result} />
        </div>

        {showEmailDialog && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", width: "90%", maxWidth: "400px" }}>
              <h3 style={{ marginTop: 0 }}>Email Report</h3>
              <p>Send a secure copy of this clinical report directly to your doctor or dentist.</p>
              <input type="email" placeholder="doctor@clinic.com" value={doctorEmail} onChange={e => setDoctorEmail(e.target.value)} style={{ width: "100%", padding: "12px", border: "1px solid #ccc", borderRadius: "8px", marginBottom: "16px", boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button onClick={() => setShowEmailDialog(false)} style={{ padding: "8px 16px", border: "none", background: "#eee", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>Cancel</button>
                <button onClick={sendEmail} disabled={emailSending} style={{ padding: "8px 16px", border: "none", background: "#4f46e5", color: "#fff", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>{emailSending ? "Sending..." : "Send"}</button>
              </div>
            </div>
          </div>
        )}

        <div className="result-card">
          <div className="result-card-title">💬 Ask Follow-up Questions</div>
          <div className="chat-messages">
            {chat.map((m, i) => <div key={i} className={`chat-msg ${m.role}`}>{m.content}</div>)}
            {chatLoading && <div className="chat-msg ai">Thinking...</div>}
          </div>
          <div className="quick-qs">
            {["What treatment?", "Is it serious?", "Foods to avoid?", "See a doctor?"].map(q => (
              <button key={q} className="quick-q-btn" onClick={() => setChatInput(q)}>{q}</button>
            ))}
          </div>
          <div className="chat-input-row">
            <textarea
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendChat();
                }
              }}
              placeholder="Ask a question... (Shift+Enter for new line)"
              rows={2}
            />
            <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}>Send</button>
          </div>
        </div>
      </div>

      <div className="result-footer">
        <button className="btn-outline" onClick={onBack}>← Back</button>
        <button className="btn-primary" onClick={onDashboard}>Back to Dashboard</button>
      </div>
    </div>
  );
}

// ─── History Screen ───────────────────────────────────────────────────────────
function HistoryScreen({ token, user, onBack, onView }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api("/api/ulcer/records", "GET", null, token)
      .then(data => { setRecords(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const filteredRecords = records.filter(r =>
    `${r.patientName} ${r.userEmail} ${r.diagnosis}`.toLowerCase().includes(search.toLowerCase())
  );

  const deleteRecord = async (id) => {
    await api(`/api/ulcer/records/${id}`, "DELETE", null, token);
    setRecords(prev => prev.filter(r => r._id !== id));
  };

  return (
    <div className="history-page">
      <div className="step-header">
        <button className="step-back" onClick={onBack}>‹</button>
        <div>
          <div className="step-title">Assessment History</div>
          <div className="step-sub">{filteredRecords.length} records {user?.isAdmin ? "• Admin view" : ""}</div>
        </div>
      </div>

      <div className="history-body">
        <input className="history-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by patient, email, or diagnosis..." />
        {loading && <p className="history-empty">Loading...</p>}
        {!loading && filteredRecords.length === 0 && <p className="history-empty">No matching assessments found.</p>}
        {filteredRecords.map(r => (
          <div key={r._id} className="history-item">
            <div className="history-item-top">
              <span className="history-name">👤 {r.patientName}</span>
              <span className="history-date">{new Date(r.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="history-preview">{user?.isAdmin && r.userEmail ? `${r.userEmail} • ` : ""}{r.riskLevel ? `Risk: ${r.riskLevel} • ` : ""}{r.diagnosis.slice(0, 100)}...</p>
            <div className="history-actions">
              <button className="btn-small-primary" onClick={() => onView(r)}>View Report</button>
              <button className="btn-small-danger" onClick={() => deleteRecord(r._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Animated Loading Screen ──────────────────────────────────────────────────
function AnimatedLoadingScreen() {
  const [step, setStep] = useState(0);
  const steps = [
    { icon: "🔍", label: "Reading patient data..." },
    { icon: "🧠", label: "Running AI analysis..." },
    { icon: "📋", label: "Generating diagnosis..." },
    { icon: "✅", label: "Finalizing report..." },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep(s => (s < steps.length - 1 ? s + 1 : s));
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="loading-page">
      <div className="loading-spinner" />
      <h2>AI Analysis in Progress</h2>
      <p>Our specialist AI is carefully reviewing all patient data</p>
      <div className="loading-steps">
        {steps.map((s, i) => (
          <div key={i} className={`loading-step ${i <= step ? "active" : ""} ${i < step ? "done" : ""}`}>
            <span className="loading-step-icon">{i < step ? "✓" : s.icon}</span>
            <span className="loading-step-label">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
const INIT = {
  patientName: "", age: "", gender: "",
  tobaccoUse: "", alcoholUse: "", betelNutUse: "",
  diabetes: null, vitaminDeficiency: null, lowImmunity: null, currentMedications: "",
  bitCheekLip: null, sharpToothRubbing: null, dentureContact: null,
  bracesIrritation: null, burnFromHotFood: null, chemicalContact: null,
  painWhileEating: null, soreRubbingTeeth: null,
  duration: "", firstTimeOrRecurring: "", numberOfSores: "",
  size: "", shape: "", color: "", border: "", bleedsEasily: null,
  soreLocation: "", alongBiteLine: null,
  painLevel: 5, difficultyEating: null, feverSwellingTiredness: null,
  lastingMoreThan2Weeks: null, gettingBigger: null, hardRaisedEdges: null,
  imageNote: "",
  image: "",
};

export default function App() {
  const [user, setUser] = useState(() => { try { return JSON.parse(sessionStorage.getItem("user")); } catch { return null; } });
  const [token, setToken] = useState(() => sessionStorage.getItem("token"));
  const [screen, setScreen] = useState("dashboard");
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState(INIT);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);

  // Settings state
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [fontSize, setFontSize] = useState(() => localStorage.getItem("fontSize") || "medium");
  const [notifications, setNotifications] = useState(() => localStorage.getItem("notifications") !== "false");
  const [language, setLanguage] = useState(() => localStorage.getItem("language") || "en");

  // Apply dark mode and font size
  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    document.body.setAttribute("data-font", fontSize);
    localStorage.setItem("darkMode", String(darkMode));
    localStorage.setItem("fontSize", fontSize);
    localStorage.setItem("notifications", String(notifications));
    localStorage.setItem("language", language);
  }, [darkMode, fontSize, notifications, language]);

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  const handleLogin = (u, t) => { setUser(u); setToken(t); setScreen("dashboard"); };
  const logout = () => {
    sessionStorage.removeItem("token"); sessionStorage.removeItem("user");
    setUser(null); setToken(null);
  };

  const buildPrompt = () => {
    const f = form;
    return `
PATIENT: ${f.patientName}, Age: ${f.age}, Gender: ${f.gender}
HABITS: Tobacco: ${f.tobaccoUse || "None"}, Alcohol: ${f.alcoholUse || "None"}, Betel Nut: ${f.betelNutUse || "None"}
MEDICAL: Diabetes: ${f.diabetes ? "Yes" : "No"}, Vitamin Deficiency: ${f.vitaminDeficiency ? "Yes" : "No"}, Low Immunity: ${f.lowImmunity ? "Yes" : "No"}, Medications: ${f.currentMedications || "None"}
TRAUMA: Bit cheek/lip: ${f.bitCheekLip ? "Yes" : "No"}, Sharp tooth: ${f.sharpToothRubbing ? "Yes" : "No"}, Denture: ${f.dentureContact ? "Yes" : "No"}, Braces: ${f.bracesIrritation ? "Yes" : "No"}, Hot burn: ${f.burnFromHotFood ? "Yes" : "No"}, Chemical: ${f.chemicalContact ? "Yes" : "No"}, Pain eating: ${f.painWhileEating ? "Yes" : "No"}, Rubbing teeth: ${f.soreRubbingTeeth ? "Yes" : "No"}
ULCER HISTORY: Duration: ${f.duration}, Recurring: ${f.firstTimeOrRecurring}, Number: ${f.numberOfSores}
APPEARANCE: Size: ${f.size}, Shape: ${f.shape}, Color: ${f.color}, Border: ${f.border}, Bleeds: ${f.bleedsEasily ? "Yes" : "No"}
LOCATION: ${f.soreLocation}, Bite line: ${f.alongBiteLine ? "Yes" : "No"}
SYMPTOMS: Pain: ${f.painLevel}/10, Difficulty eating: ${f.difficultyEating ? "Yes" : "No"}, Fever/swelling: ${f.feverSwellingTiredness ? "Yes" : "No"}
RED FLAGS: >2 weeks: ${f.lastingMoreThan2Weeks ? "YES ⚠️" : "No"}, Getting bigger: ${f.gettingBigger ? "YES ⚠️" : "No"}, Hard edges: ${f.hardRaisedEdges ? "YES ⚠️" : "No"}
NOTES: ${f.imageNote || "None"}
HAS ATTACHED PHOTO: ${f.image ? "YES" : "No"}
    `.trim();
  };

  const analyze = async () => {
    setLoading(true); setResult(null);
    try {
      const data = await api("/api/ulcer/analyze", "POST", {
        messages: [{ role: "user", content: `Analyze this patient data:\n\n${buildPrompt()}` }],
        systemPrompt: SYSTEM_PROMPT,
        symptoms: form,
        patientName: form.patientName || "Anonymous",
        image: form.image || null,
      }, token);
      if (data.result) { setResult(data.result); setScreen("result"); }
      else alert(data.error || data.msg || "Analysis failed.");
    } catch (err) { alert(err.message || "Server error."); }
    setLoading(false);
  };

  const TOTAL = STEPS.length;

  // Validation per step
  const isStepValid = () => {
    switch (currentStep) {
      case 1: return !!form.patientName && !!form.age && !!form.gender;
      case 2: return !!form.tobaccoUse && !!form.alcoholUse && !!form.betelNutUse;
      case 3: return form.diabetes !== null && form.vitaminDeficiency !== null && form.lowImmunity !== null;
      case 4: return form.bitCheekLip !== null && form.sharpToothRubbing !== null && form.dentureContact !== null && form.bracesIrritation !== null && form.burnFromHotFood !== null && form.chemicalContact !== null && form.painWhileEating !== null && form.soreRubbingTeeth !== null;
      case 5: return !!form.duration && !!form.firstTimeOrRecurring && !!form.numberOfSores;
      case 6: return !!form.size && !!form.shape && !!form.color && !!form.border && form.bleedsEasily !== null;
      case 7: return !!form.soreLocation && form.alongBiteLine !== null;
      case 8: return form.difficultyEating !== null && form.feverSwellingTiredness !== null;
      case 9: return form.lastingMoreThan2Weeks !== null && form.gettingBigger !== null && form.hardRaisedEdges !== null;
      case 10: return true;
      default: return true;
    }
  };

  const [showError, setShowError] = useState(false);

  const handleContinue = () => {
    if (!isStepValid()) { setShowError(true); return; }
    setShowError(false);
    if (currentStep < TOTAL) setCurrentStep(s => s + 1);
    else analyze();
  };

  const handleBack = () => {
    setShowError(false);
    if (currentStep > 1) setCurrentStep(s => s - 1);
    else setScreen("dashboard");
  };

  const startNew = () => { setForm(INIT); setCurrentStep(1); setResult(null); setShowError(false); setScreen("assessment"); };


  if (!user || !token) return <AuthScreen onLogin={handleLogin} />;

  if (screen === "dashboard") return (
    <Dashboard user={user} onStart={startNew} onHistory={() => setScreen("history")} onLogout={logout} onSettings={() => setScreen("settings")} />
  );

  if (screen === "settings") return (
    <SettingsScreen
      user={user}
      onBack={() => setScreen("dashboard")}
      onLogout={logout}
      darkMode={darkMode} setDarkMode={setDarkMode}
      fontSize={fontSize} setFontSize={setFontSize}
      notifications={notifications} setNotifications={setNotifications}
      language={language} setLanguage={setLanguage}
    />
  );

  if (screen === "history") return (
    <HistoryScreen token={token} user={user} onBack={() => setScreen("dashboard")} onView={r => { setViewRecord(r); setScreen("view-record"); }} />
  );

  if (screen === "view-record") return (
    <ResultScreen recordId={viewRecord?._id} result={viewRecord?.diagnosis} patientName={viewRecord?.patientName} imageUrl={viewRecord?.imageUrl} onBack={() => setScreen("history")} onDashboard={() => setScreen("dashboard")} />
  );

  if (screen === "result") return (
    <ResultScreen result={result} patientName={form.patientName} imageUrl={form.image} onBack={() => { setScreen("assessment"); setCurrentStep(TOTAL); }} onDashboard={() => setScreen("dashboard")} />
  );

  // Assessment steps
  const stepProps = { step: currentStep, total: TOTAL, onBack: handleBack, onContinue: handleContinue, showError, isValid: isStepValid() };

  if (loading) return <AnimatedLoadingScreen />;

  return (
    <>
      {currentStep === 1 && (
        <StepScreen {...stepProps} title="Patient Profile">
          <InfoBox text="Oral ulcers (also called canker sores or mouth sores) are painful spots or open wounds that appear inside your mouth. They typically look like small, round, white or yellowish spots with a red border." />
          <FormCard title="Personal Information" icon="👤">
            <Field label="Full Name *"><Input value={form.patientName} onChange={set("patientName")} placeholder="Enter patient name" /></Field>
            <Field label="Age *"><Input value={form.age} onChange={set("age")} placeholder="Age" type="number" /></Field>
            <Field label="Gender *"><Select value={form.gender} onChange={set("gender")} options={["Male", "Female", "Other"]} /></Field>
          </FormCard>
        </StepScreen>
      )}

      {currentStep === 2 && (
        <StepScreen {...stepProps} title="Habits and Lifestyle">
          <FormCard title="Habits and Lifestyle" icon="〜">
            <Field label="Tobacco Use"><Select value={form.tobaccoUse} onChange={set("tobaccoUse")} options={["Never", "Occasionally", "Daily", "Quit recently"]} /></Field>
            <Field label="Alcohol Consumption"><Select value={form.alcoholUse} onChange={set("alcoholUse")} options={["Never", "Occasionally", "Weekly", "Daily"]} /></Field>
            <Field label="Betel Nut / Pan Chewing"><Select value={form.betelNutUse} onChange={set("betelNutUse")} options={["Never", "Occasionally", "Daily", "Multiple times a day"]} /></Field>
          </FormCard>
        </StepScreen>
      )}

      {currentStep === 3 && (
        <StepScreen {...stepProps} title="Medical History">
          <FormCard title="Medical History" icon="🏥">
            <YesNoField label="Diabetes?" value={form.diabetes} onChange={set("diabetes")} />
            <YesNoField label="Vitamin Deficiency / Anemia?" value={form.vitaminDeficiency} onChange={set("vitaminDeficiency")} />
            <YesNoField label="Low Immunity / Long-term Illness?" value={form.lowImmunity} onChange={set("lowImmunity")} />
            <Field label="Current Medications">
              <textarea className="step-textarea" value={form.currentMedications} onChange={e => set("currentMedications")(e.target.value)} placeholder="List any medications..." rows={3} />
            </Field>
          </FormCard>
        </StepScreen>
      )}

      {currentStep === 4 && (
        <StepScreen {...stepProps} title="Trauma Check">
          <InfoBox text="Trauma is one of the most common causes of mouth sores. Please answer honestly to help us identify the cause." />
          <FormCard title="Trauma Check" icon="⚠️">
            <YesNoField label="Bit cheek, lip, or tongue recently?" value={form.bitCheekLip} onChange={set("bitCheekLip")} />
            <YesNoField label="Sharp tooth rubbing the sore?" value={form.sharpToothRubbing} onChange={set("sharpToothRubbing")} />
            <YesNoField label="Denture touching the sore?" value={form.dentureContact} onChange={set("dentureContact")} />
            <YesNoField label="Braces / wire irritation?" value={form.bracesIrritation} onChange={set("bracesIrritation")} />
            <YesNoField label="Burn from hot food or drink?" value={form.burnFromHotFood} onChange={set("burnFromHotFood")} />
            <YesNoField label="Strong chemical contact? (clove oil, balm, tablet)" value={form.chemicalContact} onChange={set("chemicalContact")} />
            <YesNoField label="Pain worse while eating?" value={form.painWhileEating} onChange={set("painWhileEating")} />
            <YesNoField label="Sore rubbing against teeth?" value={form.soreRubbingTeeth} onChange={set("soreRubbingTeeth")} />
          </FormCard>
        </StepScreen>
      )}

      {currentStep === 5 && (
        <StepScreen {...stepProps} title="Ulcer History">
          <FormCard title="Ulcer History" icon="📅">
            <Field label="When did it start?">
              <Select value={form.duration} onChange={set("duration")} options={["Less than 3 days", "3–7 days", "1–2 weeks", "2–4 weeks", "More than 1 month", "More than 3 months"]} />
            </Field>
            <Field label="First time or recurring?">
              <RadioGroup value={form.firstTimeOrRecurring} onChange={set("firstTimeOrRecurring")} options={["First time", "Recurring", "Chronic"]} />
            </Field>
            <Field label="Number of sores">
              <Select value={form.numberOfSores} onChange={set("numberOfSores")} options={["1", "2–3", "4–5", "More than 5", "Too many to count"]} />
            </Field>
          </FormCard>
        </StepScreen>
      )}

      {currentStep === 6 && (
        <StepScreen {...stepProps} title="Ulcer Appearance">
          <FormCard title="Ulcer Appearance" icon="🔍">
            <Field label="Size of sore">
              <Select value={form.size} onChange={set("size")} options={["Pinpoint (< 2mm)", "Small (2–5mm)", "Medium (5–10mm)", "Large (10–20mm)", "Very large (> 20mm)"]} />
            </Field>
            <Field label="Shape">
              <RadioGroup value={form.shape} onChange={set("shape")} options={["Round", "Oval", "Irregular"]} />
            </Field>
            <Field label="Color">
              <Select value={form.color} onChange={set("color")} options={["White/Grey", "Yellow", "Red", "White with red border", "Mixed/Patchy", "Black/Dark"]} />
            </Field>
            <Field label="Border">
              <RadioGroup value={form.border} onChange={set("border")} options={["Smooth", "Raised", "Irregular"]} />
            </Field>
            <YesNoField label="Does it bleed easily?" value={form.bleedsEasily} onChange={set("bleedsEasily")} />
          </FormCard>
        </StepScreen>
      )}

      {currentStep === 7 && (
        <StepScreen {...stepProps} title="Location">
          <FormCard title="Location" icon="📍">
            <Field label="Select sore location">
              <Select value={form.soreLocation} onChange={set("soreLocation")} options={["Inner lip (upper)", "Inner lip (lower)", "Inner cheek", "Tongue (top)", "Tongue (side)", "Tongue (bottom)", "Gum (upper)", "Gum (lower)", "Roof of mouth (palate)", "Back of mouth/throat", "Floor of mouth", "Corner of mouth"]} />
            </Field>
            <YesNoField label="Is it along bite line / denture area?" value={form.alongBiteLine} onChange={set("alongBiteLine")} />
          </FormCard>
        </StepScreen>
      )}

      {currentStep === 8 && (
        <StepScreen {...stepProps} title="Symptoms">
          <FormCard title="Symptoms" icon="🩺">
            <Field label="Pain Level (0–10)"><Slider value={form.painLevel} onChange={set("painLevel")} /></Field>
            <YesNoField label="Difficulty eating or swallowing?" value={form.difficultyEating} onChange={set("difficultyEating")} />
            <YesNoField label="Fever, swelling, or tiredness?" value={form.feverSwellingTiredness} onChange={set("feverSwellingTiredness")} />
          </FormCard>
        </StepScreen>
      )}

      {currentStep === 9 && (
        <StepScreen {...stepProps} title="Red Flags">
          <InfoBox text="The following signs may indicate a more serious condition. Please answer carefully." />
          <FormCard title="Red Flags" icon="🚨">
            <YesNoField label="Lasting more than 2 weeks?" value={form.lastingMoreThan2Weeks} onChange={set("lastingMoreThan2Weeks")} />
            <YesNoField label="Getting bigger or not healing?" value={form.gettingBigger} onChange={set("gettingBigger")} />
            <YesNoField label="Hard / raised edges or lump?" value={form.hardRaisedEdges} onChange={set("hardRaisedEdges")} />
          </FormCard>
          {(form.lastingMoreThan2Weeks || form.gettingBigger || form.hardRaisedEdges) && (
            <div className="redflag-alert">
              🚨 <strong>Warning:</strong> You have indicated red flag symptoms. Please consult a doctor as soon as possible.
            </div>
          )}
        </StepScreen>
      )}

      {currentStep === 10 && (
        <StepScreen {...stepProps} title="Photo Upload & Notes">
          <FormCard title="Upload Photo of Oral Ulcer (Optional)" icon="📷">
            <InfoBox text="Optional: Uploading a clear, well-lit photo of your mouth sore allows the AI to perform multimodal visual inspection of color, border, and physical features." />
            {!form.image ? (
              <div className="photo-upload-zone" onClick={() => document.getElementById("photo-input-file")?.click()}>
                <div className="photo-upload-icon">📸</div>
                <div className="photo-upload-text">Click or drag a photo here to upload</div>
                <div className="photo-upload-sub">Supports JPG, PNG, WEBP (Completely Optional)</div>
                <input
                  id="photo-input-file"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setForm(f => ({ ...f, image: reader.result }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="photo-preview-box">
                <img src={form.image} alt="Ulcer Preview" className="photo-preview-img" />
                <button className="photo-remove-btn" onClick={() => setForm(f => ({ ...f, image: "" }))}>
                  ✕ Remove Photo
                </button>
              </div>
            )}
          </FormCard>

          <FormCard title="Additional Notes" icon="📝">
            <Field label="Describe what the sore looks like or any other relevant details">
              <textarea className="step-textarea" value={form.imageNote} onChange={e => set("imageNote")(e.target.value)} placeholder="Describe appearance, texture, or any other details that might help with diagnosis..." rows={4} />
            </Field>
          </FormCard>
          <div className="submit-note">
            Clicking Continue will send your assessment data {form.image ? "and photo " : ""}to our AI for analysis.
          </div>
        </StepScreen>
      )}
    </>
  );
}