// Spec 008: big ones (multi-day tasks). Pure rules; no clock, no zone. Days are local "YYYY-MM-DD" keys.

import { addDays, daysBetween, isDayKey } from "./days";

// ---------- types and limits ----------

export type TaskType = "writing" | "problems" | "exam" | "project";

export const GUT_SIZES = [60, 120, 180, 240] as const;
export const FIRST_PAYMENT_MIN = 15;
export const FIRST_PAYMENT_ALT_MIN = 30;
export const MAX_PIECES = 12;
export const TITLE_MAX = 80;
export const LINE_MAX = 140;
export const CARDS_SHOWN = 3;
export const WORKED_DAYS_KEPT = 30;
export const PIECE_MIN = 5;
export const PIECE_MAX = 240;

export interface Piece { title: string; minutes: number; plannedDay?: string; stampedAt?: number }

export interface BigOne {
  title: string;
  taskType?: TaskType;
  gutMin?: number;
  workedMin: number;
  openTermsMin: number | null;
  firstMove: string;
  bookmark?: string;
  pieces?: Piece[];
  dueDay?: string;
  spreadSignedAt?: number;
  status: "open" | "done" | "set_aside";
  lastFocusMin?: number;
  workedDays: string[];
}

// ---------- copy tables ("Four types, one engine") ----------

const FIRST_MOVE: Record<TaskType, { first: string; comeback: string }> = {
  writing: { first: "Open the doc and write one ugly sentence", comeback: "Read your last paragraph and fix one sentence" },
  problems: { first: "Do problem 1 until you're stuck", comeback: "Reread your stuck question" },
  exam: { first: "Quiz yourself on topic 1 without notes", comeback: "Recall three things from last time" },
  project: { first: "Decide one thing: ___", comeback: "Look at the last thing you made" },
};

const SLOTS: Record<TaskType, string[]> = {
  writing: ["Intro", "Body", "Body", "Conclusion", "Revise"],
  problems: ["Problems 1–3", "Problems 4–6", "Problems 7–9"],
  exam: ["Topic 1", "Topic 2", "Topic 3"],
  project: ["Decide", "Sketch", "Build", "Check"],
};

const DONE_QUESTION: Record<TaskType, string> = {
  writing: "Messy draft exists?",
  problems: "Tried each one, stuck ones written down?",
  exam: "Recalled each item once without notes?",
  project: "Decided or made?",
};

const BOOKMARK_PLACEHOLDER: Record<TaskType, string> = {
  writing: "Claim for paragraph 2",
  problems: "The question I'm stuck on",
  exam: "Weak spot: …",
  project: "Next visible thing: …",
};

/** No type picked: blank first move (UI shows its own placeholder). */
export function firstMoveFor(type: TaskType | undefined, comeback: boolean): string {
  if (!type) return "";
  return comeback ? FIRST_MOVE[type].comeback : FIRST_MOVE[type].first;
}

/** Piece titles to pre-fill the split; no type gives one empty row. */
export function splitSlots(type: TaskType | undefined): string[] {
  return type ? [...SLOTS[type]] : [""];
}

/** The piece-level "is this part done" question. */
export function doneQuestion(type: TaskType | undefined): string {
  return type ? DONE_QUESTION[type] : "Done with this part?";
}

export function bookmarkPlaceholder(type: TaskType | undefined): string {
  return type ? BOOKMARK_PLACEHOLDER[type] : "Where you'll pick up";
}

// ---------- validation ----------

/** Trim; empty becomes undefined. */
export function cleanLine(s: string | undefined): string | undefined {
  const t = s?.trim();
  return t ? t : undefined;
}

const len = (s: string) => [...s.trim()].length;

/** A short human-readable reason the input is not acceptable, or null when it is fine. */
export function bigOneProblem(input: {
  title: string; firstMove?: string; bookmark?: string; pieces?: Piece[]; gutMin?: number;
}): string | null {
  const t = len(input.title);
  if (t < 1) return "Give it a name.";
  if (t > TITLE_MAX) return `Name it in ${TITLE_MAX} characters or fewer.`;
  if (input.firstMove !== undefined && len(input.firstMove) > LINE_MAX) return `Keep the first move to ${LINE_MAX} characters.`;
  if (input.bookmark !== undefined && len(input.bookmark) > LINE_MAX) return `Keep the bookmark to ${LINE_MAX} characters.`;
  if (input.gutMin !== undefined && !(GUT_SIZES as readonly number[]).includes(input.gutMin)) return "Pick one of the sizes offered.";
  if (input.pieces) {
    if (input.pieces.length > MAX_PIECES) return `Up to ${MAX_PIECES} pieces.`;
    for (const p of input.pieces) {
      const pt = len(p.title);
      if (pt < 1) return "Give each piece a name.";
      if (pt > TITLE_MAX) return `Name each piece in ${TITLE_MAX} characters or fewer.`;
      if (!Number.isInteger(p.minutes) || p.minutes < PIECE_MIN || p.minutes > PIECE_MAX) return `Each piece is ${PIECE_MIN} to ${PIECE_MAX} minutes.`;
    }
  }
  return null;
}

// ---------- open terms, progress, comeback, spread ----------

/** Minutes left of the gut estimate, never negative; null when there was no estimate. */
export function openTerms(gutMin: number | undefined, workedMin: number): number | null {
  if (gutMin === undefined) return null;
  return Math.max(0, gutMin - workedMin);
}

/** First payment is 15 min; after a gap always 15, otherwise the last focus length if it was set. */
export function firstPaymentMinutes(task: Pick<BigOne, "lastFocusMin">, comeback: boolean): number {
  if (comeback) return FIRST_PAYMENT_MIN;
  return task.lastFocusMin ?? FIRST_PAYMENT_MIN;
}

export type ProgressLabel = { kind: "stamped" | "toGo"; n: number } | { kind: "in" | "left"; minutes: number };

/**
 * Structured progress (the UI words it). With pieces: "stamped" while fewer than half are stamped, then "toGo".
 * Without pieces: "in" (minutes worked) while worked is under half the gut estimate, then "left".
 * Nothing stamped or worked: null.
 */
export function progressLabel(task: Pick<BigOne, "taskType" | "pieces" | "gutMin" | "workedMin">): ProgressLabel | null {
  const pieces = task.pieces;
  if (pieces && pieces.length > 0) {
    const stamped = pieces.filter((p) => p.stampedAt !== undefined).length;
    if (stamped === 0) return null;
    if (stamped * 2 < pieces.length) return { kind: "stamped", n: stamped };
    return { kind: "toGo", n: pieces.length - stamped };
  }
  if (task.taskType === "exam") return null; // no progress line until it is split into pieces
  if (task.workedMin <= 0) return null;
  if (task.gutMin !== undefined && task.workedMin * 2 >= task.gutMin) {
    return { kind: "left", minutes: Math.max(0, task.gutMin - task.workedMin) };
  }
  return { kind: "in", minutes: task.workedMin };
}

/** Open, worked before, and either a signed plan slipped past or two or more days passed with terms left. */
export function isComeback(
  task: Pick<BigOne, "status" | "openTermsMin" | "pieces" | "spreadSignedAt" | "workedDays">,
  todayKey: string,
): boolean {
  if (task.status !== "open" || task.workedDays.length === 0) return false;
  if (task.spreadSignedAt !== undefined) {
    const slipped = (task.pieces ?? []).some(
      (p) => p.stampedAt === undefined && p.plannedDay !== undefined && p.plannedDay < todayKey && !task.workedDays.includes(p.plannedDay),
    );
    if (slipped) return true;
  }
  return daysBetween(task.workedDays[0], todayKey) >= 2 && task.openTermsMin !== 0;
}

export interface SpreadDay { day: string; pieceIndex?: number; minutes: number }

/** A proposed plan from today to due: unstamped pieces spread evenly, or open terms split by day. */
export function proposeSpread(
  task: Pick<BigOne, "taskType" | "pieces" | "openTermsMin">,
  todayKey: string,
  dueKey: string,
): SpreadDay[] {
  const days = Math.max(1, daysBetween(todayKey, dueKey) + 1);
  const open = (task.pieces ?? []).map((p, i) => ({ p, i })).filter(({ p }) => p.stampedAt === undefined);
  if (open.length > 0) {
    // Piece k of n lands on day floor(k * span / n); span = min(days, n), so with 2+ days and 2+ pieces
    // (an exam included) at least two distinct days are used, and nothing lands past due.
    const span = Math.min(days, open.length);
    return open.map(({ p, i }, k) => ({
      day: addDays(todayKey, Math.floor((k * span) / open.length)),
      pieceIndex: i,
      minutes: p.minutes,
    }));
  }
  const total = task.openTermsMin ?? 0;
  if (total <= 0) return [];
  // Fewer, fuller days when open terms are small: no slice under PIECE_MIN (unless the whole is), so never a 0-minute day.
  const used = Math.max(1, Math.min(days, Math.floor(total / PIECE_MIN)));
  const each = Math.floor(total / used);
  const extra = total - each * used;
  return Array.from({ length: used }, (_, d) => ({ day: addDays(todayKey, d), minutes: each + (d === 0 ? extra : 0) }));
}

/** A signed plan never needs more rows than a year of days. */
export const SPREAD_MAX_DAYS = 366;

/** Why a signed spread can't be stored, or null. Days are real keys on or before due; piece indexes exist. */
export function spreadProblem(plan: SpreadDay[], pieceCount: number, dueKey: string): string | null {
  if (!isDayKey(dueKey)) return "Pick a due day.";
  if (plan.length > SPREAD_MAX_DAYS) return "That plan is too long.";
  for (const d of plan) {
    if (!isDayKey(d.day) || d.day > dueKey) return "Each day is on or before the due day.";
    if (d.pieceIndex !== undefined && (!Number.isInteger(d.pieceIndex) || d.pieceIndex < 0 || d.pieceIndex >= pieceCount)) {
      return "That piece isn't in the split.";
    }
    if (!Number.isFinite(d.minutes) || d.minutes < 0) return "Minutes can't be negative.";
  }
  return null;
}

export interface BigOneCard { title: string; startWith: string; progress: ProgressLabel | null; minutes: number; comeback: boolean; offerRespread: boolean }

/** A signed plan slipped: an unstamped piece's planned day is before today. A re-spread moves every day to today or later. */
function planSlipped(task: Pick<BigOne, "spreadSignedAt" | "pieces">, todayKey: string): boolean {
  return task.spreadSignedAt !== undefined
    && (task.pieces ?? []).some((p) => p.stampedAt === undefined && p.plannedDay !== undefined && p.plannedDay < todayKey);
}

export function cardFor(task: BigOne, todayKey: string): BigOneCard {
  const comeback = isComeback(task, todayKey);
  return {
    title: task.title,
    startWith: comeback ? firstMoveFor(task.taskType, true) : task.bookmark ?? task.firstMove,
    progress: progressLabel(task),
    minutes: firstPaymentMinutes(task, comeback),
    comeback,
    offerRespread: comeback && planSlipped(task, todayKey),
  };
}

export type CardInput = BigOne & { id: string; lastWorkedAt?: number };
export type BigOneCardRow = BigOneCard & { id: string; taskType?: TaskType; currentPiece?: string };

/** Cards for every open big one: comeback first, then most recently worked. The screen shows the first CARDS_SHOWN. */
export function cardsFor(tasks: CardInput[], todayKey: string): BigOneCardRow[] {
  return tasks
    .filter((t) => t.status === "open")
    .map((t) => {
      const current = t.pieces?.find((p) => p.stampedAt === undefined)?.title;
      return {
        row: {
          ...cardFor(t, todayKey),
          id: t.id,
          ...(t.taskType ? { taskType: t.taskType } : {}),
          ...(current !== undefined ? { currentPiece: current } : {}),
        },
        at: t.lastWorkedAt ?? 0,
      };
    })
    .sort((a, b) => Number(b.row.comeback) - Number(a.row.comeback) || b.at - a.at)
    .map((x) => x.row);
}

/** Newest first, no duplicates, only the most recent WORKED_DAYS_KEPT. */
export function addWorkedDay(days: string[], key: string): string[] {
  return [key, ...days.filter((d) => d !== key)].slice(0, WORKED_DAYS_KEPT);
}

// ---------- AI limits, scrubbing, weekly check-in ----------

export const AI_USER_DAILY = 10;
export const AI_GLOBAL_DAILY = 300;
export const AI_MAX_PIECES = 12;

export function aiAllowed(userToday: number, globalToday: number): boolean {
  return userToday < AI_USER_DAILY && globalToday < AI_GLOBAL_DAILY;
}

const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
const PHONE_RE = /(?<![\w])(?:\+?\d{1,2}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}(?![\w])/g;

/** Strip emails and phone numbers before any text leaves for the model. */
export function scrubForAI(text: string): string {
  return text.replace(EMAIL_RE, "").replace(PHONE_RE, "").replace(/ {2,}/g, " ").trim();
}

/** The Sunday on or before the day key. */
export function weekKey(todayKey: string): string {
  const [y, m, d] = todayKey.split("-").map(Number);
  return addDays(todayKey, -new Date(Date.UTC(y, m - 1, d)).getUTCDay());
}

export function shouldAskCheckIn(todayKey: string, lastAnsweredWeekKey: string | undefined): boolean {
  return lastAnsweredWeekKey === undefined || lastAnsweredWeekKey < weekKey(todayKey);
}
