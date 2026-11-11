// Spec 010 "Admin screen": how many people are joining and using Pomodeal, and the sign-up switch and limits.
// Admins only; identity comes from the token.
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/members";
import { getBetaSettings, memberCounts, putBetaSettings } from "./lib/signups";

const WEEK_MS = 7 * 86_400_000;
/** Function calls are the free plan's first limit; a Convex function can't read them, so the screen links here. */
const USAGE_URL = "https://dashboard.convex.dev/t/chris-jobi/settings/usage";

export const overview = query({
  // The client passes the time (rounded to the minute): queries shouldn't read the clock.
  args: { now: v.number() },
  handler: async (ctx, { now }) => {
    await requireAdmin(ctx);
    const s = await getBetaSettings(ctx);
    const { recent, total } = await memberCounts(ctx, s, now);
    // Counts read every row: fine for the beta; past a few thousand members use @convex-dev/aggregate.
    const sessions = await ctx.db.query("sessions").withIndex("by_createdAt", (q) => q.gte("createdAt", now - WEEK_MS)).collect();
    const waiting = (await ctx.db.query("waitlist").collect()).length;
    const ready = (await ctx.db.query("users").collect()).filter((u) => u.emailHash).length;
    return {
      signups: s.signups,
      memberCap: s.memberCap,
      dayLimit: s.dayLimit,
      paused: s.paused ?? null,
      members: total,
      newInDay: recent,
      activeInWeek: new Set(sessions.map((x) => x.userId)).size,
      waiting,
      readyForProduction: ready,
      usageUrl: USAGE_URL,
    };
  },
});

/** Open: clears any pause and starts a fresh 24-hour window. Invite-only: a manual pause. */
export const setSignups = mutation({
  args: { mode: v.union(v.literal("open"), v.literal("inviteOnly")) },
  returns: v.null(),
  handler: async (ctx, { mode }) => {
    await requireAdmin(ctx);
    const now = Date.now();
    if (mode === "open") {
      await putBetaSettings(ctx, { signups: "open", paused: undefined, windowStart: now });
    } else {
      const s = await getBetaSettings(ctx);
      const { recent } = await memberCounts(ctx, s, now);
      await putBetaSettings(ctx, { signups: "inviteOnly", paused: { at: now, reason: "manual", count: recent } });
    }
    return null;
  },
});

/** The member cap and the 24-hour limit. Never changes the mode. */
export const setLimits = mutation({
  args: { memberCap: v.number(), dayLimit: v.number() },
  returns: v.null(),
  handler: async (ctx, { memberCap, dayLimit }) => {
    await requireAdmin(ctx);
    for (const n of [memberCap, dayLimit]) {
      if (!Number.isInteger(n) || n < 1) throw new ConvexError({ code: "BAD_LIMIT", message: "Limits are whole numbers of at least 1." });
    }
    await putBetaSettings(ctx, { memberCap, dayLimit });
    return null;
  },
});
