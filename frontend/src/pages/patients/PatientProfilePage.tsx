import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppNav } from "@/shared/hooks/useAppNav";
import { useApiData } from "@/shared/hooks/useApiData";
import { getPatient, listPatients } from "@/shared/api/patients";
import { listScreenings } from "@/shared/api/screenings";
import { getActivePatientId, setActivePatientId } from "@/shared/screening/session";
import {
  C, Ico, FundusImg, Badge, Sidebar, Header,
  Card, StatCard, ActionButton, DR,
  type NavKey, type FundusV, type BadgeV,
} from "@/shared/ui";
import { useEffect, useMemo, useState } from "react";

function asBadge(status: string | null | undefined): BadgeV {
  const allowed: BadgeV[] = ["normal", "mild", "moderate", "referable", "severe", "pdr", "pending", "completed"];
  return (allowed.includes(status as BadgeV) ? status : "pending") as BadgeV;
}

function asThumb(v: string | null | undefined, level?: number | null): FundusV {
  if (v === "normal" || v === "mild" || v === "moderate" || v === "severe" || v === "proliferative") return v;
  if ((level ?? 0) >= 4) return "proliferative";
  if ((level ?? 0) >= 3) return "severe";
  if ((level ?? 0) >= 2) return "moderate";
  if ((level ?? 0) >= 1) return "mild";
  return "normal";
}

function PatientProfileScreen({ onNav, onOpenHistory, patientId }: {
  onNav: (k: NavKey) => void;
  onOpenHistory?: () => void;
  patientId: string;
}) {
  const [activeNav] = useState<NavKey>("patients");
  const { data: patient, loading, error } = useApiData(
    () => getPatient(patientId),
    null as Awaited<ReturnType<typeof getPatient>> | null,
    [patientId],
  );
  const { data: screenings } = useApiData(listScreenings, [], [patientId]);
  const timeline = useMemo(
    () => screenings.filter(s => s.patient_id === patientId),
    [screenings, patientId],
  );

  const initials = (patient?.full_name || "?")
    .split(" ")
    .map(p => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const level = patient?.latest_dr_level ?? 0;
  const dr = DR[level] ?? DR[0];
  const thumb = asThumb(patient?.thumb_variant, level);
  const latestSid = timeline[0]?.screening_id || "—";

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header
          title="Patient Profile"
          breadcrumbs={["NetraX", "Patients", patientId]}
          actions={
            <ActionButton variant="primary" size="sm" onClick={onOpenHistory} icon={<Ico.Eye />}>
              Screening History
            </ActionButton>
          }
        />
        <main style={{ flex: 1, overflowY: "auto", padding: 28, background: C.bg }}>
          {error && <div style={{ marginBottom: 12, fontSize: 12, color: C.danger }}>{error}</div>}
          {loading && <div style={{ marginBottom: 12, fontSize: 12, color: C.slate500 }}>Loading patient…</div>}
          {!patient ? (
            !loading && <div style={{ fontSize: 13, color: C.slate500 }}>Patient not found.</div>
          ) : (
            <>
              <Card style={{ padding: "22px 26px", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
                  <div style={{
                    width: 58, height: 58, borderRadius: 16, background: C.indigo, color: C.white,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800,
                    boxShadow: `0 4px 12px rgba(97,41,199,0.35)`,
                  }}>{initials}</div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: C.textPrimary }}>{patient.full_name}</div>
                    <div style={{ fontSize: 13, color: C.slate500, marginTop: 4 }}>
                      Patient ID: {patient.patient_id} · {patient.gender === "F" ? "Female" : patient.gender === "M" ? "Male" : patient.gender} · {patient.age} yrs · {patient.center}
                    </div>
                  </div>
                  <Badge v={asBadge(patient.queue_status)} />
                </div>
              </Card>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
                <StatCard title="Latest DR Level" value={`Level ${level}`} accent={dr.color} delta={dr.label} up={false} sublabel="" icon={<Ico.Warn />} />
                <StatCard title="Last Screening" value={patient.last_screening_date || "—"} accent={C.indigo} delta={latestSid} up={true} sublabel="" icon={<Ico.Eye />} />
                <StatCard title="Referral Status" value={(level >= 2) ? "Referable" : "Observe"} accent={level >= 2 ? C.danger : C.success} delta={patient.queue_status || ""} up={false} sublabel="" icon={<Ico.Shield />} />
                <StatCard title="Total Screenings" value={String(timeline.length)} accent={C.success} delta="From database" up={true} sublabel="" icon={<Ico.Activity />} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 20 }}>
                <div style={{ background: C.navy, borderRadius: 18, overflow: "hidden", alignSelf: "start", border: `1px solid rgba(255,255,255,0.08)` }}>
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>Latest Retinal Image</div>
                    <div style={{ fontSize: 11, color: C.slate400, marginTop: 2 }}>OD · Right Eye · {patient.last_screening_date || "—"}</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", padding: 28 }}>
                    <FundusImg variant={thumb} size={270} />
                  </div>
                </div>

                <Card title="Screening History Timeline" subtitle="Assessments from NetraX database">
                  <div style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: 8 }}>
                    {timeline.map((t, i) => {
                      const lvl = t.dr_level ?? 0;
                      const meta = DR[lvl] ?? DR[0];
                      return (
                        <div key={t.screening_id} style={{ display: "flex", gap: 16, position: "relative" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20 }}>
                            <div style={{ width: 12, height: 12, borderRadius: "50%", background: meta.color, border: `2px solid ${C.white}`, boxShadow: `0 0 0 2px ${meta.color}`, zIndex: 1 }} />
                            {i < timeline.length - 1 && <div style={{ flex: 1, width: 2, background: C.slate200, margin: "3px 0" }} />}
                          </div>
                          <div style={{
                            flex: 1, display: "flex", gap: 16, alignItems: "center", padding: "0 0 20px",
                            borderBottom: i < timeline.length - 1 ? `1px solid ${C.borderLight}` : "none", marginBottom: i < timeline.length - 1 ? 6 : 0,
                          }}>
                            <FundusImg variant={asThumb(null, lvl)} size={68} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary }}>{t.date}</div>
                              <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
                                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: meta.bg, color: meta.text }}>
                                  L{lvl} · {meta.label}
                                </span>
                                <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, fontWeight: 700, color: C.slate600 }}>
                                  Conf: {((t.confidence ?? 0) * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div style={{ fontSize: 12, color: C.slate500, marginTop: 6 }}>
                                Review: <strong style={{ color: C.textPrimary }}>{t.review_status}</strong> · {t.screening_id}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {timeline.length === 0 && (
                      <div style={{ fontSize: 13, color: C.slate500, padding: 8 }}>No screenings for this patient.</div>
                    )}
                  </div>
                </Card>
              </div>
            </>
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
  const active = getActivePatientId();
  const { data: patients, loading } = useApiData(listPatients, []);
  const patientId = fromQuery || active || patients[0]?.patient_id || "";

  useEffect(() => {
    if (patientId) setActivePatientId(patientId);
  }, [patientId]);

  if (!patientId) {
    return (
      <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: C.slate500, fontSize: 13 }}>
        {loading ? "Resolving patient…" : "No patients in database yet."}
      </div>
    );
  }

  return (
    <PatientProfileScreen
      key={patientId}
      onNav={onNav}
      patientId={patientId}
      onOpenHistory={() => navigate("/screenings")}
    />
  );
}

