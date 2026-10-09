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

function ToggleSwitch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0" }}>
      <span style={{ fontSize:12, fontWeight:600, color:C.slate700 }}>{label}</span>
      <div onClick={() => onChange(!on)} style={{
        width:36, height:20, borderRadius:99, cursor:"pointer", position:"relative",
        background: on ? C.indigo : C.slate200, transition:"background 0.2s", flexShrink:0,
      }}>
        <div style={{
          position:"absolute", top:2, left: on ? 18 : 2, width:16, height:16,
          borderRadius:"50%", background:C.white,
          boxShadow:"0 1px 3px rgba(0,0,0,0.2)", transition:"left 0.2s",
        }}/>
      </div>
    </div>
  );
}

function ImageEnhancementScreen({
 onNext, onBack, onNav }: { onNext: () => void; onBack: () => void; onNav: (k: NavKey) => void }) {
  const { screeningId, patient, result } = useActiveScreening();

  const [activeNav] = useState<NavKey>("new-screening");
  const [sliderPos, setSliderPos] = useState(50);
  const [clahe, setClahe] = useState(true);
  const [illum, setIllum] = useState(true);
  const [denoise, setDenoise] = useState(true);

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <Header title="Image Enhancement" breadcrumbs={["NetraX","New Screening","Enhancement"]} />
        <main style={{ flex:1, overflowY:"auto", padding:28, background:C.bg }}>
          {/* Patient bar */}
          <Card style={{ padding:"14px 20px", marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:C.indigo, display:"flex", alignItems:"center", justifyContent:"center", color:C.white, fontSize:13, fontWeight:700 }}>SD</div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:C.textPrimary }}>{patient?.full_name || result?.patient_name || "Patient"}</div>
                <div style={{ fontSize:12, color:C.slate500 }}>{`${patient?.patient_id || result?.patient_id || "—"} · Right Eye (OD) · Quality check`}</div>
              </div>
              <div style={{ marginLeft:"auto" }}><Badge v="processing" pulse /></div>
            </div>
          </Card>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:20 }}>
            {/* Main comparison area */}
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {/* Side-by-side labels */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                {[
                  { label:"Original Fundus",  sub:"Unprocessed · Raw capture", variant:"moderate" as FundusV, tag:"Before" },
                  { label:"Enhanced Fundus",  sub:"CLAHE + Normalized + Denoised", variant:"enhanced" as FundusV, tag:"After" },
                ].map((p,i) => (
                  <div key={i} style={{ background:C.navy, borderRadius:16, overflow:"hidden" }}>
                    <div style={{ padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.08)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, color:C.white }}>{p.label}</div>
                        <div style={{ fontSize:10, color:C.slate500, marginTop:1 }}>{p.sub}</div>
                      </div>
                      <span style={{ fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:99,
                        background: i===0 ? "rgba(255,255,255,0.1)" : `${C.indigo}80`, color:C.white }}>
                        {p.tag}
                      </span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"center", padding:"24px 16px" }}>
                      <FundusImg variant={p.variant} size={230} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Slider comparison */}
              <div style={{ background:C.navy, borderRadius:16, overflow:"hidden" }}>
                <div style={{ padding:"14px 18px", borderBottom:"1px solid rgba(255,255,255,0.08)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:C.white }}>Interactive Comparison</div>
                    <div style={{ fontSize:10, color:C.slate500, marginTop:1 }}>Drag slider · Before ← → After</div>
                  </div>
                  <div style={{ fontSize:11, color:C.slate400, fontFamily:"var(--font-jetbrains)" }}>{sliderPos}%</div>
                </div>
                <div style={{ padding:24, display:"flex", justifyContent:"center" }}>
                  <div style={{ position:"relative", width:480, height:260, borderRadius:12, overflow:"hidden", cursor:"col-resize" }}>
                    {/* Base: enhanced */}
                    <div className="enhancement-preview" style={{ position:"absolute", inset:0 }}>
                      <FundusImg variant="enhanced" size={480} style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)" }} />
                    </div>
                    {/* Overlay: original (clipped) */}
                    <div style={{ position:"absolute", inset:0, clipPath:`inset(0 ${100-sliderPos}% 0 0)` }}>
                      <FundusImg variant="moderate" size={480} style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)" }} />
                    </div>
                    {/* Divider */}
                    <div style={{ position:"absolute", top:0, bottom:0, width:2, background:C.white, left:`${sliderPos}%`, zIndex:3 }}>
                      <div style={{
                        position:"absolute", top:"50%", left:"50%",
                        transform:"translate(-50%,-50%)",
                        width:32, height:32, borderRadius:"50%", background:C.white,
                        boxShadow:"0 2px 8px rgba(0,0,0,0.4)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                      }}>
                        <svg viewBox="0 0 20 20" style={{ width:16, height:16 }} fill="none" stroke={C.slate600} strokeWidth="2">
                          <path d="M6 6l-4 4 4 4M14 6l4 4-4 4"/>
                        </svg>
                      </div>
                    </div>
                    <input type="range" min={2} max={98} value={sliderPos}
                      onChange={e => setSliderPos(+e.target.value)}
                      style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0, cursor:"col-resize", zIndex:10 }}
                    />
                    {/* Labels */}
                    <div style={{ position:"absolute", top:12, left:12, fontSize:10, fontWeight:700, color:C.white, background:"rgba(0,0,0,0.5)", padding:"3px 8px", borderRadius:99, backdropFilter:"blur(4px)" }}>Original</div>
                    <div style={{ position:"absolute", top:12, right:12, fontSize:10, fontWeight:700, color:C.white, background:`${C.indigo}cc`, padding:"3px 8px", borderRadius:99 }}>Enhanced</div>
                  </div>
                </div>
              </div>

              {/* Enhancement summary */}
              <Card title="Enhancement Summary">
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:8 }}>
                  {[
                    { label:"Focus Clarity",        before:"84 px²",   after:"312 px²",   up:true  },
                    { label:"Contrast (CLAHE)",     before:"38%",      after:"74%",        up:true  },
                    { label:"Illumination Std Dev", before:"±42",      after:"±18",        up:false },
                    { label:"Noise Level",          before:"High",     after:"Low",        up:false },
                  ].map(s => (
                    <div key={s.label} style={{
                      padding:"10px 14px", borderRadius:10, background:C.bg,
                      border:`1px solid ${C.borderLight}`,
                    }}>
                      <div style={{ fontSize:10, fontWeight:600, color:C.slate500, marginBottom:5 }}>{s.label}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:11, color:C.slate400, textDecoration:"line-through" }}>{s.before}</span>
                        <Ico.ArrowR />
                        <span style={{ fontSize:12, fontWeight:700, color:C.success }}>{s.after}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right panel — controls */}
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {/* Enhancement controls */}
              <Card title="Enhancement Controls" subtitle="Toggle algorithms on/off">
                <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                  <ToggleSwitch on={clahe}   onChange={setClahe}   label="CLAHE" />
                  <div style={{ height:1, background:C.borderLight, margin:"2px 0" }}/>
                  <ToggleSwitch on={illum}   onChange={setIllum}   label="Illumination Normalization" />
                  <div style={{ height:1, background:C.borderLight, margin:"2px 0" }}/>
                  <ToggleSwitch on={denoise} onChange={setDenoise} label="Denoising (BM3D)" />
                </div>
                <ActionButton variant="secondary" style={{ marginTop:14, width:"100%", justifyContent:"center" }}
                  onClick={() => {
                    setClahe(true);
                    setIllum(true);
                    setDenoise(true);
                    setSliderPos(50);
                  }}
                >
                  Reset to Defaults
                </ActionButton>
              </Card>

              {/* Metrics comparison */}
              <Card title="Algorithm Details">
                <div style={{ marginTop:8 }}>
                {[
                  { name:"CLAHE", desc:"Contrast Limited Adaptive Histogram Equalization", param:"Clip limit: 2.0 · Grid: 8×8" },
                  { name:"Illumin. Norm.", desc:"Gamma correction + flat-field correction", param:"γ = 0.45 · Kernel: Gaussian σ=30" },
                  { name:"BM3D Denoising", desc:"Block-Matching 3D collaborative filtering", param:"σ = 12 · Step 1+2" },
                ].map(a => (
                  <div key={a.name} style={{ marginBottom:12, padding:"10px 12px", borderRadius:10, background:C.bg, border:`1px solid ${C.borderLight}` }}>
                    <div style={{ fontSize:12, fontWeight:700, color:C.textPrimary }}>{a.name}</div>
                    <div style={{ fontSize:10, color:C.slate500, marginTop:2, lineHeight:1.5 }}>{a.desc}</div>
                    <div style={{ fontSize:9, fontFamily:"var(--font-jetbrains)", color:C.slate400, marginTop:4 }}>{a.param}</div>
                  </div>
                ))}
                </div>
              </Card>

              {/* Thumbnail set */}
              <Card title="Stage Thumbnails">
                <div style={{ display:"flex", flexWrap:"wrap", gap:10, justifyContent:"center", marginTop:8 }}>
                  {([
                    { label:"Original",  v:"moderate" as FundusV },
                    { label:"CLAHE",     v:"enhanced"  as FundusV },
                    { label:"Illum.",    v:"enhanced"  as FundusV },
                    { label:"Denoised", v:"enhanced"  as FundusV },
                  ] as {label:string;v:FundusV}[]).map(t => (
                    <div key={t.label} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
                      <FundusImg variant={t.v} size={56} />
                      <span style={{ fontSize:9, color:C.slate500, fontWeight:600 }}>{t.label}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* CTA */}
              <ActionButton variant="primary" size="lg" onClick={onNext} icon={<Ico.ArrowR />} style={{ width:"100%", justifyContent:"center" }}>
                Continue to AI Analysis
              </ActionButton>
              <ActionButton variant="secondary" onClick={onBack} style={{ width:"100%", justifyContent:"center" }}>← Back</ActionButton>
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
  return <ImageEnhancementScreen onNav={onNav} onNext={() => navigate(screeningPath("/screening/ai-analysis", screeningId))} onBack={() => navigate(screeningPath("/screening/quality", screeningId))} />;
}
