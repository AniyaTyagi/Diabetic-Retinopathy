import { useNavigate } from "react-router-dom";
import { useAppNav } from "@/shared/hooks/useAppNav";
import { useApiData } from "@/shared/hooks/useApiData";
import { getAnalyticsSummary } from "@/shared/api/analytics";
import { listCenters } from "@/shared/api/ops";
import {
  C, Ico, Sidebar, Header, Card, StatCard, ActionButton,
  MiniBarChart, DonutMini,
  type NavKey,
} from "@/shared/ui";
import { useMemo, useState } from "react";

const LEVEL_COLORS = ["#16A34A", "#65A30D", "#D97706", "#EA580C", "#DC2626"];

function AnalyticsDashboardScreen({ onNav, onOpenModels, onOpenQuality }: {
  onNav: (k: NavKey) => void;
  onOpenModels: () => void;
  onOpenQuality: () => void;
}) {
  const [activeNav] = useState<NavKey>("analytics");
  const { data: summary, loading, error } = useApiData(getAnalyticsSummary, {
    total_screenings: 0,
    today_screenings: 0,
    referred: 0,
    pending_review: 0,
    ungradeable: 0,
    by_level: {},
    avg_confidence: null,
  });
  const { data: centers } = useApiData(listCenters, []);

  const slices = useMemo(() => (
    [0, 1, 2, 3, 4].map(l => ({
      label: `L${l}`,
      value: summary.by_level[String(l)] || 0,
      color: LEVEL_COLORS[l],
    }))
  ), [summary.by_level]);

  const trend = useMemo(() => {
    const base = Math.max(summary.total_screenings, 1);
    return Array.from({ length: 12 }, (_, i) => Math.max(1, Math.round(base * (0.55 + i * 0.04))));
  }, [summary.total_screenings]);

  const referralPct = summary.total_screenings
    ? ((summary.referred / summary.total_screenings) * 100).toFixed(1)
    : "0.0";

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header title="Screening Analytics" breadcrumbs={["NetraX", "Analytics"]}
          actions={
            <div style={{ display: "flex", gap: 8 }}>
              <ActionButton variant="outline" size="sm" onClick={onOpenModels}>Model Performance</ActionButton>
              <ActionButton variant="secondary" size="sm" onClick={onOpenQuality}>Quality Analytics</ActionButton>
            </div>
          }
        />
        <main style={{ flex: 1, overflowY: "auto", padding: 28, background: C.bg }}>
          {error && <div style={{ marginBottom: 12, fontSize: 12, color: C.danger }}>{error}</div>}
          {loading && <div style={{ marginBottom: 12, fontSize: 12, color: C.slate500 }}>Loading analytics…</div>}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
            <StatCard title="Total Screenings" value={String(summary.total_screenings)} icon={<Ico.Activity />} />
            <StatCard title="Referable DR" value={String(summary.referred)} icon={<Ico.Eye />} accent={C.warning} />
            <StatCard title="Ungradeable" value={String(summary.ungradeable)} icon={<Ico.Warn />} accent={C.slate500} />
            <StatCard title="Average Confidence" value={summary.avg_confidence != null ? String(summary.avg_confidence) : "—"} icon={<Ico.Check />} accent={C.success} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 16 }}>
            <Card title="Screenings over time" subtitle="Projected monthly volume from current DB total">
              <MiniBarChart data={trend} color={C.indigo} height={120} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 9, color: C.slate400 }}>
                {["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"].map(m => <span key={m}>{m}</span>)}
              </div>
            </Card>
            <Card title="DR severity distribution">
              <DonutMini slices={slices} />
            </Card>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
            <Card title="Referral rate">
              <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 36, fontWeight: 800, color: C.warning, marginTop: 8 }}>{referralPct}%</div>
              <div style={{ fontSize: 11, color: C.slate500, marginTop: 6 }}>Referable = Level 2+</div>
              <div style={{ marginTop: 14, height: 8, borderRadius: 99, background: C.borderLight, overflow: "hidden" }}>
                <div style={{ width: `${referralPct}%`, height: "100%", background: C.warning, borderRadius: 99 }} />
              </div>
            </Card>
            <Card title="Pending specialist review">
              <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 36, fontWeight: 800, color: C.textPrimary, marginTop: 8 }}>{summary.pending_review}</div>
              <div style={{ fontSize: 11, color: C.slate500, marginTop: 6 }}>From live screening queue</div>
            </Card>
            <Card title="Today’s volume">
              <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 36, fontWeight: 800, color: C.indigo, marginTop: 8 }}>{summary.today_screenings}</div>
              <div style={{ fontSize: 11, color: C.slate500, marginTop: 6 }}>Screenings in dataset</div>
            </Card>
          </div>

          <Card title="PHC / Rural center performance" subtitle="Daily volume · quality from centers table">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
              {centers.slice(0, 4).map(c => (
                <div key={c.id} style={{ padding: 16, borderRadius: 12, background: C.bg, border: `1px solid ${C.borderLight}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>{c.name}</div>
                  <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 22, fontWeight: 800, color: C.indigo, marginTop: 8 }}>{c.daily_volume}</div>
                  <div style={{ fontSize: 11, color: C.slate500, marginTop: 2 }}>daily screenings</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 11 }}>
                    <span style={{ color: C.warning, fontWeight: 700 }}>{c.ophthalmologist_status}</span>
                    <span style={{ color: C.success, fontWeight: 700 }}>Q {c.quality_score}</span>
                  </div>
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
  const navigate = useNavigate();
  return (
    <AnalyticsDashboardScreen
      onNav={onNav}
      onOpenModels={() => navigate("/analytics/models")}
      onOpenQuality={() => navigate("/analytics/quality")}
    />
  );
}
