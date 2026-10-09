import { useNavigate } from "react-router-dom";
import { useAppNav } from "@/shared/hooks/useAppNav";
import { useActiveScreening } from "@/shared/screening/useActiveScreening";
import { useScreeningFlowNav } from "@/shared/screening/useScreeningFlowNav";
import { screeningPath, initialsOf } from "@/shared/screening/session";
import { useAuthImage, screeningImagePath } from "@/shared/hooks/useAuthImage";
import {
  C, Ico, FundusImg, Badge, Sidebar, Header,
  Card, ActionButton,
  type NavKey, type BadgeV,
} from "@/shared/ui";
import { useEffect, useState } from "react";
import { assessScreeningQuality, type QualityCheck } from "@/shared/api/screenings";

function EyeThumb({ screeningId, eye }: { screeningId: string; eye: "od" | "os" }) {
  const { src, loading } = useAuthImage(screeningImagePath(screeningId, eye));
  if (src) {
    return (
      <img
        src={src}
        alt={eye}
        style={{ width: 160, height: 160, objectFit: "cover", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)" }}
      />
    );
  }
  return (
    <div style={{ position: "relative" }}>
      <FundusImg variant="moderate" size={160} />
      {loading && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: C.slate300, fontSize: 10 }}>
          …
        </div>
      )}
    </div>
  );
}

function QualityAssessmentScreen({
  onNext, onBack, onRecapture, onNav, nextLabel,
}: {
  onNext: () => void; onBack: () => void; onRecapture: () => void; onNav: (k: NavKey) => void;
  nextLabel: string;
}) {
  const { screeningId, patient, result, reload } = useActiveScreening();
  const [activeNav] = useState<NavKey>("new-screening");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(result?.quality_score ?? 0);
  const [suitable, setSuitable] = useState(true);
  const [statusLabel, setStatusLabel] = useState("Checking upload…");
  const [checks, setChecks] = useState<QualityCheck[]>([]);

  async function runAssess() {
    if (!screeningId) return;
    setLoading(true);
    setError(null);
    try {
      const q = await assessScreeningQuality(screeningId);
      setScore(q.score);
      setSuitable(q.suitable);
      setStatusLabel(q.status_label);
      setChecks(q.checks);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload check failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void runAssess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screeningId]);

  const statusColor = suitable ? C.success : C.danger;
  const statusBg = suitable ? C.successLight : C.dangerLight;
  const badge: BadgeV = suitable ? "completed" : "error";
  const initials = initialsOf(patient?.full_name || result?.patient_name);

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header
          title="Upload Readiness Check"
          breadcrumbs={["NetraX", "New Screening", "Quality"]}
          actions={
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 99,
                background: C.indigoLight, color: C.indigo,
              }}>Basic check · not AI QA</span>
              <ActionButton variant="secondary" size="sm" onClick={() => void runAssess()} disabled={loading || !screeningId}>
                {loading ? "Checking…" : "Re-check"}
              </ActionButton>
            </div>
          }
        />

        <main style={{ flex: 1, overflowY: "auto", padding: 28, background: C.bg }}>
          {error && <div style={{ marginBottom: 12, fontSize: 12, color: C.danger }}>{error}</div>}

          <Card style={{ padding: "14px 20px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, background: C.indigo,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: C.white, fontSize: 13, fontWeight: 700,
              }}>{initials}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary }}>
                  {patient?.full_name || result?.patient_name || "Patient"}
                </div>
                <div style={{ fontSize: 12, color: C.slate500 }}>
                  {screeningId || "—"} · Confirm files before CNN + QML analyze
                </div>
              </div>
              <div style={{ marginLeft: "auto" }}><Badge v={badge} /></div>
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 20 }}>
            <div style={{ background: C.navy, borderRadius: 18, padding: 24, border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 16 }}>Uploaded fundus</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 28, flexWrap: "wrap" }}>
                <div style={{ textAlign: "center" }}>
                  {screeningId ? <EyeThumb screeningId={screeningId} eye="od" /> : <FundusImg variant="moderate" size={160} />}
                  <div style={{ marginTop: 8, fontSize: 11, color: C.slate300, fontWeight: 600 }}>OD</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  {screeningId ? <EyeThumb screeningId={screeningId} eye="os" /> : <FundusImg variant="moderate" size={160} />}
                  <div style={{ marginTop: 8, fontSize: 11, color: C.slate300, fontWeight: 600 }}>OS</div>
                </div>
              </div>
              <div style={{
                marginTop: 20, display: "inline-flex", padding: "6px 14px", borderRadius: 99,
                background: suitable ? "rgba(26,161,107,0.9)" : "rgba(232,51,64,0.9)",
                color: C.white, fontSize: 11, fontWeight: 700,
              }}>{statusLabel}</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Card title="Readiness" subtitle={`Score ${Math.round(Number(score) || 0)} · upload check`}>
                <div style={{
                  marginTop: 8, padding: "10px 14px", borderRadius: 12,
                  background: statusBg, color: statusColor, fontSize: 13, fontWeight: 700,
                }}>{statusLabel}</div>
              </Card>

              <Card title="Checklist">
                <div style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: 6 }}>
                  {(checks.length ? checks : [{ label: "Waiting", status: "Checking…", ok: null }]).map((c, i, arr) => (
                    <div key={c.label} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.borderLight}` : "none",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: "50%",
                          background: c.ok === true ? C.successLight : c.ok === false ? C.dangerLight : C.warningLight,
                          color: c.ok === true ? C.success : c.ok === false ? C.danger : C.warning,
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800,
                        }}>
                          {c.ok === true ? "✓" : c.ok === false ? "✕" : "!"}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary }}>{c.label}</span>
                      </div>
                      <span style={{ fontSize: 11, color: C.slate500 }}>{c.status}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <ActionButton variant="secondary" onClick={onBack}>← Back to Upload</ActionButton>
                {!suitable ? (
                  <ActionButton variant="danger" onClick={onRecapture} icon={<Ico.Refresh />}>
                    Re-upload Images
                  </ActionButton>
                ) : (
                  <ActionButton
                    variant="primary"
                    disabled={busy || loading}
                    onClick={async () => {
                      setBusy(true);
                      try { onNext(); } finally { setBusy(false); }
                    }}
                    icon={<Ico.ArrowR />}
                  >
                    {busy ? "Continuing…" : nextLabel}
                  </ActionButton>
                )}
              </div>
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
  const { screeningId } = useActiveScreening();
  const flow = useScreeningFlowNav("/screening/quality");
  const canUpload = flow.canPath("/screening/upload");
  return (
    <QualityAssessmentScreen
      onNav={onNav}
      onBack={() => navigate(canUpload ? screeningPath("/screening/upload", screeningId) : "/dashboard")}
      onRecapture={() => navigate(canUpload ? screeningPath("/screening/upload", screeningId) : "/dashboard")}
      onNext={flow.goNext}
      nextLabel={flow.buttonLabel}
    />
  );
}
