import type { Block, SessionState } from "./negotiation";

export interface QuickDeal {
  /** What the person is doing right now (e.g. "Reels"); null means "nothing, start now". */
  activity: string | null;
  breakMin: number;
  task: string;
  focusMin: number;
}

/** Builds a ramp-up session from a Quick Deal: the current distraction becomes the first, planned block. */
export function buildSession(d: QuickDeal, now: number, rounds = 3): SessionState {
  const blocks: Block[] = [];
  if (d.activity) blocks.push({ type: "break", label: d.activity, min: d.breakMin });
  for (let i = 0; i < rounds; i++) {
    blocks.push({ type: "focus", label: d.task, min: d.focusMin + i * 4 });
    // later breaks are the break you chose, so every screen can name it
    if (i < rounds - 1) blocks.push({ type: "break", label: d.activity ?? "Your pick", min: 5 + i * 2 });
  }
  return { blocks, idx: 0, startedAt: now, durMs: blocks[0].min * 60_000, askCount: 0, debt: 0, bonusOffered: false };
}
