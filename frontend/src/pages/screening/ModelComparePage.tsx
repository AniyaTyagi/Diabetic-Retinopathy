import { useAppNav } from "@/shared/hooks/useAppNav";
import { useActiveScreening } from "@/shared/screening/useActiveScreening";
import { useScreeningFlowNav } from "@/shared/screening/useScreeningFlowNav";
import {
  C, Ico, Sidebar, Header,
  Card, ActionButton,
  ArchStep, ArchArrow,
  type NavKey,
} from "@/shared/ui";
import { useState } from "react";

function pct(n: number | undefined | null) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function ModelComparisonScreen({
 onNext, onNav, nextLabel }: { onNext: () => void; onNav: (k: NavKey) => void; nextLabel: string }) {
  const { screeningId, result } = useActiveScreening();
  const [activeNav] = useState<NavKey>("analytics");

  const mc = result?.explainability?.model_compare;
  const live = Boolean(mc && (mc.cnn_dr_level != null || mc.qml_dr_level != null));

  const cnnRows = live
    ? [
        { label: "DR grade", value: mc?.cnn_label ?? `L${mc?.cnn_dr_level}` },
        { label: "Confidence", value: pct(mc?.cnn_confidence) },
        { label: "Level (0–4)", value: String(mc?.cnn_dr_level ?? "—") },
        { label: "Role", value: "DINOv2 classifier" },
      ]
    : [
        { label: "Status", value: "Run Analyze first" },
        { label: "Expected", value: "CNN-DINOv2 live grade" },
      ];

  const qmlRows = live
    ? [
        { label: "DR grade", value: mc?.qml_label ?? `L${mc?.qml_dr_level}` },
        { label: "Confidence", value: pct(mc?.qml_confidence) },
        { label: "Level (0–4)", value: String(mc?.qml_dr_level ?? "—") },
        { label: "Role", value: "Hybrid QML (4 qubits)" },
      ]
    : [
        { label: "Status", value: "Run Analyze first" },
        { label: "Expected", value: "QML-Hybrid live grade" },
      ];

  const cnnConf = mc?.cnn_confidence ?? 0;
  const qmlConf = mc?.qml_confidence ?? 0;
  const chartRows = live
    ? [
        {
          label: "Confidence",
          cnn: cnnConf,
          qml: qmlConf,
        },
        {
          label: "Normalized grade",
          cnn: (mc?.cnn_dr_level ?? 0) / 4,
          qml: (mc?.qml_dr_level ?? 0) / 4,
        },
      ]
    : [];

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <Header title="Model Comparison" breadcrumbs={["NetraX","Screening","CNN vs QML"]}
          actions={
            <span style={{
              fontSize:10, fontWeight:700, padding:"4px 10px", borderRadius:99,
              background: live ? C.successLight : C.warningLight,
              color: live ? C.success : C.warning,
              border:`1px solid ${(live ? C.success : C.warning)}40`,
            }}>{live ? "Live inference" : "Awaiting analyze"}</span>
          }
        />
        <main style={{ flex:1, overflowY:"auto", padding:28, background:C.bg }}>
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:15, fontWeight:700, color:C.textPrimary }}>CNN (DINOv2) vs Hybrid QML</div>
            <div style={{ fontSize:12, color:C.slate500, marginTop:4, maxWidth:720, lineHeight:1.55 }}>
              Same uploaded fundus → classical CNN grade and quantum-hybrid head on PCA-compressed DINOv2 features.
              Ensemble uses higher-confidence model{mc?.winner ? ` (winner: ${mc.winner})` : ""}.
            </div>
          </div>

          {live && (
            <Card style={{ padding:18, marginBottom:18, background:C.indigoLight, border:`1px solid ${C.indigoDim}` }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.indigo, textTransform:"uppercase", letterSpacing:0.4 }}>Ensemble</div>
              <div style={{ fontSize:20, fontWeight:800, color:C.textPrimary, marginTop:4 }}>
                {mc?.ensemble_label ?? `L${mc?.ensemble_dr_level}`} · {pct(mc?.ensemble_confidence)}
              </div>
              <div style={{ fontSize:12, color:C.slate600, marginTop:6 }}>
                Screening {screeningId || "—"} · model {result?.model_used || "ensemble-CNN+QML"}
              </div>
            </Card>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginBottom:18 }}>
            <Card style={{ padding:22 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:C.slate500, textTransform:"uppercase", letterSpacing:0.4 }}>Classical</div>
                  <div style={{ fontSize:20, fontWeight:800, color:C.textPrimary, marginTop:2 }}>CNN · DINOv2</div>
                </div>
                <div style={{ width:40, height:40, borderRadius:12, background:C.slate100, display:"flex", alignItems:"center", justifyContent:"center", color:C.slate600 }}>
                  <Ico.Cpu />
                </div>
              </div>
              {cnnRows.map(m => (
                <div key={m.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:`1px solid ${C.borderLight}` }}>
                  <span style={{ fontSize:12, color:C.slate500 }}>{m.label}</span>
                  <span style={{ fontFamily:"var(--font-jetbrains)", fontSize:13, fontWeight:700, color:C.textPrimary }}>
                    {m.value}
                  </span>
                </div>
              ))}
              <div style={{ marginTop:18 }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.slate500, marginBottom:10, textTransform:"uppercase", letterSpacing:0.3 }}>Architecture</div>
                <ArchStep label="Fundus RGB" accent={C.indigo} />
                <ArchArrow />
                <ArchStep label="DINOv2 classifier" accent={C.indigo} />
                <ArchArrow />
                <ArchStep label="Softmax · 5-class DR" accent={C.slate600} />
              </div>
            </Card>

            <Card style={{ padding:22, border:`1.5px solid ${C.indigoDim}`, boxShadow:`0 0 0 3px ${C.indigo}0D` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:C.indigo, textTransform:"uppercase", letterSpacing:0.4 }}>QML</div>
                  <div style={{ fontSize:20, fontWeight:800, color:C.textPrimary, marginTop:2 }}>Hybrid VQC</div>
                </div>
                <div style={{ width:40, height:40, borderRadius:12, background:C.indigoLight, display:"flex", alignItems:"center", justifyContent:"center", color:C.indigo }}>
                  <Ico.Atom />
                </div>
              </div>
              {qmlRows.map(m => (
                <div key={m.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:`1px solid ${C.borderLight}` }}>
                  <span style={{ fontSize:12, color:C.slate500 }}>{m.label}</span>
                  <span style={{ fontFamily:"var(--font-jetbrains)", fontSize:13, fontWeight:700, color:C.indigo }}>
                    {m.value}
                  </span>
                </div>
              ))}
              <div style={{ marginTop:18 }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.slate500, marginBottom:10, textTransform:"uppercase", letterSpacing:0.3 }}>Architecture</div>
                <ArchStep label="DINOv2 1536-d features" accent={C.indigo} />
                <ArchArrow />
                <ArchStep label="PCA(4) + scaler" accent={C.indigo} />
                <ArchArrow />
                <ArchStep label="AngleEmbedding + Entangler" accent={C.warning} />
                <ArchArrow />
                <ArchStep label="Linear → 5-class DR" accent={C.indigo} />
              </div>
            </Card>
          </div>

          {live && (
            <Card title="Live metric bars" style={{ marginBottom:16 }}
              action={
                <div style={{ display:"flex", gap:14 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <div style={{ width:10, height:10, borderRadius:3, background:C.slate500 }}/>
                    <span style={{ fontSize:11, color:C.slate500, fontWeight:600 }}>CNN</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <div style={{ width:10, height:10, borderRadius:3, background:C.indigo }}/>
                    <span style={{ fontSize:11, color:C.slate500, fontWeight:600 }}>QML</span>
                  </div>
                </div>
              }
            >
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {chartRows.map(r => (
                  <div key={r.label}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ fontSize:12, fontWeight:600, color:C.textPrimary }}>{r.label}</span>
                      <span style={{ fontSize:11, color:C.slate400, fontFamily:"var(--font-jetbrains)" }}>
                        {r.cnn.toFixed(2)} · {r.qml.toFixed(2)}
                      </span>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                      <div style={{ height:8, borderRadius:99, background:C.borderLight, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${Math.min(100, r.cnn*100)}%`, background:C.slate500, borderRadius:99 }} />
                      </div>
                      <div style={{ height:8, borderRadius:99, background:C.borderLight, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${Math.min(100, r.qml*100)}%`, background:C.indigo, borderRadius:99 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div style={{
            background:C.warningLight, borderRadius:14, border:`1px solid ${C.warning}35`,
            padding:"14px 18px", display:"flex", gap:12, alignItems:"flex-start", marginBottom:16,
          }}>
            <div style={{ color:C.warning, flexShrink:0 }}><Ico.Warn /></div>
            <div style={{ fontSize:12, color:C.slate700, lineHeight:1.6 }}>
              <strong style={{ color:C.textPrimary }}>Live screening comparison.</strong>{" "}
              Numbers above come from this patient&apos;s uploaded images after Analyze — not static benchmark placeholders.
            </div>
          </div>

          <ActionButton variant="primary" size="lg" onClick={onNext} icon={<Ico.ArrowR />} style={{ width:"100%", justifyContent:"center" }}>
            {nextLabel}
          </ActionButton>
        </main>
      </div>
    </div>
  );
}


export default function Page() {
  const onNav = useAppNav();
  const flow = useScreeningFlowNav("/screening/model-compare");
  return <ModelComparisonScreen onNav={onNav} onNext={flow.goNext} nextLabel={flow.buttonLabel} />;
}
