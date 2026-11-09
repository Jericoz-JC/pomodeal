import { ConvexError, v } from "convex/values";
import { isDayKey, weekKey as weekOf } from "../packages/core/src";
import { mutation, query } from "./_generated/server";
import { currentMember, requireMember } from "./lib/members";

/** The newest week this member answered (a Sunday's day key), or null. The client asks core's shouldAskCheckIn with it. */
export const lastWeekKey = query({
  args: {},
  handler: async (ctx) => {
    const user = await currentMember(ctx);
    if (!user) return null;
    const last = await ctx.db
      .query("checkIns")
      .withIndex("by_userId_and_weekKey", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();
    return last ? last.weekKey : null;
  },
});

/** One answer per member per week: answering again in the same week replaces the answer, never adds a row. */
/** When this member joined (epoch ms), or null. The client turns it into a local day key for shouldAskCheckIn. */
export const joinedAt = query({
  args: {},
  handler: async (ctx) => {
    const user = await currentMember(ctx);
    return user ? user.joinedAt : null;
  },
});

export const answer = mutation({
  args: {
    weekKey: v.string(),
    answer: v.union(v.literal("better"), v.literal("same"), v.literal("worse")),
  },
  handler: async (ctx, args) => {
    const user = await requireMember(ctx);
    if (!isDayKey(args.weekKey) || weekOf(args.weekKey) !== args.weekKey) {
      throw new ConvexError({ code: "BAD_WEEK", message: "That isn't a week to answer for." });
    }
    const existing = await ctx.db
      .query("checkIns")
      .withIndex("by_userId_and_weekKey", (q) => q.eq("userId", user._id).eq("weekKey", args.weekKey))
      .first();
    if (existing) await ctx.db.patch(existing._id, { answer: args.answer, at: Date.now() });
    else await ctx.db.insert("checkIns", { userId: user._id, weekKey: args.weekKey, answer: args.answer, at: Date.now() });
  },
});
