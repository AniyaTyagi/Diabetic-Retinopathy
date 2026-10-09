import { canAccessPath, type Role } from "@/shared/rbac";

/** Primary screening chain (redirected/dead screens omitted). */
export const SCREENING_FLOW = [
  { path: "/screening/new", enterLabel: "Continue to Patient Info" },
  { path: "/screening/upload", enterLabel: "Continue to Image Upload" },
  { path: "/screening/quality", enterLabel: "Continue to Quality Check" },
  { path: "/screening/ai-analysis", enterLabel: "Continue to AI Analysis" },
  { path: "/screening/results", enterLabel: "Continue to Results" },
  { path: "/screening/gradcam", enterLabel: "View Grad-CAM Explainability" },
  { path: "/screening/model-compare", enterLabel: "Continue to Model Comparison" },
  { path: "/screening/review", enterLabel: "Continue to Review" },
  { path: "/screening/referral", enterLabel: "Confirm & Proceed to Referral" },
] as const;

export type ScreeningFlowStep = (typeof SCREENING_FLOW)[number];

export type ScreeningNext = {
  targetPath: string;
  buttonLabel: string;
  isFinish: boolean;
};

const FINISH: ScreeningNext = {
  targetPath: "/dashboard",
  buttonLabel: "Finish & return to Dashboard",
  isFinish: true,
};

/** Next allowed step after `currentPath` for this role; otherwise finish → dashboard. */
export function resolveScreeningNext(
  role: Role | null | undefined,
  currentPath: string,
): ScreeningNext {
  const idx = SCREENING_FLOW.findIndex(s => s.path === currentPath);
  const start = idx >= 0 ? idx + 1 : 0;
  for (let i = start; i < SCREENING_FLOW.length; i++) {
    const step = SCREENING_FLOW[i];
    if (canAccessPath(role, step.path)) {
      return {
        targetPath: step.path,
        buttonLabel: step.enterLabel,
        isFinish: false,
      };
    }
  }
  return FINISH;
}
