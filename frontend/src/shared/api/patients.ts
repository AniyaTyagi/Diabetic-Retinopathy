import { apiFetch } from "./auth";

export type Patient = {
  id: number;
  patient_id: string;
  full_name: string;
  age: number;
  gender: string;
  mobile: string | null;
  center: string;
  diabetes_type: string | null;
  diabetes_duration_years: number | null;
  previous_dr: string | null;
  notes: string | null;
  last_screening_date: string | null;
  latest_dr_level: number | null;
  latest_confidence: number | null;
  queue_status: string | null;
  thumb_variant: string | null;
  created_at: string;
};

export async function listPatients(params?: { q?: string; center?: string }): Promise<Patient[]> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.center && params.center !== "All") qs.set("center", params.center);
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiFetch<Patient[]>(`/api/patients${suffix}`);
}

export async function getPatient(patientId: string): Promise<Patient> {
  return apiFetch<Patient>(`/api/patients/${encodeURIComponent(patientId)}`);
}

export type PatientCreateInput = {
  patient_id: string;
  full_name: string;
  age: number;
  gender: string;
  mobile?: string | null;
  center?: string;
  diabetes_type?: string | null;
  diabetes_duration_years?: number | null;
  previous_dr?: string | null;
  notes?: string | null;
};

export async function getNextPatientId(): Promise<string> {
  const data = await apiFetch<{ patient_id: string }>("/api/patients/next-id");
  return data.patient_id;
}

export async function createPatient(payload: PatientCreateInput): Promise<Patient> {
  return apiFetch<Patient>("/api/patients", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePatient(patientId: string, payload: Partial<PatientCreateInput>): Promise<Patient> {
  return apiFetch<Patient>(`/api/patients/${encodeURIComponent(patientId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/**
 * Create a new patient. If patient_id already exists, allocate a fresh server ID
 * and create — never silently overwrite another patient during new screening.
 * Pass `allowUpdate: true` only when intentionally editing an existing record.
 */
export async function upsertPatient(
  payload: PatientCreateInput,
  opts?: { allowUpdate?: boolean },
): Promise<Patient> {
  if (opts?.allowUpdate) {
    try {
      await getPatient(payload.patient_id);
      return updatePatient(payload.patient_id, {
        full_name: payload.full_name,
        age: payload.age,
        gender: payload.gender,
        mobile: payload.mobile,
        center: payload.center,
        diabetes_type: payload.diabetes_type,
        diabetes_duration_years: payload.diabetes_duration_years,
        previous_dr: payload.previous_dr,
        notes: payload.notes,
      });
    } catch {
      /* fall through to create */
    }
  }

  try {
    return await createPatient(payload);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (!/already exists|409|400/i.test(msg)) throw err;
    const freshId = await getNextPatientId();
    return createPatient({ ...payload, patient_id: freshId });
  }
}
