const TOKEN_KEY = "netrax_token";
const USER_KEY = "netrax_user";

/** Use Vite proxy in dev (`/api`) or absolute URL from env. */
export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "";

export type AuthUser = {
  id: number;
  email: string;
  full_name: string;
  role: string;
  center: string;
  is_active: boolean;
};

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

type ApiErrorBody = { detail?: string | { msg: string }[] };

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function detailMessage(data: ApiErrorBody | null, fallback: string): string {
  if (!data?.detail) return fallback;
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail.map(d => d.msg).filter(Boolean).join(", ") || fallback;
  }
  return fallback;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    let body: ApiErrorBody | null = null;
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      body = null;
    }
    throw new ApiError(res.status, detailMessage(body, res.statusText || "Request failed"));
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function login(email: string, password: string): Promise<string> {
  const data = await apiFetch<{ access_token: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.access_token);
  return data.access_token;
}

export async function register(payload: {
  email: string;
  password: string;
  full_name: string;
  center?: string;
}): Promise<string> {
  const data = await apiFetch<{ access_token: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setToken(data.access_token);
  return data.access_token;
}

export async function fetchMe(): Promise<AuthUser> {
  const user = await apiFetch<AuthUser>("/api/auth/me");
  setStoredUser(user);
  return user;
}

export async function listUsers(): Promise<AuthUser[]> {
  return apiFetch<AuthUser[]>("/api/users");
}

export async function updateUserRole(userId: number, role: string): Promise<AuthUser> {
  return apiFetch<AuthUser>(`/api/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function inviteUser(payload: {
  email: string;
  password: string;
  full_name: string;
  role: string;
  center?: string;
}): Promise<AuthUser> {
  return apiFetch<AuthUser>("/api/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function setUserActive(userId: number, active: boolean): Promise<AuthUser> {
  return apiFetch<AuthUser>(`/api/users/${userId}/active?active=${active}`, {
    method: "PATCH",
  });
}
