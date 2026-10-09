import { useNavigate } from "react-router-dom";
import { useAppNav } from "@/shared/hooks/useAppNav";
import { useApiData } from "@/shared/hooks/useApiData";
import { getSimulationDefaults } from "@/shared/api/platform";
import {
  C, Ico, Sidebar, Header, Card, ActionButton, MiniBarChart,
  type NavKey,
} from "@/shared/ui";
import { useEffect, useState } from "react";

function ResourceAllocationScreen({ onNav, onBack }: { onNav: (k: NavKey) => void; onBack: () => void }) {
  const [activeNav] = useState<NavKey>("simulation");
  const { data: defaults, loading, error } = useApiData(getSimulationDefaults, {
    phcs: 12,
    images_day: 320,
    bandwidth: 68,
    ophthalmologists: 4,
    ai_capacity_per_hour: 180,
  });

  const [phcs, setPhcs] = useState(12);
  const [imagesDay, setImagesDay] = useState(320);
  const [bandwidth, setBandwidth] = useState(68);
  const [ophths, setOphth] = useState(4);
  const [aiCap, setAiCap] = useState(180);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (loading || hydrated) return;
    setPhcs(defaults.phcs);
    setImagesDay(defaults.images_day);
    setBandwidth(defaults.bandwidth);
    setOphth(defaults.ophthalmologists);
    setAiCap(defaults.ai_capacity_per_hour);
    setHydrated(true);
  }, [loading, hydrated, defaults]);

  const dailyThroughput = Math.min(imagesDay, aiCap * 8, ophths * 120);
  const waiting = Math.max(0, Math.round((imagesDay - dailyThroughput) / Math.max(ophths, 1) * 2.4));
  const backlog = Math.max(0, imagesDay - dailyThroughput);
  const annual = dailyThroughput * 260;
  const alloc = [phcs * 8, imagesDay / 4, bandwidth, ophths * 22, aiCap / 2];

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header title="Simulation & Resource Allocation" breadcrumbs={["NetraX", "Simulation", "Resource Model"]}
          actions={
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 99, background: C.warningLight, color: C.warning }}>Defaults from DB</span>
              <ActionButton variant="secondary" size="sm" onClick={onBack}>← Workflow</ActionButton>
            </div>
          }
        />
        <main style={{ flex: 1, overflowY: "auto", padding: 28, background: C.bg }}>
          {error && <div style={{ marginBottom: 12, fontSize: 12, color: C.danger }}>{error}</div>}
          {loading && <div style={{ marginBottom: 12, fontSize: 12, color: C.slate500 }}>Loading simulation defaults…</div>}

          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 18 }}>
            <Card style={{ alignSelf: "start" }} title="Simulation Controls">
              {[
                { l: "Number of PHCs", v: phcs, set: setPhcs, min: 4, max: 24, unit: "" },
                { l: "Images per Day", v: imagesDay, set: setImagesDay, min: 100, max: 600, unit: "" },
                { l: "Bandwidth", v: bandwidth, set: setBandwidth, min: 20, max: 100, unit: "%" },
                { l: "Ophthalmologists", v: ophths, set: setOphth, min: 1, max: 12, unit: "" },
                { l: "AI Processing Capacity", v: aiCap, set: setAiCap, min: 60, max: 300, unit: "/hr" },
              ].map(ctrl => (
                <div key={ctrl.l} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.slate600 }}>{ctrl.l}</span>
                    <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, fontWeight: 800, color: C.indigo }}>
                      {ctrl.v}{ctrl.unit}
                    </span>
                  </div>
                  <input type="range" min={ctrl.min} max={ctrl.max} value={ctrl.v}
                    onChange={e => ctrl.set(Number(e.target.value))}
                    style={{ width: "100%", accentColor: C.indigo }}
                  />
                </div>
              ))}
            </Card>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
                {[
                  { l: "Daily Throughput", v: String(dailyThroughput) },
                  { l: "Waiting Time", v: `${waiting} min` },
                  { l: "Review Backlog", v: String(backlog) },
                  { l: "Bandwidth Utilization", v: `${bandwidth}%` },
                  { l: "Annual Capacity", v: annual.toLocaleString() },
                ].map(o => (
                  <Card key={o.l} style={{ padding: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: C.slate500 }}>{o.l}</div>
                    <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 18, fontWeight: 800, color: C.textPrimary, marginTop: 6 }}>{o.v}</div>
                  </Card>
                ))}
              </div>

              <Card title="District Network" subtitle="PHC nodes → regional processing → review">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {["PHC 01", "PHC 02", "PHC 03", "PHC 04"].map(p => (
                      <div key={p} style={{
                        padding: "14px 18px", borderRadius: 12, background: C.bg, border: `1.5px solid ${C.border}`,
                        textAlign: "center", fontSize: 12, fontWeight: 700, color: C.textPrimary,
                      }}>{p}</div>
                    ))}
                  </div>
                  <div style={{ color: C.slate400 }}><Ico.ArrowR /></div>
                  <div style={{
                    padding: "20px 22px", borderRadius: 14, background: C.indigoLight, border: `1.5px solid ${C.indigoDim}`,
                    textAlign: "center", minWidth: 130,
                  }}>
                    <div style={{ color: C.indigo, marginBottom: 6, display: "flex", justifyContent: "center" }}><Ico.Cpu /></div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: C.textPrimary }}>Regional Processing</div>
                    <div style={{ fontSize: 10, color: C.slate500, marginTop: 4 }}>{aiCap}/hr AI</div>
                  </div>
                  <div style={{ color: C.slate400 }}><Ico.ArrowR /></div>
                  <div style={{
                    padding: "20px 22px", borderRadius: 14, background: C.warningLight, border: `1.5px solid ${C.warning}40`,
                    textAlign: "center", minWidth: 130,
                  }}>
                    <div style={{ color: C.warning, marginBottom: 6, display: "flex", justifyContent: "center" }}><Ico.Eye /></div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: C.textPrimary }}>Ophthalmologist</div>
                    <div style={{ fontSize: 10, color: C.slate500, marginTop: 4 }}>{ophths} reviewers</div>
                  </div>
                </div>
              </Card>

              <Card title="Resource Allocation" subtitle="Relative capacity mix (prototype)">
                <MiniBarChart data={alloc} color={C.indigo} height={110} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 9, color: C.slate500, fontWeight: 600 }}>
                  {["PHCs", "Images", "BW", "Ophth", "AI"].map(x => <span key={x}>{x}</span>)}
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
  return <ResourceAllocationScreen onNav={onNav} onBack={() => navigate("/simulation")} />;
}
