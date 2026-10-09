import { apiFetch } from "./auth";

export type Center = {
  id: number;
  name: string;
  location: string;
  device_id: string | null;
  daily_volume: number;
  quality_score: number;
  network_status: string;
  ophthalmologist_status: string;
};

export type Device = {
  id: number;
  device_id: string;
  center: string;
  device_type: string;
  status: string;
  last_sync: string;
  images_count: number;
  avg_quality: number;
};

export type Notification = {
  id: number;
  category: string;
  title: string;
  detail: string;
  time_label: string;
  path: string;
  is_read: boolean;
};

export async function listCenters(): Promise<Center[]> {
  return apiFetch<Center[]>("/api/centers");
}

export async function createCenter(payload: {
  name: string;
  location: string;
  device_id?: string | null;
  daily_volume?: number;
  quality_score?: number;
  network_status?: string;
  ophthalmologist_status?: string;
}): Promise<Center> {
  return apiFetch<Center>("/api/centers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCenter(
  id: number,
  payload: Partial<Omit<Center, "id">>,
): Promise<Center> {
  return apiFetch<Center>(`/api/centers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function listDevices(): Promise<Device[]> {
  return apiFetch<Device[]>("/api/devices");
}

export async function createDevice(payload: {
  device_id: string;
  center: string;
  device_type: string;
  status?: string;
  last_sync?: string;
  images_count?: number;
  avg_quality?: number;
}): Promise<Device> {
  return apiFetch<Device>("/api/devices", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateDevice(
  id: number,
  payload: Partial<Omit<Device, "id" | "device_id">>,
): Promise<Device> {
  return apiFetch<Device>(`/api/devices/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function listNotifications(): Promise<Notification[]> {
  return apiFetch<Notification[]>("/api/notifications");
}

export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  return apiFetch<{ updated: number }>("/api/notifications/mark-all-read", {
    method: "POST",
  });
}
