import { useNavigate } from "react-router-dom";
import { useAppNav } from "@/shared/hooks/useAppNav";
import { useActiveScreening } from "@/shared/screening/useActiveScreening";
import { screeningPath } from "@/shared/screening/session";
import { useAuth } from "@/shared/auth/AuthContext";
import {
  C, Ico, FundusImg, Badge, Sidebar, Header,
  Card, ActionButton,
  type NavKey, type BadgeV, type FundusV,
} from "@/shared/ui";
import { useState } from "react";

function WorkflowScreen({
 onBack, onNext, onNav }: { onBack: () => void; onNext: () => void; onNav: (k: NavKey) => void }) {
  const { screeningId, patient, result } = useActiveScreening();
  const { user } = useAuth();

  const [activeNav] = useState<NavKey>("new-screening");
  const [activeStep, setActiveStep] = useState(2);

  const dateLabel = result?.date || patient?.last_screening_date || "—";
  const centerLabel = patient?.center || result?.center || user?.center || "—";
  const operatorLabel = user?.full_name || "—";

  const STEPS = [
    { n:1, label:"Patient Info",    sublabel:"Demographics & history",    done:true,  active:false },
    { n:2, label:"Image Upload",    sublabel:"OD + OS fundus photos",      done:true,  active:false },
    { n:3, label:"Quality Check",   sublabel:"Automated assessment",       done:false, active:true  },
    { n:4, label:"AI Analysis",     sublabel:"CNN + QML grading",          done:false, active:false },
    { n:5, label:"Results",         sublabel:"Grade, report & referral",   done:false, active:false },
  ];

  const STATUS_CARDS = [
    {
      title:"Image Received",
      detail:"2 images uploaded successfully",
      sub:"OD: 2.4 MB  ·  OS: 2.1 MB",
      status:"completed" as BadgeV,
      color:C.success,
      bg:C.successLight,
      ts:"03 Sep 2026, 14:32",
      icon:<Ico.Upload />,
    },
    {
      title:"Quality Assessment",
      detail:"Automated quality analysis in progress",
      sub:"BRISQUE score · Focus · Illumination · FOV",
      status:"processing" as BadgeV,
      color:C.indigo,
      bg:C.indigoLight,
      ts:"03 Sep 2026, 14:33",
      icon:<Ico.Shield />,
    },
    {
      title:"AI Analysis",
      detail:"Awaiting quality check completion",
      sub:"CNN + Quantum ML · Grad-CAM · Lesion map",
      status:"pending" as BadgeV,
      color:C.slate400,
      bg:C.slate50,
      ts:"—",
      icon:<Ico.Cpu />,
    },
    {
      title:"Clinical Review",
      detail:"Awaiting AI analysis results",
      sub:"Ophthalmologist review · Grade override",
      status:"pending" as BadgeV,
      color:C.slate400,
      bg:C.slate50,
      ts:"—",
      icon:<Ico.Eye />,
    },
  ];

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <Header
          title="Screening Workflow"
          breadcrumbs={["NetraX","Screenings", screeningId || "—","Workflow"]}
          actions={
            <div style={{ display:"flex", gap:8 }}>
              <Badge v="processing" pulse />
            </div>
          }
        />

        <main style={{ flex:1, overflowY:"auto", padding:28, background:C.bg }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:20, maxWidth:1140 }}>
            {/* Left */}
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {/* Patient context */}
              <Card noPadding>
                <div style={{ padding:"14px 20px", borderBottom:`1px solid ${C.borderLight}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.textPrimary }}>Current Patient</div>
                  <span style={{ fontFamily:"var(--font-jetbrains)", fontSize:11, color:C.slate500 }}>{screeningId || "—"}</span>
                </div>
                <div style={{ padding:20, display:"flex", alignItems:"center", gap:16 }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:C.indigo, display:"flex", alignItems:"center", justifyContent:"center", color:C.white, fontSize:14, fontWeight:800, flexShrink:0 }}>SD</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:800, color:C.textPrimary, letterSpacing:-0.2 }}>{patient?.full_name || result?.patient_name || "Patient"}</div>
                    <div style={{ fontSize:11, color:C.slate500, marginTop:2 }}>
                      {[patient?.patient_id || result?.patient_id, patient ? `${patient.age} years` : null, patient?.gender === "F" ? "Female" : patient?.gender === "M" ? "Male" : patient?.gender, patient?.center || result?.center].filter(Boolean).join(" · ") || "Loading…"}
                    </div>
                    <div style={{ fontSize:11, color:C.slate500, marginTop:1 }}>
                      {[patient?.diabetes_type, patient?.diabetes_duration_years != null ? `${patient.diabetes_duration_years} years` : null, patient?.previous_dr || "No prior DR history"].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </div>
                  <div>
                    <Badge v="processing" pulse />
                  </div>
                </div>
              </Card>

              {/* Stepper */}
              <Card title="Screening Progress">
                <div style={{ display:"flex", flexDirection:"column", gap:0, marginTop:8 }}>
                  {STEPS.map((s,i)=>(
                    <div key={i} style={{ display:"flex", gap:14 }}>
                      {/* Left connector */}
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
                        <div style={{
                          width:36, height:36, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:12, fontWeight:800, flexShrink:0, transition:"all 0.2s",
                          background: s.done ? C.indigo : s.active ? C.white : C.bg,
                          color: s.done ? C.white : s.active ? C.indigo : C.slate400,
                          border: s.active ? `2.5px solid ${C.indigo}` : s.done ? "none" : `1.5px solid ${C.border}`,
                          boxShadow: s.active ? `0 0 0 4px ${C.indigo}18` : "none",
                          cursor: "pointer",
                        }} onClick={()=>setActiveStep(i+1)}>
                          {s.done ? <Ico.Check /> : s.active ? <Ico.Loader /> : s.n}
                        </div>
                        {i < STEPS.length-1 && (
                          <div style={{ width:2, flex:1, minHeight:24, background: s.done ? C.indigo : C.border, margin:"4px 0", borderRadius:1 }}/>
                        )}
                      </div>
                      {/* Content */}
                      <div style={{ flex:1, paddingBottom: i < STEPS.length-1 ? 16 : 0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ fontSize:13, fontWeight:700, color: s.done||s.active ? C.textPrimary : C.slate400 }}>{s.label}</div>
                          {s.done && (
                            <span style={{ fontSize:10, fontWeight:600, color:C.success, background:C.successLight, padding:"1px 8px", borderRadius:99 }}>Complete</span>
                          )}
                          {s.active && (
                            <span style={{ fontSize:10, fontWeight:600, color:C.indigo, background:C.indigoLight, padding:"1px 8px", borderRadius:99 }}>In Progress</span>
                          )}
                        </div>
                        <div style={{ fontSize:11, color:C.slate500, marginTop:2 }}>{s.sublabel}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Workflow status cards */}
              <Card title="Workflow Events">
                <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:8 }}>
                  {STATUS_CARDS.map((card,i)=>(
                    <div key={i} style={{
                      display:"flex", alignItems:"flex-start", gap:14, padding:14,
                      borderRadius:12, background: card.bg, border:`1px solid ${card.color}28`,
                      transition:"transform 0.15s", cursor:"pointer",
                    }}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.transform="translateX(3px)"}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.transform="translateX(0)"}
                    >
                      <div style={{
                        width:36, height:36, borderRadius:10, background:`${card.color}20`,
                        display:"flex", alignItems:"center", justifyContent:"center", color:card.color, flexShrink:0,
                      }}>{card.icon}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"space-between", flexWrap:"wrap" }}>
                          <div style={{ fontSize:13, fontWeight:700, color:C.textPrimary }}>{card.title}</div>
                          <Badge v={card.status} pulse={card.status==="processing"} />
                        </div>
                        <div style={{ fontSize:12, color:C.slate600, marginTop:3 }}>{card.detail}</div>
                        <div style={{ fontSize:10, color:C.slate400, marginTop:4 }}>{card.sub}</div>
                        <div style={{ fontSize:10, color:C.slate400, marginTop:5, fontFamily:"var(--font-jetbrains)" }}>{card.ts}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Actions */}
              <div style={{ display:"flex", gap:10 }}>
                <ActionButton variant="secondary" onClick={onBack}>← Back</ActionButton>
                <ActionButton variant="primary" onClick={onNext} icon={<Ico.ArrowR />} style={{ flex:1, justifyContent:"center" }}>
                  Continue to Quality Check
                </ActionButton>
              </div>
            </div>

            {/* Right panel */}
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {/* Fundus thumbnails */}
              <Card>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.textPrimary }}>Fundus Images</div>
                  <button style={{ fontSize:11, fontWeight:600, color:C.indigo, border:"none", background:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
                    View all <Ico.ChevR />
                  </button>
                </div>
                <div style={{ display:"flex", gap:12 }}>
                  {[
                    { eye:"Right Eye", abbr:"OD", variant:"moderate" as FundusV, size:128 },
                    { eye:"Left Eye",  abbr:"OS", variant:"mild" as FundusV, size:128 },
                  ].map(img=>(
                    <div key={img.abbr} style={{ flex:1, display:"flex", flexDirection:"column", gap:8, alignItems:"center" }}>
                      <div style={{ position:"relative" }}>
                        <FundusImg variant={img.variant} size={img.size} />
                        <div style={{
                          position:"absolute", bottom:5, left:5, fontSize:9, fontWeight:700,
                          color:C.white, background:"rgba(0,0,0,0.55)", padding:"2px 7px", borderRadius:99,
                        }}>{img.abbr}</div>
                        <div style={{
                          position:"absolute", top:5, right:5, width:22, height:22, borderRadius:7,
                          background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", color:C.white, cursor:"pointer",
                        }}>
                          <Ico.Maximize />
                        </div>
                      </div>
                      <div style={{ textAlign:"center" }}>
                        <div style={{ fontSize:11, fontWeight:700, color:C.textPrimary }}>{img.eye}</div>
                        <div style={{ fontSize:9, color:C.slate400, marginTop:1 }}>2.4 MP · JPEG</div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Quality preview */}
                <div style={{ marginTop:14, padding:"10px 12px", borderRadius:10, background:C.indigoLight, border:`1px solid ${C.indigoDim}40` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                    <Ico.Loader />
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:C.indigo }}>Quality check running…</div>
                      <div style={{ fontSize:10, color:C.slate500, marginTop:1 }}>BRISQUE · Laplacian sharpness · Histogram</div>
                    </div>
                  </div>
                  <div style={{ marginTop:8, height:4, borderRadius:99, background:`${C.indigo}20`, overflow:"hidden" }}>
                    <div style={{ height:"100%", borderRadius:99, background:C.indigo, width:"42%", animation:"fillBar 2s ease-in-out infinite alternate" }}/>
                  </div>
                </div>
              </Card>

              {/* Screening info */}
              <Card title="Screening Info">
                <div style={{ marginTop:8 }}>
                {[
                  { label:"Screening ID",    value: screeningId || "—" },
                  { label:"Date",            value: dateLabel },
                  { label:"Center",          value: centerLabel },
                  { label:"Camera",          value:"Remidio NM-FOP 10" },
                  { label:"Operator",        value: operatorLabel },
                  { label:"AI Model",        value:"QML v2.4.1" },
                ].map(r=>(
                  <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${C.borderLight}`, fontSize:12 }}>
                    <span style={{ color:C.slate500 }}>{r.label}</span>
                    <span style={{ fontWeight:600, color:C.textPrimary }}>{r.value}</span>
                  </div>
                ))}
                </div>
              </Card>

              {/* Timeline */}
              <Card title="Timeline">
                <div style={{ marginTop:8 }}>
                {[
                  { time:"14:33", event:"Quality check started", color:C.indigo,   active:true  },
                  { time:"14:32", event:"Images uploaded (OD + OS)", color:C.success, active:false },
                  { time:"14:30", event:"Patient registered",      color:C.success, active:false },
                  { time:"14:28", event:"Screening session opened", color:C.slate400, active:false },
                ].map((t,i,arr)=>(
                  <div key={i} style={{ display:"flex", gap:10 }}>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
                      <div className={t.active ? "pulse-dot" : ""} style={{ width:9, height:9, borderRadius:"50%", background:t.color, marginTop:3, flexShrink:0 }}/>
                      {i < arr.length-1 && <div style={{ width:1, flex:1, background:C.border, margin:"3px 0" }}/>}
                    </div>
                    <div style={{ paddingBottom: i<arr.length-1 ? 12 : 0, flex:1 }}>
                      <div style={{ fontSize:11, fontWeight:600, color:t.active ? C.textPrimary : C.slate500 }}>{t.event}</div>
                      <div style={{ fontFamily:"var(--font-jetbrains)", fontSize:10, color:C.slate400, marginTop:1 }}>{t.time}</div>
                    </div>
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
  return <WorkflowScreen onNav={onNav} onBack={() => navigate(screeningPath("/screening/upload", screeningId))} onNext={() => navigate(screeningPath("/screening/quality", screeningId))} />;
}
