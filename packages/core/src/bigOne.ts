// Spec 008: big ones (multi-day tasks). Pure rules; no clock, no zone. Days are local "YYYY-MM-DD" keys.

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
      if (!Number.isFinite(p.minutes) || p.minutes < PIECE_MIN || p.minutes > PIECE_MAX) return `Each piece is ${PIECE_MIN} to ${PIECE_MAX} minutes.`;
    }
  }
  return null;
}
