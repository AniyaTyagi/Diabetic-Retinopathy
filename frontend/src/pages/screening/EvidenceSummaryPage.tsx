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

function EvidenceSummaryScreen({
 onNext, onNav }: { onNext: () => void; onNav: (k: NavKey) => void }) {
  const { screeningId, patient, result } = useActiveScreening();

  const [activeNav] = useState<NavKey>("screenings");
  const level = result?.dr_level ?? 2;
  const dr = DR[level] ?? DR[2];
  const conf = result?.confidence ?? 0;
  const counts = result?.lesions?.counts || {};

  const hierarchy = [
    {
      key:"model", title:"Model Evidence", icon:<Ico.Cpu />, color:C.indigo,
      items:[
        `DR Level ${level} · ${dr.label}`,
        `Confidence ${conf.toFixed(2)} (above threshold)`,
        `${result?.model_used || "AI model"} inference`,
        result?.referral_needed ? "Referable screening recommendation" : "Non-referable screening recommendation",
      ],
    },
    {
      key:"visual", title:"Visual Evidence", icon:<Ico.Layers />, color:C.purple,
      items:[
        result?.explainability?.summary || "Grad-CAM attention on posterior pole",
        ...(result?.explainability?.regions?.slice(0, 2).map(r => r.note) || ["Lesion-dense macular / mid-peripheral zones"]),
      ],
    },
    {
      key:"clinical", title:"Clinical Evidence", icon:<Ico.FileText />, color:C.warning,
      items:[
        `${counts.microaneurysms ?? 0} Microaneurysms`,
        `${counts.hemorrhages ?? 0} Hemorrhages`,
        `${counts.hard_exudates ?? 0} Exudates`,
        `${counts.neovascularization ?? 0} Neovascularization`,
      ],
    },
  ];

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <Header title="AI Evidence Summary" breadcrumbs={["NetraX","Screenings", screeningId || "—","Evidence Summary"]}
          actions={<Badge v="referable" />}
        />
        <main style={{ flex:1, overflowY:"auto", padding:28, background:C.bg }}>
          <Card style={{ padding:"14px 20px", marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
              <div style={{ width:38, height:38, borderRadius:10, background:C.indigo, display:"flex", alignItems:"center", justifyContent:"center", color:C.white, fontSize:13, fontWeight:700 }}>SD</div>
              <div style={{ flex:1, minWidth:180 }}>
                <div style={{ fontSize:14, fontWeight:700, color:C.textPrimary }}>{`${patient?.full_name || result?.patient_name || "Patient"} · Consolidated Explanation`}</div>
                <div style={{ fontSize:12, color:C.slate500 }}>{`Explainable clinical decision support · ${screeningId || "—"}`}</div>
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                <span style={{ padding:"6px 12px", borderRadius:99, background:dr.bg, color:dr.text, fontSize:12, fontWeight:700 }}>DR Level 2</span>
                <span style={{ padding:"6px 12px", borderRadius:99, background:C.successLight, color:C.success, fontSize:12, fontWeight:700, fontFamily:"var(--font-jetbrains)" }}>{conf.toFixed(2)}</span>
                <Badge v="referable" />
              </div>
            </div>
          </Card>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:18 }}>
            <div style={{ background:C.navy, borderRadius:16, overflow:"hidden" }}>
              <div style={{ padding:"12px 14px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.white }}>Fundus Image</div>
                <div style={{ fontSize:9, color:C.slate500, marginTop:1 }}>Original · OD</div>
              </div>
              <div style={{ display:"flex", justifyContent:"center", padding:"24px 12px" }}>
                <FundusImg variant="moderate" size={220} />
              </div>
            </div>
            <div style={{ background:C.navy, borderRadius:16, overflow:"hidden" }}>
              <div style={{ padding:"12px 14px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.white }}>Grad-CAM Overlay</div>
                <div style={{ fontSize:9, color:C.slate500, marginTop:1 }}>Visual evidence</div>
              </div>
              <div style={{ display:"flex", justifyContent:"center", padding:"24px 12px" }}>
                <GradCamHeatmapImg size={220} mode="overlay" />
              </div>
            </div>
            <Card title="Clinical Evidence">
              <div style={{ marginTop:8 }}>
              {[
                { l:"Microaneurysms", n:23, c:"#FF4444" },
                { l:"Hemorrhages", n:7, c:"#B41414" },
                { l:"Exudates", n:12, c:"#D4A017" },
                { l:"Neovascularization", n:1, c:"#EA580C" },
              ].map((e,i) => (
                <div key={e.l} style={{
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"11px 0", borderBottom: i < 3 ? `1px solid ${C.borderLight}` : "none",
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:e.c }}/>
                    <span style={{ fontSize:12, fontWeight:600, color:C.textPrimary }}>{e.l}</span>
                  </div>
                  <span style={{ fontFamily:"var(--font-jetbrains)", fontSize:16, fontWeight:800, color:e.c }}>{e.n}</span>
                </div>
              ))}
              <div style={{
                marginTop:14, padding:"12px 14px", borderRadius:12,
                background:C.dangerLight, border:`1px solid ${C.danger}30`,
              }}>
                <div style={{ fontSize:11, color:C.danger, fontWeight:600 }}>Status</div>
                <div style={{ fontSize:16, fontWeight:800, color:C.danger, marginTop:2 }}>Referable DR</div>
                <div style={{ fontSize:11, color:C.slate600, marginTop:4 }}>Confidence {conf.toFixed(2)} · Level {level} {dr.label}</div>
              </div>
              </div>
            </Card>
          </div>

          <Card title="Evidence Hierarchy" subtitle="Model → Visual → Clinical · consolidated decision support trail" style={{ marginBottom:16 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
              {hierarchy.map((h, idx) => (
                <div key={h.key} style={{
                  borderRadius:14, border:`1.5px solid ${h.color}35`, padding:18,
                  background:`${h.color}08`, position:"relative",
                }}>
                  <div style={{
                    position:"absolute", top:12, right:12, width:22, height:22, borderRadius:99,
                    background:h.color, color:C.white, fontSize:11, fontWeight:800,
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>{idx+1}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                    <div style={{
                      width:32, height:32, borderRadius:10, background:`${h.color}18`,
                      display:"flex", alignItems:"center", justifyContent:"center", color:h.color,
                    }}>{h.icon}</div>
                    <div style={{ fontSize:13, fontWeight:800, color:C.textPrimary }}>{h.title}</div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {h.items.map(item => (
                      <div key={item} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                        <div style={{ width:5, height:5, borderRadius:"50%", background:h.color, marginTop:6, flexShrink:0 }}/>
                        <span style={{ fontSize:11, color:C.slate600, lineHeight:1.45 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div style={{
            background:C.indigoLight, borderRadius:14, border:`1px solid ${C.indigoDim}50`,
            padding:"14px 18px", display:"flex", gap:12, marginBottom:16,
          }}>
            <div style={{ color:C.indigo }}><Ico.Shield /></div>
            <div style={{ fontSize:12, color:C.slate600, lineHeight:1.6 }}>
              NetraX presents explainable evidence for clinical decision support. The ophthalmologist retains final responsibility for diagnosis, referral, and treatment decisions.
            </div>
          </div>

          <ActionButton variant="primary" size="lg" onClick={onNext} icon={<Ico.ArrowR />} style={{ width:"100%", justifyContent:"center" }}>
            Proceed to Ophthalmologist Review
          </ActionButton>
        </main>
      </div>
    </div>
  );
}


export default function Page() {
  const onNav = useAppNav();
  const navigate = useNavigate();
  const { screeningId } = useActiveScreening();
  return <EvidenceSummaryScreen onNav={onNav} onNext={() => navigate(screeningPath("/screening/review", screeningId))} />;
}
