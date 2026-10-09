import { useNavigate } from "react-router-dom";
import { useAppNav } from "@/shared/hooks/useAppNav";
import { useApiData } from "@/shared/hooks/useApiData";
import { getSimulationCapacity } from "@/shared/api/platform";
import {
  C, Ico, Sidebar, Header, Card, ActionButton, PipelineNode, PipelineArrow,
  type NavKey,
} from "@/shared/ui";
import { useState, type ReactNode } from "react";

const PIPELINE_ICONS: Record<string, ReactNode> = {
  "Fundus Camera": <Ico.Camera />,
  "Image Acquisition": <Ico.Scan />,
  "Data Transfer": <Ico.Activity />,
  "NetraX AI Processing": <Ico.Cpu />,
  "Ophthalmologist Review": <Ico.Eye />,
  Referral: <Ico.ArrowR />,
};

function SimulinkWorkflowScreen({ onNext, onNav }: { onNext: () => void; onNav: (k: NavKey) => void }) {
  const [activeNav] = useState<NavKey>("simulation");
  const { data, loading, error } = useApiData(getSimulationCapacity, {
    title: "",
    subtitle: "",
    pipeline: [],
    metrics: [],
    bottlenecks: [],
  });

  const nodes = data.pipeline.length
    ? data.pipeline.map(n => ({
        l: n.label,
        icon: PIPELINE_ICONS[n.label] ?? <Ico.Activity />,
        a: n.accent,
      }))
    : [];

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header title="Simulink Workflow Simulation" breadcrumbs={["NetraX", "Simulation", "District Capacity"]}
          actions={<span style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 99, background: C.warningLight, color: C.warning }}>From DB</span>}
        />
        <main style={{ flex: 1, overflowY: "auto", padding: 28, background: C.bg }}>
          {error && <div style={{ marginBottom: 12, fontSize: 12, color: C.danger }}>{error}</div>}
          {loading && <div style={{ marginBottom: 12, fontSize: 12, color: C.slate500 }}>Loading capacity model…</div>}

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary }}>
              {data.title || "District-Level Telemedicine Screening Capacity"}
            </div>
            <div style={{ fontSize: 12, color: C.slate500, marginTop: 4 }}>
              {data.subtitle || "System-level capacity model for rural screening networks"}
            </div>
          </div>

          <Card style={{ padding: "28px 20px", marginBottom: 18, overflowX: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, minWidth: 760 }}>
              {nodes.map((n, i) => (
                <span key={n.l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <PipelineNode label={n.l} icon={n.icon} accent={n.a} />
                  {i < nodes.length - 1 && <PipelineArrow />}
                </span>
              ))}
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
            {data.metrics.map(m => (
              <Card key={m.label} style={{ padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.slate500 }}>{m.label}</div>
                <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 24, fontWeight: 800, color: m.color, marginTop: 6 }}>{m.value}</div>
              </Card>
            ))}
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, marginBottom: 12 }}>Bottleneck Analysis</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 18 }}>
            {data.bottlenecks.map(b => (
              <Card key={b.label} style={{ border: `1.5px solid ${b.color}40`, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.textPrimary }}>{b.label}</div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: `${b.color}18`, color: b.color }}>{b.severity}</span>
                </div>
                <div style={{ fontSize: 12, color: C.slate600, lineHeight: 1.5 }}>{b.detail}</div>
              </Card>
            ))}
          </div>

          <ActionButton variant="primary" size="lg" onClick={onNext} icon={<Ico.ArrowR />} style={{ width: "100%", justifyContent: "center" }}>
            Open Full Simulation Model
          </ActionButton>
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  const onNav = useAppNav();
  const navigate = useNavigate();
  return <SimulinkWorkflowScreen onNav={onNav} onNext={() => navigate("/simulation/resources")} />;
}
