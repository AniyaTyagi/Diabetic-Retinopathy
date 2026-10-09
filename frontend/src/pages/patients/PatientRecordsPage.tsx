import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppNav } from "@/shared/hooks/useAppNav";
import { useApiData } from "@/shared/hooks/useApiData";
import { listPatients } from "@/shared/api/patients";
import {
  C, Ico, FundusImg, Badge, Sidebar, Header,
  Card, CardRow, ActionButton,
  type NavKey, type FundusV, type BadgeV,
} from "@/shared/ui";
import { useEffect, useMemo, useState } from "react";

function asBadge(status: string | null | undefined): BadgeV {
  const allowed: BadgeV[] = ["normal", "mild", "moderate", "referable", "severe", "pdr", "ungradeable", "processing", "completed", "pending", "error", "online", "offline"];
  return (allowed.includes(status as BadgeV) ? status : "pending") as BadgeV;
}

function asThumb(v: string | null | undefined): FundusV {
  const allowed: FundusV[] = ["normal", "mild", "moderate", "severe", "proliferative", "gradcam", "vessels", "poor", "enhanced"];
  return (allowed.includes(v as FundusV) ? v : "normal") as FundusV;
}

function PatientRecordsScreen({ onNav, onOpenProfile }: {
  onNav: (k: NavKey) => void;
  onOpenProfile: (patientId: string) => void;
}) {
  const [params] = useSearchParams();
  const [activeNav] = useState<NavKey>("patients");
  const [q, setQ] = useState(() => params.get("q") || "");
  const [center, setCenter] = useState("All");
  const [severity, setSeverity] = useState("All");
  const { data: patients, loading, error } = useApiData(listPatients, []);

  useEffect(() => {
    const fromUrl = params.get("q") || "";
    setQ(fromUrl);
  }, [params]);

  const centers = useMemo(
    () => ["All", ...Array.from(new Set(patients.map(p => p.center))).sort()],
    [patients],
  );

  const filtered = patients.filter(p => {
    const matchQ = !q
      || p.full_name.toLowerCase().includes(q.toLowerCase())
      || p.patient_id.toLowerCase().includes(q.toLowerCase());
    const matchC = center === "All" || p.center === center;
    const matchS = severity === "All" || String(p.latest_dr_level ?? "") === severity;
    return matchQ && matchC && matchS;
  });

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header title="Patient Queue" breadcrumbs={["NetraX", "Patient Queue"]} />
        <main style={{ flex: 1, overflowY: "auto", padding: 28, background: C.bg }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 14 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: C.textPrimary, letterSpacing: -0.4, margin: 0 }}>
                Screening queue
              </h2>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.warning, marginTop: 4 }}>
                {loading ? "Loading…" : `${filtered.length} patients`}
              </div>
              {error && <div style={{ fontSize: 12, color: C.danger, marginTop: 4 }}>{error}</div>}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
                borderRadius: 10, border: `1px solid ${C.border}`, background: C.white,
                width: 260,
              }}>
                <span style={{ color: C.slate400, display: "flex" }}><Ico.Search /></span>
                <input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Search patient ID or name"
                  style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13, color: C.textPrimary }}
                />
              </div>

              <select
                value={center}
                onChange={e => setCenter(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 12, fontWeight: 600, color: C.textPrimary, background: C.white }}
              >
                {centers.map(c => (
                  <option key={c} value={c}>{c === "All" ? "All Centers" : c}</option>
                ))}
              </select>

              <select
                value={severity}
                onChange={e => setSeverity(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 12, fontWeight: 600, color: C.textPrimary, background: C.white }}
              >
                <option value="All">All Severity</option>
                <option value="0">L0 - No DR</option>
                <option value="1">L1 - Mild</option>
                <option value="2">L2 - Moderate</option>
                <option value="3">L3 - Severe</option>
                <option value="4">L4 - PDR</option>
              </select>
            </div>
          </div>

          <Card style={{ padding: "20px 24px" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "120px 1.4fr 100px 120px 110px 90px 90px",
              padding: "0 16px 12px",
              gap: 12,
              borderBottom: `1px solid ${C.borderLight}`,
              marginBottom: 10,
            }}>
              {["Patient ID", "Patient", "Age / Gender", "Arrival", "Screening", "Risk", "Action"].map(h => (
                <div key={h} style={{ fontSize: 12, fontWeight: 600, color: C.slate500 }}>{h}</div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.map(p => {
                const level = p.latest_dr_level ?? 0;
                const isRisk = level >= 2;
                const riskColor = level >= 3 ? C.danger : level === 2 ? C.warning : C.success;
                const riskText = level >= 3 ? "High" : level === 2 ? "Moderate" : level === 1 ? "Low" : "Normal";
                const status = asBadge(p.queue_status);

                return (
                  <CardRow
                    key={p.patient_id}
                    onClick={() => onOpenProfile(p.patient_id)}
                    style={{
                      gridTemplateColumns: "120px 1.4fr 100px 120px 110px 90px 90px",
                      gap: 12,
                      minHeight: 58,
                    }}
                  >
                    <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, fontWeight: 700, color: C.indigo }}>
                      {p.patient_id}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <FundusImg variant={asThumb(p.thumb_variant)} size={34} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>{p.full_name}</div>
                        <div style={{ fontSize: 11, color: C.slate500 }}>{p.center}</div>
                      </div>
                    </div>

                    <div style={{ fontSize: 12, color: C.textPrimary, fontWeight: 500 }}>
                      {p.age} / {p.gender}
                    </div>

                    <div style={{ fontSize: 12, color: C.slate600 }}>
                      {p.last_screening_date || "—"}
                    </div>

                    <div>
                      <Badge v={status} />
                    </div>

                    <div style={{ fontSize: 12, fontWeight: 700, color: riskColor, display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: riskColor }} />
                      {riskText}
                    </div>

                    <div>
                      <ActionButton
                        size="sm"
                        variant={isRisk ? "primary" : "secondary"}
                        onClick={() => onOpenProfile(p.patient_id)}
                        style={{ padding: "5px 12px", fontSize: 11 }}
                      >
                        {status === "completed" ? "View" : status === "pending" ? "Review" : "Open"}
                      </ActionButton>
                    </div>
                  </CardRow>
                );
              })}
              {!loading && filtered.length === 0 && (
                <div style={{ padding: 16, fontSize: 13, color: C.slate500 }}>No patients match filters.</div>
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
    <PatientRecordsScreen
      onNav={onNav}
      onOpenProfile={(id) => navigate(`/patients/profile?id=${encodeURIComponent(id)}`)}
    />
  );
}
