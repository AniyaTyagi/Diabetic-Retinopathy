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

/** Sidebar nav keys allowed per role strictly for designated tasks */
export const NAV_ACCESS: Record<Role, NavKey[]> = {
  "Screening Operator": ["dashboard", "new-screening", "patients", "screenings", "reports", "devices", "settings"],
  Ophthalmologist: ["dashboard", "screenings", "patients", "reports", "analytics", "settings"],
  Reviewer: ["dashboard", "screenings", "patients", "reports", "settings"],
  Administrator: ["dashboard", "analytics", "centers", "devices", "users", "settings"],
};

/**
 * Route path → allowed roles strictly limited to designated tasks.
 * Unauthorized access is denied and redirected.
 */
export const PATH_ACCESS: Record<string, Role[]> = {
  "/dashboard": [...ROLES],
  "/notifications": [...ROLES],
  "/help": [...ROLES],
  "/settings": [...ROLES],
  "/system/errors": [...ROLES],
  "/system/empty": [...ROLES],

  // Operator-only clinical acquisition tasks
  "/screening/new": ["Screening Operator"],
  "/screening/upload": ["Screening Operator"],
  "/screening/workflow": ["Screening Operator"],
  "/screening/quality": ["Screening Operator"],
  "/screening/enhancement": ["Screening Operator"],
  "/screening/ai-analysis": ["Screening Operator"],

  // Screening Results viewing (Operator, Reviewer, Ophthalmologist)
  "/screening/results": ["Screening Operator", "Ophthalmologist", "Reviewer"],

  // Advanced Explainability & Model Comparison (Specialists only)
  "/screening/gradcam": ["Ophthalmologist", "Reviewer"],
  "/screening/grad-cam": ["Ophthalmologist", "Reviewer"],
  "/screening/model-compare": ["Ophthalmologist", "Reviewer"],
  "/screening/evidence-summary": ["Ophthalmologist", "Reviewer"],

  // Clinical Review & Verification (Specialists only — Operator and Admin forbidden)
  "/screening/review": ["Ophthalmologist", "Reviewer"],

  // Referral Triage & Care Planning (Senior Ophthalmologist only)
  "/screening/referral": ["Ophthalmologist"],

  // Reports
  "/reports": ["Screening Operator", "Ophthalmologist", "Reviewer", "Administrator"],
  "/reports/clinical": ["Ophthalmologist", "Reviewer"],

  // Patient & Screening History
  "/patients": ["Screening Operator", "Ophthalmologist", "Reviewer"],
  "/patients/profile": ["Screening Operator", "Ophthalmologist", "Reviewer"],
  "/screenings": ["Screening Operator", "Ophthalmologist", "Reviewer"],

  // Analytics (Role-specific views)
  "/analytics": ["Ophthalmologist", "Administrator"],
  "/analytics/models": ["Ophthalmologist", "Administrator"],
  "/analytics/quality": ["Ophthalmologist", "Reviewer", "Administrator"],

  // System Administration (Administrator only)
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
