import type { NavKey } from "@/shared/ui";

export const ROLES = [
  "Screening Operator",
  "Ophthalmologist",
  "Reviewer",
  "Administrator",
] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: string | null | undefined): value is Role {
  return !!value && (ROLES as readonly string[]).includes(value);
}

/** Sidebar nav keys allowed per role */
export const NAV_ACCESS: Record<Role, NavKey[]> = {
  "Screening Operator": ["dashboard", "new-screening", "patients", "screenings", "reports", "devices", "settings"],
  Ophthalmologist: ["dashboard", "patients", "screenings", "reports", "analytics", "settings"],
  Reviewer: ["dashboard", "patients", "screenings", "reports", "analytics", "settings"],
  Administrator: ["dashboard", "analytics", "centers", "devices", "users", "settings"],
};

/**
 * Route path → allowed roles (Step 6 screen matrix).
 * Paths not listed require auth but any role (fallback deny via explicit list preferred).
 */
export const PATH_ACCESS: Record<string, Role[]> = {
  "/dashboard": [...ROLES],
  "/notifications": [...ROLES],
  "/help": [...ROLES],
  "/settings": [...ROLES],
  "/system/errors": [...ROLES],
  "/system/empty": [...ROLES],

  "/screening/new": ["Screening Operator"],
  "/screening/upload": ["Screening Operator"],
  "/screening/workflow": ["Screening Operator"],
  "/screening/quality": ["Screening Operator", "Reviewer", "Ophthalmologist"],
  "/screening/enhancement": ["Screening Operator"],
  "/screening/ai-analysis": ["Screening Operator", "Ophthalmologist", "Reviewer"],
  "/screening/structure": ["Screening Operator", "Ophthalmologist", "Reviewer"],
  "/screening/lesions": ["Screening Operator", "Ophthalmologist", "Reviewer"],
  "/screening/results": ["Screening Operator", "Ophthalmologist", "Reviewer"],
  "/screening/gradcam": ["Screening Operator", "Ophthalmologist", "Reviewer"],
  "/screening/lesion-evidence": ["Screening Operator", "Ophthalmologist", "Reviewer"],
  "/screening/model-compare": ["Screening Operator", "Ophthalmologist", "Reviewer"],
  "/screening/evidence-summary": ["Ophthalmologist", "Reviewer"],
  "/screening/review": ["Ophthalmologist", "Reviewer"],
  "/screening/referral": ["Ophthalmologist"],

  "/reports": ["Screening Operator", "Ophthalmologist", "Reviewer", "Administrator"],
  "/reports/clinical": ["Screening Operator", "Ophthalmologist", "Reviewer"],

  "/patients": ["Screening Operator", "Ophthalmologist", "Reviewer"],
  "/patients/profile": ["Screening Operator", "Ophthalmologist", "Reviewer"],
  "/screenings": ["Screening Operator", "Ophthalmologist", "Reviewer"],

  "/analytics": ["Ophthalmologist", "Administrator", "Reviewer"],
  "/analytics/models": ["Administrator", "Ophthalmologist"],
  "/analytics/quality": ["Administrator", "Reviewer", "Ophthalmologist"],

  "/simulation": ["Administrator"],
  "/simulation/resources": ["Administrator"],
  "/centers": ["Administrator"],
  "/devices": ["Administrator", "Screening Operator"],
  "/settings/operations": ["Administrator"],
  "/users": ["Administrator"],
};

export function canAccessPath(role: string | null | undefined, path: string): boolean {
  if (!isRole(role)) return false;
  const allowed = PATH_ACCESS[path];
  if (!allowed) return true; // unknown path: allow if authenticated (login handles unauth)
  return allowed.includes(role);
}

export function canAccessNav(role: string | null | undefined, key: string): boolean {
  if (!isRole(role)) return false;
  return NAV_ACCESS[role].includes(key as NavKey);
}

export function can(role: string | null | undefined, ...allowed: Role[]): boolean {
  if (!isRole(role)) return false;
  return allowed.includes(role);
}
