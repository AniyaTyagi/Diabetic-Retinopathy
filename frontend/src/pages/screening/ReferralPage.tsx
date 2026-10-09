import { useNavigate } from "react-router-dom";
import { useAppNav } from "@/shared/hooks/useAppNav";
import { useActiveScreening } from "@/shared/screening/useActiveScreening";
import { useScreeningFlowNav } from "@/shared/screening/useScreeningFlowNav";
import { downloadReportPdf } from "@/shared/api/reports";
import { scheduleFollowUp } from "@/shared/api/screenings";
import { shareSecureLink } from "@/shared/share";
import {
  C, Ico, FundusImg, Badge, ConfBar, Sidebar, Header,
  Card, ActionButton,
  DR,
  type NavKey,
} from "@/shared/ui";
import { useEffect, useMemo, useState } from "react";

function defaultFollowUpDate(daysAhead = 28): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

function formatDisplayDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function ReferralFollowUpScreen({
 onNav, onGenerateReport, onFinish, finishLabel, canReports,
}: {
  onNav: (k: NavKey) => void;
  onGenerateReport: () => void;
  onFinish: () => void;
  finishLabel: string;
  canReports: boolean;
}) {
  const { screeningId, patient, result, reload } = useActiveScreening();

  const [activeNav] = useState<NavKey>("reports");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFollowForm, setShowFollowForm] = useState(false);
  const [followDate, setFollowDate] = useState(defaultFollowUpDate());
  const [followCenter, setFollowCenter] = useState("District Hospital");

  const level = result?.dr_level ?? 2;
  const dr = DR[level] ?? DR[2];
  const conf = result?.confidence ?? 0;
  const counts = result?.lesions?.counts || {};
  const lesionRows: [string, string][] = [
    ["Microaneurysms", String(counts.microaneurysms ?? "—")],
    ["Hemorrhages", String(counts.hemorrhages ?? "—")],
    ["Exudates", String((counts.hard_exudates ?? 0) + (counts.soft_exudates ?? 0) || "—")],
    ["Neovascularization", String(counts.neovascularization ?? "—")],
  ];
  const reportId = result?.report_id || "";
  const scheduled = Boolean(result?.follow_up_date && result?.follow_up_center);

  useEffect(() => {
    if (result?.follow_up_date) setFollowDate(result.follow_up_date);
    if (result?.follow_up_center) setFollowCenter(result.follow_up_center);
    else if (patient?.center) setFollowCenter(patient.center);
  }, [result?.follow_up_date, result?.follow_up_center, patient?.center]);

  const followSummary = useMemo(() => {
    if (!result?.follow_up_date || !result?.follow_up_center) return null;
    return `Follow-up scheduled at ${result.follow_up_center} for ${formatDisplayDate(result.follow_up_date)}.`;
  }, [result?.follow_up_date, result?.follow_up_center]);

  async function handlePdf() {
    if (!reportId) {
      setError("No report yet — generate a report first.");
      return;
    }
    setPdfBusy(true);
    setError(null);
    try {
      await downloadReportPdf(reportId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF download failed");
    } finally {
      setPdfBusy(false);
    }
  }

  async function handleShare() {
    setError(null);
    setMsg(null);
    const path = reportId
      ? `/reports/clinical?id=${encodeURIComponent(reportId)}`
      : `/screening/referral?sid=${encodeURIComponent(screeningId || "")}`;
    try {
      const mode = await shareSecureLink({
        title: reportId ? `NetraX Report ${reportId}` : "NetraX Referral",
        text: "Secure NetraX clinical link",
        path,
      });
      setMsg(mode === "shared" ? "Shared securely" : "Secure link copied to clipboard");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Share failed");
    }
  }

  async function handleSchedule() {
    if (!screeningId) {
      setError("No active screening.");
      return;
    }
    if (!followDate.trim() || !followCenter.trim()) {
      setError("Follow-up date and center are required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await scheduleFollowUp(screeningId, {
        follow_up_date: followDate.trim(),
        follow_up_center: followCenter.trim(),
        follow_up_notes: "Scheduled from referral workflow",
      });
      setShowFollowForm(false);
      setMsg("Follow-up saved to database");
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule follow-up");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <Header
          title="Referral Recommended"
          breadcrumbs={["NetraX","Screenings", screeningId || "—","Referral"]}
          actions={<Badge v="referable" />}
        />
        <main style={{ flex:1, overflowY:"auto", padding:28, background:C.bg }}>
          {error && <div style={{ marginBottom: 12, fontSize: 12, color: C.danger }}>{error}</div>}
          {msg && <div style={{ marginBottom: 12, fontSize: 12, color: C.success }}>{msg}</div>}
          <div style={{
            background:C.dangerLight, borderRadius:12, border:`1px solid ${C.danger}35`,
            padding:"12px 18px", marginBottom:20, display:"flex", gap:10, alignItems:"center",
          }}>
            <span style={{ color:C.danger, display:"flex" }}><Ico.Warn /></span>
            <div style={{ fontSize:13, fontWeight:600, color:C.textPrimary }}>
              Referral decision support only. NetraX provides triage guidance; care planning remains with the attending ophthalmologist.
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
            <div style={{ background:C.navy, borderRadius:18, overflow:"hidden", border:`1px solid rgba(255,255,255,0.08)`, alignSelf:"start" }}>
              <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize:14, fontWeight:700, color:C.white }}>Fundus — Right Eye (OD)</div>
                <div style={{ fontSize:11, color:C.slate400, marginTop:2 }}>{[patient?.full_name || result?.patient_name, patient?.patient_id || result?.patient_id, patient?.center || result?.center].filter(Boolean).join(" · ") || "Loading…"}</div>
              </div>
              <div style={{ display:"flex", justifyContent:"center", padding:32 }}>
                <FundusImg variant="moderate" size={320} />
              </div>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <Card>
                <div style={{ fontSize:11, fontWeight:600, color:C.slate500, textTransform:"uppercase", letterSpacing:0.3 }}>DR Classification</div>
                <div style={{ fontSize:22, fontWeight:800, color:dr.color, marginTop:4 }}>Level {level} — {dr.label}</div>
                <div style={{
                  marginTop:14, padding:"12px 16px", borderRadius:10, background: result?.referral_needed ? C.dangerLight : C.successLight, border:`1px solid ${(result?.referral_needed ? C.danger : C.success)}30`,
                }}>
                  <div style={{ fontSize:11, fontWeight:600, color: result?.referral_needed ? C.danger : C.success }}>Clinical Status</div>
                  <div style={{ fontSize:18, fontWeight:800, color: result?.referral_needed ? C.danger : C.success, marginTop:2 }}>
                    {result?.referral_needed ? "Referable DR" : "Not referable"}
                  </div>
                </div>
                <div style={{ marginTop:16 }}>
                  <ConfBar value={conf} label="Model Confidence" />
                </div>
              </Card>

              <Card title="Clinical Lesion Count">
                <div style={{ display:"flex", flexDirection:"column", gap:0, marginTop:6 }}>
                  {lesionRows.map(([l,v], i) => (
                    <div key={l} style={{
                      display:"flex", justifyContent:"space-between", padding:"8px 0",
                      borderBottom: i < lesionRows.length - 1 ? `1px solid ${C.borderLight}` : "none",
                    }}>
                      <span style={{ fontSize:12, color:C.slate600 }}>{l}</span>
                      <span style={{ fontFamily:"var(--font-jetbrains)", fontSize:13, fontWeight:800, color:C.textPrimary }}>{v}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Ophthalmologist Decision" badge={<span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99, background:C.successLight, color:C.success }}>Confirmed</span>}>
                <div style={{
                  padding:"12px 16px", borderRadius:10, background:C.indigoLight, border:`1px solid ${C.indigoDim}`, marginTop:6,
                }}>
                  <div style={{ fontSize:11, fontWeight:700, color:C.indigo, marginBottom:2 }}>Action Recommendation</div>
                  <div style={{ fontSize:13, fontWeight:700, color:C.textPrimary }}>Comprehensive dilated fundus exam & optical coherence tomography (OCT) within 4 weeks.</div>
                </div>
              </Card>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {canReports && (
                  <ActionButton variant="primary" size="md" onClick={onGenerateReport} icon={<Ico.FileText />}>
                    Generate Report
                  </ActionButton>
                )}
                <ActionButton
                  variant="secondary"
                  size="md"
                  icon={<Ico.Download />}
                  onClick={() => void handlePdf()}
                  disabled={pdfBusy}
                >
                  {pdfBusy ? "Downloading…" : "Print & Export PDF"}
                </ActionButton>
                <ActionButton variant="secondary" size="md" onClick={() => void handleShare()}>
                  Share Securely
                </ActionButton>
                <ActionButton
                  variant={scheduled ? "primary" : "outline"}
                  size="md"
                  onClick={() => setShowFollowForm(v => !v)}
                  icon={scheduled ? <Ico.Check /> : <Ico.Calendar />}
                  style={{ background: scheduled ? C.success : undefined }}
                >
                  {scheduled ? "Update Follow-up" : "Schedule Follow-up"}
                </ActionButton>
              </div>

              {showFollowForm && (
                <Card title="Schedule follow-up">
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: C.slate500 }}>
                      Date
                      <input
                        type="date"
                        value={followDate}
                        onChange={e => setFollowDate(e.target.value)}
                        style={{
                          display: "block", width: "100%", marginTop: 4, padding: "8px 10px",
                          borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13,
                        }}
                      />
                    </label>
                    <label style={{ fontSize: 11, fontWeight: 600, color: C.slate500 }}>
                      Center / Hospital
                      <input
                        value={followCenter}
                        onChange={e => setFollowCenter(e.target.value)}
                        style={{
                          display: "block", width: "100%", marginTop: 4, padding: "8px 10px",
                          borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13,
                        }}
                      />
                    </label>
                    <ActionButton variant="primary" onClick={() => void handleSchedule()} disabled={busy}>
                      {busy ? "Saving…" : "Save Follow-up"}
                    </ActionButton>
                  </div>
                </Card>
              )}

              <ActionButton variant="primary" size="lg" style={{ width: "100%", marginTop: 4 }} onClick={onFinish} icon={<Ico.Check />}>
                {finishLabel}
              </ActionButton>

              {followSummary && (
                <div style={{
                  padding:"12px 16px", borderRadius:10, background:C.successLight, border:`1px solid ${C.success}40`,
                  fontSize:12, color:C.success, fontWeight:600,
                }}>
                  {followSummary}
                </div>
              )}
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
  const flow = useScreeningFlowNav("/screening/referral");
  return (
    <ReferralFollowUpScreen
      onNav={onNav}
      onGenerateReport={() => navigate("/reports")}
      onFinish={flow.goNext}
      finishLabel={flow.buttonLabel}
      canReports={flow.canPath("/reports")}
    />
  );
}
