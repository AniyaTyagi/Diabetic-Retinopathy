import { useNavigate } from "react-router-dom";
import { useAppNav } from "@/shared/hooks/useAppNav";
import { upsertPatient, getNextPatientId } from "@/shared/api/patients";
import { createScreening } from "@/shared/api/screenings";
import {
  setActivePatientId,
  setActiveScreeningId,
  screeningPath,
} from "@/shared/screening/session";
import { useAuth } from "@/shared/auth/AuthContext";
import { useCenterOptions } from "@/shared/hooks/useCenterOptions";
import { pickDefaultCenter } from "@/shared/centers";
import {
  C, Ico, FundusImg, Badge, Sidebar, Header,
  Card, ActionButton,
  type NavKey,
} from "@/shared/ui";
import { useEffect, useState, type ReactNode } from "react";

const FIELD_INPUT_STYLE = {
  width: "100%",
  padding: "10px 14px",
  fontSize: 13,
  borderRadius: 10,
  border: `1px solid ${C.border}`,
  background: C.bg,
  color: C.textPrimary,
  outline: "none",
  fontFamily: "var(--font-inter)",
} as const;

function Field({
  label,
  id,
  type = "text",
  value,
  onChange,
  children,
  half = false,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange?: (value: string) => void;
  children?: ReactNode;
  half?: boolean;
}) {
  return (
    <div style={{ gridColumn: half ? "span 1" : undefined }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: C.slate600, display: "block", marginBottom: 6 }}>{label}</label>
      {children ?? (
        <input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          style={FIELD_INPUT_STYLE}
        />
      )}
    </div>
  );
}

function PatientInfoScreen({ onNav }: { onNav: (k: NavKey) => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { centers, defaultCenter } = useCenterOptions(user?.center);
  const [activeNav, setActiveNav] = useState<NavKey>("new-screening");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    patientId: "",
    fullName: "",
    age: "",
    gender: "F",
    mobile: "",
    diabetesDuration: "",
    diabetesType: "Type 2",
    center: "",
    previousDR: "No previous history",
    prevScreeningDate: "",
    notes: "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!form.center && defaultCenter) set("center", defaultCenter);
  }, [defaultCenter, form.center]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const id = await getNextPatientId();
        if (!cancelled) setForm(f => (f.patientId ? f : { ...f, patientId: id }));
      } catch {
        if (!cancelled) setForm(f => (f.patientId ? f : { ...f, patientId: `P${Date.now()}` }));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const STEPS = [
    { n: 1, label: "Patient Info", sublabel: "Demographics" },
    { n: 2, label: "Image Upload", sublabel: "Fundus photos" },
    { n: 3, label: "Quality Check", sublabel: "Auto-assess" },
    { n: 4, label: "AI Analysis", sublabel: "CNN + QML" },
    { n: 5, label: "Results", sublabel: "Grade & report" },
  ];

  async function startScreening() {
    setError(null);
    if (!form.patientId.trim() || !form.fullName.trim() || !form.age) {
      setError("Patient ID, full name, and age are required.");
      return;
    }
    setSaving(true);
    try {
      const patient = await upsertPatient({
        patient_id: form.patientId.trim(),
        full_name: form.fullName.trim(),
        age: Number(form.age),
        gender: form.gender,
        mobile: form.mobile.trim() || null,
        center: form.center.trim() || pickDefaultCenter(user?.center, centers),
        diabetes_type: form.diabetesType,
        diabetes_duration_years: form.diabetesDuration ? Number(form.diabetesDuration) : null,
        previous_dr: form.previousDR === "No previous history" ? null : form.previousDR,
        notes: form.notes.trim() || null,
      });
      const screening = await createScreening({
        patient_id: patient.patient_id,
        center: patient.center,
      });
      setActivePatientId(patient.patient_id);
      setActiveScreeningId(screening.screening_id);
      navigate(screeningPath("/screening/upload", screening.screening_id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start screening");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <Sidebar active={activeNav} onSelect={k => { setActiveNav(k); onNav(k); }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header title="New Screening" breadcrumbs={["NetraX", "New Screening", "Patient Info"]}
          actions={<Badge v="processing" pulse />}
        />
        <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "16px 28px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 0, maxWidth: 720 }}>
            {STEPS.map((s, i) => {
              const state = i === 0 ? "active" : "pending";
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : undefined }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700,
                      background: state === "active" ? C.indigo : C.slate100,
                      color: state === "active" ? C.white : C.slate400,
                      border: state === "active" ? "none" : `1.5px solid ${C.border}`,
                    }}>{s.n}</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: state === "active" ? C.textPrimary : C.slate400 }}>{s.label}</div>
                      <div style={{ fontSize: 10, color: C.slate400 }}>{s.sublabel}</div>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ flex: 1, height: 1.5, background: C.border, margin: "0 12px", borderRadius: 1 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <main style={{ flex: 1, overflowY: "auto", padding: 28, background: C.bg }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, maxWidth: 1080 }}>
            <Card style={{ padding: 28 }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.textPrimary, letterSpacing: -0.3 }}>Patient Information</div>
                <div style={{ fontSize: 12, color: C.slate500, marginTop: 4 }}>Creates / updates patient in DB, then starts a screening</div>
              </div>

              {error && <div style={{ marginBottom: 14, fontSize: 12, color: C.danger }}>{error}</div>}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
                <Field label="Patient ID *" id="patientId" value={form.patientId} onChange={v => set("patientId", v)} half />
                <Field label="Full Name *" id="fullName" value={form.fullName} onChange={v => set("fullName", v)} half />
                <Field label="Age *" id="age" type="number" value={form.age} onChange={v => set("age", v)} half />
                <Field label="Gender *" id="gender" value={form.gender} half>
                  <select value={form.gender} onChange={e => set("gender", e.target.value)}
                    style={{ ...FIELD_INPUT_STYLE, cursor: "pointer" }}>
                    <option value="F">Female</option>
                    <option value="M">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>
                <Field label="Mobile Number" id="mobile" value={form.mobile} onChange={v => set("mobile", v)} half />
                <Field label="Diabetes Duration (years)" id="diabetesDuration" type="number" value={form.diabetesDuration} onChange={v => set("diabetesDuration", v)} half />
                <Field label="Diabetes Type" id="diabetesType" value={form.diabetesType} half>
                  <select value={form.diabetesType} onChange={e => set("diabetesType", e.target.value)}
                    style={{ ...FIELD_INPUT_STYLE, cursor: "pointer" }}>
                    <option>Type 1</option>
                    <option>Type 2</option>
                    <option>Gestational</option>
                    <option>Unknown</option>
                  </select>
                </Field>
                <Field label="PHC / Screening Center *" id="center" value={form.center} half>
                  <select value={form.center} onChange={e => set("center", e.target.value)}
                    style={{ ...FIELD_INPUT_STYLE, cursor: "pointer" }}>
                    {centers.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Previous DR History" id="previousDR" value={form.previousDR} half>
                  <select value={form.previousDR} onChange={e => set("previousDR", e.target.value)}
                    style={{ ...FIELD_INPUT_STYLE, cursor: "pointer" }}>
                    <option>No previous history</option>
                    <option>No DR detected</option>
                    <option>Mild NPDR</option>
                    <option>Moderate NPDR</option>
                    <option>Severe NPDR</option>
                    <option>Proliferative DR</option>
                  </select>
                </Field>
                <Field label="Previous Screening Date" id="prevScreeningDate" type="date" value={form.prevScreeningDate} onChange={v => set("prevScreeningDate", v)} half />
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.slate600, display: "block", marginBottom: 6 }}>Clinical Notes</label>
                  <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
                    placeholder="Comorbidities, medications, clinical observations…"
                    rows={3}
                    style={{ ...FIELD_INPUT_STYLE, resize: "none" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.borderLight}` }}>
                <ActionButton variant="secondary" onClick={() => void startScreening()} disabled={saving}>
                  Save Patient
                </ActionButton>
                <ActionButton variant="primary" onClick={() => void startScreening()} disabled={saving} icon={<Ico.ArrowR />}>
                  {saving ? "Starting…" : "Continue to Image Upload"}
                </ActionButton>
              </div>
            </Card>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                <div style={{ position: "relative", height: 110, background: C.navyDark, overflow: "hidden" }}>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FundusImg variant="normal" size={180} style={{ opacity: 0.7, margin: "-30px auto" }} />
                  </div>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(2,6,23,0.4) 0%, rgba(2,6,23,0.85) 100%)" }} />
                  <div style={{ position: "absolute", bottom: 12, left: 14, right: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.white, lineHeight: 1.1 }}>{form.fullName || "—"}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
                      {form.patientId} · {form.age ? `${form.age}y` : "—"} · {form.gender}
                    </div>
                  </div>
                </div>
                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "Screening Center", value: form.center || "—", icon: <Ico.MapPin /> },
                    { label: "Diabetes Type", value: form.diabetesType, icon: <Ico.Activity /> },
                    { label: "Duration", value: form.diabetesDuration ? `${form.diabetesDuration} years` : "—", icon: <Ico.Calendar /> },
                    { label: "Previous DR", value: form.previousDR, icon: <Ico.Eye /> },
                  ].map(r => (
                    <div key={r.label} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ color: C.slate400, marginTop: 1, flexShrink: 0 }}>{r.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10, color: C.slate400, fontWeight: 500 }}>{r.label}</div>
                        <div style={{ fontSize: 12, color: C.textPrimary, fontWeight: 600, marginTop: 1, wordBreak: "break-word" }}>{r.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Card title="Screening Progress">
                <div style={{ marginTop: 8 }}>
                  {STEPS.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, fontSize: 10, fontWeight: 700,
                        background: i === 0 ? C.indigo : C.slate100,
                        color: i === 0 ? C.white : C.slate400,
                      }}>{i === 0 ? <Ico.Check /> : s.n}</div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: i === 0 ? C.textPrimary : C.slate400 }}>{s.label}</div>
                        <div style={{ fontSize: 9, color: i === 0 ? C.success : C.slate400 }}>{i === 0 ? "In progress" : "Pending"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  const onNav = useAppNav();
  return <PatientInfoScreen onNav={onNav} />;
}
