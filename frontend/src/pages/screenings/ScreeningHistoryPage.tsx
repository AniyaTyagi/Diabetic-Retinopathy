import { useNavigate } from "react-router-dom";
import { useAppNav } from "@/shared/hooks/useAppNav";
import { useApiData } from "@/shared/hooks/useApiData";
import { listScreenings } from "@/shared/api/screenings";
import {
  C, Ico, Badge, Sidebar, Header,
  Card, CardRow, DR,
  type NavKey, type BadgeV,
} from "@/shared/ui";
import { useState } from "react";

function asReviewBadge(status: string): BadgeV {
  return status === "pending" ? "pending" : "completed";
}

function ScreeningHistoryScreen({ onNav, onOpenScreening }: {
  onNav: (k: NavKey) => void;
  onOpenScreening: (screeningId: string) => void;
}) {
  const [activeNav] = useState<NavKey>("screenings");
  const [q, setQ] = useState("");
  const [model, setModel] = useState("All");
  const [status, setStatus] = useState("All");
  const [levelFilter, setLevelFilter] = useState("All");
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const { data: screenings, loading, error } = useApiData(listScreenings, []);

  const filtered = screenings.filter(s => {
    const mq = !q
      || s.patient_id.toLowerCase().includes(q.toLowerCase())
      || s.screening_id.toLowerCase().includes(q.toLowerCase())
      || s.center.toLowerCase().includes(q.toLowerCase());
    const mm = model === "All" || s.model_used === model;
    const ms = status === "All" || s.review_status === status;
    const ml = levelFilter === "All" || String(s.dr_level) === levelFilter;
    return mq && mm && ms && ml;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header
          title="Review & Verify"
          breadcrumbs={["NetraX", "Review & Verify"]}
          actions={<span style={{ fontSize: 12, color: C.slate500, fontWeight: 600 }}>{rows.length} records</span>}
        />
        <main style={{ flex: 1, overflowY: "auto", padding: 28, background: C.bg }}>
          {error && <div style={{ marginBottom: 12, fontSize: 12, color: C.danger }}>{error}</div>}
          <div style={{
            background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: "14px 18px", marginBottom: 20,
            display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center",
            boxShadow: "0 1px 3px rgba(18, 28, 46, 0.04)",
          }}>
            <div style={{
              flex: "1 1 240px", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
              borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg,
            }}>
              <span style={{ color: C.slate400, display: "flex" }}><Ico.Search /></span>
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search Patient ID / Center / Screening ID"
                style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13, color: C.textPrimary }}
              />
            </div>

            <select value={model} onChange={e => { setModel(e.target.value); setPage(1); }}
              style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 12, fontWeight: 600, color: C.textPrimary, background: C.white }}>
              <option value="All">Model: All</option>
              <option>SVM</option>
              <option>VQC</option>
              <option>QSVM</option>
            </select>
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
              style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 12, fontWeight: 600, color: C.textPrimary, background: C.white }}>
              <option value="All">Status: All</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
            <select value={levelFilter} onChange={e => { setLevelFilter(e.target.value); setPage(1); }}
              style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 12, fontWeight: 600, color: C.textPrimary, background: C.white }}>
              <option value="All">DR Level: All</option>
              <option value="0">Level 0 (No DR)</option>
              <option value="1">Level 1 (Mild)</option>
              <option value="2">Level 2 (Moderate)</option>
              <option value="3">Level 3 (Severe)</option>
              <option value="4">Level 4 (PDR)</option>
            </select>
          </div>

          <Card style={{ padding: "20px 24px" }}>
            <div style={{
              display: "grid", gridTemplateColumns: "120px 1.4fr 110px 100px 110px 90px 120px",
              padding: "0 16px 12px", gap: 12, borderBottom: `1px solid ${C.borderLight}`, marginBottom: 10,
            }}>
              {["Patient ID", "Center", "Date", "DR Level", "AI Confidence", "Model", "Review Status"].map(h => (
                <div key={h} style={{ fontSize: 12, fontWeight: 600, color: C.slate500 }}>{h}</div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {loading && <div style={{ padding: 16, fontSize: 13, color: C.slate500 }}>Loading…</div>}
              {rows.map(s => {
                const level = s.dr_level ?? 0;
                const dr = DR[level] ?? DR[0];
                return (
                  <CardRow
                    key={s.screening_id}
                    onClick={() => onOpenScreening(s.screening_id)}
                    style={{
                      gridTemplateColumns: "120px 1.4fr 110px 100px 110px 90px 120px",
                      gap: 12,
                      minHeight: 56,
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, fontWeight: 700, color: C.indigo }}>{s.patient_id}</div>
                      <div style={{ fontSize: 10, color: C.slate400 }}>{s.screening_id}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{s.center}</div>
                    <div style={{ fontSize: 12, color: C.slate600 }}>{s.date}</div>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: dr.bg, color: dr.text }}>
                        L{level} · {dr.label}
                      </span>
                    </div>
                    <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, fontWeight: 700, color: C.textPrimary }}>
                      {((s.confidence ?? 0) * 100).toFixed(0)}%
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.slate600 }}>{s.model_used || "—"}</div>
                    <div><Badge v={asReviewBadge(s.review_status)} /></div>
                  </CardRow>
                );
              })}
              {!loading && rows.length === 0 && (
                <div style={{ padding: 16, fontSize: 13, color: C.slate500 }}>No screenings found.</div>
              )}
            </div>

            {totalPages > 1 && (
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 16,
                paddingTop: 12,
                borderTop: `1px solid ${C.borderLight}`,
              }}>
                <span style={{ fontSize: 12, color: C.slate500 }}>
                  Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} screenings
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      background: currentPage <= 1 ? C.slate100 : C.white,
                      color: currentPage <= 1 ? C.slate400 : C.textPrimary,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                    }}
                  >
                    Previous
                  </button>
                  <span style={{ padding: "6px 10px", fontSize: 12, fontWeight: 700, color: C.indigo }}>
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      background: currentPage >= totalPages ? C.slate100 : C.white,
                      color: currentPage >= totalPages ? C.slate400 : C.textPrimary,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
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
    <ScreeningHistoryScreen
      onNav={onNav}
      onOpenScreening={(sid) => navigate(`/screening/results?sid=${encodeURIComponent(sid)}`)}
    />
  );
}
