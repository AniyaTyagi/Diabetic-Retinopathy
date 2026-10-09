import { useAppNav } from "@/shared/hooks/useAppNav";
import { useActiveScreening } from "@/shared/screening/useActiveScreening";
import { useScreeningFlowNav } from "@/shared/screening/useScreeningFlowNav";
import { initialsOf } from "@/shared/screening/session";
import { PatientContextBar } from "@/shared/screening/PatientContextBar";
import {
  C, Ico, FundusImg, NetraXLogo, Badge, ConfBar, Sidebar, Header,
  Card, StatCard, CardRow, ActionButton,
  QualityArc, LesionMapImg, VesselMapImg, DiscMapImg, FoveaMapImg,
  GradCamHeatmapImg, ArchStep, ArchArrow, FilterChip, MiniBarChart, DonutMini,
  FundusDeviceVisual, PipelineNode, PipelineArrow, RoleBadge, DR, LESION_META,
  type NavKey, type FundusV, type LesionType, type BadgeV,
} from "@/shared/ui";
import { useState } from "react";
import { updateScreeningStep } from "@/shared/api/screenings";

function OphthalmologistReviewScreen({
 onNext, onNav, nextLabel }: { onNext: () => void; onNav: (k: NavKey) => void; nextLabel: string }) {
  const { screeningId, patient, result } = useActiveScreening();

  const [activeNav] = useState<NavKey>("screenings");
  const [zoom, setZoom] = useState(1);
  const level = result?.dr_level ?? 2;
  const dr = DR[level] ?? DR[2];
  const conf = result?.confidence ?? 0;
  const [grade, setGrade] = useState(String(level));
  const [notes, setNotes] = useState("Agree with AI findings. Recommend ophthalmology follow-up as indicated.");
  const [decision, setDecision] = useState<"confirm"|"modify"|"recapture"|"refer">("confirm");
  const [submitted, setSubmitted] = useState(false);

  const decisions = [
    { key:"confirm" as const, label:"Confirm AI Result", color:C.success },
    { key:"modify" as const, label:"Modify Result", color:C.warning },
    { key:"recapture" as const, label:"Request Recapture", color:C.slate600 },
    { key:"refer" as const, label:"Refer for Specialist Review", color:C.danger },
  ];

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <Header
          title="Ophthalmologist Review"
          breadcrumbs={["NetraX","Screenings", screeningId || "—","Clinical Review"]}
          actions={<Badge v="pending" />}
        />
        <main style={{ flex:1, overflowY:"auto", padding:28, background:C.bg }}>
          {/* Top Notice Banner */}
          <div style={{
            background:C.warningLight, borderRadius:12, border:`1px solid ${C.warning}40`,
            padding:"12px 18px", marginBottom:20, display:"flex", gap:10, alignItems:"center",
          }}>
            <span style={{ color:C.warning, display:"flex" }}><Ico.Shield /></span>
            <div style={{ fontSize:13, fontWeight:600, color:C.textPrimary }}>
              Final clinical decision is made by the ophthalmologist. AI outputs are decision-support only.
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1.05fr 0.95fr 1fr", gap:18 }}>
            {/* LEFT — image + zoom */}
            <div style={{ background:C.navy, borderRadius:16, overflow:"hidden", alignSelf:"start", border:`1px solid rgba(255,255,255,0.08)` }}>
              <div style={{ padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.08)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:C.white }}>Retinal Image</div>
                  <div style={{ fontSize:10, color:C.slate400, marginTop:1 }}>OD · Right Eye · Interactive Zoom</div>
                </div>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <button onClick={() => setZoom(z => Math.max(0.7, z-0.2))}
                    style={{ width:28, height:28, borderRadius:7, background:"rgba(255,255,255,0.12)", border:"none", color:C.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Ico.ZoomOut />
                  </button>
                  <span style={{ fontSize:11, color:C.slate300, fontFamily:"var(--font-jetbrains)", minWidth:38, textAlign:"center" }}>{Math.round(zoom*100)}%</span>
                  <button onClick={() => setZoom(z => Math.min(2.2, z+0.2))}
                    style={{ width:28, height:28, borderRadius:7, background:"rgba(255,255,255,0.12)", border:"none", color:C.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Ico.ZoomIn />
                  </button>
                </div>
              </div>
              <div style={{ display:"flex", justifyContent:"center", padding:"28px 16px", overflow:"hidden" }}>
                <div style={{ transform:`scale(${zoom})`, transformOrigin:"center", transition:"transform 0.25s" }}>
                  <FundusImg variant="moderate" size={260} />
                </div>
              </div>
            </div>

            {/* CENTER — AI findings Card */}
            <Card title="AI Findings">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
                <div style={{ padding:"12px", borderRadius:10, background:C.bg, border:`1px solid ${C.borderLight}` }}>
                  <div style={{ fontSize:10, color:C.slate500, fontWeight:600 }}>DR Level</div>
                  <div style={{ fontSize:18, fontWeight:800, color:dr.color, marginTop:4 }}>Level {level}</div>
                  <div style={{ fontSize:11, color:C.slate600, marginTop:2 }}>{dr.label}</div>
                </div>
                <div style={{ padding:"12px", borderRadius:10, background:C.bg, border:`1px solid ${C.borderLight}` }}>
                  <div style={{ fontSize:10, color:C.slate500, fontWeight:600 }}>Confidence</div>
                  <div style={{ fontFamily:"var(--font-jetbrains)", fontSize:18, fontWeight:800, color:C.success, marginTop:4 }}>{Math.round(conf * 100)}%</div>
                  <ConfBar value={conf} label="" />
                </div>
              </div>

              <div style={{
                padding:"12px 14px", borderRadius:10, background:C.dangerLight,
                border:`1px solid ${C.danger}30`, marginBottom:14,
              }}>
                <div style={{ fontSize:10, fontWeight:600, color:C.danger }}>Recommendation</div>
                <div style={{ fontSize:14, fontWeight:800, color:C.danger, marginTop:2 }}>Refer to Specialist</div>
              </div>

              <div style={{ fontSize:11, fontWeight:700, color:C.slate500, marginBottom:8 }}>Grad-CAM Activation</div>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:14 }}>
                <div style={{ borderRadius:10, overflow:"hidden", border:`1px solid ${C.borderLight}` }}>
                  <GradCamHeatmapImg size={120} mode="overlay" />
                </div>
              </div>

              <div style={{ fontSize:11, fontWeight:700, color:C.slate500, marginBottom:8 }}>Lesion Detection Count</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {(["ma","hm","ex","nv"] as LesionType[]).map(t => (
                  <div key={t} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                    <LesionMapImg type={t} size={54} />
                    <span style={{ fontSize:9, fontWeight:700, color:C.textPrimary }}>{LESION_META[t].count}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* RIGHT — clinical review Card */}
            <Card title="Clinical Review">
              <label style={{ fontSize:11, fontWeight:600, color:C.slate500, display:"block", marginBottom:6 }}>
                Ophthalmologist Assessment
              </label>
              <select
                value={grade}
                onChange={e => setGrade(e.target.value)}
                style={{
                  width:"100%", padding:"9px 12px", borderRadius:10, border:`1px solid ${C.border}`,
                  fontSize:13, fontWeight:600, color:C.textPrimary, background:C.bg, marginBottom:14,
                }}
              >
                <option value="0">Level 0 — No DR</option>
                <option value="1">Level 1 — Mild NPDR</option>
                <option value="2">Level 2 — Moderate NPDR</option>
                <option value="3">Level 3 — Severe NPDR</option>
                <option value="4">Level 4 — Proliferative DR</option>
              </select>

              <label style={{ fontSize:11, fontWeight:600, color:C.slate500, display:"block", marginBottom:6 }}>
                Clinical Decision Action
              </label>
              <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:14 }}>
                {decisions.map(d => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setDecision(d.key)}
                    style={{
                      display:"flex", alignItems:"center", gap:10, padding:"8px 12px",
                      borderRadius:9, cursor:"pointer", textAlign:"left",
                      border: decision === d.key ? `1.5px solid ${C.indigo}` : `1px solid ${C.borderLight}`,
                      background: decision === d.key ? C.indigoLight : C.white,
                      color: decision === d.key ? C.indigo : C.textPrimary,
                      fontWeight: decision === d.key ? 700 : 500, fontSize:12,
                    }}
                  >
                    <span style={{ width:7, height:7, borderRadius:"50%", background:d.color }} />
                    {d.label}
                  </button>
                ))}
              </div>

              <label style={{ fontSize:11, fontWeight:600, color:C.slate500, display:"block", marginBottom:6 }}>
                Clinical Notes
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                style={{
                  width:"100%", padding:"9px 12px", borderRadius:10, border:`1px solid ${C.border}`,
                  fontSize:12, color:C.textPrimary, background:C.bg, resize:"none", marginBottom:14,
                  fontFamily:"var(--font-inter)",
                }}
              />

              <ActionButton
                variant="primary"
                size="md"
                style={{ width:"100%" }}
                onClick={async () => {
                  setSubmitted(true);
                  if (screeningId) {
                    try {
                      await updateScreeningStep(screeningId, {
                        step: "reviewed",
                        status: "reviewed",
                        review_status: "completed",
                      });
                    } catch { /* keep UI moving */ }
                  }
                  onNext();
                }}
                icon={<Ico.Check />}
              >
                {submitted ? "Decision Submitted" : nextLabel}
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
