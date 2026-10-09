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

function ErrorStatesScreen({ onNav, onRetry, onUpload }: {
  onNav: (k: NavKey) => void; onRetry: () => void; onUpload: () => void;
}) {
  const [activeNav] = useState<NavKey>("screenings");
  const [mode, setMode] = useState<"analyze"|"offline">("analyze");

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <Header title="Error States" breadcrumbs={["NetraX","System","Errors"]}
          actions={
            <div style={{ display:"flex", gap:8 }}>
              <FilterChip label="Unable to Analyze" active={mode==="analyze"} onClick={() => setMode("analyze")} />
              <FilterChip label="Connection Unavailable" active={mode==="offline"} onClick={() => setMode("offline")} />
            </div>
          }
        />
        <main style={{ flex:1, overflowY:"auto", padding:28, background:C.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
          {mode === "analyze" ? (
            <Card style={{ maxWidth:480, width:"100%", padding:32, textAlign:"center" }}>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
                <div style={{ opacity:0.85 }}><FundusImg variant="poor" size={120} /></div>
              </div>
              <div style={{
                width:48, height:48, borderRadius:14, background:C.dangerLight, color:C.danger,
                display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px",
              }}><Ico.X /></div>
              <div style={{ fontSize:20, fontWeight:800, color:C.textPrimary, marginBottom:8 }}>Unable to Analyze Image</div>
              <div style={{ fontSize:13, color:C.slate600, lineHeight:1.55, marginBottom:18 }}>
                The retinal image could not be processed.
              </div>
              <div style={{ textAlign:"left", background:C.bg, borderRadius:12, border:`1px solid ${C.borderLight}`, padding:16, marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.slate500, marginBottom:8, textTransform:"uppercase" }}>Possible reasons</div>
                {["Poor image quality","Unsupported format","Processing error"].map(r => (
                  <div key={r} style={{ display:"flex", gap:8, alignItems:"center", padding:"6px 0", fontSize:12, color:C.slate700 }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", background:C.danger }} />{r}
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
                <ActionButton variant="primary" onClick={onRetry}>Try Again</ActionButton>
                <ActionButton variant="secondary" onClick={onUpload}>Upload New Image</ActionButton>
              </div>
            </Card>
          ) : (
            <Card style={{ maxWidth:480, width:"100%", padding:32, textAlign:"center" }}>
              <div style={{
                width:56, height:56, borderRadius:16, background:C.warningLight, color:C.warning,
                display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px",
              }}><Ico.Activity /></div>
              <div style={{ fontSize:20, fontWeight:800, color:C.textPrimary, marginBottom:8 }}>Connection unavailable</div>
              <div style={{ fontSize:13, color:C.slate600, lineHeight:1.6, marginBottom:20 }}>
                Screening data will synchronize when connectivity is restored. Local capture can continue at the PHC; AI grading and review resume after sync.
              </div>
              <ActionButton variant="primary" onClick={onRetry}>Retry Connection</ActionButton>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}


export default function Page() {
  const onNav = useAppNav();
  const navigate = useNavigate();
  return (
    <ErrorStatesScreen
      onNav={onNav}
      onRetry={() => navigate("/screening/ai-analysis")}
      onUpload={() => navigate("/screening/upload")}
    />
  );
}
