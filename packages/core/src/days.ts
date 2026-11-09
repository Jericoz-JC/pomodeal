// Spec 008: day-key arithmetic. Keys are local "YYYY-MM-DD" strings computed by the client;
// here they are only ever parsed and shifted with Date.UTC, never with local time.

const DAY_MS = 86_400_000;

function toUtc(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(key: string, n: number): string {
  return new Date(toUtc(key) + n * DAY_MS).toISOString().slice(0, 10);
}

/** Whole days from `fromKey` to `toKey` (negative when `toKey` is earlier). */
export function daysBetween(fromKey: string, toKey: string): number {
  return Math.round((toUtc(toKey) - toUtc(fromKey)) / DAY_MS);
}
