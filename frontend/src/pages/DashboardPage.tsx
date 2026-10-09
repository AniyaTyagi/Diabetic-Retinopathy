import { useNavigate } from "react-router-dom";
import { useAppNav } from "@/shared/hooks/useAppNav";
import { useApiData } from "@/shared/hooks/useApiData";
import { useOnlineStatus } from "@/shared/hooks/useOnlineStatus";
import { listScreenings } from "@/shared/api/screenings";
import {
  C, Ico, Sidebar, Header, Card, CardRow, DR,
  type NavKey,
} from "@/shared/ui";
import { useState } from "react";

function riskMeta(level: number) {
  if (level >= 3) return { label: "High", color: C.danger, bg: C.dangerLight };
  if (level === 2) return { label: "Moderate", color: C.warning, bg: C.warningLight };
  return { label: "Low", color: C.success, bg: C.successLight };
}

function statusMeta(level: number, review: string) {
  if (level >= 3) return { label: "Referred", color: C.danger };
  if (review === "pending" || level === 2) return { label: "Review", color: C.textPrimary };
  return { label: "Cleared", color: C.success };
}

function DashboardScreen({ onNav, onOpenResults }: {
  onNav: (k: NavKey) => void;
  onOpenResults: (screeningId: string) => void;
}) {
  const [activeNav, setActiveNav] = useState<NavKey>("dashboard");
  const handleNav = (k: NavKey) => { setActiveNav(k); onNav(k); };
  const { data: screenings, loading, error } = useApiData(listScreenings, []);
  const online = useOnlineStatus();

  const todayCount = screenings.length;
  const referredCount = screenings.filter(s => (s.dr_level ?? 0) >= 3).length;
  const pendingCount = screenings.filter(s => s.review_status === "pending").length;
  const recent = screenings.slice(0, 5);

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <Sidebar active={activeNav} onSelect={handleNav} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header
          title="Health Worker Dashboard"
          breadcrumbs={["NetraX", "Health Worker Dashboard"]}
        />

        <main style={{
          flex: 1, overflowY: "auto", padding: 28, background: C.bg,
          display: "flex", flexDirection: "column", gap: 22,
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.success, marginBottom: 4 }}>
              Good morning,
            </div>
            <div style={{
              fontSize: 28, fontWeight: 800, color: C.textPrimary,
              letterSpacing: -0.5, lineHeight: 1.2,
            }}>
              Ready for today’s screenings?
            </div>
            {error && <div style={{ marginTop: 8, fontSize: 12, color: C.danger }}>{error}</div>}
            {loading && <div style={{ marginTop: 8, fontSize: 12, color: C.slate500 }}>Loading screenings…</div>}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 14 }}>
            <div
              onClick={() => handleNav("new-screening")}
              style={{
                background: C.navy,
                borderRadius: 16,
                padding: "22px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(6, 15, 41, 0.22)",
                transition: "transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s ease",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(6, 15, 41, 0.28)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(6, 15, 41, 0.22)";
              }}
            >
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.white, letterSpacing: -0.3 }}>
                  New Screening
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
                  Start patient assessment
                </div>
              </div>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: C.white,
              }}>
                <Ico.Plus />
              </div>
            </div>

            <Card style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.slate500 }}>Today</div>
              <div style={{
                fontFamily: "var(--font-jetbrains)", fontSize: 32, fontWeight: 800,
                color: C.textPrimary, letterSpacing: -0.6, marginTop: 6, lineHeight: 1,
              }}>
                {todayCount}
              </div>
              <div style={{ fontSize: 12, color: C.slate500, marginTop: 6 }}>Screenings</div>
            </Card>

            <Card style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.danger }}>Referred</div>
              <div style={{
                fontFamily: "var(--font-jetbrains)", fontSize: 32, fontWeight: 800,
                color: C.textPrimary, letterSpacing: -0.6, marginTop: 6, lineHeight: 1,
              }}>
                {referredCount}
              </div>
              <div style={{ fontSize: 12, color: C.danger, marginTop: 6 }}>High-risk</div>
            </Card>

            <Card style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.warning }}>Pending</div>
              <div style={{
                fontFamily: "var(--font-jetbrains)", fontSize: 32, fontWeight: 800,
                color: C.textPrimary, letterSpacing: -0.6, marginTop: 6, lineHeight: 1,
              }}>
                {pendingCount}
              </div>
              <div style={{ fontSize: 12, color: C.warning, marginTop: 6 }}>Specialist review</div>
            </Card>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: 16, alignItems: "start" }}>
            <Card title="Recent screenings" style={{ padding: "20px 22px" }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1.1fr 1fr 1.3fr 0.9fr 0.9fr",
                gap: 10,
                padding: "0 4px 10px",
                borderBottom: `1px solid ${C.borderLight}`,
                marginBottom: 8,
              }}>
                {["Patient ID", "Date", "AI result", "Risk", "Status"].map(h => (
                  <div key={h} style={{ fontSize: 12, fontWeight: 600, color: C.slate500 }}>{h}</div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {recent.map(s => {
                  const level = s.dr_level ?? 0;
                  const dr = DR[level] ?? DR[0];
                  const risk = riskMeta(level);
                  const st = statusMeta(level, s.review_status);
                  return (
                    <CardRow
                      key={s.screening_id}
                      onClick={() => onOpenResults(s.screening_id)}
                      style={{
                        gridTemplateColumns: "1.1fr 1fr 1.3fr 0.9fr 0.9fr",
                        gap: 10,
                        minHeight: 52,
                        padding: "10px 12px",
                      }}
                    >
                      <div style={{
                        fontFamily: "var(--font-jetbrains)", fontSize: 12,
                        fontWeight: 700, color: C.indigo,
                      }}>
                        {s.patient_id}
                      </div>
                      <div style={{ fontSize: 12, color: C.slate600 }}>{s.date}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary }}>
                        {dr.label}
                      </div>
                      <div>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99,
                          background: risk.bg, color: risk.color,
                        }}>
                          {risk.label}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: st.color }}>
                        {st.label}
                      </div>
                    </CardRow>
                  );
                })}
                {!loading && recent.length === 0 && (
                  <div style={{ padding: 16, fontSize: 13, color: C.slate500 }}>No screenings yet.</div>
                )}
              </div>
            </Card>

            <Card title="Connection status" style={{ padding: "20px 22px" }}>
              <div style={{ fontSize: 13, color: C.slate500, marginTop: 2, marginBottom: 16 }}>
                {online ? "" : "Network unavailable — reconnect to sync"}
              </div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 14px", borderRadius: 99,
                background: online ? C.successLight : C.dangerLight,
                color: online ? C.successText : C.danger,
                fontSize: 13, fontWeight: 700,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: online ? C.success : C.danger }} />
                {online ? "Online" : "Offline"}
              </div>
              <div style={{
                marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.borderLight}`,
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: C.slate500 }}>Network</span>
                  <span style={{ fontWeight: 700, color: online ? C.success : C.danger }}>{online ? "Online" : "Offline"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: C.slate500 }}>Pending reviews</span>
                  <span style={{ fontWeight: 700, color: C.textPrimary }}>{pendingCount}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: C.slate500 }}>High-risk referrals</span>
                  <span style={{ fontWeight: 700, color: C.danger }}>{referredCount}</span>
                </div>
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
  const navigate = useNavigate();
  return (
    <DashboardScreen
      onNav={onNav}
      onOpenResults={(sid) => navigate(`/screening/results?sid=${encodeURIComponent(sid)}`)}
    />
  );
}
