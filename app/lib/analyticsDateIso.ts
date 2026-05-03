/** Local calendar date → YYYY-MM-DD (matches mock bucket keys for typical browser TZ demo). */
export function dateToLocalIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isoToLocalMidday(iso: string): Date {
  const [y, mo, dy] = iso.split("-").map(Number);
  return new Date(y, mo - 1, dy, 12, 0, 0);
}
