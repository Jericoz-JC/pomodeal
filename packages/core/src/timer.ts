// Timer math. Time is always computed from a stored start, never from ticking intervals,
// because browsers throttle background tabs and iOS suspends PWAs.

import type { SessionState } from "./negotiation";

export const HEADS_UP_MS = 2 * 60_000;
export const LONG_HEADS_UP_MS = 5 * 60_000;
/** Blocks this long get the longer heads-up and the halfway line (spec 007). */
export const LONG_BLOCK_MS = 45 * 60_000;
export const HALFWAY_WINDOW_MS = 3 * 60_000;

/** Wrapping up a chapter takes longer than wrapping up a reel: 5 min of warning on blocks of 45+, else 2. */
export function headsUpMs(durMs: number): number {
  return durMs >= LONG_BLOCK_MS ? LONG_HEADS_UP_MS : HEADS_UP_MS;
}

export function remainingMs(s: Pick<SessionState, "startedAt" | "durMs">, now: number): number {
  return Math.max(0, s.startedAt + s.durMs - now);
}

export function fractionLeft(s: Pick<SessionState, "startedAt" | "durMs">, now: number): number {
  return s.durMs <= 0 ? 0 : remainingMs(s, now) / s.durMs;
}

export function isHeadsUp(s: Pick<SessionState, "startedAt" | "durMs">, now: number): boolean {
  const r = remainingMs(s, now);
  return r > 0 && r <= headsUpMs(s.durMs);
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

/** A silent line under the dial for 3 min after the midpoint of a focus block of 45+. Never a sound or a sheet. */
export function isHalfway(s: Pick<SessionState, "blocks" | "idx" | "startedAt" | "durMs">, now: number): boolean {
  if (s.blocks[s.idx]?.type !== "focus" || s.durMs < LONG_BLOCK_MS) return false;
  const since = now - s.startedAt - s.durMs / 2;
  return since >= 0 && since < HALFWAY_WINDOW_MS;
}

/** The dial's tick ring follows the block: one minor tick per minute, majors every 5 up to 30 min, every 15 above.
 *  When the block doesn't divide evenly (8, 12, a traded 13), only the 12 o'clock major is drawn, so none lands off-centre. */
export function dialTicks(blockMin: number): { minor: number; majorEvery: number } {
  const minor = Math.max(1, Math.round(blockMin));
  const step = minor > 30 ? 15 : 5;
  return { minor, majorEvery: minor % step === 0 ? step : minor };
}
