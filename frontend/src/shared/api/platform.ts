import { apiFetch } from "./auth";

export type SimulationCapacity = {
  title: string;
  subtitle: string;
  pipeline: { label: string; accent: string }[];
  metrics: { label: string; value: string; color: string }[];
  bottlenecks: { label: string; detail: string; severity: string; color: string }[];
};

export type SimulationDefaults = {
  phcs: number;
  images_day: number;
  bandwidth: number;
  ophthalmologists: number;
  ai_capacity_per_hour: number;
};

export type OpsStatus = {
  banner: string;
  all_operational: boolean;
  systems: { name: string; status: string; load: number; updated: string; color: string }[];
  offline_devices: number;
  total_devices: number;
};

export type PlatformSettings = {
  sections: string[];
  inference_model: string;
  referral_threshold: string;
  explainability_enabled: boolean;
  human_review_required: boolean;
  notification_prefs: {
    critical_alerts: boolean;
    offline_sync: boolean;
    daily_digest: boolean;
  };
  report_blurb: string;
  security_blurb: string;
  profile_name: string | null;
  profile_email: string | null;
  profile_role: string | null;
  profile_center: string | null;
};

export async function getSimulationCapacity(): Promise<SimulationCapacity> {
  return apiFetch<SimulationCapacity>("/api/simulation/capacity");
}

export async function getSimulationDefaults(): Promise<SimulationDefaults> {
  return apiFetch<SimulationDefaults>("/api/simulation/defaults");
}

export async function getOpsStatus(): Promise<OpsStatus> {
  return apiFetch<OpsStatus>("/api/ops/status");
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  return apiFetch<PlatformSettings>("/api/settings");
}

export async function patchPlatformSettings(
  body: Partial<PlatformSettings>,
): Promise<PlatformSettings> {
  return apiFetch<PlatformSettings>("/api/settings", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
