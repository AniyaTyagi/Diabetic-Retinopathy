import { API_BASE, ApiError, apiFetch, getToken } from "./auth";

export type Report = {
  report_id: string;
  patient_id: string;
  patient_name: string | null;
  severity: string;
  date: string;
  status: string;
  screening_id?: string | null;
};

export async function listReports(): Promise<Report[]> {
  return apiFetch<Report[]>("/api/reports");
}

export async function getReport(reportId: string): Promise<Report> {
  return apiFetch<Report>(`/api/reports/${encodeURIComponent(reportId)}`);
}

/** Download clinical report as PDF (auth blob). */
export async function downloadReportPdf(reportId: string): Promise<void> {
  const headers = new Headers();
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}/api/reports/${encodeURIComponent(reportId)}/pdf`, {
    headers,
  });
  if (!res.ok) {
    let message = res.statusText || "PDF download failed";
    try {
      const body = (await res.json()) as { detail?: string };
      if (typeof body.detail === "string") message = body.detail;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, message);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${reportId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
