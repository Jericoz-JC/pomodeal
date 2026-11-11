// Spec 012 "Tonight in a line", built for real: tonight's plan is one row per member per local day. Every sitting
// starts through sessions.start or tasks.startFromCard with `fromNight`, which takes it in the same transaction.
import { ConvexError, v } from "convex/values";
import { nightProblem, sittingsOf } from "../packages/core/src";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import { logEvent } from "./lib/events";
import { nightOf, sittingCount } from "./lib/nights";
import { currentMember, requireMember } from "./lib/members";
import { checkDayKey, ownTask } from "./lib/tasks";
import schema, { nightItem } from "./schema";

const DAY_MS = 86_400_000;
/** Spec 012 section 7: a night is deleted once its day is more than 2 days old. */
const NIGHT_DAYS_KEPT = 2;
const SWEEP_BATCH = 500;
const utcKey = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** The done sittings, as titles and lengths, so a reprint can tell they're still the same. */
const doneOf = (items: { title: string; sittings: number; minutes: number }[], taken: number) =>
  sittingsOf(items).slice(0, taken).map((s) => `${s.minutes}:${s.title}`).join("\n");

/**
 * Prints tonight: replaces the day's night with `items`, nothing taken yet. With `keepTaken` (a reorder of what is
 * left, from the roll) the sittings already taken stay taken; they must still lead the night unchanged, or someone
 * changed it on another device first.
 */
export const print = mutation({
  args: { dayKey: v.string(), items: v.array(nightItem), keepTaken: v.optional(v.boolean()) },
  returns: v.null(),
  handler: async (ctx, { dayKey, items, keepTaken }) => {
    const user = await requireMember(ctx);
    checkDayKey(dayKey);
    const problem = nightProblem({ items });
    if (problem) throw new ConvexError({ code: "BAD_NIGHT", message: problem });
    for (const it of items) if (it.taskId) await ownTask(ctx, user, it.taskId);
    const old = await nightOf(ctx, user._id, dayKey);
    let taken = 0;
    if (keepTaken && old) {
      taken = Math.min(old.taken, sittingCount(items));
      if (doneOf(items, taken) !== doneOf(old.items, taken)) {
        throw new ConvexError({ code: "NIGHT_CHANGED", message: "Tonight changed on another device." });
      }
    }
    const row = { userId: user._id, dayKey, items, taken, printedAt: Date.now() };
    if (old) await ctx.db.replace("nights", old._id, row);
    else await ctx.db.insert("nights", row);
    if (!keepTaken) await logEvent(ctx, user._id, "night_printed", { count: items.length });
    return null;
  },
});

/** The caller's night for a local day, or null. */
export const tonight = query({
  args: { dayKey: v.string() },
  returns: v.union(schema.doc("nights"), v.null()),
  handler: async (ctx, { dayKey }) => {
    const user = await currentMember(ctx);
    if (!user) return null;
    checkDayKey(dayKey);
    return await nightOf(ctx, user._id, dayKey);
  },
});

/** Daily: deletes nights whose day is more than 2 days old. */
export const sweep = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const old = await ctx.db
      .query("nights")
      .withIndex("by_dayKey", (q) => q.lt("dayKey", utcKey(Date.now() - NIGHT_DAYS_KEPT * DAY_MS)))
      .take(SWEEP_BATCH);
    for (const n of old) await ctx.db.delete(n._id);
    if (old.length === SWEEP_BATCH) await ctx.scheduler.runAfter(0, internal.nights.sweep, {});
    return null;
  },
});
