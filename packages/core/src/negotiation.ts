// Negotiation rules for Pomodeal.
// Source of truth: docs/specs/001-negotiation-rules.md. Pure functions only: no I/O, no clocks.
// Both clients and Convex call these so a deal is identical everywhere.

import { endsAt, focusMinutesDone, remainingMs } from "./timer";

export const ASK_MIN = 5;
export const BREAK_FLOOR_MIN = 2;
export const TRADE_CAP_MIN = 15;
export const BONUS_FOCUS_MIN = 10;
export const BONUS_BREAK_MIN = 3;
/** No focus block grows past this through trades or the bonus (spec 007). */
export const FOCUS_CEILING_MIN = 75;

export type BlockType = "focus" | "break";

export interface Block {
  type: BlockType;
  label: string;
  min: number;
  /** Minutes added to this focus block by trades (capped at TRADE_CAP_MIN). */
  added?: number;
}

export interface SessionState {
  blocks: Block[];
  idx: number;
  startedAt: number;
  durMs: number;
  askCount: number;
  /** Borrowed minutes not yet repaid; forgiven at session end. */
  debt: number;
  bonusOffered: boolean;
}

export type Term =
  | { kind: "freebie"; addMin: number }
  | { kind: "borrow"; addMin: number; repayMin: number }
  | { kind: "trade"; addMin: number; addToNextFocusMin: number }
  | { kind: "override"; addMin: number };

export interface Offer {
  terms: Term[];
  requiresIntention: boolean;
  override: Term;
}

/** `deal` is the deal itself, filed when a session starts; `done` is a deal that ran its full time (spec 010);
 *  `skip` and `end_early` are spec 001's "Ask: skip a break / end early". */
export type LedgerKind = Term["kind"] | "bonus" | "deal" | "done" | "skip" | "end_early" | "forgiven";

export interface LedgerEntry {
  at: number;
  kind: LedgerKind;
  blockLabel: string;
  minutes: number;
  intention?: string;
}

function nextIndexOf(s: SessionState, type: BlockType, after = s.idx): number {
  for (let i = after + 1; i < s.blocks.length; i++) if (s.blocks[i].type === type) return i;
  return -1;
}

export function makeOffer(s: SessionState): Offer {
  const override: Term = { kind: "override", addMin: ASK_MIN };
  if (s.askCount === 0) {
    return { terms: [{ kind: "freebie", addMin: ASK_MIN }], requiresIntention: false, override };
  }
  const terms: Term[] = [{ kind: "borrow", addMin: ASK_MIN, repayMin: ASK_MIN }];
  const nf = nextIndexOf(s, "focus");
  if (nf >= 0 && (s.blocks[nf].added ?? 0) + ASK_MIN <= TRADE_CAP_MIN && s.blocks[nf].min + ASK_MIN <= FOCUS_CEILING_MIN) {
    terms.push({ kind: "trade", addMin: ASK_MIN, addToNextFocusMin: ASK_MIN });
  }
  return { terms, requiresIntention: s.askCount >= 2, override };
}

export interface BorrowPreview {
  /** Next break length before and after repayment (0/0 when there is no next break). */
  from: number;
  to: number;
  /** Minutes that couldn't come out of the next break and become debt. */
  carry: number;
}

export function borrowPreview(s: SessionState, repayMin = ASK_MIN): BorrowPreview {
  const nb = nextIndexOf(s, "break");
  if (nb < 0) return { from: 0, to: 0, carry: repayMin };
  const from = s.blocks[nb].min;
  const take = Math.min(Math.max(0, from - BREAK_FLOOR_MIN), repayMin);
  return { from, to: from - take, carry: repayMin - take };
}

/** Applies a term and returns a new session plus the ledger entry to persist. Never mutates the input. */
export function applyTerm(s: SessionState, term: Term, now: number, intention?: string): { session: SessionState; entry: LedgerEntry } {
  const blocks = s.blocks.map((b) => ({ ...b }));
  let debt = s.debt;
  if (term.kind === "borrow") {
    const p = borrowPreview(s, term.repayMin);
    const nb = nextIndexOf(s, "break");
    if (nb >= 0) blocks[nb].min = p.to;
    debt += p.carry;
  }
  if (term.kind === "trade") {
    const nf = nextIndexOf(s, "focus");
    if (nf < 0) throw new Error("trade offered with no focus block left");
    blocks[nf].min += term.addToNextFocusMin;
    blocks[nf].added = (blocks[nf].added ?? 0) + term.addToNextFocusMin;
  }
  const cur = blocks[s.idx];
  cur.min += term.addMin;
  const session: SessionState = { ...s, blocks, debt, askCount: s.askCount + 1, durMs: s.durMs + term.addMin * 60_000 };
  const entry: LedgerEntry = { at: now, kind: term.kind, blockLabel: cur.label, minutes: term.addMin, ...(intention ? { intention } : {}) };
  return { session, entry };
}

/** Clock-initiated "keep going" offer at the end of a focus block: once per block, never past the ceiling.
 *  Spec 010: the last block gets it too ("10 more minutes" on the done sheet). */
export function canOfferBonus(s: SessionState, pausedInLast5Min: boolean): boolean {
  const cur = s.blocks[s.idx];
  return cur.type === "focus" && !s.bonusOffered && !pausedInLast5Min && cur.min + BONUS_FOCUS_MIN <= FOCUS_CEILING_MIN;
}

export function applyBonus(s: SessionState, now: number): { session: SessionState; entry: LedgerEntry } {
  const blocks = s.blocks.map((b) => ({ ...b }));
  blocks[s.idx].min += BONUS_FOCUS_MIN;
  const nb = nextIndexOf(s, "break");
  if (nb >= 0) blocks[nb].min += BONUS_BREAK_MIN;
  return {
    session: { ...s, blocks, bonusOffered: true, durMs: s.durMs + BONUS_FOCUS_MIN * 60_000 },
    entry: { at: now, kind: "bonus", blockLabel: blocks[s.idx].label, minutes: BONUS_FOCUS_MIN },
  };
}

/** Moves to the next block; asks and bonus reset per block. */
export function advance(s: SessionState, now: number): SessionState {
  const idx = Math.min(s.idx + 1, s.blocks.length - 1);
  return { ...s, idx, startedAt: now, durMs: s.blocks[idx].min * 60_000, askCount: 0, bonusOffered: false };
}

/** Debt never crosses days: whatever is left at session end is forgiven. */
export function endSession(s: SessionState, now: number): LedgerEntry | null {
  if (s.debt <= 0) return null;
  return { at: now, kind: "forgiven", blockLabel: s.blocks[s.idx].label, minutes: s.debt };
}

/** The session's first focus block: its label is the task, its length the one chosen. */
const firstFocus = (s: SessionState): Block => s.blocks.find((b) => b.type === "focus") ?? s.blocks[0];

/** The deal itself, filed when a session starts: the task (or the big one's title, `label`) and the focus length chosen. */
export function dealEntry(s: SessionState, now: number, label?: string): LedgerEntry {
  const focus = firstFocus(s);
  return { at: now, kind: "deal", blockLabel: label ?? focus.label, minutes: focus.min };
}

/**
 * Stopping a session: what was being worked on (the big one's title, `label`) and the focus minutes done.
 * A deal that ran its full time is `done`, dated when its block ended (spec 010); any other stop is `end_early`.
 */
export function endEntry(s: SessionState, now: number, label?: string): LedgerEntry {
  const blockLabel = label ?? firstFocus(s).label, minutes = focusMinutesDone(s, now);
  if (s.idx >= s.blocks.length - 1 && remainingMs(s, now) <= 0) return { at: endsAt(s), kind: "done", blockLabel, minutes };
  return { at: now, kind: "end_early", blockLabel, minutes };
}

/** Ending a block before its time is up: the block and the whole minutes it ran. Null once its time is up. */
export function skipEntry(s: SessionState, now: number): LedgerEntry | null {
  if (remainingMs(s, now) <= 0) return null;
  return { at: now, kind: "skip", blockLabel: s.blocks[s.idx].label, minutes: Math.floor(Math.max(0, now - s.startedAt) / 60_000) };
}

/** Ramp-up: next focus grows by 4 after a block kept without an override; never shrinks as a penalty. */
export function nextFocusLength(prevMin: number, usedOverride: boolean, targetMin = 25, stepMin = 4): number {
  if (usedOverride) return prevMin;
  return Math.min(targetMin, prevMin + stepMin);
}

/** Earned-break mode: 1 min of break per `rate` min of completed focus, clamped. */
export function earnedBreak(focusMin: number, rate = 3, minMin = 3, maxMin = 30): number {
  return Math.min(maxMin, Math.max(minMin, Math.floor(focusMin / rate)));
}
