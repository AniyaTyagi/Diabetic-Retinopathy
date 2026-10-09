import { useAppNav } from "@/shared/hooks/useAppNav";
import { useApiData } from "@/shared/hooks/useApiData";
import { getModelPerformance } from "@/shared/api/analytics";
import {
  C, Sidebar, Header, Card, ActionButton, MiniBarChart,
  type NavKey,
} from "@/shared/ui";
import { useState } from "react";

function ModelPerformanceScreen({ onNav }: { onNav: (k: NavKey) => void }) {
  const [activeNav] = useState<NavKey>("analytics");
  const [model, setModel] = useState("All");
  const { data, loading, error } = useApiData(getModelPerformance, {
    dataset: "",
    threshold_label: "",
    headline_metrics: [],
    models: [],
    roc_points: "",
    pr_points: "",
    confusion: { tn: 0, fp: 0, fn: 0, tp: 0 },
    class_distribution: [0, 0, 0, 0, 0],
    live_by_level: {},
  });

  const metrics = data.headline_metrics;
  const cmp = data.models;
  const roc = data.roc_points;
  const pr = data.pr_points;
  const cm = data.confusion;
  const classDist = data.class_distribution.length
    ? data.class_distribution
    : [0, 1, 2, 3, 4].map(l => data.live_by_level[String(l)] || 0);

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header title="AI Model Performance" breadcrumbs={["NetraX", "Analytics", "Model Performance"]}
          actions={
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 99,
                background: C.indigoLight, color: C.indigo, border: `1px solid ${C.indigo}40`,
              }}>eval_metrics.json</span>
              <ActionButton variant="secondary" size="sm" onClick={() => onNav("analytics")}>← Analytics</ActionButton>
            </div>
          }
        />
        <main style={{ flex: 1, overflowY: "auto", padding: 28, background: C.bg }}>
          {error && <div style={{ marginBottom: 12, fontSize: 12, color: C.danger }}>{error}</div>}
          {loading && <div style={{ marginBottom: 12, fontSize: 12, color: C.slate500 }}>Loading model metrics…</div>}

          <Card style={{ padding: 14, marginBottom: 16 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <select style={{ padding: "8px 12px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 12, fontWeight: 600, color: C.textPrimary, background: C.white }}>
                <option>Dataset: {data.dataset || "NetraX Eval"}</option>
              </select>
              <select value={model} onChange={e => setModel(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 12, fontWeight: 600, color: C.textPrimary, background: C.white }}>
                <option value="All">Model: All</option>
                {cmp.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
              </select>
              <select style={{ padding: "8px 12px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 12, fontWeight: 600, color: C.textPrimary, background: C.white }}>
                <option>DR Threshold: {data.threshold_label || "Level 2+"}</option>
              </select>
            </div>
          </Card>

          <div style={{
            background: data.status === "pending_user_metrics" ? C.warningLight : C.indigoLight,
            borderRadius: 12,
            border: `1px solid ${(data.status === "pending_user_metrics" ? C.warning : C.indigo)}40`,
            padding: "12px 16px", marginBottom: 16, fontSize: 12, color: C.slate600, lineHeight: 1.55,
          }}>
            <strong style={{ color: C.textPrimary }}>
              {data.status === "pending_user_metrics" ? "Awaiting your final eval numbers" : (data.threshold_label || "Referable DR = Level 2+")}
            </strong>
            . {data.note || "Metrics from app/ml/eval_metrics.json (CNN + QML)."}
            {data.source ? ` Source: ${data.source}.` : ""}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10, marginBottom: 16 }}>
            {metrics.map(m => (
              <Card key={m.l} style={{ padding: 14, textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: C.slate500 }}>{m.l}</div>
                <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 22, fontWeight: 800, color: C.indigo, marginTop: 6 }}>{m.v}</div>
              </Card>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <Card title="ROC Curve" subtitle="TPR vs FPR · From analytics snapshot">
              <svg viewBox="0 0 100 100" style={{ width: "100%", height: 180, background: C.bg, borderRadius: 10 }}>
                <line x1="0" y1="100" x2="100" y2="0" stroke={C.slate300} strokeWidth="0.5" strokeDasharray="2 2" />
                <polyline fill="none" stroke={C.indigo} strokeWidth="2" points={roc} />
              </svg>
            </Card>
            <Card title="Precision-Recall Curve" subtitle={`PR-AUC · ${metrics.find(m => m.l === "PR-AUC")?.v || "—"}`}>
              <svg viewBox="0 0 100 100" style={{ width: "100%", height: 180, background: C.bg, borderRadius: 10 }}>
                <polyline fill="none" stroke={C.indigo} strokeWidth="2" points={pr} />
              </svg>
            </Card>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <Card title="Confusion Matrix" subtitle="Referable vs Non-referable · Benchmark">
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr", gap: 8, maxWidth: 360 }}>
                <div />
                <div style={{ fontSize: 10, fontWeight: 700, color: C.slate500, textAlign: "center" }}>Pred −</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.slate500, textAlign: "center" }}>Pred +</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.slate500, display: "flex", alignItems: "center" }}>Actual −</div>
                <div style={{ padding: 18, borderRadius: 10, background: C.successLight, textAlign: "center", fontFamily: "var(--font-jetbrains)", fontWeight: 800, color: C.success }}>{cm.tn}</div>
                <div style={{ padding: 18, borderRadius: 10, background: C.warningLight, textAlign: "center", fontFamily: "var(--font-jetbrains)", fontWeight: 800, color: C.warning }}>{cm.fp}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.slate500, display: "flex", alignItems: "center" }}>Actual +</div>
                <div style={{ padding: 18, borderRadius: 10, background: C.dangerLight, textAlign: "center", fontFamily: "var(--font-jetbrains)", fontWeight: 800, color: C.danger }}>{cm.fn}</div>
                <div style={{ padding: 18, borderRadius: 10, background: C.indigoLight, textAlign: "center", fontFamily: "var(--font-jetbrains)", fontWeight: 800, color: C.indigo }}>{cm.tp}</div>
              </div>
            </Card>
            <Card title="Class Distribution" subtitle="Evaluation set grades">
              <MiniBarChart data={classDist} color={C.indigo} height={110} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, color: C.slate500, fontWeight: 600 }}>
                {["L0", "L1", "L2", "L3", "L4"].map(l => <span key={l}>{l}</span>)}
              </div>
            </Card>
          </div>

          <Card title="CNN vs QML — held-out metrics" subtitle="From eval_metrics.json (replace when you send final numbers)">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
              {cmp.filter(m => model === "All" || m.name === model).map(m => (
                <div key={m.name} style={{ padding: 16, borderRadius: 12, border: `1.5px solid ${m.name.includes("QML") ? C.indigoDim : C.border}`, background: m.name.includes("QML") ? C.indigoLight : C.bg }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.textPrimary, marginBottom: 12 }}>{m.name}</div>
                  {[
                    ["Accuracy", m.accuracy],
                    ["Macro-F1", m.f1],
                    ["Q. Kappa", m.quadratic_kappa],
                    ["Sensitivity", m.sensitivity],
                    ["Specificity", m.specificity],
                    ["ROC-AUC", m.roc_auc],
                  ].map(([l, v]) => (
                    <div key={String(l)} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: 11, color: C.slate500 }}>{l}</span>
                      <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, fontWeight: 700, color: C.textPrimary }}>
                        {v == null || Number.isNaN(Number(v)) ? "—" : Number(v).toFixed(4)}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  const onNav = useAppNav();
  return <ModelPerformanceScreen onNav={onNav} />;
}
