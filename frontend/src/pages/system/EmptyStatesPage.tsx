import { useNavigate } from "react-router-dom";
import { useAppNav } from "@/shared/hooks/useAppNav";
import {
  C, Ico, FundusImg, NetraXLogo, Badge, ConfBar, Sidebar, Header,
  Card, ActionButton,
  QualityArc, LesionMapImg, VesselMapImg, DiscMapImg, FoveaMapImg,
  GradCamHeatmapImg, ArchStep, ArchArrow, FilterChip, MiniBarChart, DonutMini,
  FundusDeviceVisual, PipelineNode, PipelineArrow, RoleBadge, DR, LESION_META,
  type NavKey, type FundusV, type LesionType, type BadgeV,
} from "@/shared/ui";
import { useState } from "react";

function EmptyStatesScreen({ onNav }: { onNav: (k: NavKey) => void }) {
  const [activeNav] = useState<NavKey>("screenings");
  const [mode, setMode] = useState(0);

  const states = [
    { key:"screenings", title:"No screenings yet", body:"Start your first retinal screening to see results here.", cta:"Start New Screening", nav:"new-screening" as NavKey, visual:"moderate" as FundusV },
    { key:"patients", title:"No patients found", body:"Try a different Patient ID or name, or register a new patient at your PHC.", cta:"Add Patient", nav:"patients" as NavKey, visual:"normal" as FundusV },
    { key:"reports", title:"No reports available", body:"Completed and reviewed screenings will appear here as clinical reports.", cta:"View Screenings", nav:"screenings" as NavKey, visual:"enhanced" as FundusV },
    { key:"notifications", title:"No notifications", body:"Critical reviews, quality alerts, and system updates will show up here.", cta:"Back to Dashboard", nav:"dashboard" as NavKey, visual:"mild" as FundusV },
    { key:"devices", title:"No connected devices", body:"Connect a fundus camera at your screening center to begin image capture.", cta:"Open Devices", nav:"devices" as NavKey, visual:"vessels" as FundusV },
    { key:"simulation", title:"No simulation data", body:"Run the district capacity model to estimate throughput and bottlenecks.", cta:"Open Simulation", nav:"simulation" as NavKey, visual:"gradcam" as FundusV },
  ];

  const s = states[mode];

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <Header title="Empty States" breadcrumbs={["NetraX","System","Empty"]}
          actions={
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", maxWidth:520, justifyContent:"flex-end" }}>
              {states.map((st,i) => (
                <FilterChip key={st.key} label={st.key} active={mode===i} onClick={() => setMode(i)} />
              ))}
            </div>
          }
        />
        <main style={{ flex:1, overflowY:"auto", padding:28, background:C.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Card style={{ maxWidth:440, width:"100%", padding:36, textAlign:"center" }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:18, opacity:0.9 }}>
              <div style={{ borderRadius:"50%", padding:6, background:C.bg, border:`1px solid ${C.border}` }}>
                <FundusImg variant={s.visual} size={100} />
              </div>
            </div>
            <div style={{ fontSize:18, fontWeight:800, color:C.textPrimary, marginBottom:8 }}>{s.title}</div>
            <div style={{ fontSize:13, color:C.slate600, lineHeight:1.6, marginBottom:22 }}>{s.body}</div>
            <ActionButton variant="primary" onClick={() => onNav(s.nav)} icon={<Ico.ArrowR />}>
              {s.cta}
            </ActionButton>
          </Card>
        </main>
      </div>
    </div>
  );
}


export default function Page() {
  const onNav = useAppNav();
  return <EmptyStatesScreen onNav={onNav} />;
}
