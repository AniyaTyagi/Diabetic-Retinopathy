import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/auth/AuthContext";
import { clearActiveScreening, screeningPath } from "@/shared/screening/session";
import { resolveScreeningNext, type ScreeningNext } from "@/shared/screening/flow";
import { useActiveScreening } from "@/shared/screening/useActiveScreening";

export type ScreeningFlowNav = ScreeningNext & {
  goNext: () => void;
  canPath: (path: string) => boolean;
};

/** Role-aware next-step for the active screening workflow. */
export function useScreeningFlowNav(currentPath: string): ScreeningFlowNav {
  const { role, canPath } = useAuth();
  const navigate = useNavigate();
  const { screeningId } = useActiveScreening();

  const next = useMemo(
    () => resolveScreeningNext(role, currentPath),
    [role, currentPath],
  );

  function goNext() {
    if (next.isFinish) {
      clearActiveScreening();
      navigate("/dashboard");
      return;
    }
    navigate(screeningPath(next.targetPath, screeningId));
  }

  return { ...next, goNext, canPath };
}
