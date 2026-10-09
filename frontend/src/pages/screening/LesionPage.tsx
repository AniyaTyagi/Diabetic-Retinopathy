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

function LesionAnalysisScreen({
 onNext, onNav }: { onNext: () => void; onNav: (k: NavKey) => void }) {
  const { screeningId, patient, result } = useActiveScreening();

  const [activeNav] = useState<NavKey>("screenings");
  const [activeTypes, setActiveTypes] = useState<Set<LesionType>>(new Set(["ma","hm","ex","nv"]));
  const [selectedMap, setSelectedMap] = useState<LesionType>("ma");

  const toggleType = (t: LesionType) => {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(t)) { if (next.size > 1) next.delete(t); }
      else next.add(t);
      return next;
    });
  };

  const counts = result?.lesions?.counts || {};
  const EVIDENCE = [
    { type:"ma" as LesionType, label:"Microaneurysms",   count: counts.microaneurysms ?? 0, color:"#FF4444", bg:"#FEE2E2", icon:<Ico.Scan />,  severity:"Moderate", clinical:"Small saccular outpouchings of retinal capillaries — earliest clinically visible sign of DR" },
    { type:"hm" as LesionType, label:"Hemorrhages",      count: counts.hemorrhages ?? 0,  color:"#B41414", bg:"#FEE2E2", icon:<Ico.Activity />, severity:"Moderate", clinical:"Dot-and-blot hemorrhages from capillary microaneurysm rupture" },
    { type:"ex" as LesionType, label:"Hard Exudates",    count: counts.hard_exudates ?? 0, color:"#D4A017", bg:"#FEF3C7", icon:<Ico.Sparkles />, severity:"Mild",     clinical:"Lipid deposits at inner plexiform layer — indicative of vascular leakage" },
    { type:"nv" as LesionType, label:"Neovascularization", count: counts.neovascularization ?? 0, color:"#EA580C", bg:"#FEE2D5", icon:<Ico.Atom />, severity:"Referable", clinical:"Abnormal vessel growth near disc — marker for proliferative DR risk" },
  ];

  const severityColor: Record<string,string> = { Mild:C.success, Moderate:C.warning, Referable:C.danger };

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <Header title="Retinal Lesion Analysis" breadcrumbs={["NetraX","Screenings", screeningId || "—","Lesion Analysis"]}
          actions={<Badge v="referable" />}
        />
        <main style={{ flex:1, overflowY:"auto", padding:28, background:C.bg }}>
          {/* Patient bar */}
          <Card style={{ padding:"14px 20px", marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
              <div style={{ width:38, height:38, borderRadius:10, background:C.indigo, display:"flex", alignItems:"center", justifyContent:"center", color:C.white, fontSize:13, fontWeight:700 }}>SD</div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:C.textPrimary }}>{patient?.full_name || result?.patient_name || "Patient"}</div>
                <div style={{ fontSize:12, color:C.slate500 }}>{`${patient?.patient_id || result?.patient_id || "—"} · Right Eye (OD) · AI lesion detection`}</div>
              </div>
              <div style={{ display:"flex", gap:8, marginLeft:"auto", alignItems:"center" }}>
                {DR.slice(2,3).map(d => (
                  <span key={d.level} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:99, background:d.bg, color:d.text, fontSize:12, fontWeight:700 }}>
                    <span style={{ width:7, height:7, borderRadius:"50%", background:d.color }} />
                    {d.label}
                  </span>
                ))}
                <Badge v="referable" />
              </div>
            </div>
          </Card>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:20 }}>
            {/* Left — main image with overlays + evidence maps */}
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {/* Main annotated image */}
              <div style={{ background:C.navy, borderRadius:18, overflow:"hidden" }}>
                <div style={{ padding:"14px 18px", borderBottom:"1px solid rgba(255,255,255,0.08)", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:C.white }}>Lesion Overlay — Right Eye (OD)</div>
                    <div style={{ fontSize:10, color:C.slate500, marginTop:1 }}>AI-detected lesions · Toggle type visibility</div>
                  </div>
                  {/* Toggle buttons */}
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {EVIDENCE.map(e => (
                      <button key={e.type} onClick={() => toggleType(e.type)}
                        style={{
                          padding:"4px 10px", borderRadius:99, fontSize:10, fontWeight:700, border:"none", cursor:"pointer",
                          background: activeTypes.has(e.type) ? e.color : "rgba(255,255,255,0.08)",
                          color: activeTypes.has(e.type) ? C.white : C.slate500,
                          opacity: activeTypes.has(e.type) ? 1 : 0.5, transition:"all 0.15s",
                        }}>
                        {e.label.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main image with layered SVG overlays */}
                <div style={{ display:"flex", justifyContent:"center", padding:"32px 24px" }}>
                  <div style={{ position:"relative" }}>
                    <FundusImg variant="moderate" size={320} />
                    {/* Lesion SVG overlay */}
                    <svg style={{ position:"absolute", inset:0, borderRadius:"50%", overflow:"hidden", pointerEvents:"none" }}
                      width={320} height={320} viewBox="0 0 100 100">
                      {EVIDENCE.filter(e => activeTypes.has(e.type)).map(e =>
                        LESION_META[e.type].positions.slice(0, e.count).map((p,i) => {
                          const r = LESION_META[e.type].dotR;
                          return (
                            <g key={`${e.type}-${i}`}>
                              <circle cx={p.x} cy={p.y} r={r * 2} fill={e.color} opacity={0.15}/>
                              <circle cx={p.x} cy={p.y} r={r} fill={e.color} opacity={0.9}/>
                            </g>
                          );
                        })
                      )}
                      {/* NV branching overlay */}
                      {activeTypes.has("nv") && (
                        <>
                          <path d="M58,42 C62,38 66,35 70,32" stroke="#FF8C00" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity={0.9}/>
                          <path d="M58,42 C55,37 53,33 52,28" stroke="#FF8C00" strokeWidth="1.0" fill="none" strokeLinecap="round" opacity={0.9}/>
                        </>
                      )}
                    </svg>
                    {/* Legend overlay */}
                    <div style={{
                      position:"absolute", bottom:12, left:12, display:"flex", flexDirection:"column", gap:4,
                    }}>
                      {EVIDENCE.filter(e => activeTypes.has(e.type)).map(e => (
                        <div key={e.type} style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 8px", borderRadius:99, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(4px)" }}>
                          <div style={{ width:6, height:6, borderRadius:"50%", background:e.color }}/>
                          <span style={{ fontSize:9, fontWeight:700, color:C.white }}>{e.label} ({e.count})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Evidence maps grid */}
              <Card title="Lesion Evidence Maps" subtitle="AI-generated per-lesion probability maps">
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
                  {(["ma","hm","ex","nv"] as LesionType[]).map(t => {
                    const m = LESION_META[t];
                    const isSelected = selectedMap === t;
                    return (
                      <div key={t} onClick={() => setSelectedMap(t)}
                        style={{
                          display:"flex", flexDirection:"column", alignItems:"center", gap:8,
                          padding:"12px 8px", borderRadius:12, cursor:"pointer", transition:"all 0.15s",
                          background: isSelected ? `${m.strokeColor}12` : C.bg,
                          border: `1.5px solid ${isSelected ? m.strokeColor+"50" : C.borderLight}`,
                        }}
                        onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = C.slate100; }}
                        onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = C.bg; }}
                      >
                        <LesionMapImg type={t} size={96} />
                        <div style={{ textAlign:"center" }}>
                          <div style={{ fontSize:11, fontWeight:700, color:C.textPrimary }}>{m.label}</div>
                          <div style={{ fontFamily:"var(--font-jetbrains)", fontSize:13, fontWeight:800, color:m.strokeColor, marginTop:1 }}>
                            {m.count} <span style={{ fontSize:10, fontWeight:500, color:C.slate400 }}>found</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Clinical evidence disclaimer */}
              <div style={{ background:C.warningLight, borderRadius:14, border:`1px solid ${C.warning}35`, padding:"14px 18px", display:"flex", gap:12, alignItems:"flex-start" }}>
                <div style={{ color:C.warning, flexShrink:0, marginTop:1 }}><Ico.Warn /></div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:C.textPrimary, marginBottom:4 }}>Illustrative lesion cues</div>
                  <div style={{ fontSize:11, color:C.slate600, lineHeight:1.65 }}>
                    {result?.lesions?.disclaimer
                      || "Lesion counts/maps are illustrative (derived from DR grade), not a trained segmentation model. Confirm clinically."}
                  </div>
                </div>
              </div>

              <ActionButton variant="primary" size="lg" onClick={onNext} icon={<Ico.ArrowR />} style={{ width:"100%", justifyContent:"center" }}>
                Continue to Results Overview
              </ActionButton>
            </div>

            {/* Right — evidence cards */}
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {/* Selected map enlarged */}
              <div style={{ background:C.navy, borderRadius:16, overflow:"hidden" }}>
                <div style={{ padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:C.white }}>{LESION_META[selectedMap].label} Map</div>
                  <div style={{ fontSize:10, color:C.slate500, marginTop:1 }}>Probability heat map · AI confidence</div>
                </div>
                <div style={{ display:"flex", justifyContent:"center", padding:20 }}>
                  <LesionMapImg type={selectedMap} size={180} />
                </div>
              </div>

              {/* Evidence cards */}
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {EVIDENCE.map(e => (
                  <Card key={e.type} onClick={() => setSelectedMap(e.type)}
                    style={{
                      border:`1.5px solid ${selectedMap === e.type ? e.color+"60" : C.border}`,
                      padding:16,
                      boxShadow: selectedMap === e.type ? `0 0 0 3px ${e.color}18` : "none",
                    }}>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:10 }}>
                      <div style={{ width:32, height:32, borderRadius:9, background:e.bg, display:"flex", alignItems:"center", justifyContent:"center", color:e.color, flexShrink:0 }}>
                        {e.icon}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <div style={{ fontSize:12, fontWeight:700, color:C.textPrimary }}>{e.label}</div>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ fontFamily:"var(--font-jetbrains)", fontSize:16, fontWeight:800, color:e.color }}>{e.count}</span>
                            <span style={{ fontSize:10, color:C.slate400, fontWeight:500 }}>detected</span>
                          </div>
                        </div>
                        <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99, marginTop:4, display:"inline-block",
                          background:`${severityColor[e.severity]}18`, color:severityColor[e.severity] }}>
                          {e.severity}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize:10, color:C.slate500, lineHeight:1.6, paddingLeft:44 }}>
                      {e.clinical}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Summary stats */}
              <Card title="Detection Summary">
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:8 }}>
                  <div style={{ padding:"10px 12px", borderRadius:10, background:C.bg, border:`1px solid ${C.borderLight}`, textAlign:"center" }}>
                    <div style={{ fontFamily:"var(--font-jetbrains)", fontSize:22, fontWeight:800, color:C.danger }}>43</div>
                    <div style={{ fontSize:10, color:C.slate500, marginTop:2 }}>Total lesions</div>
                  </div>
                  <div style={{ padding:"10px 12px", borderRadius:10, background:C.bg, border:`1px solid ${C.borderLight}`, textAlign:"center" }}>
                    <div style={{ fontFamily:"var(--font-jetbrains)", fontSize:22, fontWeight:800, color:C.indigo }}>4</div>
                    <div style={{ fontSize:10, color:C.slate500, marginTop:2 }}>Types detected</div>
                  </div>
                  <div style={{ padding:"10px 12px", borderRadius:10, background:C.bg, border:`1px solid ${C.borderLight}`, textAlign:"center" }}>
                    <div style={{ fontFamily:"var(--font-jetbrains)", fontSize:22, fontWeight:800, color:C.warning }}>L2</div>
                    <div style={{ fontSize:10, color:C.slate500, marginTop:2 }}>DR Grade</div>
                  </div>
                  <div style={{ padding:"10px 12px", borderRadius:10, background:C.bg, border:`1px solid ${C.borderLight}`, textAlign:"center" }}>
                    <div style={{ fontFamily:"var(--font-jetbrains)", fontSize:22, fontWeight:800, color:C.danger }}>↑</div>
                    <div style={{ fontSize:10, color:C.slate500, marginTop:2 }}>Referable</div>
                  </div>
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
  return <LesionAnalysisScreen onNav={onNav} onNext={() => navigate(screeningPath("/screening/results", screeningId))} />;
}
