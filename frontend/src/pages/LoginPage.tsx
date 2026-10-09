import { useNavigate } from "react-router-dom";
import { C, Ico } from "@/shared/ui";
import { useEffect, useState } from "react";
import { ApiError, fetchMe, login, register } from "@/shared/api/auth";
import { useAuth } from "@/shared/auth/AuthContext";
import { useCenterOptions } from "@/shared/hooks/useCenterOptions";
import { pickDefaultCenter } from "@/shared/centers";

function LoginScreen() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const { centers, defaultCenter } = useCenterOptions();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [center, setCenter] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!center && defaultCenter) setCenter(defaultCenter);
  }, [center, defaultCenter]);

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    fontSize: 14,
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    background: "#F5FAFF",
    color: C.textPrimary,
    outline: "none",
    fontFamily: "var(--font-inter)",
  } as const;

  async function onSubmit() {
    setError(null);
    if (!email.trim() || !pw) {
      setError("Email and password are required");
      return;
    }
    if (mode === "register" && fullName.trim().length < 2) {
      setError("Please enter your full name");
      return;
    }
    if (pw.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      if (mode === "register") {
        await register({
          email: email.trim(),
          password: pw,
          full_name: fullName.trim(),
          center: center.trim() || pickDefaultCenter(null, centers),
        });
      } else {
        await login(email.trim(), pw);
      }
      await fetchMe();
      await refresh();
      navigate("/dashboard");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Unable to reach server. Is the backend running?";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, overflow: "hidden" }}>
      {/* LEFT — Brand panel with fundus background */}
      <div style={{
        flex: "0 0 52%", position: "relative", overflow: "hidden",
        background: C.navyDark, display: "flex", flexDirection: "column",
        padding: "48px 56px", justifyContent: "space-between",
      }}>
        {/* Large retinal image as background art */}
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: "radial-gradient(ellipse 85% 78% at 56% 50%, #c04a05 0%, #8c2a02 28%, #501604 55%, #1e0800 78%, #050100 100%)",
        }}>
          {[
            { t: "49%", l: "57%", w: "30%", a: "0deg", o: 0.55, h: 2 },
            { t: "49%", l: "27%", w: "30%", a: "8deg", o: 0.48, h: 2 },
            { t: "43%", l: "43%", w: "24%", a: "-30deg", o: 0.42, h: 1.5 },
            { t: "57%", l: "43%", w: "26%", a: "28deg", o: 0.42, h: 1.5 },
            { t: "36%", l: "53%", w: "17%", a: "-50deg", o: 0.36, h: 1.5 },
            { t: "64%", l: "53%", w: "17%", a: "46deg", o: 0.36, h: 1.5 },
            { t: "49%", l: "57%", w: "19%", a: "-15deg", o: 0.32, h: 1 },
            { t: "49%", l: "57%", w: "19%", a: "18deg", o: 0.32, h: 1 },
            { t: "38%", l: "62%", w: "14%", a: "-68deg", o: 0.3, h: 1 },
            { t: "60%", l: "62%", w: "14%", a: "64deg", o: 0.3, h: 1 },
          ].map((v, i) => (
            <div key={i} style={{
              position: "absolute", top: v.t, left: v.l, width: v.w, height: `${v.h}px`,
              borderRadius: 1, transformOrigin: "left center",
              transform: `rotate(${v.a})`, opacity: v.o,
              background: "rgba(80,12,2,0.7)",
            }} />
          ))}
          <div style={{
            position: "absolute", top: "47%", left: "57%",
            width: 74, height: 64,
            background: "radial-gradient(ellipse, #ffc050 15%, #d87818 58%, #a04808 100%)",
            borderRadius: "50%", transform: "translate(-50%,-50%)",
            boxShadow: "0 0 22px 8px rgba(220,160,40,0.32)",
          }} />
          <div style={{
            position: "absolute", top: "50%", left: "37%",
            width: 36, height: 36,
            background: "radial-gradient(ellipse, rgba(30,6,0,0.8) 20%, transparent 100%)",
            borderRadius: "50%", transform: "translate(-50%,-50%)",
          }} />
          <div style={{ position: "absolute", inset: 0, background: "rgba(2,6,23,0.52)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(2,6,23,0.82) 0%, transparent 42%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(2,6,23,0.88) 0%, transparent 55%)" }} />
        </div>

        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: C.indigo,
              display: "flex", alignItems: "center", justifyContent: "center", color: C.white,
              boxShadow: "0 4px 14px rgba(97,41,199,0.4)",
            }}>
              <Ico.Eye />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: C.white, letterSpacing: -0.5, lineHeight: 1 }}>NetraX</div>
          </div>

          <div style={{ marginTop: 44 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: C.white, lineHeight: 1.3, letterSpacing: -0.4, marginBottom: 12 }}>
              Explainable AI for Diabetic Retinopathy Screening
            </h1>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.72)", lineHeight: 1.6, maxWidth: 480 }}>
              Designed for rural healthcare. Built for earlier detection.
            </p>
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 2, fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>
          Built for low-connectivity settings • Specialist-in-the-loop • SIH 2026
        </div>
      </div>

      {/* RIGHT — Form */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 32px", background: C.bg,
      }}>
        <div style={{
          width: "100%", maxWidth: 460, background: C.white,
          borderRadius: 24, border: `1px solid ${C.border}`, padding: "44px 40px",
          boxShadow: "0 8px 30px rgba(18,28,46,0.06)",
        }} className="fade-in">
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.textPrimary, letterSpacing: -0.4, lineHeight: 1.15, marginBottom: 6 }}>
              {mode === "login" ? "Welcome back" : "Create account"}
            </div>
            <div style={{ fontSize: 14, color: C.textSecondary }}>
              {mode === "login" ? "Sign in to continue to NetraX" : "Register a new health worker account"}
            </div>
          </div>

          {/* Mode tabs */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6,
            padding: 4, borderRadius: 12, background: C.bg, marginBottom: 20,
            border: `1px solid ${C.borderLight}`,
          }}>
            {(["login", "register"] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(null); }}
                style={{
                  padding: "9px 12px", borderRadius: 9, border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: 700,
                  background: mode === m ? C.white : "transparent",
                  color: mode === m ? C.textPrimary : C.slate500,
                  boxShadow: mode === m ? "0 1px 3px rgba(18,28,46,0.08)" : "none",
                }}
              >
                {m === "login" ? "Sign in" : "New account"}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "register" && (
              <>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, display: "block", marginBottom: 7 }}>
                    Full name
                  </label>
                  <input
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Priya Naik"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = C.indigo)}
                    onBlur={e => (e.target.style.borderColor = C.border)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, display: "block", marginBottom: 7 }}>
                    PHC / Center
                  </label>
                  <select
                    value={center}
                    onChange={e => setCenter(e.target.value)}
                    style={{ ...inputStyle, cursor: "pointer" }}
                    onFocus={e => (e.target.style.borderColor = C.indigo)}
                    onBlur={e => (e.target.style.borderColor = C.border)}
                  >
                    {centers.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </>
            )}

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, display: "block", marginBottom: 7 }}>
                Work email
              </label>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
                placeholder="you@phc.gov.in"
                autoComplete="username"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = C.indigo)}
                onBlur={e => (e.target.style.borderColor = C.border)}
                onKeyDown={e => { if (e.key === "Enter") onSubmit(); }}
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary }}>Password</label>
                {mode === "login" && (
                  <button type="button" style={{ fontSize: 12, color: C.indigo, fontWeight: 600, border: "none", background: "none", cursor: "pointer", padding: 0 }}>
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                value={pw}
                onChange={e => setPw(e.target.value)}
                type="password"
                placeholder="Min. 6 characters"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = C.indigo)}
                onBlur={e => (e.target.style.borderColor = C.border)}
                onKeyDown={e => { if (e.key === "Enter") onSubmit(); }}
              />
            </div>

            {mode === "login" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setRemember(r => !r)}>
                <div style={{
                  width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${remember ? C.indigo : C.slate300}`,
                  background: remember ? C.indigo : C.white,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {remember && (
                    <svg viewBox="0 0 12 10" style={{ width: 10, height: 10 }}>
                      <polyline points="1 5 4 8 11 1" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: 13, color: C.textSecondary, fontWeight: 500 }}>Remember me for 30 days</span>
              </div>
            )}

            {error && (
              <div style={{
                padding: "10px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                background: C.dangerLight, color: C.danger, border: `1px solid ${C.danger}33`,
              }}>
                {error}
              </div>
            )}

            <button
              type="button"
              disabled={loading}
              onClick={onSubmit}
              style={{
                marginTop: 4,
                padding: "13px 20px", borderRadius: 12, fontSize: 15, fontWeight: 700,
                background: loading ? C.indigoHover : C.indigo, color: C.white,
                border: "none", cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: `0 4px 14px rgba(97,41,199,0.35)`, opacity: loading ? 0.85 : 1,
              }}
            >
              {loading
                ? <><Ico.Loader /><span>{mode === "login" ? "Signing in…" : "Creating account…"}</span></>
                : (mode === "login" ? "Sign in" : "Create account")}
            </button>
          </div>

          <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.borderLight}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.slate500, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Quick Demo Roles
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {[
                { label: "Screening Operator", email: "operator@netrax.health", bg: C.successLight, color: C.success },
                { label: "Admin", email: "arjun@netrax.health", bg: C.indigoLight, color: C.indigo },
                { label: "Reviewer", email: "reviewer@netrax.health", bg: C.warningLight, color: C.warning },
                { label: "Ophthalmologist", email: "ophtho@netrax.health", bg: C.dangerLight, color: C.danger },
              ].map(d => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setEmail(d.email);
                    setPw("netrax123");
                  }}
                  style={{
                    padding: "6px 11px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                    background: d.bg, color: d.color, border: `1px solid ${d.color}44`,
                    cursor: "pointer", transition: "all 0.15s ease",
                  }}
                >
                  ⚡ {d.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 16, fontSize: 12, color: C.slate500, textAlign: "center", lineHeight: 1.5 }}>
            New here? Use <strong style={{ color: C.textPrimary }}>New account</strong> to register a Screening Operator.
          </div>

          <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${C.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 11, color: C.slate400, fontWeight: 500 }}>© 2026 NetraX • Rural Screening</div>
            <div style={{ display: "flex", gap: 12 }}>
              {["Privacy", "Help", "Offline Guide"].map(l => (
                <button key={l} type="button" style={{ fontSize: 11, color: C.slate500, border: "none", background: "none", cursor: "pointer", padding: 0 }}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return <LoginScreen />;
}
