import { mutation, query } from "./_generated/server";
import { ConvexError, v, type Infer } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
  addWorkedDay, advance, applyBonus, applyTerm, buildSession, canOfferBonus, dealEntry, dealProblem, endEntry, endSession, focusMinutesDone,
  makeOffer, openTerms, repayDebt, skipEntry, type LedgerEntry,
} from "../packages/core/src";
import { currentMember, requireMember } from "./lib/members";
import { cancelPushes, reschedule } from "./lib/pushSchedule";
import { checkDayKey, ownTask } from "./lib/tasks";

const DAY_MS = 24 * 60 * 60 * 1000;
/** A day of deals is a few dozen rows; this only bounds the read. */
const TAPE_MAX = 200;

export const quickDeal = v.object({ activity: v.union(v.string(), v.null()), breakMin: v.number(), task: v.string(), focusMin: v.number() });
export type QuickDealArgs = Infer<typeof quickDeal>;

async function running(ctx: QueryCtx | MutationCtx, userId: Id<"users">): Promise<Doc<"sessions"> | null> {
  return ctx.db
    .query("sessions")
    .withIndex("by_userId_and_status", (q) => q.eq("userId", userId).eq("status", "running"))
    .first();
}

type Owned = Pick<Doc<"sessions">, "userId" | "taskId">;

/** Files a ledger row for a session; a row on a big one's session is linked to it. */
async function log(ctx: MutationCtx, s: Owned & { _id: Id<"sessions"> }, e: LedgerEntry) {
  await ctx.db.insert("ledger", { userId: s.userId, sessionId: s._id, ...e, ...(s.taskId ? { taskId: s.taskId } : {}) });
}

/** The big one's title, so a deal or a stop on it says which big one it was. Undefined for a Quick Deal or a deleted big one. */
async function bigOneTitle(ctx: MutationCtx, s: Owned): Promise<string | undefined> {
  if (!s.taskId) return undefined;
  const task = await ctx.db.get(s.taskId);
  return task && task.userId === s.userId ? task.title : undefined;
}

type SessionState = Doc<"sessions">["state"];

/**
 * The one place a session's state is written after it starts. Every change bumps `version` (stale scheduled
 * pushes check it) and keeps the scheduled ids, whatever the core rules returned. The pushes follow the write:
 * a running session gets its current block's heads-up and end rescheduled; an ended one, or a write with
 * `schedule: false`, has them cancelled and none scheduled.
 */
async function saveState(
  ctx: MutationCtx,
  s: Doc<"sessions">,
  state: SessionState,
  status?: "ended",
  { schedule = true }: { schedule?: boolean } = {},
) {
  const next: SessionState = {
    ...state,
    version: (s.state.version ?? 0) + 1,
    ...(s.state.scheduledIds ? { scheduledIds: s.state.scheduledIds } : {}),
  };
  if (status) await ctx.db.patch(s._id, { status });
  if (status || !schedule) {
    await cancelPushes(ctx, s._id, next); // writes `next`
  } else {
    await reschedule(ctx, s._id, next, Date.now()); // writes `next` with the new ids
  }
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
 * Stops a running session: "Done for now", "Stop for now", or a new deal replacing it. Credits the running focus
 * block's minutes to the big one, files `done` (it ran its full time, spec 010) or `end_early`, files `forgiven` for
 * borrowed minutes still owed (`owed`: what the next deal's break couldn't take), and ends it.
 */
async function stop(ctx: MutationCtx, s: Doc<"sessions">, now: number, dayKey: string | undefined, owed = s.state.debt) {
  await creditTask(ctx, s, focusMinutesDone(s.state, now), dayKey);
  await log(ctx, s, endEntry(s.state, now, await bigOneTitle(ctx, s)));
  const forgiven = endSession({ ...s.state, debt: owed }, now);
  if (forgiven) await log(ctx, s, forgiven);
  await saveState(ctx, s, s.state, "ended");
}

/**
 * The one path every deal starts through (Quick Deal, the next round, a new big one, a card): stops any running
 * session (see `stop`), takes its borrowed minutes off this deal's break (spec 010), starts the new one, linked to
 * `taskId`, and files the deal itself on the ledger. The caller has already checked that `taskId` is the user's.
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
  const repay = repayDebt(deal, prev ? prev.state.debt : 0);
  if (prev) await stop(ctx, prev, now, dayKey, repay.forgiven);
  // The card button offers the length chosen last time: the deal's chosen length, not a block's.
  if (taskId) await ctx.db.patch(taskId, { lastFocusMin: deal.focusMin });
  const state: SessionState = { ...buildSession(repay.deal, now), version: 1 };
  const sessionId = await ctx.db.insert("sessions", {
    userId: user._id,
    state,
    status: "running",
    createdAt: now,
    ...(taskId ? { taskId } : {}),
  });
  const session = { _id: sessionId, userId: user._id, taskId };
  await log(ctx, session, dealEntry(state, now, await bigOneTitle(ctx, session)));
  await reschedule(ctx, sessionId, state, now);
  return sessionId;
}

/** The running session, with the last repayment pick so the ask sheet can pre-select it (ADR 0005). */
export const current = query({
  args: {},
  handler: async (ctx) => {
    const user = await currentMember(ctx);
    if (!user) return null;
    const doc = await running(ctx, user._id);
    return doc ? { ...doc, lastRepay: user.lastRepay ?? null } : null;
  },
});

/** The tape: the newest rows from the 24 hours before `now` (the client moves `now` forward, see apps/web/src/main.ts). */
export const today = query({
  args: { now: v.number() },
  handler: async (ctx, { now }) => {
    const user = await currentMember(ctx);
    if (!user) return [];
    return ctx.db
      .query("ledger")
      .withIndex("by_userId_and_at", (q) => q.eq("userId", user._id).gte("at", now - DAY_MS))
      .order("desc")
      .take(TAPE_MAX);
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
    await saveState(ctx, s, session);
    await log(ctx, s, entry);
    // ADR 0005: remember borrow or trade so the next ask pre-selects it. Freebies and overrides aren't a choice.
    if ((term.kind === "borrow" || term.kind === "trade") && user.lastRepay !== term.kind) {
      await ctx.db.patch(user._id, { lastRepay: term.kind });
    }
    return session;
  },
});

/** Move to the next block. Idempotent: two open devices can both call it at a block's end, but only the
 *  first advance from `fromIdx` counts. Leaving a focus block credits its minutes to the big one.
 *  `early` means the student ended the block before its time ("Start reading early"): that files a `skip`, unless
 *  the block's time is already up by the server's clock. Ordinary block ends leave it off.
 *  The last block has no next: it ends the deal, which stops through `end` or the next deal (spec 010). */
export const next = mutation({
  args: { sessionId: v.id("sessions"), fromIdx: v.number(), dayKey: v.optional(v.string()), early: v.optional(v.boolean()) },
  handler: async (ctx, { sessionId, fromIdx, dayKey, early }) => {
    checkDayKey(dayKey);
    const { s } = await ownSession(ctx, sessionId);
    if (s.state.idx !== fromIdx || s.state.idx >= s.state.blocks.length - 1) return;
    const now = Date.now();
    const skip = early ? skipEntry(s.state, now) : null;
    if (skip) await log(ctx, s, skip);
    await creditTask(ctx, s, focusMinutesDone(s.state, now), dayKey);
    await saveState(ctx, s, advance(s.state, now));
  },
});

/** The clock's offer at the end of a focus block: keep going for 10 more (on the done sheet, spec 010); a next
 *  break, in an older session, grows by 3. Once per block, never past the 75 min ceiling. */
export const bonus = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const { s } = await ownSession(ctx, sessionId);
    if (!canOfferBonus(s.state, false)) return;
    const { session, entry } = applyBonus(s.state, Date.now());
    await saveState(ctx, s, session);
    await log(ctx, s, entry);
  },
});

/** "Stop for now" (see `stop`). Only a running session stops, so a second device's call throws and files nothing. */
export const end = mutation({
  args: { sessionId: v.id("sessions"), dayKey: v.optional(v.string()) },
  handler: async (ctx, { sessionId, dayKey }) => {
    checkDayKey(dayKey);
    const { s } = await ownSession(ctx, sessionId);
    await stop(ctx, s, Date.now(), dayKey);
  },
});

/** The server's clock, so a device that didn't start the session can still render time from it. */
export const serverNow = mutation({
  args: {},
  handler: async (ctx) => {
    await requireMember(ctx);
    return Date.now();
  },
});
