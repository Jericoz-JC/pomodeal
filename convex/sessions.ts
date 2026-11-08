import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { advance, applyBonus, applyTerm, buildSession, endSession, makeOffer, type LedgerEntry } from "../packages/core/src";
import { currentMember, requireMember } from "./lib/members";

const DAY_MS = 24 * 60 * 60 * 1000;

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

export const current = query({
  args: {},
  handler: async (ctx) => {
    const user = await currentMember(ctx);
    if (!user) return null;
    return ctx.db
      .query("sessions")
      .withIndex("by_userId_and_status", (q) => q.eq("userId", user._id).eq("status", "running"))
      .first();
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

/** Quick Deal: ends any running session (forgiving its debt) and starts a new one. */
export const start = mutation({
  args: {
    deal: v.object({ activity: v.union(v.string(), v.null()), breakMin: v.number(), task: v.string(), focusMin: v.number() }),
  },
  handler: async (ctx, { deal }) => {
    const user = await requireMember(ctx);
    const now = Date.now();
    const prev = await running(ctx, user._id);
    if (prev) {
      const forgiven = endSession(prev.state, now);
      if (forgiven) await log(ctx, user._id, prev._id, forgiven);
      await ctx.db.patch(prev._id, { status: "ended" });
    }
    return ctx.db.insert("sessions", { userId: user._id, state: buildSession(deal, now), status: "running", createdAt: now });
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
    return session;
  },
});

/** Move to the next block. Idempotent: two open devices can both call it at a block's end, but only the
 *  first advance from `fromIdx` counts. */
export const next = mutation({
  args: { sessionId: v.id("sessions"), fromIdx: v.number() },
  handler: async (ctx, { sessionId, fromIdx }) => {
    const { s } = await ownSession(ctx, sessionId);
    if (s.state.idx !== fromIdx) return;
    await ctx.db.patch(sessionId, { state: advance(s.state, Date.now()) });
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

export const end = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const { user, s } = await ownSession(ctx, sessionId);
    const forgiven = endSession(s.state, Date.now());
    if (forgiven) await log(ctx, user._id, sessionId, forgiven);
    await ctx.db.patch(sessionId, { status: "ended" });
  },
});
