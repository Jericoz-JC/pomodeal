import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { advance, applyTerm, buildSession, endSession, makeOffer, type LedgerEntry } from "../packages/core/src";

const DAY_MS = 24 * 60 * 60 * 1000;

async function running(ctx: MutationCtx, deviceId: string): Promise<Doc<"sessions"> | null> {
  return ctx.db
    .query("sessions")
    .withIndex("by_device_status", (q) => q.eq("deviceId", deviceId).eq("status", "running"))
    .first();
}

async function log(ctx: MutationCtx, deviceId: string, sessionId: Id<"sessions">, e: LedgerEntry) {
  await ctx.db.insert("ledger", { deviceId, sessionId, ...e });
}

export const current = query({
  args: { deviceId: v.string() },
  handler: (ctx, { deviceId }) =>
    ctx.db
      .query("sessions")
      .withIndex("by_device_status", (q) => q.eq("deviceId", deviceId).eq("status", "running"))
      .first(),
});

export const today = query({
  args: { deviceId: v.string(), now: v.number() },
  handler: (ctx, { deviceId, now }) =>
    ctx.db
      .query("ledger")
      .withIndex("by_device_at", (q) => q.eq("deviceId", deviceId).gte("at", now - DAY_MS))
      .order("desc")
      .collect(),
});

/** Quick Deal: ends any running session (forgiving its debt) and starts a new one. */
export const start = mutation({
  args: {
    deviceId: v.string(),
    deal: v.object({ activity: v.union(v.string(), v.null()), breakMin: v.number(), task: v.string(), focusMin: v.number() }),
  },
  handler: async (ctx, { deviceId, deal }) => {
    const now = Date.now();
    const prev = await running(ctx, deviceId);
    if (prev) {
      const forgiven = endSession(prev.state, now);
      if (forgiven) await log(ctx, deviceId, prev._id, forgiven);
      await ctx.db.patch(prev._id, { status: "ended" });
    }
    return ctx.db.insert("sessions", { deviceId, state: buildSession(deal, now), status: "running", createdAt: now });
  },
});

/** Ask for more time. `pick` is an index into the offer's terms, or "override". */
export const ask = mutation({
  args: { sessionId: v.id("sessions"), pick: v.union(v.number(), v.literal("override")), intention: v.optional(v.string()) },
  handler: async (ctx, { sessionId, pick, intention }) => {
    const s = await ctx.db.get(sessionId);
    if (!s || s.status !== "running") throw new Error("No running session");
    const offer = makeOffer(s.state);
    if (offer.requiresIntention && pick !== "override" && !intention?.trim()) throw new Error("This deal needs a first step");
    const term = pick === "override" ? offer.override : offer.terms[pick];
    if (!term) throw new Error("That deal isn't on offer");
    const { session, entry } = applyTerm(s.state, term, Date.now(), intention?.trim());
    await ctx.db.patch(sessionId, { state: session });
    await log(ctx, s.deviceId, sessionId, entry);
    return session;
  },
});

export const next = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const s = await ctx.db.get(sessionId);
    if (!s || s.status !== "running") throw new Error("No running session");
    await ctx.db.patch(sessionId, { state: advance(s.state, Date.now()) });
  },
});

export const end = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const s = await ctx.db.get(sessionId);
    if (!s || s.status !== "running") return;
    const forgiven = endSession(s.state, Date.now());
    if (forgiven) await log(ctx, s.deviceId, sessionId, forgiven);
    await ctx.db.patch(sessionId, { status: "ended" });
  },
});
