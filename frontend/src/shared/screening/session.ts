const SID_KEY = "netrax_active_screening";
const PID_KEY = "netrax_active_patient";

export function getActiveScreeningId(): string | null {
  return sessionStorage.getItem(SID_KEY);
}

export function setActiveScreeningId(sid: string) {
  sessionStorage.setItem(SID_KEY, sid);
}

export function getActivePatientId(): string | null {
  return sessionStorage.getItem(PID_KEY);
}

export function setActivePatientId(pid: string) {
  sessionStorage.setItem(PID_KEY, pid);
}

export function clearActiveScreening() {
  sessionStorage.removeItem(SID_KEY);
  sessionStorage.removeItem(PID_KEY);
}

/** Preserve screening id across workflow navigations. */
export function screeningPath(path: string, sid?: string | null): string {
  const id = sid || getActiveScreeningId();
  if (!id) return path;
  const [base, hash] = path.split("#");
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}sid=${encodeURIComponent(id)}${hash ? `#${hash}` : ""}`;
}

export function initialsOf(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map(p => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
