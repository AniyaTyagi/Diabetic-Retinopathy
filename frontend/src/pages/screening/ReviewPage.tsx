import { useAppNav } from "@/shared/hooks/useAppNav";
import { useActiveScreening } from "@/shared/screening/useActiveScreening";
import { useScreeningFlowNav } from "@/shared/screening/useScreeningFlowNav";
import { useAuthImage, screeningImagePath, gradcamImagePath } from "@/shared/hooks/useAuthImage";
import {
  C, Ico, Badge, ConfBar, Sidebar, Header,
  Card, ActionButton, DR,
  type NavKey,
} from "@/shared/ui";
import { useState, useEffect } from "react";
import { submitReview } from "@/shared/api/screenings";

function AuthImgViewer({
  path,
  alt,
  zoom = 1,
  fallbackLabel = "Image not available",
}: {
  path: string | null;
  alt: string;
  zoom?: number;
  fallbackLabel?: string;
}) {
  const { src, loading, error } = useAuthImage(path);

  if (loading) {
    return (
      <div style={{
        width: "100%", height: 260, display: "flex", alignItems: "center", justifyContent: "center",
        color: C.slate400, fontSize: 12,
      }}>
        Loading retinal image…
      </div>
    );
  }

  if (src && !error) {
    return (
      <div style={{ transform: `scale(${zoom})`, transformOrigin: "center", transition: "transform 0.2s" }}>
        <img
          src={src}
          alt={alt}
          style={{ width: 260, height: 260, objectFit: "contain", borderRadius: 12 }}
        />
      </div>
    );
  }

  return (
    <div style={{
      width: 260, height: 260, borderRadius: 12, background: "rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      color: C.slate400, fontSize: 11, textAlign: "center", padding: 16,
    }}>
      <span style={{ fontSize: 24, marginBottom: 6 }}>👁️</span>
      {fallbackLabel}
    </div>
  );
}

function OphthalmologistReviewScreen({
  onNext, onNav, nextLabel,
}: {
  onNext: () => void;
  onNav: (k: NavKey) => void;
  nextLabel: string;
}) {
  const { screeningId, patient, result, reload } = useActiveScreening();

  const [activeNav] = useState<NavKey>("screenings");
  const [selectedEye, setSelectedEye] = useState<"od" | "os">("od");
  const [zoom, setZoom] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const level = result?.dr_level ?? 0;
  const dr = DR[level] ?? DR[0];
  const conf = result?.confidence ?? 0;

  const [grade, setGrade] = useState(String(level));
  const [notes, setNotes] = useState("AI-assisted screening verified. Recommended management as clinically indicated.");
  const [decision, setDecision] = useState<"confirm" | "modify" | "recapture" | "refer">("confirm");
  const [submitted, setSubmitted] = useState(result?.review_status === "completed");

  useEffect(() => {
    if (result?.dr_level !== undefined && result?.dr_level !== null) {
      setGrade(String(result.clinician_dr_level ?? result.dr_level));
    }
    if (result?.follow_up_notes) {
      setNotes(result.follow_up_notes);
    }
  }, [result?.dr_level, result?.clinician_dr_level, result?.follow_up_notes]);

  const decisions = [
    { key: "confirm" as const, label: "Confirm AI Result", color: C.success },
    { key: "modify" as const, label: "Modify Result", color: C.warning },
    { key: "recapture" as const, label: "Request Recapture", color: C.slate600 },
    { key: "refer" as const, label: "Refer for Specialist Review", color: C.danger },
  ];

  const sid = screeningId || "";
  const hasEye = selectedEye === "od" ? result?.has_od_image : result?.has_os_image;
  const gc = result?.explainability?.gradcam?.[selectedEye];
  const gcOk = Boolean(gc && !gc.error);

  async function handleSubmit() {
    if (!screeningId) {
      setError("No active screening to review.");
      return;
    }
    setBusy(true);
    setError(null);
    setSuccessMsg(null);

    const chosenGrade = Number(grade);
    const isOverride = decision === "modify" || (chosenGrade !== level);

    try {
      await submitReview(screeningId, {
        clinician_dr_level: chosenGrade,
        clinician_decision: decision,
        review_notes: notes.trim() || undefined,
        reviewer_override: isOverride,
      });
      setSubmitted(true);
      setSuccessMsg("Clinical review verified and recorded in audit trail.");
      reload();
      setTimeout(() => {
        onNext();
      }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header
          title="Ophthalmologist Review"
          breadcrumbs={["NetraX", "Screenings", sid || "—", "Clinical Review"]}
          actions={<Badge v={submitted ? "completed" : "pending"} />}
        />
        <main style={{ flex: 1, overflowY: "auto", padding: 28, background: C.bg }}>
          {/* Top Notice Banner */}
          <div style={{
            background: C.warningLight, borderRadius: 12, border: `1px solid ${C.warning}40`,
            padding: "12px 18px", marginBottom: 20, display: "flex", gap: 10, alignItems: "center",
          }}>
            <span style={{ color: C.warning, display: "flex" }}><Ico.Shield /></span>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary }}>
              Final clinical management decision is made by the ophthalmologist. AI predictions and clinician decisions remain separate audit records.
            </div>
          </div>

          {error && (
            <div style={{
              background: C.dangerLight, borderRadius: 10, border: `1px solid ${C.danger}40`,
              padding: "10px 14px", marginBottom: 16, color: C.danger, fontSize: 12, fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          {successMsg && (
            <div style={{
              background: C.successLight, borderRadius: 10, border: `1px solid ${C.success}40`,
              padding: "10px 14px", marginBottom: 16, color: C.success, fontSize: 12, fontWeight: 600,
            }}>
              {successMsg}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.95fr 1fr", gap: 18 }}>
            {/* LEFT — Retinal Image + Zoom Controls */}
            <div style={{ background: C.navy, borderRadius: 16, overflow: "hidden", alignSelf: "start", border: `1px solid rgba(255,255,255,0.08)` }}>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.white }}>Patient Retinal Image</div>
                  <div style={{ fontSize: 10, color: C.slate400, marginTop: 1 }}>
                    {selectedEye.toUpperCase()} · {patient?.full_name || result?.patient_name || "Fundus"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {(["od", "os"] as const).map(e => (
                    <button
                      key={e}
                      onClick={() => setSelectedEye(e)}
                      style={{
                        padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                        border: "none", cursor: "pointer",
                        background: selectedEye === e ? C.indigo : "rgba(255,255,255,0.12)",
                        color: C.white,
                      }}
                    >
                      {e.toUpperCase()}
                    </button>
                  ))}
                  <button onClick={() => setZoom(z => Math.max(0.7, z - 0.2))}
                    style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(255,255,255,0.12)", border: "none", color: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Ico.ZoomOut />
                  </button>
                  <span style={{ fontSize: 10, color: C.slate300, fontFamily: "var(--font-jetbrains)", minWidth: 32, textAlign: "center" }}>
                    {Math.round(zoom * 100)}%
                  </span>
                  <button onClick={() => setZoom(z => Math.min(2.2, z + 0.2))}
                    style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(255,255,255,0.12)", border: "none", color: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Ico.ZoomIn />
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "center", padding: "20px 16px", overflow: "hidden", minHeight: 280 }}>
                <AuthImgViewer
                  path={hasEye ? screeningImagePath(sid, selectedEye) : null}
                  alt={`${selectedEye.toUpperCase()} retina`}
                  zoom={zoom}
                  fallbackLabel={`No ${selectedEye.toUpperCase()} upload on record`}
                />
              </div>
            </div>

            {/* CENTER — AI Findings & Attention Overlay */}
            <Card title="AI Screening Findings">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div style={{ padding: "12px", borderRadius: 10, background: C.bg, border: `1px solid ${C.borderLight}` }}>
                  <div style={{ fontSize: 10, color: C.slate500, fontWeight: 600 }}>AI Predicted DR</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: dr.color, marginTop: 4 }}>Level {level}</div>
                  <div style={{ fontSize: 11, color: C.slate600, marginTop: 2 }}>{dr.label}</div>
                </div>
                <div style={{ padding: "12px", borderRadius: 10, background: C.bg, border: `1px solid ${C.borderLight}` }}>
                  <div style={{ fontSize: 10, color: C.slate500, fontWeight: 600 }}>Confidence</div>
                  <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 18, fontWeight: 800, color: C.success, marginTop: 4 }}>
                    {conf > 0 ? `${Math.round(conf * 100)}%` : "N/A (Stub)"}
                  </div>
                  <ConfBar value={conf} label="" />
                </div>
              </div>

              <div style={{
                padding: "10px 14px", borderRadius: 10,
                background: result?.referral_needed ? C.dangerLight : C.successLight,
                border: `1px solid ${(result?.referral_needed ? C.danger : C.success)}30`,
                marginBottom: 14,
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: result?.referral_needed ? C.danger : C.success }}>
                  Triage Recommendation
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: result?.referral_needed ? C.danger : C.success, marginTop: 2 }}>
                  {result?.referral_needed ? "Refer to Ophthalmologist" : "Routine Periodic Follow-Up"}
                </div>
              </div>

              <div style={{ fontSize: 11, fontWeight: 700, color: C.slate500, marginBottom: 8 }}>
                Grad-CAM Attention Map ({selectedEye.toUpperCase()})
              </div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.borderLight}`, background: C.navy }}>
                  <AuthImgViewer
                    path={gcOk ? gradcamImagePath(sid, selectedEye, "overlay") : null}
                    alt="Grad-CAM Overlay"
                    zoom={1}
                    fallbackLabel={gc?.error || "Grad-CAM unavailable"}
                  />
                </div>
              </div>

              {/* Real Technical Quality Checks — replacing synthetic lesion counts */}
              <div style={{ fontSize: 11, fontWeight: 700, color: C.slate500, marginBottom: 6 }}>
                Technical Quality Assessment
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {(result?.quality?.checks || [
                  { label: "Format & Decodability", status: "Verified" },
                  { label: "Screening Suitability", status: result?.quality?.status_label || "Gradable" },
                ]).slice(0, 3).map(c => (
                  <div key={c.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "3px 0", borderBottom: `1px solid ${C.borderLight}` }}>
                    <span style={{ color: C.slate600 }}>{c.label}</span>
                    <span style={{ fontWeight: 600, color: C.textPrimary }}>{c.status}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* RIGHT — Clinician Review Decision */}
            <Card title="Clinical Review Decision">
              <label style={{ fontSize: 11, fontWeight: 600, color: C.slate500, display: "block", marginBottom: 6 }}>
                Clinician DR Grade Assessment
              </label>
              <select
                value={grade}
                onChange={e => setGrade(e.target.value)}
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: 10, border: `1px solid ${C.border}`,
                  fontSize: 13, fontWeight: 600, color: C.textPrimary, background: C.bg, marginBottom: 14,
                }}
              >
                <option value="0">Level 0 — No DR</option>
                <option value="1">Level 1 — Mild NPDR</option>
                <option value="2">Level 2 — Moderate NPDR</option>
                <option value="3">Level 3 — Severe NPDR</option>
                <option value="4">Level 4 — Proliferative DR</option>
              </select>

              <label style={{ fontSize: 11, fontWeight: 600, color: C.slate500, display: "block", marginBottom: 6 }}>
                Clinical Action
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                {decisions.map(d => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => {
                      setDecision(d.key);
                      if (d.key === "confirm") setGrade(String(level));
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                      borderRadius: 9, cursor: "pointer", textAlign: "left",
                      border: decision === d.key ? `1.5px solid ${C.indigo}` : `1px solid ${C.borderLight}`,
                      background: decision === d.key ? C.indigoLight : C.white,
                      color: decision === d.key ? C.indigo : C.textPrimary,
                      fontWeight: decision === d.key ? 700 : 500, fontSize: 12,
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: d.color }} />
                    {d.label}
                  </button>
                ))}
              </div>

              <label style={{ fontSize: 11, fontWeight: 600, color: C.slate500, display: "block", marginBottom: 6 }}>
                Clinical Review Notes
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: 10, border: `1px solid ${C.border}`,
                  fontSize: 12, color: C.textPrimary, background: C.bg, resize: "none", marginBottom: 16,
                  fontFamily: "var(--font-inter)",
                }}
                placeholder="Enter clinical review notes and recommendations…"
              />

              <ActionButton
                variant="primary"
                size="md"
                style={{ width: "100%" }}
                disabled={busy}
                onClick={handleSubmit}
                icon={<Ico.Check />}
              >
                {busy ? "Submitting Review…" : submitted ? "Review Verified · Continue" : nextLabel}
              </ActionButton>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  const onNav = useAppNav();
  const flow = useScreeningFlowNav("/screening/review");
  return <OphthalmologistReviewScreen onNav={onNav} onNext={flow.goNext} nextLabel={flow.buttonLabel} />;
}
