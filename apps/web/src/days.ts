/** Local calendar date as "YYYY-MM-DD" (the day keys the server and core work in). */
export function localDayKey(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Milliseconds from `ms` to the next local midnight (at least 1 s, so a re-arm never spins). */
export function msToLocalMidnight(ms: number): number {
  const d = new Date(ms);
  return Math.max(1000, new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime() - ms);
}
