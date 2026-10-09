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

function LesionEvidenceScreen({
 onNext, onNav }: { onNext: () => void; onNav: (k: NavKey) => void }) {
  const { screeningId, patient, result } = useActiveScreening();

  const [activeNav] = useState<NavKey>("screenings");
  const [selected, setSelected] = useState<LesionType | "vessel">("ma");
  const [activeTypes, setActiveTypes] = useState<Set<LesionType>>(new Set(["ma","hm","ex","nv"]));

  const counts = result?.lesions?.counts || {};
  const cats = [
    { type:"ma" as const, label:"Microaneurysms", count: counts.microaneurysms ?? 0, color:"#FF4444", bg:"#FEE2E2" },
    { type:"hm" as const, label:"Hemorrhages", count: counts.hemorrhages ?? 0, color:"#B41414", bg:"#FEE2E2" },
    { type:"ex" as const, label:"Exudates", count: (counts.hard_exudates ?? 0) + (counts.soft_exudates ?? 0), color:"#D4A017", bg:"#FEF3C7" },
    { type:"nv" as const, label:"Neovascularization", count: counts.neovascularization ?? 0, color:"#EA580C", bg:"#FEE2D5" },
  ];

  const toggleType = (t: LesionType) => {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(t)) { if (next.size > 1) next.delete(t); }
      else next.add(t);
      return next;
    });
    setSelected(t);
  };

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <Header title="Lesion Evidence" breadcrumbs={["NetraX","Screenings", screeningId || "—","Lesion Evidence"]}
          actions={<Badge v="referable" />}
        />
        <main style={{ flex:1, overflowY:"auto", padding:28, background:C.bg }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:20 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ background:C.navy, borderRadius:18, overflow:"hidden" }}>
                <div style={{ padding:"14px 18px", borderBottom:"1px solid rgba(255,255,255,0.08)", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:C.white }}>Original Retina — Lesion Overlay</div>
                    <div style={{ fontSize:10, color:C.slate500, marginTop:1 }}>Selectable evidence categories · OD</div>
                  </div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {cats.map(c => (
                      <button key={c.type} onClick={() => toggleType(c.type)}
                        style={{
                          padding:"4px 10px", borderRadius:99, fontSize:10, fontWeight:700, border:"none", cursor:"pointer",
                          background: activeTypes.has(c.type) ? c.color : "rgba(255,255,255,0.08)",
                          color: activeTypes.has(c.type) ? C.white : C.slate500,
                        }}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display:"flex", justifyContent:"center", padding:"32px 24px" }}>
                  <div style={{ position:"relative" }}>
                    <FundusImg variant="moderate" size={340} />
                    <svg style={{ position:"absolute", inset:0, borderRadius:"50%", overflow:"hidden", pointerEvents:"none" }}
                      width={340} height={340} viewBox="0 0 100 100">
                      {cats.filter(c => activeTypes.has(c.type)).map(c =>
                        LESION_META[c.type].positions.slice(0, c.count).map((p,i) => {
                          const r = LESION_META[c.type].dotR;
                          return (
                            <g key={`${c.type}-${i}`}>
                              <circle cx={p.x} cy={p.y} r={r * 2} fill={c.color} opacity={0.15}/>
                              <circle cx={p.x} cy={p.y} r={r} fill={c.color} opacity={0.92}/>
                            </g>
                          );
                        })
                      )}
                      {activeTypes.has("nv") && (
                        <>
                          <path d="M58,42 C62,38 66,35 70,32" stroke="#FF8C00" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                          <path d="M58,42 C55,37 53,33 52,28" stroke="#FF8C00" strokeWidth="1.0" fill="none" strokeLinecap="round"/>
                        </>
                      )}
                    </svg>
                  </div>
                </div>
              </div>

              <Card title="Evidence Maps" subtitle="Per-lesion probability maps and vessel segmentation">
                <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12 }}>
                  {([
                    { key:"ma" as const, label:"Microaneurysm Map", el:<LesionMapImg type="ma" size={88} /> },
                    { key:"hm" as const, label:"Hemorrhage Map", el:<LesionMapImg type="hm" size={88} /> },
                    { key:"ex" as const, label:"Exudate Map", el:<LesionMapImg type="ex" size={88} /> },
                    { key:"nv" as const, label:"Neovascularization Map", el:<LesionMapImg type="nv" size={88} /> },
                    { key:"vessel" as const, label:"Vessel Map", el:<VesselMapImg size={88} /> },
                  ]).map(m => {
                    const isA = selected === m.key;
                    return (
                      <div key={m.key} onClick={() => setSelected(m.key)}
                        style={{
                          display:"flex", flexDirection:"column", alignItems:"center", gap:8,
                          padding:"12px 8px", borderRadius:12, cursor:"pointer",
                          background: isA ? C.indigoLight : C.bg,
                          border:`1.5px solid ${isA ? C.indigoDim : C.borderLight}`,
                        }}>
                        {m.el}
                        <div style={{ fontSize:10, fontWeight:700, color:C.textPrimary, textAlign:"center", lineHeight:1.3 }}>{m.label}</div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop:18, paddingTop:16, borderTop:`1px solid ${C.borderLight}` }}>
                  <div style={{ fontSize:12, fontWeight:700, color:C.textPrimary, marginBottom:10 }}>Clinical Legend</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
                    {cats.map(c => (
                      <div key={c.type} style={{
                        display:"flex", alignItems:"center", gap:8, padding:"6px 12px", borderRadius:99,
                        background:c.bg, border:`1px solid ${c.color}30`,
                      }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:c.color }}/>
                        <span style={{ fontSize:11, fontWeight:600, color:C.textPrimary }}>{c.label}</span>
                        <span style={{ fontFamily:"var(--font-jetbrains)", fontSize:12, fontWeight:800, color:c.color }}>{c.count}</span>
                      </div>
                    ))}
                    <div style={{
                      display:"flex", alignItems:"center", gap:8, padding:"6px 12px", borderRadius:99,
                      background:C.slate100, border:`1px solid ${C.border}`,
                    }}>
                      <div style={{ width:8, height:8, borderRadius:2, background:"rgba(220,80,20,0.85)" }}/>
                      <span style={{ fontSize:11, fontWeight:600, color:C.textPrimary }}>Vessels</span>
                    </div>
                  </div>
                </div>
              </Card>

              <ActionButton variant="primary" size="lg" onClick={onNext} icon={<Ico.ArrowR />} style={{ width:"100%", justifyContent:"center" }}>
                Continue to Model Comparison
              </ActionButton>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {cats.map(c => {
                const isA = selected === c.type;
                return (
                  <Card key={c.type} onClick={() => { setSelected(c.type); if (!activeTypes.has(c.type)) toggleType(c.type); }}
                    style={{
                      padding:18,
                      border:`1.5px solid ${isA ? c.color+"55" : C.border}`,
                      boxShadow: isA ? `0 0 0 3px ${c.color}14` : "none",
                    }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div style={{ fontSize:13, fontWeight:700, color:C.textPrimary }}>{c.label}</div>
                      <div style={{ fontFamily:"var(--font-jetbrains)", fontSize:28, fontWeight:800, color:c.color, lineHeight:1 }}>{c.count}</div>
                    </div>
                    <div style={{ marginTop:10, height:4, borderRadius:99, background:C.borderLight, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${Math.min(100, c.count * 4)}%`, background:c.color, borderRadius:99 }} />
                    </div>
                  </Card>
                );
              })}

              <div style={{ background:C.navy, borderRadius:16, overflow:"hidden", marginTop:4 }}>
                <div style={{ padding:"12px 14px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:C.white }}>
                    {selected === "vessel" ? "Vessel Map" : `${LESION_META[selected].label} Map`}
                  </div>
                  <div style={{ fontSize:10, color:C.slate500, marginTop:1 }}>Selected evidence view</div>
                </div>
                <div style={{ display:"flex", justifyContent:"center", padding:20 }}>
                  {selected === "vessel"
                    ? <VesselMapImg size={168} />
                    : <LesionMapImg type={selected} size={168} />}
                </div>
              </div>
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
  return <LesionEvidenceScreen onNav={onNav} onNext={() => navigate(screeningPath("/screening/model-compare", screeningId))} />;
}
