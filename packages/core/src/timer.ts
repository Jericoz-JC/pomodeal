// Timer math. Time is always computed from a stored start, never from ticking intervals,
// because browsers throttle background tabs and iOS suspends PWAs.

import type { SessionState } from "./negotiation";

export const HEADS_UP_MS = 2 * 60_000;

export function remainingMs(s: Pick<SessionState, "startedAt" | "durMs">, now: number): number {
  return Math.max(0, s.startedAt + s.durMs - now);
}

export function fractionLeft(s: Pick<SessionState, "startedAt" | "durMs">, now: number): number {
  return s.durMs <= 0 ? 0 : remainingMs(s, now) / s.durMs;
}

export function isHeadsUp(s: Pick<SessionState, "startedAt" | "durMs">, now: number): boolean {
  const r = remainingMs(s, now);
  return r > 0 && r <= HEADS_UP_MS;
}

/** What the dial face shows: whole minutes, then m:ss under 3 minutes, then 0:00. */
export function dialLabel(ms: number): string {
  if (ms <= 0) return "0:00";
  if (ms < 180_000) {
    const sec = Math.ceil(ms / 1000);
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  }
  return String(Math.ceil(ms / 60_000));
}

/** When the block ends, for scheduling the server-side boundary job and push. */
export function endsAt(s: Pick<SessionState, "startedAt" | "durMs">): number {
  return s.startedAt + s.durMs;
}
