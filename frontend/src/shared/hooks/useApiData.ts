import { useEffect, useState } from "react";

type LoadState<T> = {
  data: T;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

/** Tiny async loader for API-backed screens. */
export function useApiData<T>(loader: () => Promise<T>, initial: T, deps: unknown[] = []): LoadState<T> {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loader()
      .then(res => {
        if (!cancelled) setData(res);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  return {
    data,
    loading,
    error,
    reload: () => setTick(t => t + 1),
  };
}
