import { useEffect, useState } from "react";
import { API_BASE, getToken } from "@/shared/api/auth";

/** Fetch authenticated image as blob URL (img tags cannot send Bearer headers). */
export function useAuthImage(path: string | null | undefined) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(path));

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;
    if (!path) {
      setSrc(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const token = getToken();
        const res = await fetch(`${API_BASE}${path}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`Image ${res.status}`);
        const blob = await res.blob();
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        revoked = url;
        setSrc(url);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Image load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [path]);

  return { src, error, loading };
}

export function screeningImagePath(screeningId: string, eye: "od" | "os") {
  return `/api/screenings/${encodeURIComponent(screeningId)}/images/${eye}`;
}

export function gradcamImagePath(
  screeningId: string,
  eye: "od" | "os",
  kind: "heatmap" | "overlay",
) {
  return `/api/screenings/${encodeURIComponent(screeningId)}/gradcam/${eye}/${kind}`;
}
