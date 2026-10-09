import { useAppNav } from "@/shared/hooks/useAppNav";
import { useActiveScreening } from "@/shared/screening/useActiveScreening";
import { useScreeningFlowNav } from "@/shared/screening/useScreeningFlowNav";
import { initialsOf } from "@/shared/screening/session";
import {
  C, Ico, Badge, Sidebar, Header,
  Card, ActionButton, DR,
  type NavKey, type BadgeV,
} from "@/shared/ui";
import { useAuthImage, screeningImagePath, gradcamImagePath } from "@/shared/hooks/useAuthImage";
import { analyzeScreening, getScreeningResults, type ScreeningResults } from "@/shared/api/screenings";
import { API_BASE, getToken } from "@/shared/api/auth";
import { useEffect, useState } from "react";

type PipelineStep = {
  label: string;
  done: boolean;
  active: boolean;
  detail: string;
};

type MlHealth = {
  cnn?: string;
  qml?: string;
  device?: string;
  note?: string;
};

function AuthImg({
  path,
  size,
  round = false,
  label,
}: {
  path: string | null;
  size: number;
  round?: boolean;
  label: string;
}) {
  const { src, loading } = useAuthImage(path);
  const radius = round ? "50%" : 12;
  if (src) {
    return (
      <img
        src={src}
        alt={label}
        style={{
          width: size,
          height: size,
          objectFit: "cover",
          borderRadius: radius,
          border: "2px solid rgba(255,255,255,0.12)",
        }}
      />
    );
  }
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: radius,
      background: "rgba(255,255,255,0.06)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: C.slate400,
      fontSize: 11,
      textAlign: "center",
      padding: 8,
    }}>
      {loading ? "Loading…" : label}
    </div>
  );
}

function fmtSec(ms: number | null) {
  if (ms == null) return "—";
  return `${(ms / 1000).toFixed(1)}s`;
}

function buildPipeline(opts: {
  running: boolean;
  done: boolean;
  error: boolean;
  elapsedMs: number | null;
  hasOd: boolean;
  hasOs: boolean;
  hasGradcam: boolean;
  hasReport: boolean;
  cnnLive: boolean;
  qmlLive: boolean;
}): PipelineStep[] {
  const { running, done, error, elapsedMs, hasOd, hasOs, hasGradcam, hasReport, cnnLive, qmlLive } = opts;
  const t = fmtSec(elapsedMs);
  const imagesReady = hasOd || hasOs;

  if (error) {
    return [
      { label: "Load OD / OS fundus", done: imagesReady, active: false, detail: imagesReady ? "Loaded" : "Missing" },
      { label: "CNN DINOv2 classification", done: false, active: false, detail: "Failed" },
      { label: "QML Hybrid inference", done: false, active: false, detail: "Failed" },
      { label: "Ensemble fusion", done: false, active: false, detail: "Failed" },
      { label: "Grad-CAM explainability", done: false, active: false, detail: "Failed" },
      { label: "Persist clinical report", done: false, active: false, detail: "Failed" },
    ];
  }

  if (done) {
    return [
      { label: "Load OD / OS fundus", done: true, active: false, detail: `✓ ${hasOd && hasOs ? "OD+OS" : hasOd ? "OD" : hasOs ? "OS" : "—"}` },
      { label: "CNN DINOv2 classification", done: cnnLive, active: false, detail: cnnLive ? `✓ ${t}` : "Disabled" },
      { label: "QML Hybrid inference", done: qmlLive, active: false, detail: qmlLive ? `✓ ${t}` : "Disabled" },
      { label: "Ensemble fusion", done: true, active: false, detail: `✓ ${t}` },
      { label: "Grad-CAM explainability", done: hasGradcam, active: false, detail: hasGradcam ? "✓ Ready" : "Unavailable" },
      { label: "Persist clinical report", done: hasReport, active: false, detail: hasReport ? "✓ Saved" : "No report" },
    ];
  }

  if (running) {
    return [
      { label: "Load OD / OS fundus", done: imagesReady, active: !imagesReady, detail: imagesReady ? "✓ Ready" : "Loading…" },
      { label: "CNN DINOv2 classification", done: false, active: true, detail: "Running…" },
      { label: "QML Hybrid inference", done: false, active: true, detail: "Running…" },
      { label: "Ensemble fusion", done: false, active: false, detail: "Pending" },
      { label: "Grad-CAM explainability", done: false, active: false, detail: "Pending" },
      { label: "Persist clinical report", done: false, active: false, detail: "Pending" },
    ];
  }

  return [
    { label: "Load OD / OS fundus", done: false, active: true, detail: "Starting…" },
    { label: "CNN DINOv2 classification", done: false, active: false, detail: "Pending" },
    { label: "QML Hybrid inference", done: false, active: false, detail: "Pending" },
    { label: "Ensemble fusion", done: false, active: false, detail: "Pending" },
    { label: "Grad-CAM explainability", done: false, active: false, detail: "Pending" },
    { label: "Persist clinical report", done: false, active: false, detail: "Pending" },
  ];
}

function AIAnalysisScreen({
  onNext, onNav, nextLabel,
}: {
  onNext: () => void;
  onNav: (k: NavKey) => void;
  nextLabel: string;
}) {
  const { screeningId, patient, result, reload } = useActiveScreening();
  const [activeNav] = useState<NavKey>("new-screening");
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState("Preparing CNN + QML ensemble…");
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [tickMs, setTickMs] = useState(0);
  const [liveResult, setLiveResult] = useState<ScreeningResults | null>(null);
  const [analyzeMeta, setAnalyzeMeta] = useState<{
    dr_level: number;
    confidence: number;
    model_used: string;
    report_id: string | null;
    message: string;
  } | null>(null);
  const [ml, setMl] = useState<MlHealth>({});
  const [eye, setEye] = useState<"od" | "os">("od");

  const display = liveResult || result;
  const mc = display?.explainability?.model_compare;
  const grad = display?.explainability?.gradcam;
  const hasOd = Boolean(display?.has_od_image ?? screeningId);
  const hasOs = Boolean(display?.has_os_image ?? screeningId);
  const hasGradcam = Boolean(grad?.od && !grad.od.error) || Boolean(grad?.os && !grad.os.error);
  const hasReport = Boolean(analyzeMeta?.report_id || display?.report_id);
  const cnnLive = ml.cnn === "live";
  const qmlLive = ml.qml === "live";

  const progress = done ? 100 : running ? Math.min(92, 12 + tickMs / 800) : 8;
  const pipeline = buildPipeline({
    running,
    done,
    error: Boolean(analyzeError),
    elapsedMs: done ? elapsedMs : running ? tickMs : null,
    hasOd,
    hasOs,
    hasGradcam,
    hasReport,
    cnnLive,
    qmlLive,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = getToken();
        const res = await fetch(`${API_BASE}/api/health`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const body = await res.json();
        if (!cancelled && body?.ml) setMl(body.ml as MlHealth);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!running || done) return;
    const t0 = Date.now();
    const id = setInterval(() => setTickMs(Date.now() - t0), 250);
    return () => clearInterval(id);
  }, [running, done]);

  useEffect(() => {
    if (done || analyzeError) return;
    if (!screeningId) {
      setAnalyzeError("No active screening");
      return;
    }
    let cancelled = false;
    (async () => {
      setRunning(true);
      setStatusMsg("Running CNN + QML ensemble (first load may take 1–2 min)…");
      const t0 = Date.now();
      try {
        const ar = await analyzeScreening(screeningId, "ensemble");
        if (cancelled) return;
        const ms = Date.now() - t0;
        setElapsedMs(ms);
        setAnalyzeMeta({
          dr_level: ar.dr_level,
          confidence: ar.confidence,
          model_used: ar.model_used,
          report_id: ar.report_id,
          message: ar.message,
        });
        setStatusMsg(ar.message || "Analysis complete");
        try {
          const full = await getScreeningResults(screeningId);
          if (!cancelled) setLiveResult(full);
        } catch { /* keep analyzeMeta */ }
        reload();
        setDone(true);
        setRunning(false);
      } catch (err) {
        if (!cancelled) {
          setAnalyzeError(err instanceof Error ? err.message : "Analyze failed");
          setStatusMsg("Analysis failed");
          setElapsedMs(Date.now() - t0);
          setRunning(false);
        }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per screening
  }, [screeningId]);

  const level = analyzeMeta?.dr_level ?? display?.dr_level ?? null;
  const conf = analyzeMeta?.confidence ?? display?.confidence ?? null;
  const dr = level != null ? (DR[level] ?? DR[0]) : null;
  const badge: BadgeV = analyzeError ? "error" : done ? "completed" : "processing";
  const sid = screeningId || "";
  const gcOk = Boolean(grad?.[eye] && !grad[eye]?.error);

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header
          title="AI Analysis in Progress"
          breadcrumbs={["NetraX", "New Screening", "AI Analysis"]}
          actions={<Badge v={badge} pulse={!done && !analyzeError} />}
        />
        <main style={{ flex: 1, overflowY: "auto", padding: 28, background: C.bg }}>
          {analyzeError && (
            <div style={{ marginBottom: 12, fontSize: 12, color: C.danger }}>{analyzeError}</div>
          )}
          <div style={{ marginBottom: 12, fontSize: 12, color: C.slate600, fontWeight: 600 }}>{statusMsg}</div>

          <Card style={{ padding: "14px 20px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, background: C.indigo,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: C.white, fontSize: 13, fontWeight: 700,
              }}>
                {initialsOf(patient?.full_name || display?.patient_name)}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary }}>
                  {patient?.full_name || display?.patient_name || "Patient"}
                </div>
                <div style={{ fontSize: 12, color: C.slate500 }}>
                  {`${patient?.patient_id || display?.patient_id || "—"} · ${sid || "—"} · OD+OS · ${analyzeMeta?.model_used || "ensemble"}`}
                </div>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 22, fontWeight: 800, color: C.indigo, lineHeight: 1 }}>
                  {Math.round(progress)}%
                </div>
                <div style={{ fontSize: 10, color: C.slate400 }}>
                  {done ? fmtSec(elapsedMs) : running ? fmtSec(tickMs) : "—"}
                </div>
              </div>
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{
                background: C.navy, borderRadius: 18, padding: 28,
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", inset: 0, opacity: 0.04,
                  backgroundImage: "linear-gradient(rgba(79,70,229,1) 1px, transparent 1px), linear-gradient(90deg, rgba(79,70,229,1) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }} />

                <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", minHeight: 560 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12, zIndex: 2 }}>
                    {(["od", "os"] as const).map(e => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setEye(e)}
                        style={{
                          padding: "4px 12px", borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: "pointer",
                          border: `1px solid ${eye === e ? C.indigo : "rgba(255,255,255,0.15)"}`,
                          background: eye === e ? C.indigo : "transparent",
                          color: C.white,
                        }}
                      >
                        {e.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  {/* Orbit stage */}
                  <div style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: 520,
                    height: 500,
                    margin: "0 auto",
                  }}>
                    {/* Large satellite orbit rings */}
                    <div style={{
                      position: "absolute",
                      left: "50%", top: "42%",
                      width: 400, height: 400,
                      transform: "translate(-50%, -50%)",
                      borderRadius: "50%",
                      border: `1.5px solid ${C.indigo}28`,
                      boxShadow: `inset 0 0 60px ${C.indigo}10`,
                      pointerEvents: "none",
                    }} />
                    <div style={{
                      position: "absolute",
                      left: "50%", top: "42%",
                      width: 320, height: 320,
                      transform: "translate(-50%, -50%)",
                      borderRadius: "50%",
                      border: `1px dashed ${C.indigo}35`,
                      pointerEvents: "none",
                    }} />
                    <div style={{
                      position: "absolute",
                      left: "50%", top: "42%",
                      width: 280, height: 280,
                      transform: "translate(-50%, -50%)",
                      borderRadius: "50%",
                      border: `1px solid rgba(124,58,237,0.2)`,
                      pointerEvents: "none",
                    }} />

                    {/* Connector lines */}
                    <svg
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}
                      viewBox="0 0 520 500"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      <line x1="90" y1="100" x2="200" y2="180" stroke={`${C.indigo}55`} strokeWidth="1.5" strokeDasharray="5 4" className="conn-pulse" />
                      <line x1="430" y1="100" x2="320" y2="180" stroke={`rgba(124,58,237,0.55)`} strokeWidth="1.5" strokeDasharray="5 4" className="conn-pulse" />
                      <line x1="260" y1="430" x2="260" y2="300" stroke={`${C.indigo}55`} strokeWidth="1.5" strokeDasharray="5 4" className="conn-pulse" />
                    </svg>

                    {/* Left satellite — fellow eye */}
                    <div style={{
                      position: "absolute", left: 8, top: 56, zIndex: 2,
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                    }}>
                      <div style={{
                        padding: 4, borderRadius: "50%",
                        border: `1px solid ${C.indigo}40`,
                        boxShadow: `0 0 20px ${C.indigo}25`,
                        background: "rgba(15,23,42,0.5)",
                      }}>
                        <AuthImg
                          path={sid ? screeningImagePath(sid, eye === "od" ? "os" : "od") : null}
                          size={96}
                          round
                          label={eye === "od" ? "OS" : "OD"}
                        />
                      </div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: C.indigoDim, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        {eye === "od" ? "OS fundus" : "OD fundus"}
                      </div>
                      <Badge v={sid ? "completed" : "pending"} />
                    </div>

                    {/* Center — primary eye + radar (above heatmap so grade chip stays visible) */}
                    <div style={{
                      position: "absolute", left: "50%", top: "40%",
                      transform: "translate(-50%, -50%)", zIndex: 5,
                      display: "flex", flexDirection: "column", alignItems: "center",
                    }}>
                      <div style={{ position: "relative" }}>
                        <div className="radar-ring" style={{
                          position: "absolute", inset: -36, borderRadius: "50%",
                          border: `2px solid ${C.indigo}`, opacity: 0, pointerEvents: "none",
                        }} />
                        <div className="radar-ring-2" style={{
                          position: "absolute", inset: -36, borderRadius: "50%",
                          border: "1.5px solid rgba(124,58,237,0.65)", opacity: 0, pointerEvents: "none",
                        }} />
                        <div style={{
                          borderRadius: "50%",
                          padding: 5,
                          background: `radial-gradient(circle, ${C.indigo}22 0%, transparent 70%)`,
                          boxShadow: `0 0 40px ${C.indigo}30`,
                        }}>
                          <AuthImg
                            path={sid ? screeningImagePath(sid, eye) : null}
                            size={248}
                            round
                            label={`${eye.toUpperCase()} fundus`}
                          />
                        </div>
                        {!done && !analyzeError && (
                          <div style={{
                            position: "absolute", inset: 5, borderRadius: "50%",
                            background: `linear-gradient(to bottom, transparent 0%, ${C.indigo}18 45%, ${C.indigo}35 50%, ${C.indigo}18 55%, transparent 100%)`,
                            animation: "slideDown 2.2s linear infinite",
                            overflow: "hidden",
                            pointerEvents: "none",
                          }} />
                        )}
                        <div style={{
                          position: "absolute", bottom: 18, left: "50%", transform: "translateX(-50%)",
                          display: "flex", alignItems: "center", gap: 6, padding: "5px 12px",
                          borderRadius: 99, background: "rgba(79,70,229,0.95)", backdropFilter: "blur(4px)",
                          zIndex: 6,
                          boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
                        }}>
                          {!done && !analyzeError ? <Ico.Loader /> : <Ico.Check />}
                          <span style={{ fontSize: 10, fontWeight: 700, color: C.white, whiteSpace: "nowrap" }}>
                            {analyzeError ? "Failed" : done ? (dr?.label || "Complete") : "CNN + QML running"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right satellite — Grad-CAM */}
                    <div style={{
                      position: "absolute", right: 8, top: 56, zIndex: 2,
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                    }}>
                      <div style={{
                        padding: 4, borderRadius: "50%",
                        border: `1px solid rgba(124,58,237,0.45)`,
                        boxShadow: "0 0 20px rgba(124,58,237,0.25)",
                        background: "rgba(15,23,42,0.5)",
                      }}>
                        <AuthImg
                          path={done && gcOk ? gradcamImagePath(sid, eye, "overlay") : null}
                          size={96}
                          round
                          label={done ? (gcOk ? "Grad-CAM" : "No Grad-CAM") : "Waiting…"}
                        />
                      </div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: C.indigoDim, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        Grad-CAM
                      </div>
                      <Badge v={done && gcOk ? "completed" : done ? "ungradeable" : "pending"} />
                    </div>

                    {/* Bottom satellite — Heatmap (lower so it doesn't cover grade chip) */}
                    <div style={{
                      position: "absolute", left: "50%", bottom: 4,
                      transform: "translateX(-50%)", zIndex: 1,
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    }}>
                      <div style={{
                        padding: 4, borderRadius: "50%",
                        border: `1px solid ${C.indigo}40`,
                        boxShadow: `0 0 18px ${C.indigo}22`,
                        background: "rgba(15,23,42,0.5)",
                      }}>
                        <AuthImg
                          path={done && gcOk ? gradcamImagePath(sid, eye, "heatmap") : null}
                          size={72}
                          round
                          label={done ? "Heatmap" : "Queued"}
                        />
                      </div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: C.indigoDim, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        Heatmap
                      </div>
                      <Badge v={done && gcOk ? "completed" : "pending"} />
                    </div>
                  </div>

                  <div style={{ fontSize: 10, fontWeight: 600, color: C.slate400, marginTop: 4, zIndex: 2 }}>
                    {eye === "od" ? "Right Eye (OD)" : "Left Eye (OS)"} · Live upload
                  </div>
                </div>
              </div>

              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>Analysis Progress</div>
                    <div style={{ fontSize: 11, color: C.slate500, marginTop: 1 }}>
                      Live until API returns · {ml.note || "DINOv2 + Hybrid QML"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: C.slate500 }}>Elapsed</div>
                      <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 13, fontWeight: 700, color: C.textPrimary }}>
                        {done ? fmtSec(elapsedMs) : running ? fmtSec(tickMs) : "—"}
                      </div>
                    </div>
                    <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 26, fontWeight: 800, color: C.indigo, lineHeight: 1 }}>
                      {Math.round(progress)}%
                    </div>
                  </div>
                </div>
                <div style={{ height: 10, borderRadius: 99, background: C.borderLight, overflow: "hidden", position: "relative" }}>
                  <div className="shimmer" style={{
                    position: "absolute", inset: 0, borderRadius: 99,
                    width: `${Math.min(100, progress)}%`, transition: "width 0.3s ease",
                    background: C.indigo,
                  }} />
                </div>
              </Card>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  {
                    name: "Classical CNN",
                    icon: <Ico.Sparkles />,
                    desc: "DINOv2-base · 5-class DR",
                    status: ml.cnn || "—",
                    label: mc?.cnn_label,
                    conf: mc?.cnn_confidence,
                  },
                  {
                    name: "Quantum ML",
                    icon: <Ico.Atom />,
                    desc: "4-qubit Hybrid VQC · PCA",
                    status: ml.qml || "—",
                    label: mc?.qml_label,
                    conf: mc?.qml_confidence,
                  },
                ].map(m => (
                  <Card key={m.name} style={{ padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, background: `${C.indigo}15`,
                        display: "flex", alignItems: "center", justifyContent: "center", color: C.indigo,
                      }}>
                        {m.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary }}>{m.name}</div>
                        <div style={{ fontSize: 9, color: C.slate400 }}>{m.desc}</div>
                      </div>
                    </div>
                    {done && m.conf != null ? (
                      <>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary }}>{m.label || "—"}</div>
                        <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 20, fontWeight: 800, color: C.indigo, marginTop: 4 }}>
                          {m.conf.toFixed(3)}
                        </div>
                        <div style={{ marginTop: 8, height: 4, borderRadius: 99, background: C.borderLight, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min(100, m.conf * 100)}%`, background: C.indigo, borderRadius: 99 }} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ height: 4, borderRadius: 99, background: C.borderLight, overflow: "hidden" }}>
                          <div className="shimmer" style={{ height: "100%", borderRadius: 99, width: `${progress * 0.95}%`, background: C.indigo }} />
                        </div>
                        <div style={{ fontSize: 10, color: C.indigo, fontWeight: 600, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                          {analyzeError ? "Failed" : done ? `Status: ${m.status}` : (<><Ico.Loader /> Processing… ({m.status})</>)}
                        </div>
                      </>
                    )}
                  </Card>
                ))}
              </div>

              {done && (
                <Card title="Ensemble result">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, color: C.slate500 }}>DR grade</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: C.textPrimary }}>{dr?.label || `L${level}`}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: C.slate500 }}>Confidence</div>
                      <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 14, fontWeight: 800, color: C.indigo }}>
                        {conf != null ? conf.toFixed(3) : "—"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: C.slate500 }}>Report</div>
                      <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 13, fontWeight: 700, color: C.textPrimary }}>
                        {analyzeMeta?.report_id || display?.report_id || "—"}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Card>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, marginBottom: 4 }}>Processing Pipeline</div>
                <div style={{ fontSize: 11, color: C.slate400, marginBottom: 16 }}>
                  Live stages · {pipeline.filter(s => s.done).length}/{pipeline.length} done
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {pipeline.map((step, i) => (
                    <div key={step.label} style={{ display: "flex", gap: 12 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 700, flexShrink: 0,
                          background: step.done ? C.indigo : step.active ? C.white : C.bg,
                          color: step.done ? C.white : step.active ? C.indigo : C.slate400,
                          border: step.active ? `2px solid ${C.indigo}` : step.done ? "none" : `1.5px solid ${C.border}`,
                          boxShadow: step.active ? `0 0 0 4px ${C.indigo}15` : "none",
                        }}>
                          {step.done ? <Ico.Check /> : step.active ? <Ico.Loader /> : i + 1}
                        </div>
                        {i < pipeline.length - 1 && (
                          <div style={{
                            width: 2, flex: 1, minHeight: 14,
                            background: step.done ? C.indigo : C.border,
                            margin: "3px 0", borderRadius: 1,
                          }} />
                        )}
                      </div>
                      <div style={{ flex: 1, paddingBottom: i < pipeline.length - 1 ? 14 : 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: step.done || step.active ? C.textPrimary : C.slate400 }}>
                          {step.label}
                        </div>
                        <div style={{
                          fontSize: 10, marginTop: 1, fontFamily: "var(--font-jetbrains)",
                          color: step.done ? C.success : step.active ? C.indigo : C.slate300,
                        }}>
                          {step.detail}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Inference Details">
                <div style={{ marginTop: 8 }}>
                  {[
                    { label: "Device", value: ml.device || "Detecting…" },
                    { label: "CNN", value: ml.cnn === "live" ? "DINOv2-base · live" : `CNN · ${ml.cnn || "—"}` },
                    { label: "QML", value: ml.qml === "live" ? "Hybrid VQC · live" : `QML · ${ml.qml || "—"}` },
                    { label: "Model used", value: analyzeMeta?.model_used || display?.model_used || "ensemble" },
                    { label: "Winner", value: mc?.winner || "—" },
                    { label: "Input", value: "518×518 · OD+OS batch" },
                    { label: "Elapsed", value: done ? fmtSec(elapsedMs) : running ? fmtSec(tickMs) : "—" },
                    { label: "Report ID", value: analyzeMeta?.report_id || display?.report_id || "—" },
                  ].map(r => (
                    <div key={r.label} style={{
                      display: "flex", justifyContent: "space-between", padding: "6px 0",
                      borderBottom: `1px solid ${C.borderLight}`, fontSize: 11, gap: 8,
                    }}>
                      <span style={{ color: C.slate500, flexShrink: 0 }}>{r.label}</span>
                      <span style={{
                        fontFamily: "var(--font-jetbrains)", fontWeight: 600, color: C.textPrimary,
                        fontSize: 10, textAlign: "right",
                      }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Explainability">
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <AuthImg
                      path={done && grad?.od && !grad.od.error ? gradcamImagePath(sid, "od", "overlay") : null}
                      size={80}
                      label="OD Grad-CAM"
                    />
                    <span style={{ fontSize: 10, color: C.slate400, fontWeight: 600 }}>OD Grad-CAM</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <AuthImg
                      path={done && grad?.os && !grad.os.error ? gradcamImagePath(sid, "os", "overlay") : null}
                      size={80}
                      label="OS Grad-CAM"
                    />
                    <span style={{ fontSize: 10, color: C.slate400, fontWeight: 600 }}>OS Grad-CAM</span>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: C.slate400, textAlign: "center", marginTop: 8 }}>
                  {done
                    ? (display?.explainability?.summary || "Grad-CAM from CNN DINOv2")
                    : "Generated when analyze finishes"}
                </div>
              </Card>

              <ActionButton
                variant="primary"
                size="lg"
                onClick={onNext}
                disabled={!done || Boolean(analyzeError)}
                icon={done ? <Ico.ArrowR /> : <Ico.Loader />}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {analyzeError ? "Fix error to continue" : done ? nextLabel : "Analysis in progress…"}
              </ActionButton>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  const onNav = useAppNav();
  const flow = useScreeningFlowNav("/screening/ai-analysis");
  return <AIAnalysisScreen onNav={onNav} onNext={flow.goNext} nextLabel={flow.buttonLabel} />;
}
