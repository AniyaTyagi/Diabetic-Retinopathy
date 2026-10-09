/** Static center names — used when centers API is unavailable (e.g. login). */
export const FALLBACK_CENTERS = [
  "PHC Shivapur",
  "PHC Belgaum",
  "PHC Hubli",
  "DH Dharwad",
  "PHC Kalghatgi",
  "PHC Bailhongal",
] as const;

export function pickDefaultCenter(
  preferred?: string | null,
  centers: readonly string[] = FALLBACK_CENTERS,
): string {
  const list = centers.length ? centers : FALLBACK_CENTERS;
  if (preferred?.trim()) {
    const match = list.find(c => c.toLowerCase() === preferred.trim().toLowerCase());
    if (match) return match;
    return preferred.trim();
  }
  return list[0] ?? "PHC Shivapur";
}
