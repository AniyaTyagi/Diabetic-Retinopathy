import { useNavigate } from "react-router-dom";
import { useAppNav } from "@/shared/hooks/useAppNav";
import { useApiData } from "@/shared/hooks/useApiData";
import { listReports, downloadReportPdf } from "@/shared/api/reports";
import {
  C, Ico, Badge, Sidebar, Header,
  Card, StatCard, CardRow, ActionButton,
  type NavKey, type BadgeV,
} from "@/shared/ui";
import { useState } from "react";

function asStatus(status: string): BadgeV {
  return status === "pending" ? "pending" : "completed";
}

function ReportsScreen({ onNav, onViewReport }: {
  onNav: (k: NavKey) => void;
  onViewReport: (reportId: string) => void;
}) {
  const [activeNav] = useState<NavKey>("reports");
  const { data: reports, loading, error } = useApiData(listReports, []);
  const [pdfBusyId, setPdfBusyId] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const completed = reports.filter(r => r.status === "completed").length;
  const pending = reports.filter(r => r.status === "pending").length;

  async function handlePdf(reportId: string) {
    setPdfBusyId(reportId);
    setPdfError(null);
    try {
      await downloadReportPdf(reportId);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "PDF download failed");
    } finally {
      setPdfBusyId(null);
    }
  }

  async function handleDownloadAll() {
    setPdfError(null);
    for (const r of reports) {
      setPdfBusyId(r.report_id);
      try {
        await downloadReportPdf(r.report_id);
      } catch (err) {
        setPdfError(err instanceof Error ? err.message : "PDF download failed");
        break;
      }
    }
    setPdfBusyId(null);
  }

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header
          title="Screening Reports"
          breadcrumbs={["NetraX", "Reports"]}
          actions={
            <ActionButton
              variant="primary"
              size="sm"
              icon={<Ico.Download />}
              onClick={() => void handleDownloadAll()}
              disabled={!reports.length || pdfBusyId !== null}
            >
              {pdfBusyId ? "Downloading…" : "Download All"}
            </ActionButton>
          }
        />
        <main style={{ flex: 1, overflowY: "auto", padding: 28, background: C.bg }}>
          {error && <div style={{ marginBottom: 12, fontSize: 12, color: C.danger }}>{error}</div>}
          {pdfError && <div style={{ marginBottom: 12, fontSize: 12, color: C.danger }}>{pdfError}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
            <StatCard title="Total Reports" value={String(reports.length)} icon={<Ico.FileText />} accent={C.indigo} />
            <StatCard title="Reviewed by Specialist" value={String(completed)} icon={<Ico.Check />} accent={C.success} />
            <StatCard title="Pending Review" value={String(pending)} icon={<Ico.Warn />} accent={C.warning} />
            <StatCard title="Average Turnaround" value="—" icon={<Ico.Activity />} accent={C.indigo} />
          </div>

          <Card style={{ padding: "20px 24px" }}>
            <div style={{
              display: "grid", gridTemplateColumns: "120px 120px 1.4fr 120px 120px 160px",
              padding: "0 16px 12px", gap: 12, borderBottom: `1px solid ${C.borderLight}`, marginBottom: 10,
            }}>
              {["Report ID", "Patient ID", "DR Severity", "Date", "Status", "Actions"].map(h => (
                <div key={h} style={{ fontSize: 12, fontWeight: 600, color: C.slate500 }}>{h}</div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {loading && <div style={{ padding: 16, fontSize: 13, color: C.slate500 }}>Loading…</div>}
              {reports.map(r => (
                <CardRow
                  key={r.report_id}
                  onClick={() => onViewReport(r.report_id)}
                  style={{
                    gridTemplateColumns: "120px 120px 1.4fr 120px 120px 160px",
                    gap: 12,
                    minHeight: 56,
                  }}
                >
                  <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, fontWeight: 700, color: C.indigo }}>{r.report_id}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{r.patient_id}</div>
                  <div style={{ fontSize: 12, color: C.textPrimary, fontWeight: 500 }}>{r.severity}</div>
                  <div style={{ fontSize: 12, color: C.slate600 }}>{r.date}</div>
                  <div><Badge v={asStatus(r.status)} /></div>
                  <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                    <ActionButton variant="primary" size="sm" onClick={() => onViewReport(r.report_id)} style={{ padding: "4px 10px", fontSize: 11 }}>
                      View
                    </ActionButton>
                    <ActionButton
                      variant="secondary"
                      size="sm"
                      style={{ padding: "4px 10px", fontSize: 11 }}
                      disabled={pdfBusyId === r.report_id}
                      onClick={() => void handlePdf(r.report_id)}
                    >
                      {pdfBusyId === r.report_id ? "…" : "PDF"}
                    </ActionButton>
                  </div>
                </CardRow>
              ))}
              {!loading && reports.length === 0 && (
                <div style={{ padding: 16, fontSize: 13, color: C.slate500 }}>No reports yet.</div>
              )}
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
    <ReportsScreen
      onNav={onNav}
      onViewReport={(id) => navigate(`/reports/clinical?id=${encodeURIComponent(id)}`)}
    />
  );
}
