// Spec 008: big ones. A big one is worked through ordinary Quick Deal sessions linked by `sessions.taskId`;
// the rules (validation, open terms, worked days) live in packages/core.
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { bigOneProblem, cleanLine, dealProblem, isDayKey, openTerms, spreadProblem, type Piece } from "../packages/core/src";
import { logEvent } from "./lib/events";
import { currentMember, requireMember } from "./lib/members";
import { clearSuggestions } from "./lib/suggestions";
import { badBigOne, checkDayKey, ownTask } from "./lib/tasks";
import { piece, taskType } from "./schema";
import { quickDeal, startSession } from "./sessions";

const spreadDay = v.object({ day: v.string(), pieceIndex: v.optional(v.number()), minutes: v.number() });

/** Most recently touched first: last worked, or named if never worked. */
const byRecent = (a: Doc<"tasks">, b: Doc<"tasks">) => (b.lastWorkedAt ?? b.createdAt) - (a.lastWorkedAt ?? a.createdAt);

/** A piece without its planned day (undefined fields are left out, not stored). */
function unplanned({ plannedDay: _, ...rest }: Piece): Piece {
  return rest;
}

// ---------- queries ----------

/** Open big ones for the cards, most recently worked first. */
export const open = query({
  args: {},
  handler: async (ctx) => {
    const user = await currentMember(ctx);
    if (!user) return [];
    const rows = await ctx.db
      .query("tasks")
      .withIndex("by_userId_and_status", (q) => q.eq("userId", user._id).eq("status", "open"))
      .order("desc")
      .take(50);
    return rows.sort(byRecent);
  },
});

/** "All big ones": open and set aside. Done ones drop out. */
export const all = query({
  args: {},
  handler: async (ctx) => {
    const user = await currentMember(ctx);
    if (!user) return [];
    const of = (status: "open" | "set_aside") =>
      ctx.db
        .query("tasks")
        .withIndex("by_userId_and_status", (q) => q.eq("userId", user._id).eq("status", status))
        .order("desc")
        .take(100);
    const [opened, aside] = await Promise.all([of("open"), of("set_aside")]);
    return [...opened, ...aside].sort(byRecent).slice(0, 100);
  },
});

/** Task-scoped history: the newest 50 sessions on this big one. */
export const history = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, { taskId }) => {
    const user = await requireMember(ctx);
    await ownTask(ctx, user, taskId);
    return ctx.db
      .query("sessions")
      .withIndex("by_taskId", (q) => q.eq("taskId", taskId))
      .order("desc")
      .take(50);
  },
});

// ---------- starting ----------

/** Day 1: name it and pay the first block. No planning screen comes before this. */
export const create = mutation({
  args: {
    title: v.string(),
    taskType: v.optional(taskType),
    gutMin: v.optional(v.number()),
    firstMove: v.string(),
    deal: quickDeal,
    dayKey: v.string(),
    namedAt: v.optional(v.number()), // client time (plus clock offset) when the student first tapped "Bigger than one block?"
  },
  handler: async (ctx, { title, taskType, gutMin, firstMove, deal, dayKey, namedAt }) => {
    const user = await requireMember(ctx);
    checkDayKey(dayKey);
    const problem = bigOneProblem({ title, firstMove, gutMin });
    if (problem) badBigOne(problem);
    const dp = dealProblem(deal);
    if (dp) throw new ConvexError({ code: "BAD_DEAL", message: dp });
    const now = Date.now();
    const taskId = await ctx.db.insert("tasks", {
      userId: user._id,
      title: title.trim(),
      ...(taskType ? { taskType } : {}),
      ...(gutMin !== undefined ? { gutMin } : {}),
      workedMin: 0,
      openTermsMin: openTerms(gutMin, 0),
      firstMove: firstMove.trim(),
      aiSuggested: false,
      status: "open",
      workedDays: [],
      createdAt: now,
    });
    await logEvent(ctx, user._id, "big_one_named", { taskId });
    const sessionId = await startSession(ctx, user, deal, now, taskId, dayKey);
    await logEvent(ctx, user._id, "first_payment_started", { taskId, ...(namedAt !== undefined ? { ms: Math.max(0, now - namedAt) } : {}) });
    return { taskId, sessionId, serverNow: now };
  },
});

/** Day 2 and later: the card's one button. Starting a set-aside or done big one opens it again. */
export const startFromCard = mutation({
  args: { taskId: v.id("tasks"), deal: quickDeal, dayKey: v.string() },
  handler: async (ctx, { taskId, deal, dayKey }) => {
    const user = await requireMember(ctx);
    checkDayKey(dayKey);
    const task = await ownTask(ctx, user, taskId);
    if (task.status !== "open") await ctx.db.patch(taskId, { status: "open" });
    const now = Date.now();
    const sessionId = await startSession(ctx, user, deal, now, taskId, dayKey);
    return { sessionId, serverNow: now };
  },
});

// ---------- end of a focus block ----------

/**
 * The stamp screen's two prompts (bookmark, done). Idempotent per (sessionId, fromIdx): two devices or a
 * retry can both send it, and only the first counts. Minutes are credited by sessions.next/end, not here.
 * `dayKey` is accepted for the client contract; nothing here is day-scoped.
 */
export const blockNotes = mutation({
  args: { sessionId: v.id("sessions"), fromIdx: v.number(), bookmark: v.optional(v.string()), done: v.boolean(), dayKey: v.string() },
  handler: async (ctx, { sessionId, fromIdx, bookmark, done, dayKey }) => {
    const user = await requireMember(ctx);
    checkDayKey(dayKey);
    const s = await ctx.db.get(sessionId);
    if (!s || s.userId !== user._id) throw new ConvexError({ code: "NOT_FOUND", message: "That session isn't here." });
    if (!Number.isInteger(fromIdx) || s.state.blocks[fromIdx]?.type !== "focus") {
      throw new ConvexError({ code: "BAD_BLOCK", message: "Notes are for a focus block." });
    }
    if (s.notedIdx !== undefined && s.notedIdx >= fromIdx) return;
    await ctx.db.patch(sessionId, { notedIdx: fromIdx });

    const task = s.taskId ? await ctx.db.get(s.taskId) : null;
    if (!task || task.userId !== user._id) return; // deleted big one: the session is ordinary history now

    const line = cleanLine(bookmark); // skipped or blank keeps the old bookmark
    if (line !== undefined) {
      const problem = bigOneProblem({ title: task.title, bookmark: line });
      if (problem) badBigOne(problem);
    }
    const patch: Partial<Doc<"tasks">> = {};
    if (line !== undefined) patch.bookmark = line;
    if (done) {
      const i = (task.pieces ?? []).findIndex((p) => p.stampedAt === undefined);
      if (task.pieces && i >= 0) patch.pieces = task.pieces.map((p, k) => (k === i ? { ...p, stampedAt: Date.now() } : p));
      else patch.status = "done";
    }
    if (Object.keys(patch).length > 0) await ctx.db.patch(task._id, patch);
    if (line !== undefined) await logEvent(ctx, user._id, "bookmark_written", { taskId: task._id });
  },
});

// ---------- planning on the card ----------

/** Stores the pieces. The gut size is kept, never overwritten. Any suggestion for this big one is done with once the student saves (spec 008); with
 *  `fromSuggestion` the saved pieces started as one, so the big one is marked aiSuggested and ai_accepted is logged. */
export const saveSplit = mutation({
  args: { taskId: v.id("tasks"), pieces: v.array(piece), fromSuggestion: v.optional(v.boolean()) },
  handler: async (ctx, { taskId, pieces, fromSuggestion }) => {
    const user = await requireMember(ctx);
    const task = await ownTask(ctx, user, taskId);
    const problem = bigOneProblem({ title: task.title, pieces });
    if (problem) badBigOne(problem);
    if (pieces.some((p) => p.plannedDay !== undefined && !isDayKey(p.plannedDay))) badBigOne("That isn't a day.");
    await ctx.db.patch(taskId, { pieces: pieces.map((p) => ({ ...p, title: p.title.trim() })), ...(fromSuggestion ? { aiSuggested: true } : {}) });
    await clearSuggestions(ctx, taskId);
    await logEvent(ctx, user._id, "split_saved", { taskId });
    if (fromSuggestion) await logEvent(ctx, user._id, "ai_accepted", { taskId });
  },
});

/** The student signs a spread. Pieces in the plan get its day; pieces left out lose any old one.
 *  Open-terms slices (no pieceIndex) are not stored: only pieces carry planned days. */
export const signSpread = mutation({
  args: { taskId: v.id("tasks"), dueDay: v.string(), plan: v.array(spreadDay) },
  handler: async (ctx, { taskId, dueDay, plan }) => {
    const user = await requireMember(ctx);
    const task = await ownTask(ctx, user, taskId);
    const problem = spreadProblem(plan, task.pieces?.length ?? 0, dueDay);
    if (problem) throw new ConvexError({ code: "BAD_SPREAD", message: problem });
    const dayOf = new Map(plan.flatMap((d) => (d.pieceIndex !== undefined ? [[d.pieceIndex, d.day] as const] : [])));
    const pieces = task.pieces?.map((p, i) => {
      const day = dayOf.get(i);
      return day ? { ...unplanned(p), plannedDay: day } : unplanned(p);
    });
    await ctx.db.patch(taskId, { dueDay, spreadSignedAt: Date.now(), ...(pieces ? { pieces } : {}) });
    await logEvent(ctx, user._id, "spread_signed", { taskId });
  },
});

// ---------- the card's menu ----------

/**
 * "Start fresh on this one": clears open terms, bookmark and spread; pieces stay, stamps stay.
 * Open terms are cleared by dropping the gut size, so no number comes back as minutes are added and the
 * progress line stops counting down ("about … left") from it.
 */
export const startFresh = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, { taskId }) => {
    const user = await requireMember(ctx);
    const task = await ownTask(ctx, user, taskId);
    await ctx.db.patch(taskId, {
      gutMin: undefined,
      openTermsMin: null,
      bookmark: undefined,
      dueDay: undefined,
      spreadSignedAt: undefined,
      ...(task.pieces ? { pieces: task.pieces.map(unplanned) } : {}),
    });
  },
});

/** Moves it out of the cards without deleting it. */
export const setAside = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, { taskId }) => {
    const user = await requireMember(ctx);
    await ownTask(ctx, user, taskId);
    await ctx.db.patch(taskId, { status: "set_aside" });
  },
});

export const reopen = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, { taskId }) => {
    const user = await requireMember(ctx);
    await ownTask(ctx, user, taskId);
    await ctx.db.patch(taskId, { status: "open" });
  },
});

/** Deletes the big one and unlinks its sessions; they (and a running one) stay as ordinary history. */
export const remove = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, { taskId }) => {
    const user = await requireMember(ctx);
    await ownTask(ctx, user, taskId);
    for await (const s of ctx.db.query("sessions").withIndex("by_taskId", (q) => q.eq("taskId", taskId))) {
      await ctx.db.patch(s._id, { taskId: undefined });
    }
    await clearSuggestions(ctx, taskId);
    await ctx.db.delete(taskId);
  },
});
