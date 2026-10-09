import { apiFetch } from "./auth";

export type AnalyticsSummary = {
  total_screenings: number;
  today_screenings: number;
  referred: number;
  pending_review: number;
  ungradeable: number;
  by_level: Record<string, number>;
  avg_confidence: number | null;
};

export type ModelBenchmark = {
  name: string;
  sensitivity: number | null;
  specificity: number | null;
  f1: number | null;
  roc_auc: number | null;
  pr_auc: number | null;
  calibration: number | null;
  accuracy?: number | null;
  quadratic_kappa?: number | null;
  is_headline: boolean;
};

export type ModelPerformance = {
  dataset: string;
  threshold_label: string;
  headline_metrics: { l: string; v: string }[];
  models: ModelBenchmark[];
  roc_points: string;
  pr_points: string;
  confusion: { tn: number; fp: number; fn: number; tp: number };
  class_distribution: number[];
  live_by_level: Record<string, number>;
  status?: string | null;
  note?: string | null;
  source?: string | null;
};

export type QualityAnalytics = {
  avg_quality: number;
  good_pct: number;
  ungradeable_pct: number;
  recapture_pct: number;
  score_distribution: number[];
  failures: { label: string; pct: number; color: string }[];
  by_center: number[];
  center_labels: string[];
  by_device: number[];
  device_labels: string[];
  recapture_monthly: number[];
  live_center_quality: { name: string; quality: number }[];
  live_device_quality: { name: string; quality: number }[];
};

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  return apiFetch<AnalyticsSummary>("/api/analytics/summary");
}

export async function getModelPerformance(): Promise<ModelPerformance> {
  return apiFetch<ModelPerformance>("/api/analytics/models");
}

export async function getQualityAnalytics(): Promise<QualityAnalytics> {
  return apiFetch<QualityAnalytics>("/api/analytics/quality");
}
