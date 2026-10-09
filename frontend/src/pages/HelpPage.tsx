import { useNavigate } from "react-router-dom";
import { useAppNav } from "@/shared/hooks/useAppNav";
import {
  C, Ico, FundusImg, NetraXLogo, Badge, ConfBar, Sidebar, Header,
  Card,
  QualityArc, LesionMapImg, VesselMapImg, DiscMapImg, FoveaMapImg,
  GradCamHeatmapImg, ArchStep, ArchArrow, FilterChip, MiniBarChart, DonutMini,
  FundusDeviceVisual, PipelineNode, PipelineArrow, RoleBadge, DR, LESION_META,
  type NavKey, type FundusV, type LesionType, type BadgeV,
} from "@/shared/ui";
import { useState } from "react";

function HelpCenterScreen({ onNav }: { onNav: (k: NavKey) => void }) {
  const [activeNav] = useState<NavKey>("settings");
  const [q, setQ] = useState("");

  const cats = [
    "Getting Started","Image Capture","Quality Check","AI Results","Explainability","Reports","Simulation","Troubleshooting",
  ];

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <Header title="Help Center" breadcrumbs={["NetraX","Help"]} />
        <main style={{ flex:1, overflowY:"auto", padding:28, background:C.bg }}>
          <div style={{
            background:C.navy, borderRadius:18, padding:"28px 24px", marginBottom:20, textAlign:"center",
          }}>
            <div style={{ fontSize:20, fontWeight:800, color:C.white, marginBottom:8 }}>How can we help?</div>
            <div style={{
              maxWidth:480, margin:"16px auto 0", display:"flex", alignItems:"center", gap:8,
              padding:"12px 14px", borderRadius:12, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)",
            }}>
              <Ico.Search />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search guides and FAQs"
                style={{ flex:1, border:"none", outline:"none", background:"transparent", color:C.white, fontSize:13 }} />
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
            {cats.map(c => (
              <Card key={c} style={{ padding:16, cursor:"pointer" }}>
                <div style={{ color:C.indigo, marginBottom:8 }}><Ico.Help /></div>
                <div style={{ fontSize:13, fontWeight:700, color:C.textPrimary }}>{c}</div>
              </Card>
            ))}
          </div>

          <Card title="How to capture a good fundus image" subtitle="Technician guidance · PHC screening sites">
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
              {[
                { l:"Correct Focus", v:"enhanced" as FundusV },
                { l:"Correct Illumination", v:"moderate" as FundusV },
                { l:"Full Field of View", v:"mild" as FundusV },
                { l:"Avoid Reflection", v:"normal" as FundusV },
              ].map(ex => (
                <div key={ex.l} style={{ textAlign:"center" }}>
                  <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}>
                    <div style={{ borderRadius:"50%", padding:3, border:`2px solid ${C.success}55` }}>
                      <FundusImg variant={ex.v} size={120} />
                    </div>
                  </div>
                  <div style={{ fontSize:12, fontWeight:800, color:C.textPrimary }}>{ex.l}</div>
                </div>
              ))}
            </div>
            <div style={{
              marginTop:18, padding:"12px 14px", borderRadius:12, background:C.indigoLight, border:`1px solid ${C.indigoDim}50`,
              fontSize:12, color:C.slate600, lineHeight:1.55,
            }}>
              Sharp optic disc and macula, even illumination, ≥45° field, and minimal corneal reflections improve gradeability and reduce recapture.
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}


export default function Page() {
  const onNav = useAppNav();
  return <HelpCenterScreen onNav={onNav} />;
}
