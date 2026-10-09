import { C, Badge } from "@/shared/ui";
import type { BadgeV } from "@/shared/ui";
import type { Patient } from "@/shared/api/patients";
import type { ScreeningResults } from "@/shared/api/screenings";
import { initialsOf } from "./session";

export function PatientContextBar({
  patient,
  result,
  screeningId,
  badge = "processing",
  pulse,
  extra,
}: {
  patient: Patient | null;
  result: ScreeningResults | null;
  screeningId?: string;
  badge?: BadgeV;
  pulse?: boolean;
  extra?: string;
}) {
  const name = patient?.full_name || result?.patient_name || "Patient";
  const pid = patient?.patient_id || result?.patient_id || "—";
  const sid = screeningId || result?.screening_id || "—";
  const bits = [
    pid,
    patient ? `${patient.age}y` : null,
    patient?.gender || null,
    patient?.center || result?.center || null,
    patient?.diabetes_type ? `${patient.diabetes_type} DM` : null,
    patient?.diabetes_duration_years != null ? `${patient.diabetes_duration_years} years` : null,
    extra || null,
  ].filter(Boolean);

  return (
    <div style={{
      background: C.white, borderRadius: 16, border: `1px solid ${C.border}`,
      padding: "14px 20px", marginBottom: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, background: C.indigo,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: C.white, fontSize: 13, fontWeight: 700,
        }}>
          {initialsOf(name)}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary }}>{name}</div>
          <div style={{ fontSize: 12, color: C.slate500 }}>
            {bits.join(" · ")}{sid !== "—" ? ` · ${sid}` : ""}
          </div>
        </div>
        <div style={{ marginLeft: "auto" }}><Badge v={badge} pulse={pulse} /></div>
      </div>
    </div>
  );
}
