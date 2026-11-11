// Spec 012 "Tonight in a line": tonight typed as one sentence of assignments, each a size and a name, printed as
// sittings. Every sitting is an ordinary deal; a sitting on a big one is that big one's next sitting. Pure: the
// caller passes the clock and the names it already knows.
import { BONUS_FOCUS_MIN, type SessionState } from "./negotiation";
import { FOCUS_LENGTHS, breakBetween, type QuickDeal } from "./session";

/** Sizes on offer as [sittings, minutes each]: the deal's lengths, cut into sittings with a break between. */
export const NIGHT_SIZES: readonly (readonly [number, number])[] = [[1, 15], [1, 20], [1, 30], [1, 45], [2, 30], [2, 45], [3, 30], [3, 45]];
export const NIGHT_MAX_ITEMS = 6;
export const NIGHT_TITLE_MAX = 80;
/** A bare trailing number is a size only when it is one of these ("orgo set 4" keeps its 4). */
const BARE_SIZES = [15, 20, 30, 45, 60, 90, 120];
/** A name typed without a size gets this one, unless the name it matched brings its own. */
const DEFAULT_MIN = 20;

export interface NightItem<Id extends string = string> {
  title: string;
  taskId?: Id;
  sittings: number;
  minutes: number;
  /** a big one's next piece when the item was typed; not stored */
  piece?: string;
}

export interface Sitting<Id extends string = string> {
  title: string;
  taskId?: Id;
  piece?: string;
  minutes: number;
  /** 0-based: this is sitting k + 1 of `of` */
  k: number;
  of: number;
}

/** A name the student already uses: an open big one (with its next piece and its size) or one of today's deals. */
export interface KnownName<Id extends string = string> {
  title: string;
  taskId?: Id;
  minutes?: number;
  piece?: string;
}

/** The size on offer whose total is nearest `minutes` (the first on a tie). */
export function snapNightSize(minutes: number): readonly [number, number] {
  return NIGHT_SIZES.reduce((a, s) => (Math.abs(s[0] * s[1] - minutes) < Math.abs(a[0] * a[1] - minutes) ? s : a));
}

const words = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);

/** The first known name of which every typed word starts a word ("bio ch 7" is BIO 180 ch. 7). */
export function matchNightName<Id extends string>(raw: string, known: readonly KnownName<Id>[]): KnownName<Id> | null {
  const w = words(raw);
  if (!w.length) return null;
  return known.find((k) => { const kw = words(k.title); return w.every((x) => kw.some((y) => y.startsWith(x))); }) ?? null;
}

const cut = (s: string) => [...s].slice(0, NIGHT_TITLE_MAX).join("");

/**
 * One item of the sentence: a size at the end if there is one ("45m", "45 min", "1h", "1h30", "2h", or a bare "45"
 * when that is a size), snapped to NIGHT_SIZES, then the name, matched against `known`. Null for a blank item.
 */
export function parseNightItem<Id extends string>(raw: string, known: readonly KnownName<Id>[]): NightItem<Id> | null {
  let s = raw.replace(/\s+/g, " ").trim();
  let mins: number | null = null;
  const m = s.match(/\s(\d+(?:\.\d+)?)\s*(h|hr|hrs|hours?)\s*(\d+)?\s*(m|min|mins)?$/i) || s.match(/\s(\d+)\s*(m|min|mins|minutes)$/i) || s.match(/\s(\d+)$/);
  if (m && m.index !== undefined && (m[2] || BARE_SIZES.includes(+m[1]))) {
    mins = /^h/i.test(m[2] || "") ? Math.round(parseFloat(m[1]) * 60 + (+(m[3] ?? 0) || 0)) : +m[1];
    s = s.slice(0, m.index).trim();
  }
  if (!s) return null;
  const k = matchNightName(s, known);
  const [sittings, minutes] = snapNightSize(mins ?? k?.minutes ?? DEFAULT_MIN);
  const item: NightItem<Id> = { title: k ? cut(k.title) : cut(s).replace(/^./, (c) => c.toUpperCase()), sittings, minutes };
  if (k?.taskId) item.taskId = k.taskId;
  if (k?.piece) item.piece = k.piece;
  return item;
}

/** The night's sittings, flat, in the sentence's order. */
export function sittingsOf<Id extends string>(items: readonly NightItem<Id>[]): Sitting<Id>[] {
  return items.flatMap((it) =>
    Array.from({ length: it.sittings }, (_, k) => {
      const s: Sitting<Id> = { title: it.title, minutes: it.minutes, k, of: it.sittings };
      if (it.taskId) s.taskId = it.taskId;
      if (it.piece) s.piece = it.piece;
      return s;
    }),
  );
}

/**
 * What the sittings come to: focus minutes, the breaks between them (the break between rounds after each), and when
 * they're done from `nowMs`. `leadBreakMin` is the break the first deal starts with, if it has one.
 */
export function nightFit(sittings: readonly Sitting[], nowMs: number, leadBreakMin = 0): { focusMin: number; breakMin: number; doneAt: number } {
  if (!sittings.length) return { focusMin: 0, breakMin: 0, doneAt: nowMs };
  const focusMin = sittings.reduce((a, s) => a + s.minutes, 0);
  const breakMin = sittings.slice(0, -1).reduce((a, s) => a + breakBetween(s.minutes, 0), 0) + leadBreakMin;
  return { focusMin, breakMin, doneAt: nowMs + (focusMin + breakMin) * 60_000 };
}

/**
 * The done sheet's next ticket when tonight has a sitting left: that sitting, with the break between rounds after the
 * length just chosen (trades and the bonus don't count), of the same activity, or an unnamed one.
 */
export function nightRound(s: SessionState, next: Sitting): QuickDeal {
  const focus = s.blocks.find((b) => b.type === "focus") ?? s.blocks[0];
  const first = s.blocks[0];
  const bonus = s.blocks[s.idx] === focus && s.bonusOffered ? BONUS_FOCUS_MIN : 0;
  const chosen = [...FOCUS_LENGTHS].reverse().find((m) => m <= focus.min - (focus.added ?? 0) - bonus) ?? FOCUS_LENGTHS[0];
  return { activity: first.type === "break" ? first.label : "Your pick", breakMin: breakBetween(chosen, 0), task: next.title, focusMin: next.minutes };
}

/** Why a night can't be printed, or null. Convex calls this before storing one. */
export function nightProblem(input: { items: readonly Pick<NightItem, "title" | "sittings" | "minutes">[] }): string | null {
  const { items } = input;
  if (items.length < 1) return "Tonight needs something in it";
  if (items.length > NIGHT_MAX_ITEMS) return `Tonight holds ${NIGHT_MAX_ITEMS} things at most`;
  for (const it of items) {
    const len = [...it.title.trim()].length;
    if (len < 1 || len > NIGHT_TITLE_MAX || it.title !== it.title.trim()) return "That name doesn't fit";
    if (!NIGHT_SIZES.some(([n, m]) => n === it.sittings && m === it.minutes)) return "That size isn't on offer";
  }
  return null;
}
