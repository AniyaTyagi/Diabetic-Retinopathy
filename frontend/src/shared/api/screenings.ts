import { apiFetch, API_BASE, getToken, ApiError } from "./auth";

export type ScreeningListItem = {
  screening_id: string;
  patient_id: string;
  center: string;
  date: string;
  dr_level: number | null;
  confidence: number | null;
  model_used: string | null;
  review_status: string;
};

export type QualityCheck = {
  label: string;
  status: string;
  ok: boolean | null;
};

export type QualityAssessment = {
  screening_id: string;
  score: number;
  suitable: boolean;
  status_label: string;
  checks: QualityCheck[];
  fundus_variant: string;
  step: string;
  status: string;
};

export type ScreeningResults = {
  screening_id: string;
  patient_id: string;
  patient_name: string;
  center: string;
  date: string | null;
  dr_level: number | null;
  confidence: number | null;
  model_used: string | null;
  referral_needed: boolean;
  review_status: string;
  quality_score: number | null;
  step: string;
  status: string;
  report_id: string | null;
  has_od_image?: boolean;
  has_os_image?: boolean;
  per_eye?: {
    dr_level?: number;
    confidence?: number;
    probabilities?: Record<string, number>;
    image_path?: string;
    raw_label?: string;
  }[] | null;
  quality: {
    score?: number;
    suitable?: boolean;
    status_label?: string;
    checks?: QualityCheck[];
    fundus_variant?: string;
  } | null;
  explainability: {
    confidence?: number;
    dr_level?: number;
    label?: string;
    summary?: string;
    disclaimer?: string;
    regions?: { id: string; intensity: number; note: string }[];
    per_eye?: ScreeningResults["per_eye"];
    gradcam?: Record<string, { source?: string; predicted_class?: number; error?: string }>;
    model_compare?: {
      cnn_dr_level?: number;
      cnn_confidence?: number;
      cnn_label?: string;
      qml_dr_level?: number;
      qml_confidence?: number;
      qml_label?: string;
      ensemble_dr_level?: number;
      ensemble_confidence?: number;
      ensemble_label?: string;
      winner?: string;
      disagree?: boolean;
    };
    inference?: Record<string, unknown>;
  } | null;
  lesions: {
    counts?: Record<string, number>;
    markers?: { t: string; l: string; label: string }[];
    notes?: string[];
    illustrative?: boolean;
    disclaimer?: string;
  } | null;
  structure: {
    illustrative?: boolean;
    disclaimer?: string;
    optic_disc?: { status: string; cdr_estimate?: number; note?: string };
    macula?: { status: string; note?: string };
    vessels?: { arcade?: string; caliber?: string };
    fov?: { coverage?: string; usable?: boolean };
  } | null;
  follow_up_date?: string | null;
  follow_up_center?: string | null;
  follow_up_notes?: string | null;
};

export async function listScreenings(): Promise<ScreeningListItem[]> {
  return apiFetch<ScreeningListItem[]>("/api/screenings");
}

export async function getScreeningResults(screeningId: string): Promise<ScreeningResults> {
  return apiFetch<ScreeningResults>(`/api/screenings/${encodeURIComponent(screeningId)}/results`);
}

export type ScreeningOut = {
  id: number;
  screening_id: string;
  patient_pk: number;
  center: string;
  status: string;
  step: string;
  quality_score: number | null;
  od_image_path: string | null;
  os_image_path: string | null;
  dr_level: number | null;
  confidence: number | null;
  model_used: string | null;
  review_status: string;
  referral_needed: boolean;
  created_at: string;
  updated_at: string;
};

export type AnalyzeResponse = {
  screening_id: string;
  status: string;
  step: string;
  dr_level: number;
  confidence: number;
  model_used: string;
  referral_needed: boolean;
  message: string;
  report_id: string | null;
};

export async function createScreening(payload: {
  patient_id: string;
  center?: string;
}): Promise<ScreeningOut> {
  return apiFetch<ScreeningOut>("/api/screenings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateScreeningStep(
  screeningId: string,
  payload: {
    step: string;
    status?: string;
    quality_score?: number;
    review_status?: string;
    referral_needed?: boolean;
  },
): Promise<ScreeningOut> {
  return apiFetch<ScreeningOut>(`/api/screenings/${encodeURIComponent(screeningId)}/step`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function assessScreeningQuality(screeningId: string): Promise<QualityAssessment> {
  return apiFetch<QualityAssessment>(
    `/api/screenings/${encodeURIComponent(screeningId)}/quality`,
    { method: "POST" },
  );
}

export async function uploadScreeningImages(
  screeningId: string,
  files: { od?: File | null; os?: File | null },
): Promise<ScreeningOut> {
  const form = new FormData();
  if (files.od) form.append("od", files.od);
  if (files.os) form.append("os", files.os);
  const headers = new Headers();
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_BASE}/api/screenings/${encodeURIComponent(screeningId)}/images`, {
    method: "POST",
    headers,
    body: form,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = await res.json();
      msg = typeof body.detail === "string" ? body.detail : msg;
    } catch { /* ignore */ }
    throw new ApiError(res.status, msg || "Upload failed");
  }
  return (await res.json()) as ScreeningOut;
}

export async function analyzeScreening(
  screeningId: string,
  model: string = "ensemble",
): Promise<AnalyzeResponse> {
  return apiFetch<AnalyzeResponse>(`/api/screenings/${encodeURIComponent(screeningId)}/analyze`, {
    method: "POST",
    body: JSON.stringify({ model }),
  });
}

export async function scheduleFollowUp(
  screeningId: string,
  payload: {
    follow_up_date: string;
    follow_up_center: string;
    follow_up_notes?: string | null;
  },
): Promise<{
  screening_id: string;
  follow_up_date: string | null;
  follow_up_center: string | null;
  follow_up_notes: string | null;
}> {
  return apiFetch(`/api/screenings/${encodeURIComponent(screeningId)}/follow-up`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
