import { useEffect, useMemo, useState } from "react";
import { listCenters } from "@/shared/api/ops";
import { FALLBACK_CENTERS, pickDefaultCenter } from "@/shared/centers";

/** Live center names with static fallback; picks a sensible default. */
export function useCenterOptions(preferred?: string | null) {
  const [names, setNames] = useState<string[]>([...FALLBACK_CENTERS]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listCenters()
      .then(rows => {
        if (cancelled) return;
        const live = rows.map(c => c.name).filter(Boolean);
        if (live.length) setNames(live);
      })
      .catch(() => {
        /* keep FALLBACK_CENTERS */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const defaultCenter = useMemo(
    () => pickDefaultCenter(preferred, names),
    [preferred, names],
  );

  return { centers: names, defaultCenter, loading };
}
