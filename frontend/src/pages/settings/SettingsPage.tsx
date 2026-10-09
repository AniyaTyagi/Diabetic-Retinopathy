import { useNavigate } from "react-router-dom";
import { useAppNav } from "@/shared/hooks/useAppNav";
import { useApiData } from "@/shared/hooks/useApiData";
import { getPlatformSettings, patchPlatformSettings } from "@/shared/api/platform";
import { useAuth } from "@/shared/auth/AuthContext";
import { clearActiveScreening } from "@/shared/screening/session";
import {
  C, Ico, Sidebar, Header, Card, ActionButton,
  type NavKey,
} from "@/shared/ui";
import { useEffect, useState } from "react";

function Toggle({ on, set }: { on: boolean; set: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => set(!on)} style={{
      width: 44, height: 24, borderRadius: 99, border: "none", cursor: "pointer",
      background: on ? C.indigo : C.slate300, position: "relative", transition: "background 0.15s",
    }}>
      <div style={{
        position: "absolute", top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: "50%",
        background: C.white, transition: "left 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

function SettingsScreen({ onNav, onOpenOps, onOpenHelp }: {
  onNav: (k: NavKey) => void; onOpenOps: () => void; onOpenHelp: () => void;
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeNav] = useState<NavKey>("settings");
  const { data, loading, error, reload } = useApiData(getPlatformSettings, {
    sections: [
      "Profile", "Notifications", "AI Screening Preferences", "Quality Thresholds",
      "Report Settings", "Security", "System Preferences",
    ],
    inference_model: "Variational Quantum Classifier (VQC-ResNet)",
    referral_threshold: "Level 2+ (Moderate NPDR and above) — Recommended",
    explainability_enabled: true,
    human_review_required: true,
    notification_prefs: { critical_alerts: true, offline_sync: true, daily_digest: true },
    report_blurb: "",
    security_blurb: "",
    profile_name: null,
    profile_email: null,
    profile_role: null,
    profile_center: null,
  });

  const [section, setSection] = useState("AI Screening Preferences");
  const [explain, setExplain] = useState(true);
  const [humanReview, setHumanReview] = useState(true);
  const [threshold, setThreshold] = useState("Level 2+ (Moderate NPDR and above) — Recommended");
  const [model, setModel] = useState("Variational Quantum Classifier (VQC-ResNet)");
  const [notif, setNotif] = useState(data.notification_prefs);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (loading || hydrated) return;
    setExplain(data.explainability_enabled);
    setHumanReview(data.human_review_required);
    setThreshold(data.referral_threshold);
    setModel(data.inference_model);
    setNotif(data.notification_prefs);
    if (data.sections[0]) setSection(data.sections.includes("AI Screening Preferences") ? "AI Screening Preferences" : data.sections[0]);
    setHydrated(true);
  }, [loading, hydrated, data]);

  const sections = (() => {
    const base = data.sections.length ? data.sections : [
      "Profile", "Notifications", "AI Screening Preferences", "Quality Thresholds",
      "Report Settings", "Security", "System Preferences",
    ];
    return base.includes("Profile") ? base : ["Profile", ...base];
  })();

  async function persist(partial: Parameters<typeof patchPlatformSettings>[0]) {
    setSaving(true);
    setSaveMsg(null);
    try {
      await patchPlatformSettings(partial);
      setSaveMsg("Saved");
      reload();
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const profileRows: [string, string][] = [
    ["Full Name", data.profile_name || "—"],
    ["Email", data.profile_email || "—"],
    ["Role", data.profile_role || "—"],
    ["Assigned Center", data.profile_center || "—"],
  ];

  function onLogout() {
    clearActiveScreening();
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header
          title="Settings"
          breadcrumbs={["NetraX", "Settings"]}
          actions={
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {saveMsg && <span style={{ fontSize: 11, color: C.slate500 }}>{saving ? "Saving…" : saveMsg}</span>}
              <ActionButton variant="secondary" size="sm" onClick={onOpenOps} icon={<Ico.Cpu />}>
                System Operations
              </ActionButton>
              <ActionButton variant="secondary" size="sm" onClick={onOpenHelp} icon={<Ico.Help />}>
                Help Center
              </ActionButton>
            </div>
          }
        />
        <main style={{ flex: 1, overflowY: "auto", padding: 28, background: C.bg }}>
          {error && <div style={{ marginBottom: 12, fontSize: 12, color: C.danger }}>{error}</div>}
          {loading && <div style={{ marginBottom: 12, fontSize: 12, color: C.slate500 }}>Loading settings…</div>}

          <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 20 }}>
            <Card style={{ padding: "10px", alignSelf: "start" }}>
              {sections.map(s => {
                const isA = section === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSection(s)}
                    style={{
                      width: "100%", textAlign: "left", padding: "10px 14px", borderRadius: 10, border: "none", cursor: "pointer",
                      background: isA ? C.indigoLight : "transparent",
                      color: isA ? C.indigo : C.slate600, fontSize: 13, fontWeight: isA ? 700 : 500, marginBottom: 2,
                      transition: "all 0.15s ease",
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </Card>

            <Card title={section} subtitle="Configure NetraX clinical decision-support and platform preferences">
              {(section === "AI Screening Preferences" || section === "Quality Thresholds" || section === "System Preferences") && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
                  <div style={{ padding: 16, borderRadius: 12, background: C.bg, border: `1px solid ${C.borderLight}` }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.slate500, marginBottom: 6 }}>Active Inference Model</div>
                    <select
                      value={model}
                      onChange={e => {
                        const v = e.target.value;
                        setModel(v);
                        void persist({ inference_model: v });
                      }}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, fontWeight: 600, color: C.textPrimary, background: C.white }}
                    >
                      <option>Quantum Support Vector Machine (QSVM-Ensemble)</option>
                      <option>Variational Quantum Classifier (VQC-ResNet)</option>
                      <option>Classical Deep CNN (MobileNetV3)</option>
                    </select>
                  </div>

                  <div style={{ padding: 16, borderRadius: 12, background: C.bg, border: `1px solid ${C.borderLight}` }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.slate500, marginBottom: 6 }}>DR Referral Severity Threshold</div>
                    <select
                      value={threshold}
                      onChange={e => {
                        const v = e.target.value;
                        setThreshold(v);
                        void persist({ referral_threshold: v });
                      }}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, fontWeight: 600, color: C.textPrimary, background: C.white }}
                    >
                      <option>Level 2+ (Moderate NPDR and above) — Recommended</option>
                      <option>Level 3+ (Severe NPDR and PDR only)</option>
                    </select>
                    <div style={{ fontSize: 11, color: C.slate500, marginTop: 8 }}>Automatic triage alerts trigger for referable diabetic retinopathy at or above this threshold.</div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, borderRadius: 12, border: `1px solid ${C.borderLight}`, background: C.white }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>Explainability & Grad-CAM Heatmaps</div>
                      <div style={{ fontSize: 11, color: C.slate500, marginTop: 3 }}>Generate visual attention overlays and lesion segmentation on screening completion</div>
                    </div>
                    <Toggle on={explain} set={v => {
                      setExplain(v);
                      void persist({ explainability_enabled: v });
                    }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, borderRadius: 12, border: `1px solid ${C.borderLight}`, background: C.white }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>Ophthalmologist Review Required</div>
                      <div style={{ fontSize: 11, color: C.slate500, marginTop: 3 }}>Enforce clinical specialist confirmation before issuing verified referral reports</div>
                    </div>
                    <Toggle on={humanReview} set={v => {
                      setHumanReview(v);
                      void persist({ human_review_required: v });
                    }} />
                  </div>
                </div>
              )}

              {section === "Profile" && (
                <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
                  {profileRows.map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${C.borderLight}` }}>
                      <span style={{ fontSize: 12, color: C.slate500 }}>{l}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>{v}</span>
                    </div>
                  ))}
                  <div style={{
                    marginTop: 8, padding: 16, borderRadius: 12,
                    border: `1px solid ${C.danger}33`, background: C.dangerLight,
                    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>Sign out of NetraX</div>
                      <div style={{ fontSize: 11, color: C.slate500, marginTop: 3 }}>Clears this device session. You can sign in again anytime.</div>
                    </div>
                    <ActionButton variant="danger" size="sm" onClick={onLogout}>
                      Log out
                    </ActionButton>
                  </div>
                </div>
              )}

              {section === "Notifications" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
                  {([
                    ["Critical referable DR patient alerts", "critical_alerts"],
                    ["Offline sync status warnings", "offline_sync"],
                    ["Daily summary digests", "daily_digest"],
                  ] as const).map(([label, key]) => (
                    <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${C.borderLight}` }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{label}</span>
                      <Toggle
                        on={notif[key]}
                        set={v => {
                          const next = { ...notif, [key]: v };
                          setNotif(next);
                          void persist({ notification_prefs: next });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {section === "Report Settings" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
                  <div style={{ fontSize: 13, color: C.slate600 }}>
                    {data.report_blurb || "PDF format includes AI explainability Grad-CAM visuals, lesion counts, QR code verification, and multi-language patient guidance."}
                  </div>
                </div>
              )}

              {section === "Security" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
                  <div style={{ fontSize: 13, color: C.slate600 }}>
                    {data.security_blurb || "End-to-end encryption active with local cryptographic storage for offline biometric patient data."}
                  </div>
                </div>
              )}
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
  return <SettingsScreen onNav={onNav} onOpenOps={() => navigate("/settings/operations")} onOpenHelp={() => navigate("/help")} />;
}
