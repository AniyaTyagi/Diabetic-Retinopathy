/** Share a secure in-app link via Web Share API or clipboard. */
export async function shareSecureLink(opts: {
  title: string;
  text?: string;
  path: string;
}): Promise<"shared" | "copied"> {
  const url = new URL(opts.path, window.location.origin).toString();
  const payload = {
    title: opts.title,
    text: opts.text || opts.title,
    url,
  };

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(payload);
      return "shared";
    } catch (err) {
      // User cancelled share sheet — fall through only if not AbortError
      if (err instanceof DOMException && err.name === "AbortError") {
        throw err;
      }
    }
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return "copied";
  }

  // Fallback for older browsers
  const ta = document.createElement("textarea");
  ta.value = url;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  ta.remove();
  return "copied";
}
