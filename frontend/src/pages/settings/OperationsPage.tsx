import { useAppNav } from "@/shared/hooks/useAppNav";
import { useApiData } from "@/shared/hooks/useApiData";
import { getOpsStatus } from "@/shared/api/platform";
import {
  C, Ico, Sidebar, Header, Card,
  type NavKey,
} from "@/shared/ui";
import { useState, type ReactNode } from "react";

const SYSTEM_ICONS: Record<string, ReactNode> = {
  "AI Processing": <Ico.Cpu />,
  Network: <Ico.Activity />,
  Database: <Ico.Layers />,
  "Fundus Devices": <Ico.Camera />,
  "Review Queue": <Ico.Eye />,
  "Report Generation": <Ico.FileText />,
};

function SystemOperationsScreen({ onNav }: { onNav: (k: NavKey) => void }) {
  const [activeNav] = useState<NavKey>("settings");
  const { data, loading, error } = useApiData(getOpsStatus, {
    banner: "",
    all_operational: true,
    systems: [],
    offline_devices: 0,
    total_devices: 0,
  });

  const systems = data.systems.map(s => ({
    ...s,
    icon: SYSTEM_ICONS[s.name] ?? <Ico.Activity />,
  }));

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header title="System Operations" breadcrumbs={["NetraX", "Settings", "Operations"]}
          actions={
            <div style={{
              display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 99,
              background: data.all_operational ? C.successLight : C.warningLight,
              border: `1px solid ${(data.all_operational ? C.success : C.warning)}40`,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: data.all_operational ? C.success : C.warning,
              }} className="pulse-dot" />
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: data.all_operational ? C.success : C.warning,
              }}>
                {data.all_operational ? "All systems operational" : "Degraded services detected"}
              </span>
            </div>
          }
        />
        <main style={{ flex: 1, overflowY: "auto", padding: 28, background: C.bg }}>
          {error && <div style={{ marginBottom: 12, fontSize: 12, color: C.danger }}>{error}</div>}
          {loading && <div style={{ marginBottom: 12, fontSize: 12, color: C.slate500 }}>Loading operations status…</div>}

          <Card style={{ padding: "16px 20px", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ color: data.all_operational ? C.success : C.warning }}><Ico.Shield /></div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>Operational overview</div>
                <div style={{ fontSize: 12, color: C.slate500, marginTop: 2 }}>
                  {data.banner || "Platform health for screening workflow services."}
                </div>
              </div>
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
            {systems.map(s => {
              const ok = s.status === "Operational";
              return (
                <Card key={s.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, background: `${s.color}14`,
                        display: "flex", alignItems: "center", justifyContent: "center", color: s.color,
                      }}>{s.icon}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: C.textPrimary }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: C.slate500, marginTop: 2 }}>Last updated · {s.updated}</div>
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 99,
                      background: ok ? C.successLight : C.warningLight,
                      color: ok ? C.success : C.warning,
                    }}>{s.status}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
                    <span style={{ color: C.slate500, fontWeight: 600 }}>Load</span>
                    <span style={{ fontFamily: "var(--font-jetbrains)", fontWeight: 800, color: C.textPrimary }}>{s.load}%</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 99, background: C.borderLight, overflow: "hidden" }}>
                    <div style={{
                      width: `${s.load}%`, height: "100%", borderRadius: 99,
                      background: s.load > 75 ? C.warning : s.color,
                    }} />
                  </div>
                </Card>
              );
            })}
          </div>

          <div style={{
            marginTop: 18, background: C.bg, borderRadius: 14, border: `1px solid ${C.border}`,
            padding: "14px 18px", fontSize: 12, color: C.slate600, lineHeight: 1.6,
          }}>
            Monitoring covers clinical workflow services only. This view is an operations summary for PHC administrators — not a security operations console.
            {data.total_devices > 0 && (
              <> Device fleet: {data.total_devices - data.offline_devices}/{data.total_devices} online.</>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  const onNav = useAppNav();
  return <SystemOperationsScreen onNav={onNav} />;
}
