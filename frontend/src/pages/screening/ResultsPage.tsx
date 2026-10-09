import { useNavigate } from "react-router-dom";
import { useAppNav } from "@/shared/hooks/useAppNav";
import { useActiveScreening } from "@/shared/screening/useActiveScreening";
import { useScreeningFlowNav } from "@/shared/screening/useScreeningFlowNav";
import { useApiData } from "@/shared/hooks/useApiData";
import { getScreeningResults } from "@/shared/api/screenings";
import { useAuthImage, screeningImagePath } from "@/shared/hooks/useAuthImage";
import {
  C, Ico, FundusImg, Badge, ConfBar, Sidebar, Header,
  Card, ActionButton, DR,
  type NavKey, type FundusV,
} from "@/shared/ui";
import { useState } from "react";

const DR_SHORT = ["No DR", "Mild", "Moderate", "Severe", "PDR"];

function thumbForLevel(level: number): FundusV {
  if (level >= 4) return "proliferative";
  if (level >= 3) return "severe";
  if (level >= 2) return "moderate";
  if (level >= 1) return "mild";
  return "normal";
}

function EyeFundus({
  screeningId,
  eye,
  hasImage,
  level,
  size = 340,
}: {
  screeningId: string;
  eye: "od" | "os";
  hasImage?: boolean;
  level: number;
  size?: number;
}) {
  const path = hasImage ? screeningImagePath(screeningId, eye) : null;
  const { src, loading } = useAuthImage(path);
  if (src) {
    return (
      <img
        src={src}
        alt={`${eye.toUpperCase()} fundus`}
        style={{
          width: size,
          height: size,
          objectFit: "cover",
          borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.15)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
        }}
      />
    );
  }
  return (
    <div style={{ position: "relative" }}>
      <FundusImg variant={thumbForLevel(level)} size={size} />
      {loading && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          color: C.slate300, fontSize: 11, fontWeight: 600,
        }}>Loading upload…</div>
      )}
    </div>
  );
}

function ProbBars({ probs }: { probs?: Record<string, number> | null }) {
  if (!probs) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
      {DR_SHORT.map((label, i) => {
        const v = probs[String(i)] ?? 0;
        return (
          <div key={label}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 2 }}>
              <span style={{ color: C.slate500, fontWeight: 600 }}>L{i} {label}</span>
              <span style={{ fontFamily: "var(--font-jetbrains)", color: C.textPrimary }}>{(v * 100).toFixed(1)}%</span>
            </div>
            <div style={{ height: 5, borderRadius: 99, background: C.slate200, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, v * 100)}%`, background: (DR[i] ?? DR[0]).color, borderRadius: 99 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ResultsOverviewScreen({ onNext, onNav, screeningId, nextLabel, showReport }: {
  onNext: () => void;
  onNav: (k: NavKey) => void;
  screeningId: string;
  nextLabel: string;
  showReport: boolean;
}) {
  const navigate = useNavigate();
  const [activeNav] = useState<NavKey>("screenings");
  const [eye, setEye] = useState<"od" | "os">("od");
  const { data: result, loading, error } = useApiData(
    () => getScreeningResults(screeningId),
    null as Awaited<ReturnType<typeof getScreeningResults>> | null,
    [screeningId],
  );

  const level = result?.dr_level ?? 0;
  const dr = DR[level] ?? DR[0];
  const conf = result?.confidence ?? 0;
  const initials = (result?.patient_name || "?")
    .split(" ")
    .map(p => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const mc = result?.explainability?.model_compare;
  const perEye = result?.per_eye || result?.explainability?.per_eye || [];
  const eyeIdx = eye === "od" ? 0 : Math.min(1, Math.max(0, perEye.length - 1));
  const eyeResult = perEye[eyeIdx];
  const hasEye = eye === "od" ? result?.has_od_image : result?.has_os_image;

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header
          title="Results Overview"
          breadcrumbs={["NetraX", "Screenings", screeningId, "Results"]}
          actions={<Badge v={dr.referable ? "referable" : "normal"} />}
        />
        <main style={{ flex: 1, overflowY: "auto", padding: 28, background: C.bg }}>
          {error && <div style={{ marginBottom: 12, fontSize: 12, color: C.danger }}>{error}</div>}
          {loading && <div style={{ marginBottom: 12, fontSize: 12, color: C.slate500 }}>Loading results…</div>}

          <Card style={{ padding: "14px 20px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: C.indigo, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontSize: 13, fontWeight: 700 }}>{initials}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary }}>{result?.patient_name || "Patient"}</div>
                <div style={{ fontSize: 12, color: C.slate500 }}>
                  {result?.patient_id || "—"} · Screening {screeningId} · {result?.model_used || "AI"} · uploaded fundus
                </div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                <Badge v={result?.review_status === "pending" ? "pending" : "completed"} />
                <Badge v={dr.referable ? "referable" : "normal"} />
              </div>
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 20 }}>
            <div style={{ background: C.navy, borderRadius: 18, overflow: "hidden", border: `1px solid rgba(255,255,255,0.08)` }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>
                    Fundus — {eye === "od" ? "Right Eye (OD)" : "Left Eye (OS)"}
                  </div>
                  <div style={{ fontSize: 11, color: C.slate400, marginTop: 1 }}>
                    {hasEye ? "Uploaded clinical image" : "Placeholder (no upload for this eye)"} · {dr.label}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {(["od", "os"] as const).map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEye(e)}
                      style={{
                        border: "none", cursor: "pointer", padding: "6px 12px", borderRadius: 99,
                        fontSize: 11, fontWeight: 700,
                        background: eye === e ? C.indigo : "rgba(255,255,255,0.08)",
                        color: eye === e ? C.white : C.slate300,
                      }}
                    >
                      {e.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "center", padding: "32px 24px" }}>
                <EyeFundus screeningId={screeningId} eye={eye} hasImage={hasEye} level={eyeResult?.dr_level ?? level} />
              </div>
              {eyeResult && (
                <div style={{ padding: "0 20px 20px", color: C.slate300, fontSize: 12 }}>
                  Eye grade L{eyeResult.dr_level} · conf {((eyeResult.confidence ?? 0) * 100).toFixed(1)}%
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Card>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.slate500, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8 }}>Ensemble DR Severity</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 38, fontWeight: 800, color: dr.color, lineHeight: 1 }}>Level {dr.level}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: dr.text }}>{dr.label}</span>
                </div>
                <div style={{
                  marginTop: 14, padding: "14px 18px", borderRadius: 12,
                  background: dr.referable ? C.dangerLight : C.successLight,
                  border: `1px solid ${dr.referable ? C.danger : C.success}35`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: dr.referable ? C.danger : C.success, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.3 }}>Status</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: dr.referable ? C.danger : C.success, letterSpacing: -0.3 }}>
                    {dr.referable ? "Referable DR" : "Non-referable"}
                  </div>
                </div>
              </Card>

              <Card>
                <ConfBar value={conf} label="Ensemble Confidence" />
                {mc?.qml_label != null && (
                  <div style={{
                    marginTop: 12, padding: "10px 14px", borderRadius: 10,
                    background: C.bg, border: `1px solid ${C.border}`,
                    fontSize: 12, color: C.slate600,
                  }}>
                    <span style={{ fontWeight: 700, color: C.indigo }}>QML suggests: </span>
                    {mc.qml_label}
                    {typeof mc.qml_confidence === "number" && (
                      <span style={{ fontFamily: "var(--font-jetbrains)", marginLeft: 6, color: C.slate500 }}>
                        ({(mc.qml_confidence * 100).toFixed(0)}%)
                      </span>
                    )}
                    {mc.disagree && (
                      <span style={{ marginLeft: 8, fontSize: 11, color: C.slate400 }}>(differs from final grade)</span>
                    )}
                  </div>
                )}
                <div style={{
                  marginTop: 14, padding: "12px 16px", borderRadius: 12,
                  background: C.indigoLight, border: `1px solid ${C.indigoDim}`,
                  display: "flex", gap: 12, alignItems: "flex-start",
                }}>
                  <div style={{ color: C.indigo, marginTop: 2 }}><Ico.ArrowR /></div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.indigo, marginBottom: 4 }}>AI Recommendation</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary }}>
                      {result?.referral_needed
                        ? "Refer to District Hospital / ophthalmology within 30 days"
                        : "Routine follow-up; no urgent referral indicated"}
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Per-eye class probabilities (CNN)">
                <ProbBars probs={eyeResult?.probabilities} />
                {!eyeResult?.probabilities && (
                  <div style={{ fontSize: 12, color: C.slate500, marginTop: 8 }}>Run Analyze to populate per-eye softmax scores.</div>
                )}
              </Card>

              <Card title="Live model scores">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
                  {[
                    {
                      name: "CNN · DINOv2",
                      conf: mc?.cnn_confidence ?? conf,
                      sub: mc?.cnn_label ?? "—",
                      color: C.slate600,
                    },
                    {
                      name: "QML · Hybrid",
                      conf: mc?.qml_confidence ?? conf,
                      sub: mc?.qml_label ?? "—",
                      color: C.indigo,
                    },
                  ].map(m => (
                    <div key={m.name} style={{
                      padding: "14px 14px", borderRadius: 12, background: C.bg,
                      border: `1.5px solid ${C.border}`,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.slate500, marginBottom: 4 }}>{m.name}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary, marginBottom: 6 }}>{m.sub}</div>
                      <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 22, fontWeight: 800, color: m.color }}>{m.conf.toFixed(2)}</div>
                      <div style={{ marginTop: 8, height: 4, borderRadius: 99, background: C.slate200, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.min(100, m.conf * 100)}%`, background: m.color, borderRadius: 99 }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  <ActionButton variant="primary" size="md" style={{ width: "100%" }} onClick={onNext} icon={<Ico.ArrowR />}>
                    {nextLabel}
                  </ActionButton>
                  {showReport && result?.report_id && (
                    <ActionButton
                      variant="secondary"
                      size="md"
                      style={{ width: "100%" }}
                      onClick={() => navigate(`/reports/clinical?id=${encodeURIComponent(result.report_id!)}`)}
                    >
                      View Report ({result.report_id})
                    </ActionButton>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  const onNav = useAppNav();
  const { screeningId } = useActiveScreening();
  const flow = useScreeningFlowNav("/screening/results");
  const sid = screeningId || "";
  return (
    <ResultsOverviewScreen
      onNav={onNav}
      screeningId={sid}
      onNext={flow.goNext}
      nextLabel={flow.buttonLabel}
      showReport={flow.canPath("/reports/clinical")}
    />
  );
}
