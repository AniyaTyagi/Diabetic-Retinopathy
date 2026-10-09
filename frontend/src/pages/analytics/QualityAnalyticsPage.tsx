import { useAppNav } from "@/shared/hooks/useAppNav";
import { useApiData } from "@/shared/hooks/useApiData";
import { getQualityAnalytics } from "@/shared/api/analytics";
import {
  C, Ico, FundusImg, Sidebar, Header, Card, StatCard, ActionButton, MiniBarChart,
  type NavKey, type FundusV,
} from "@/shared/ui";
import { useState } from "react";

function ImageQualityAnalyticsScreen({ onNav }: { onNav: (k: NavKey) => void }) {
  const [activeNav] = useState<NavKey>("quality");
  const { data, loading, error } = useApiData(getQualityAnalytics, {
    avg_quality: 0,
    good_pct: 0,
    ungradeable_pct: 0,
    recapture_pct: 0,
    score_distribution: [],
    failures: [],
    by_center: [],
    center_labels: [],
    by_device: [],
    device_labels: [],
    recapture_monthly: [],
    live_center_quality: [],
    live_device_quality: [],
  });

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header title="Image Quality Analytics" breadcrumbs={["NetraX", "Quality Check", "Analytics"]}
          actions={
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 99, background: C.slate100, color: C.slate600 }}>Live + seeded</span>
              <ActionButton variant="secondary" size="sm" onClick={() => onNav("analytics")}>← Analytics</ActionButton>
            </div>
          }
        />
        <main style={{ flex: 1, overflowY: "auto", padding: 28, background: C.bg }}>
          {error && <div style={{ marginBottom: 12, fontSize: 12, color: C.danger }}>{error}</div>}
          {loading && <div style={{ marginBottom: 12, fontSize: 12, color: C.slate500 }}>Loading quality analytics…</div>}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
            <StatCard title="Average Quality Score" value={String(data.avg_quality)} delta="/ 100" up icon={<Ico.Check />} accent={C.success} />
            <StatCard title="Good Images %" value={`${data.good_pct}%`} icon={<Ico.Sparkles />} />
            <StatCard title="Ungradeable %" value={`${data.ungradeable_pct}%`} icon={<Ico.Warn />} accent={C.warning} />
            <StatCard title="Recapture Rate" value={`${data.recapture_pct}%`} delta="Target < 12%" up icon={<Ico.Activity />} />
          </div>

          <div style={{ background: C.navy, borderRadius: 18, padding: 22, marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 4 }}>Retinal Image Quality Examples</div>
            <div style={{ fontSize: 11, color: C.slate500, marginBottom: 18 }}>Reference captures for technician training and QA review</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
              {[
                { l: "GOOD IMAGE", v: "enhanced" as FundusV, ok: true },
                { l: "POOR FOCUS", v: "poor" as FundusV, ok: false },
                { l: "LOW ILLUMINATION", v: "severe" as FundusV, ok: false },
                { l: "INCOMPLETE FIELD", v: "mild" as FundusV, ok: false },
              ].map(ex => (
                <div key={ex.l} style={{ textAlign: "center" }}>
                  <div style={{
                    display: "inline-flex", borderRadius: "50%", padding: 4,
                    border: `2px solid ${ex.ok ? C.success : "rgba(255,255,255,0.15)"}`,
                    boxShadow: ex.ok ? `0 0 0 4px ${C.success}22` : "none",
                  }}>
                    <FundusImg variant={ex.v} size={140} />
                  </div>
                  <div style={{
                    marginTop: 12, fontSize: 11, fontWeight: 800, letterSpacing: 0.4,
                    color: ex.ok ? C.success : C.slate300,
                  }}>{ex.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16, marginBottom: 16 }}>
            <Card title="Quality Score Distribution" subtitle="Score bins 0–100">
              <MiniBarChart data={data.score_distribution.length ? data.score_distribution : [0]} color={C.indigo} height={120} />
            </Card>
            <Card title="Common Failure Reasons">
              {data.failures.map(f => (
                <div key={f.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: C.slate600, fontWeight: 600 }}>{f.label}</span>
                    <span style={{ fontFamily: "var(--font-jetbrains)", fontWeight: 700, color: C.textPrimary }}>{f.pct}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: C.borderLight, overflow: "hidden" }}>
                    <div style={{ width: `${f.pct}%`, height: "100%", background: f.color, borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </Card>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <Card title="Quality by Center" subtitle="Mean score · centers table">
              <MiniBarChart data={data.by_center.length ? data.by_center : [0]} color={C.success} height={100} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 9, color: C.slate400 }}>
                {data.center_labels.map(x => <span key={x}>{x}</span>)}
              </div>
            </Card>
            <Card title="Quality by Device" subtitle="Mean score · devices table">
              <MiniBarChart data={data.by_device.length ? data.by_device : [0]} color={C.indigo} height={100} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 9, color: C.slate400 }}>
                {data.device_labels.map(x => <span key={x}>{x}</span>)}
              </div>
            </Card>
            <Card title="Recapture Rate Over Time" subtitle="Monthly %">
              <MiniBarChart data={data.recapture_monthly.length ? data.recapture_monthly : [0]} color={C.warning} height={100} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 9, color: C.slate400 }}>
                {["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"].map(x => <span key={x}>{x}</span>)}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  const onNav = useAppNav();
  return <ImageQualityAnalyticsScreen onNav={onNav} />;
}
