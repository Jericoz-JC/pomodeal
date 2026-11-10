import { BONUS_FOCUS_MIN, BREAK_FLOOR_MIN, nextFocusLength, type Block, type SessionState } from "./negotiation";

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

/**
 * Builds a session from a Quick Deal: the current distraction becomes the first, planned block, then one focus block.
 * Spec 010: a deal is one sitting, exactly its ticket. `rounds` above 1 builds the older multi-block sessions that may
 * still be running; nothing starts one now.
 */
export function buildSession(d: QuickDeal, now: number, rounds = 1): SessionState {
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

/**
 * Spec 010: the next round, offered as a fresh ticket when a deal is done. Quick lengths step up one notch
 * (5 → 8 → 12 → 15 → 20), long ones repeat; the break is the one between rounds, of the same activity (an unnamed
 * break when none was chosen). The length is the one chosen: minutes added by trades or the bonus don't count.
 */
export function nextRound(s: SessionState): QuickDeal {
  const focus = s.blocks.find((b) => b.type === "focus") ?? s.blocks[0];
  const first = s.blocks[0];
  // the bonus is taken on the running block and marks it (bonusOffered), unlike a trade's `added`
  const bonus = s.blocks[s.idx] === focus && s.bonusOffered ? BONUS_FOCUS_MIN : 0;
  const chosen = [...FOCUS_LENGTHS].reverse().find((m) => m <= focus.min - (focus.added ?? 0) - bonus) ?? FOCUS_LENGTHS[0];
  const focusMin = isLongFocus(chosen) ? chosen : FOCUS_QUICK.find((m) => m > chosen) ?? FOCUS_QUICK[FOCUS_QUICK.length - 1];
  return { activity: first.type === "break" ? first.label : "Your pick", breakMin: breakBetween(chosen, 0), task: focus.label, focusMin };
}

/**
 * Borrowed minutes still owed come off the next deal's break, down to the floor (spec 001 "Borrow", spec 010).
 * What the break can't take, or all of it when the next deal has no break, is forgiven.
 */
export function repayDebt(d: QuickDeal, debt: number): { deal: QuickDeal; repaid: number; forgiven: number } {
  if (debt <= 0) return { deal: d, repaid: 0, forgiven: 0 };
  if (!d.activity) return { deal: d, repaid: 0, forgiven: debt };
  const repaid = Math.min(debt, Math.max(0, d.breakMin - BREAK_FLOOR_MIN));
  return { deal: { ...d, breakMin: d.breakMin - repaid }, repaid, forgiven: debt - repaid };
}
