import { nextFocusLength, type Block, type SessionState } from "./negotiation";

/** Spec 007. Quick lengths are on first look; longer ones sit behind "Longer…". */
export const FOCUS_QUICK = [5, 8, 12, 15, 20] as const;
export const FOCUS_LONG = [30, 45, 60] as const;
export const FOCUS_LENGTHS: readonly number[] = [...FOCUS_QUICK, ...FOCUS_LONG];
export const BREAK_MAX_MIN = 30;

export interface QuickDeal {
  /** What the person is doing right now (e.g. "Reels"); null means "nothing, start now". */
  activity: string | null;
  breakMin: number;
  task: string;
  focusMin: number;
}

/** Long blocks start at the length you chose and hold; quick ones ramp. */
export const isLongFocus = (focusMin: number): boolean => focusMin >= FOCUS_LONG[0];

/** A session is about 90–120 min of focus: 45 and 60 get two blocks, everything else three. */
export function roundsFor(focusMin: number): number {
  return focusMin >= 45 ? 2 : 3;
}

/** Break after focus block `i`: 5 then 7 for quick sessions, a quarter of the block for long ones. */
export function breakBetween(focusMin: number, i: number): number {
  return isLongFocus(focusMin) ? Math.round(focusMin / 4) : 5 + i * 2;
}

/** Why a deal can't start, or null. Convex calls this before building a session. */
export function dealProblem(d: QuickDeal): string | null {
  if (!FOCUS_LENGTHS.includes(d.focusMin)) return "That focus length isn't on offer";
  if (!Number.isInteger(d.breakMin) || d.breakMin < 1 || d.breakMin > BREAK_MAX_MIN) return "That break length isn't on offer";
  return null;
}

/** Builds a session from a Quick Deal: the current distraction becomes the first, planned block. */
export function buildSession(d: QuickDeal, now: number, rounds = roundsFor(d.focusMin)): SessionState {
  const blocks: Block[] = [];
  if (d.activity) blocks.push({ type: "break", label: d.activity, min: d.breakMin });
  // the ramp grows +4 up to max(25, chosen), so a long block simply holds its length
  const target = Math.max(25, d.focusMin);
  let focus = d.focusMin;
  for (let i = 0; i < rounds; i++) {
    blocks.push({ type: "focus", label: d.task, min: focus });
    // later breaks are the break you chose, so every screen can name it
    if (i < rounds - 1) blocks.push({ type: "break", label: d.activity ?? "Your pick", min: breakBetween(d.focusMin, i) });
    focus = nextFocusLength(focus, false, target);
  }
  return { blocks, idx: 0, startedAt: now, durMs: blocks[0].min * 60_000, askCount: 0, debt: 0, bonusOffered: false };
}
