import { useNavigate } from "react-router-dom";
import { useAppNav } from "@/shared/hooks/useAppNav";
import { useActiveScreening } from "@/shared/screening/useActiveScreening";
import { screeningPath, initialsOf } from "@/shared/screening/session";
import { PatientContextBar } from "@/shared/screening/PatientContextBar";
import {
  C, Ico, FundusImg, NetraXLogo, Badge, ConfBar, Sidebar, Header,
  Card, ActionButton,
  QualityArc, LesionMapImg, VesselMapImg, DiscMapImg, FoveaMapImg,
  GradCamHeatmapImg, ArchStep, ArchArrow, FilterChip, MiniBarChart, DonutMini,
  FundusDeviceVisual, PipelineNode, PipelineArrow, RoleBadge, DR, LESION_META,
  type NavKey, type FundusV, type LesionType, type BadgeV,
} from "@/shared/ui";
import { useState } from "react";

function StructureAnalysisScreen({
 onNext, onNav }: { onNext: () => void; onNav: (k: NavKey) => void }) {
  const { screeningId, patient, result } = useActiveScreening();

  const [activeNav] = useState<NavKey>("screenings");
  const [zoom, setZoom] = useState(1);
  const [activeStruct, setActiveStruct] = useState<string|null>("disc");

  const st = result?.structure;
  const structures = [
    { key:"disc",   label:"Optic Disc",        status: st?.optic_disc?.status || "Detected",   icon:<Ico.Eye />,   color:C.warning, detail: st?.optic_disc ? `C/D ratio: ${st.optic_disc.cdr_estimate ?? "—"} · ${st.optic_disc.note || ""}` : "C/D ratio pending" },
    { key:"fovea",  label:"Fovea / Macula",    status: st?.macula?.status || "Detected",   icon:<Ico.Scan />,  color:C.purple,  detail: st?.macula?.note || "Location confirmed" },
    { key:"vessel", label:"Retinal Vessels",   status: "Segmented",  icon:<Ico.Activity />, color:C.indigo, detail: st?.vessels ? `${st.vessels.arcade || ""} · ${st.vessels.caliber || ""}` : "Vessel map pending" },
    { key:"nerve",  label:"FOV / Field",       status: st?.fov?.usable ? "Usable" : "Assessed",   icon:<Ico.Layers />, color:C.success, detail: st?.fov?.coverage ? `Coverage: ${st.fov.coverage}` : "Field assessed" },
  ];

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <Header title="Retinal Structure Analysis" breadcrumbs={["NetraX","Screenings", screeningId || "—","Structure Analysis"]}
          actions={<Badge v="completed" />}
        />
        <main style={{ flex:1, overflowY:"auto", padding:28, background:C.bg }}>
          <div style={{
            marginBottom: 16, padding: "12px 16px", borderRadius: 12,
            background: C.warningLight, border: `1px solid ${C.warning}35`,
            fontSize: 12, color: C.slate700, lineHeight: 1.55,
          }}>
            <strong style={{ color: C.textPrimary }}>Illustrative structure cues.</strong>{" "}
            {result?.structure?.disclaimer
              || "Not a dedicated optic-disc / macula segmentation model — heuristic from DR grade."}
          </div>
          {/* Patient bar */}
          <Card style={{ padding:"14px 20px", marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:C.indigo, display:"flex", alignItems:"center", justifyContent:"center", color:C.white, fontSize:13, fontWeight:700 }}>SD</div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:C.textPrimary }}>{patient?.full_name || result?.patient_name || "Patient"}</div>
                <div style={{ fontSize:12, color:C.slate500 }}>{`${patient?.patient_id || result?.patient_id || "—"} · Right Eye (OD) · Structure segmentation`}</div>
              </div>
              <div style={{ marginLeft:"auto" }}><Badge v="completed" /></div>
            </div>
          </Card>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:20 }}>
            {/* Left — image grid */}
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {/* Main large fundus */}
              <div style={{ background:C.navy, borderRadius:18, overflow:"hidden" }}>
                <div style={{ padding:"14px 18px", borderBottom:"1px solid rgba(255,255,255,0.08)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:C.white }}>① Original Fundus</div>
                    <div style={{ fontSize:10, color:C.slate500, marginTop:1 }}>Right Eye (OD) · Moderate NPDR · Full resolution</div>
                  </div>
                  {/* Zoom controls */}
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    <button onClick={() => setZoom(z => Math.max(0.6, z-0.2))}
                      style={{ width:28, height:28, borderRadius:7, background:"rgba(255,255,255,0.1)", border:"none", color:C.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Ico.ZoomOut />
                    </button>
                    <span style={{ fontSize:10, color:C.slate400, fontFamily:"var(--font-jetbrains)", minWidth:36, textAlign:"center" }}>{Math.round(zoom*100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(2, z+0.2))}
                      style={{ width:28, height:28, borderRadius:7, background:"rgba(255,255,255,0.1)", border:"none", color:C.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Ico.ZoomIn />
                    </button>
                  </div>
                </div>
                <div style={{ display:"flex", justifyContent:"center", padding:"28px 24px", position:"relative", overflow:"hidden" }}>
                  <div style={{ transform:`scale(${zoom})`, transformOrigin:"center", transition:"transform 0.25s" }}>
                    <FundusImg variant="moderate" size={300} />
                  </div>
                  {/* Structure annotation overlays */}
                  {activeStruct === "disc" && (
                    <div style={{ position:"absolute", top:"50%", left:"53%", pointerEvents:"none", transform:"translate(-50%,-50%)" }}>
                      <div style={{
                        width:54, height:46, borderRadius:"50%",
                        border:`2px solid ${C.warning}`, boxShadow:`0 0 10px ${C.warning}40`,
                      }}/>
                    </div>
                  )}
                  {activeStruct === "fovea" && (
                    <div style={{ position:"absolute", top:"50%", left:"38%", pointerEvents:"none", transform:"translate(-50%,-50%)" }}>
                      <div style={{
                        width:30, height:30, borderRadius:"50%",
                        border:`2px solid ${C.purple}`, boxShadow:`0 0 10px ${C.purple}40`,
                      }}/>
                    </div>
                  )}
                </div>
              </div>

              {/* 2×2 segmentation grid */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {[
                  { n:2, label:"Vessel Segmentation", sub:"DRIVE network · 97.2% accuracy", type:"vessel" as const },
                  { n:3, label:"Optic Disc",           sub:"Morphological analysis · C/D: 0.42", type:"disc" as const },
                  { n:4, label:"Fovea / Macula",       sub:"FAZ intact · Location confirmed",  type:"fovea" as const },
                  { n:5, label:"Enhanced Retina",       sub:"Post-CLAHE · For reference",       type:"enhanced" as const },
                ].map(card => {
                  const imgEl = card.type === "vessel" ? <VesselMapImg size={140} />
                    : card.type === "disc"   ? <DiscMapImg size={140} />
                    : card.type === "fovea"  ? <FoveaMapImg size={140} />
                    : <FundusImg variant="enhanced" size={140} />;
                  return (
                    <div key={card.n} style={{ background:C.navy, borderRadius:14, overflow:"hidden" }}>
                      <div style={{ padding:"10px 14px", borderBottom:"1px solid rgba(255,255,255,0.08)", display:"flex", justifyContent:"space-between" }}>
                        <div>
                          <div style={{ fontSize:11, fontWeight:700, color:C.white }}>
                            <span style={{ opacity:0.45, marginRight:6 }}>⑤</span>{card.label}
                          </div>
                          <div style={{ fontSize:9, color:C.slate500, marginTop:1 }}>{card.sub}</div>
                        </div>
                        <Badge v="completed" />
                      </div>
                      <div style={{ display:"flex", justifyContent:"center", padding:"16px 12px" }}>
                        {imgEl}
                      </div>
                    </div>
                  );
                })}
              </div>

              <ActionButton variant="primary" size="lg" onClick={onNext} icon={<Ico.ArrowR />} style={{ width:"100%", justifyContent:"center" }}>
                Continue to Lesion Analysis
              </ActionButton>
            </div>

            {/* Right panel */}
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {/* Detected structures */}
              <Card>
                <div style={{ fontSize:13, fontWeight:700, color:C.textPrimary, marginBottom:4 }}>Detected Structures</div>
                <div style={{ fontSize:11, color:C.slate400, marginBottom:16 }}>Click to highlight on main image</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {structures.map(s => {
                    const isA = activeStruct === s.key;
                    return (
                      <div key={s.key} onClick={() => setActiveStruct(k => k === s.key ? null : s.key)}
                        style={{
                          padding:"12px 14px", borderRadius:12, cursor:"pointer", transition:"all 0.15s",
                          background: isA ? `${s.color}10` : C.bg,
                          border: `1.5px solid ${isA ? s.color+"50" : C.borderLight}`,
                        }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                          <div style={{ width:28, height:28, borderRadius:8, background:`${s.color}18`, display:"flex", alignItems:"center", justifyContent:"center", color:s.color, flexShrink:0 }}>{s.icon}</div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:12, fontWeight:700, color:C.textPrimary }}>{s.label}</div>
                            <div style={{ fontSize:10, fontWeight:600, color:s.color }}>{s.status}</div>
                          </div>
                          <div style={{ width:8, height:8, borderRadius:"50%", background: s.color, flexShrink:0 }}/>
                        </div>
                        <div style={{ fontSize:10, color:C.slate500, paddingLeft:38 }}>{s.detail}</div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Segmentation metrics */}
              <Card title="Segmentation Metrics">
                <div style={{ marginTop:8 }}>
                {[
                  { label:"Vessel Dice",    value:"0.814", color:C.indigo },
                  { label:"Disc IoU",       value:"0.921", color:C.warning },
                  { label:"Fovea Error",    value:"±4.2 px", color:C.indigo },
                  { label:"RNFL Thickness", value:"94 μm", color:C.success },
                ].map(m => (
                  <div key={m.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:`1px solid ${C.borderLight}` }}>
                    <span style={{ fontSize:11, color:C.slate500 }}>{m.label}</span>
                    <span style={{ fontFamily:"var(--font-jetbrains)", fontSize:12, fontWeight:700, color:m.color }}>{m.value}</span>
                  </div>
                ))}
                </div>
              </Card>

              {/* Thumbnail gallery */}
              <Card title="Image Gallery">
                <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginTop:8 }}>
                  {([
                    { v:"moderate" as FundusV, l:"Original" },
                    { v:"vessels"  as FundusV, l:"Vessels" },
                    { v:"enhanced" as FundusV, l:"Enhanced" },
                    { v:"gradcam"  as FundusV, l:"Grad-CAM" },
                  ]).map(t => (
                    <div key={t.l} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                      <div style={{ borderRadius:10, overflow:"hidden", border:`2px solid ${t.v === "moderate" ? C.indigo : "transparent"}` }}>
                        <FundusImg variant={t.v} size={60} />
                      </div>
                      <span style={{ fontSize:9, color:C.slate500, fontWeight:600 }}>{t.l}</span>
                    </div>
                  ))}
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
  const navigate = useNavigate();
  const { screeningId } = useActiveScreening();
  return <StructureAnalysisScreen onNav={onNav} onNext={() => navigate(screeningPath("/screening/lesions", screeningId))} />;
}
