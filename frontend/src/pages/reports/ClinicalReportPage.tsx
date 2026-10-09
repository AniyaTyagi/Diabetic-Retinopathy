import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppNav } from "@/shared/hooks/useAppNav";
import { useApiData } from "@/shared/hooks/useApiData";
import { getReport, listReports, downloadReportPdf } from "@/shared/api/reports";
import { getPatient } from "@/shared/api/patients";
import { listScreenings } from "@/shared/api/screenings";
import { shareSecureLink } from "@/shared/share";
import {
  C, Ico, FundusImg, NetraXLogo, Sidebar, Header, ActionButton,
  GradCamHeatmapImg, LesionMapImg, DR,
  type NavKey, type FundusV,
} from "@/shared/ui";
import { useMemo, useState } from "react";

function levelFromLabel(severity: string): number {
  const s = severity.toLowerCase().trim();
  // "npdr" contains substring "pdr" — check NPDR grades before bare PDR
  if (s.includes("proliferative") || /(^|[^a-z])pdr([^a-z]|$)/.test(s)) return 4;
  if (s.includes("severe")) return 3;
  if (s.includes("moderate")) return 2;
  if (s.includes("mild")) return 1;
  if (s.includes("no dr") || s === "0") return 0;
  return 0;
}

function thumbForLevel(level: number): FundusV {
  if (level >= 4) return "proliferative";
  if (level >= 3) return "severe";
  if (level >= 2) return "moderate";
  if (level >= 1) return "mild";
  return "normal";
}

function ClinicalReportScreen({ onNext, onNav, reportId }: {
  onNext?: () => void;
  onNav: (k: NavKey) => void;
  reportId: string;
}) {
  const [activeNav] = useState<NavKey>("reports");
  const { data: report, loading, error } = useApiData(
    () => getReport(reportId),
    null as Awaited<ReturnType<typeof getReport>> | null,
    [reportId],
  );
  const patientId = report?.patient_id || "";
  const { data: patient } = useApiData(
    () => (patientId ? getPatient(patientId) : Promise.resolve(null)),
    null as Awaited<ReturnType<typeof getPatient>> | null,
    [patientId],
  );
  const { data: screenings } = useApiData(listScreenings, []);
  const screening = useMemo(() => {
    if (!report) return undefined;
    if (report.screening_id) {
      const bySid = screenings.find(s => s.screening_id === report.screening_id);
      if (bySid) return bySid;
    }
    return screenings.find(s => s.patient_id === patientId);
  }, [screenings, report, patientId]);

  // Same source of truth as Results page: screening.dr_level
  const level = screening?.dr_level ?? (report ? levelFromLabel(report.severity) : 0);
  const dr = DR[level] ?? DR[0];
  const thumb = thumbForLevel(level);
  const resultLabel = dr.label;
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  async function handleDownloadPdf() {
    if (!reportId || pdfBusy) return;
    setPdfBusy(true);
    setPdfError(null);
    try {
      await downloadReportPdf(reportId);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "PDF download failed");
    } finally {
      setPdfBusy(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  async function handleShare() {
    setShareMsg(null);
    setPdfError(null);
    try {
      const mode = await shareSecureLink({
        title: `NetraX Report ${reportId}`,
        text: `Clinical DR screening report ${reportId}`,
        path: `/reports/clinical?id=${encodeURIComponent(reportId)}`,
      });
      setShareMsg(mode === "shared" ? "Shared securely" : "Secure link copied to clipboard");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setPdfError(err instanceof Error ? err.message : "Share failed");
    }
  }

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }} className="report-page">
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header title="Clinical Report" breadcrumbs={["NetraX", "Reports", reportId]}
          actions={
            <div style={{ display: "flex", gap: 8 }} className="no-print">
              <ActionButton variant="secondary" size="sm" icon={<Ico.Download />} onClick={() => void handleDownloadPdf()} disabled={pdfBusy || !report}>
                {pdfBusy ? "Downloading…" : "Download PDF"}
              </ActionButton>
              <ActionButton variant="secondary" size="sm" onClick={handlePrint}>Print</ActionButton>
              <ActionButton variant="primary" size="sm" onClick={() => void handleShare()} disabled={!report}>
                Share Securely
              </ActionButton>
            </div>
          }
        />
        <main style={{ flex: 1, overflowY: "auto", padding: 28, background: C.bg }}>
          {error && <div style={{ marginBottom: 12, fontSize: 12, color: C.danger }} className="no-print">{error}</div>}
          {pdfError && <div style={{ marginBottom: 12, fontSize: 12, color: C.danger }} className="no-print">{pdfError}</div>}
          {shareMsg && <div style={{ marginBottom: 12, fontSize: 12, color: C.success }} className="no-print">{shareMsg}</div>}
          {loading && <div style={{ marginBottom: 12, fontSize: 12, color: C.slate500 }} className="no-print">Loading report…</div>}
          {!report ? (
            !loading && <div style={{ fontSize: 13, color: C.slate500 }}>Report not found.</div>
          ) : (
            <div
              id="clinical-report-print"
              className="print-report"
              style={{
              maxWidth: 920, margin: "0 auto", background: C.white, borderRadius: 16,
              border: `1px solid ${C.border}`, boxShadow: "0 8px 30px rgba(15,23,42,0.06)", overflow: "hidden",
            }}>
              <div style={{
                padding: "22px 28px", borderBottom: `2px solid ${C.navy}`,
                display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap",
              }}>
                <div>
                  <NetraXLogo size="md" />
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.navy, marginTop: 14 }}>Diabetic Retinopathy Screening Report</div>
                  <div style={{ fontSize: 11, color: C.slate500, marginTop: 4 }}>AI-assisted clinical decision support · Confidential</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, fontWeight: 700, color: C.indigo }}>{report.report_id}</div>
                  <div style={{ fontSize: 11, color: C.slate500, marginTop: 4 }}>Screening {screening?.screening_id || "—"}</div>
                  <div style={{ fontSize: 11, color: C.slate500 }}>{report.date}</div>
                </div>
              </div>

              <div style={{ padding: "24px 28px" }}>
                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 22,
                  padding: 16, borderRadius: 12, background: C.slate50, border: `1px solid ${C.slate200}`,
                }}>
                  {[
                    { l: "Patient", v: report.patient_name || patient?.full_name || "—" },
                    { l: "Patient ID", v: report.patient_id },
                    { l: "Age / Gender", v: patient ? `${patient.age} · ${patient.gender}` : "—" },
                    { l: "Center", v: patient?.center || screening?.center || "—" },
                    { l: "Screening Date", v: report.date },
                    { l: "Eye", v: "Right (OD)" },
                  ].map(f => (
                    <div key={f.l}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: C.slate500, textTransform: "uppercase", letterSpacing: 0.3 }}>{f.l}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginTop: 3 }}>{f.v}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 22 }}>
                  <div style={{ background: C.navy, borderRadius: 14, overflow: "hidden" }}>
                    <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)", fontSize: 12, fontWeight: 700, color: C.white }}>
                      Fundus Photograph — OD
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
                      <FundusImg variant={thumb} size={240} />
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ padding: 18, borderRadius: 14, border: `1.5px solid ${dr.color}40`, background: dr.bg }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: dr.text, textTransform: "uppercase" }}>Result</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: dr.text, marginTop: 6 }}>Level {level} — {resultLabel}</div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div style={{ padding: 14, borderRadius: 12, background: C.dangerLight, border: `1px solid ${C.danger}30` }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: C.danger }}>Referable DR</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: C.danger, marginTop: 4 }}>{dr.referable ? "Yes" : "No"}</div>
                      </div>
                      <div style={{ padding: 14, borderRadius: 12, background: C.slate50, border: `1px solid ${C.slate200}` }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: C.slate500 }}>Confidence</div>
                        <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 18, fontWeight: 800, color: C.success, marginTop: 4 }}>
                          {(screening?.confidence ?? patient?.latest_confidence ?? 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: 16, borderRadius: 12, background: C.white, border: `1px solid ${C.slate200}` }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 10 }}>Status</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{report.status}</div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 12 }}>Supporting Imagery</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                    {[
                      { l: "Original Image", el: <FundusImg variant={thumb} size={110} /> },
                      { l: "Enhanced Image", el: <FundusImg variant="enhanced" size={110} /> },
                      { l: "Grad-CAM", el: <GradCamHeatmapImg size={110} mode="overlay" /> },
                      { l: "Lesion Evidence", el: <LesionMapImg type="ma" size={110} /> },
                    ].map(c => (
                      <div key={c.l} style={{ background: C.slate50, borderRadius: 12, border: `1px solid ${C.slate200}`, padding: 12, textAlign: "center" }}>
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>{c.el}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.navy }}>{c.l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{
                  padding: "14px 16px", borderRadius: 12, background: C.indigoLight, border: `1px solid ${C.indigoDim}`,
                  marginBottom: 18,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.indigo, marginBottom: 4 }}>AI Recommendation</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>
                    {dr.referable ? "Ophthalmologist review recommended." : "Routine follow-up; no urgent referral indicated."}
                  </div>
                </div>

                <div style={{ fontSize: 11, color: C.slate500, lineHeight: 1.65, borderTop: `1px solid ${C.slate200}`, paddingTop: 14 }}>
                  This report is generated by NetraX as AI-assisted screening decision support. Final clinical interpretation and management decisions remain with the reviewing ophthalmologist.
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }} className="no-print">
                  <ActionButton variant="primary" icon={<Ico.Download />} onClick={() => void handleDownloadPdf()} disabled={pdfBusy}>
                    {pdfBusy ? "Downloading…" : "Download PDF"}
                  </ActionButton>
                  <ActionButton variant="secondary" onClick={handlePrint}>Print</ActionButton>
                  <ActionButton variant="secondary" onClick={() => void handleShare()}>Share Securely</ActionButton>
                  {onNext && (
                    <ActionButton variant="danger" onClick={onNext} icon={<Ico.ArrowR />} style={{ marginLeft: "auto" }}>
                      Continue to Referral
                    </ActionButton>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  const onNav = useAppNav();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const fromQuery = params.get("id");
  const { data: reports, loading } = useApiData(listReports, []);
  const reportId = fromQuery || reports[0]?.report_id || "";

  if (!reportId) {
    return (
      <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: C.slate500, fontSize: 13 }}>
        {loading ? "Resolving report…" : "No reports in database yet."}
      </div>
    );
  }

  return (
    <ClinicalReportScreen
      key={reportId}
      onNav={onNav}
      reportId={reportId}
      onNext={() => navigate("/screening/referral")}
    />
  );
}

