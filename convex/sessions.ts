import { mutation, query } from "./_generated/server";
import { ConvexError, v, type Infer } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import {
  addWorkedDay, advance, applyBonus, applyTerm, buildSession, dealProblem, endSession, focusMinutesDone, makeOffer, openTerms,
  type LedgerEntry,
} from "../packages/core/src";
import { currentMember, requireMember } from "./lib/members";
import { checkDayKey, ownTask } from "./lib/tasks";

const DAY_MS = 24 * 60 * 60 * 1000;

export const quickDeal = v.object({ activity: v.union(v.string(), v.null()), breakMin: v.number(), task: v.string(), focusMin: v.number() });
export type QuickDealArgs = Infer<typeof quickDeal>;

async function running(ctx: MutationCtx, userId: Id<"users">): Promise<Doc<"sessions"> | null> {
  return ctx.db
    .query("sessions")
    .withIndex("by_userId_and_status", (q) => q.eq("userId", userId).eq("status", "running"))
    .first();
}

async function log(ctx: MutationCtx, userId: Id<"users">, sessionId: Id<"sessions">, e: LedgerEntry) {
  await ctx.db.insert("ledger", { userId, sessionId, ...e });
}

/** Loads a running session that belongs to the caller. */
async function ownSession(ctx: MutationCtx, sessionId: Id<"sessions">) {
  const user = await requireMember(ctx);
  const s = await ctx.db.get(sessionId);
  if (!s || s.userId !== user._id || s.status !== "running") throw new Error("No running session");
  return { user, s };
}

/**
 * Adds focus minutes to the big one a session works on (spec 008, "End of a focus block"): worked minutes,
 * open terms recomputed from the gut size, the local day, and when. Does nothing for a plain Quick Deal or
 * when the big one was deleted. `dayKey` is optional only for clients from before big ones.
 */
export async function creditTask(ctx: MutationCtx, session: Doc<"sessions">, minutes: number, dayKey: string | undefined): Promise<void> {
  if (!session.taskId || minutes <= 0) return;
  const task = await ctx.db.get(session.taskId);
  if (!task || task.userId !== session.userId) return;
  const workedMin = task.workedMin + minutes;
  await ctx.db.patch(task._id, {
    workedMin,
    openTermsMin: openTerms(task.gutMin, workedMin),
    workedDays: dayKey ? addWorkedDay(task.workedDays, dayKey) : task.workedDays,
    lastWorkedAt: Date.now(),
  });
}

/**
 * The one path every deal starts through (Quick Deal, a new big one, a card): ends any running session
 * (crediting its partial focus minutes and forgiving its debt) and starts the new one, linked to `taskId`.
 * The caller has already checked that `taskId` is the user's.
 */
export async function startSession(
  ctx: MutationCtx,
  user: Doc<"users">,
  deal: QuickDealArgs,
  now: number,
  taskId?: Id<"tasks">,
  dayKey?: string,
): Promise<Id<"sessions">> {
  const problem = dealProblem(deal);
  if (problem) throw new ConvexError({ code: "BAD_DEAL", message: problem });
  const prev = await running(ctx, user._id);
  if (prev) {
    await creditTask(ctx, prev, focusMinutesDone(prev.state, now), dayKey);
    const forgiven = endSession(prev.state, now);
    if (forgiven) await log(ctx, user._id, prev._id, forgiven);
    await ctx.db.patch(prev._id, { status: "ended" });
  }
  // The card button offers the length chosen last time. Ramp lengths (19, 23) aren't on offer, so this is
  // the deal's chosen length, not a block's.
  if (taskId) await ctx.db.patch(taskId, { lastFocusMin: deal.focusMin });
  return ctx.db.insert("sessions", {
    userId: user._id,
    state: buildSession(deal, now),
    status: "running",
    createdAt: now,
    ...(taskId ? { taskId } : {}),
  });
}

/** The running session, with the last repayment pick so the ask sheet can pre-select it (ADR 0005). */
export const current = query({
  args: {},
  handler: async (ctx) => {
    const user = await currentMember(ctx);
    if (!user) return null;
    const doc = await ctx.db
      .query("sessions")
      .withIndex("by_userId_and_status", (q) => q.eq("userId", user._id).eq("status", "running"))
      .first();
    return doc ? { ...doc, lastRepay: user.lastRepay ?? null } : null;
  },
});

export const today = query({
  args: { now: v.number() },
  handler: async (ctx, { now }) => {
    const user = await currentMember(ctx);
    if (!user) return [];
    return ctx.db
      .query("ledger")
      .withIndex("by_userId_and_at", (q) => q.eq("userId", user._id).gte("at", now - DAY_MS))
      .order("desc")
      .collect();
  },
});

/** Quick Deal: ends any running session (forgiving its debt) and starts a new one. Lengths must be on offer (spec 007).
 *  `serverNow` lets the client render time from the server's clock. */
export const start = mutation({
  args: { deal: quickDeal, taskId: v.optional(v.id("tasks")), dayKey: v.optional(v.string()) },
  handler: async (ctx, { deal, taskId, dayKey }) => {
    const user = await requireMember(ctx);
    checkDayKey(dayKey);
    if (taskId) await ownTask(ctx, user, taskId);
    const now = Date.now();
    const sessionId = await startSession(ctx, user, deal, now, taskId, dayKey);
    return { sessionId, serverNow: now };
  },
});

/** Ask for more time. `pick` is an index into the offer's terms, or "override". */
export const ask = mutation({
  args: { sessionId: v.id("sessions"), pick: v.union(v.number(), v.literal("override")), intention: v.optional(v.string()) },
  handler: async (ctx, { sessionId, pick, intention }) => {
    const { user, s } = await ownSession(ctx, sessionId);
    const offer = makeOffer(s.state);
    if (offer.requiresIntention && pick !== "override" && !intention?.trim()) throw new Error("This deal needs a first step");
    const term = pick === "override" ? offer.override : offer.terms[pick];
    if (!term) throw new Error("That deal isn't on offer");
    const { session, entry } = applyTerm(s.state, term, Date.now(), intention?.trim());
    await ctx.db.patch(sessionId, { state: session });
    await log(ctx, user._id, sessionId, entry);
    // ADR 0005: remember borrow or trade so the next ask pre-selects it. Freebies and overrides aren't a choice.
    if ((term.kind === "borrow" || term.kind === "trade") && user.lastRepay !== term.kind) {
      await ctx.db.patch(user._id, { lastRepay: term.kind });
    }
    return session;
  },
});

/** Move to the next block. Idempotent: two open devices can both call it at a block's end, but only the
 *  first advance from `fromIdx` counts. Leaving a focus block credits its minutes to the big one. */
export const next = mutation({
  args: { sessionId: v.id("sessions"), fromIdx: v.number(), dayKey: v.optional(v.string()) },
  handler: async (ctx, { sessionId, fromIdx, dayKey }) => {
    checkDayKey(dayKey);
    const { s } = await ownSession(ctx, sessionId);
    if (s.state.idx !== fromIdx) return;
    const now = Date.now();
    await creditTask(ctx, s, focusMinutesDone(s.state, now), dayKey);
    await ctx.db.patch(sessionId, { state: advance(s.state, now) });
  },
});

/** The clock's offer at the end of a focus block: keep going for 10 more, and the next break grows by 3. */
export const bonus = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const { user, s } = await ownSession(ctx, sessionId);
    if (s.state.blocks[s.state.idx].type !== "focus" || s.state.bonusOffered) return;
    const { session, entry } = applyBonus(s.state, Date.now());
    await ctx.db.patch(sessionId, { state: session });
    await log(ctx, user._id, sessionId, entry);
  },
});

/** Ends the session; minutes done in a focus block so far are credited to the big one. */
export const end = mutation({
  args: { sessionId: v.id("sessions"), dayKey: v.optional(v.string()) },
  handler: async (ctx, { sessionId, dayKey }) => {
    checkDayKey(dayKey);
    const { user, s } = await ownSession(ctx, sessionId);
    const now = Date.now();
    await creditTask(ctx, s, focusMinutesDone(s.state, now), dayKey);
    const forgiven = endSession(s.state, now);
    if (forgiven) await log(ctx, user._id, sessionId, forgiven);
    await ctx.db.patch(sessionId, { status: "ended" });
  },
});
