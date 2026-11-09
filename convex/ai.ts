// Spec 008 "Optional AI: Suggest pieces". Only the Split sheet asks; the app is complete with it off.
// requestSuggestion checks the switch and the limits, writes a pending row and schedules aiNode.suggestPieces,
// which calls the model and hands its output to writeSuggestion. The sheet subscribes to the row.
// Nothing here stores pieces on the big one: only what the student saves (tasks.saveSplit) is kept.
import { ConvexError, v } from "convex/values";
import { aiAllowed, bigOneProblem, cleanSuggestion, daysBetween, scrubForAI } from "../packages/core/src";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import { logEvent } from "./lib/events";
import { currentMember, requireMember } from "./lib/members";
import { aiEnabled, clearSuggestions } from "./lib/suggestions";
import { badBigOne, checkDayKey, ownTask } from "./lib/tasks";

const DAY_MS = 86_400_000;
/** Bounded read for the global cap: one row per member per day, so far more than a beta's members. */
const USAGE_ROWS_READ = 1000;
/** Usage days kept after they end (only the limits read them), and suggestion rows' lifetime. */
const USAGE_DAYS_KEPT = 2;
const SUGGESTION_TTL_MS = DAY_MS;
const SWEEP_BATCH = 500;

const utcKey = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Whether the Split sheet shows "Suggest pieces". Reads only the deployment's env, never the user's data. */
export const enabled = query({
  args: {},
  returns: v.boolean(),
  handler: async () => aiEnabled(),
});

/**
 * Asks for pieces for one big one. What is sent is built here from the stored big one, exactly as the disclosure says:
 * its title with emails and phone numbers stripped (scrubForAI), its type and its gut size. Nothing the client types,
 * and nothing else (R69, R70c).
 * `dayKey` is the client's local day; it must be within a day of the server's, so rotating keys can't reset the limit.
 * Refusals are values, not errors: "off" hides the button, "limit" shows the failure line.
 */
export const requestSuggestion = mutation({
  args: { taskId: v.id("tasks"), dayKey: v.string() },
  returns: v.union(v.id("pieceSuggestions"), v.object({ refused: v.union(v.literal("limit"), v.literal("off")) })),
  handler: async (ctx, { taskId, dayKey }) => {
    const user = await requireMember(ctx);
    const task = await ownTask(ctx, user, taskId);
    checkDayKey(dayKey);
    const now = Date.now();
    if (Math.abs(daysBetween(utcKey(now), dayKey)) > 1) throw new ConvexError({ code: "BAD_DAY", message: "That isn't today." });
    if (!aiEnabled()) return { refused: "off" as const };

    const clean = scrubForAI(task.title);
    const problem = bigOneProblem({ title: clean });
    if (problem) badBigOne(problem);

    const mine = await ctx.db
      .query("aiUsage")
      .withIndex("by_userId_and_dayKey", (q) => q.eq("userId", user._id).eq("dayKey", dayKey))
      .unique();
    const day = await ctx.db.query("aiUsage").withIndex("by_dayKey", (q) => q.eq("dayKey", dayKey)).take(USAGE_ROWS_READ);
    const everyone = day.reduce((sum, r) => sum + r.count, 0);
    if (!aiAllowed(mine?.count ?? 0, everyone)) return { refused: "limit" as const };

    if (mine) await ctx.db.patch(mine._id, { count: mine.count + 1 });
    else await ctx.db.insert("aiUsage", { userId: user._id, dayKey, count: 1 });

    await clearSuggestions(ctx, taskId); // one live suggestion per big one
    const suggestionId = await ctx.db.insert("pieceSuggestions", { userId: user._id, taskId, status: "pending", createdAt: now });
    // Exactly what the disclosure says: title, type, size. Nothing else: never the bookmark, due day or other big ones.
    await ctx.scheduler.runAfter(0, internal.aiNode.suggestPieces, {
      suggestionId,
      title: clean,
      ...(task.taskType ? { taskType: task.taskType } : {}),
      ...(task.gutMin !== undefined ? { gutMin: task.gutMin } : {}),
    });
    await logEvent(ctx, user._id, "ai_requested", { taskId });
    return suggestionId;
  },
});

/** The sheet's subscription. Null when it is gone (saved, dismissed, swept) or not the caller's. */
export const suggestion = query({
  args: { suggestionId: v.id("pieceSuggestions") },
  returns: v.union(
    v.null(),
    v.object({
      status: v.union(v.literal("pending"), v.literal("ready"), v.literal("failed")),
      pieces: v.optional(v.array(v.object({ title: v.string(), minutes: v.number() }))),
    }),
  ),
  handler: async (ctx, { suggestionId }) => {
    const user = await currentMember(ctx);
    const row = await ctx.db.get(suggestionId);
    if (!user || !row || row.userId !== user._id) return null;
    return { status: row.status, ...(row.pieces ? { pieces: row.pieces } : {}) };
  },
});

/** The sheet closed without saving, or the student put their own slots back. */
export const dismissSuggestion = mutation({
  args: { suggestionId: v.id("pieceSuggestions") },
  returns: v.null(),
  handler: async (ctx, { suggestionId }) => {
    const user = await requireMember(ctx);
    const row = await ctx.db.get(suggestionId);
    if (row && row.userId === user._id) await ctx.db.delete(suggestionId);
    return null;
  },
});

/**
 * The action's result. `raw` is the model's parsed JSON (or null when it failed); core's cleanSuggestion keeps at
 * most 12 named pieces with minutes in 5..240. Nothing usable is a failure. A row dismissed meanwhile stays gone.
 */
export const writeSuggestion = internalMutation({
  args: { suggestionId: v.id("pieceSuggestions"), raw: v.any() },
  returns: v.null(),
  handler: async (ctx, { suggestionId, raw }) => {
    const row = await ctx.db.get(suggestionId);
    if (!row) return null;
    const pieces = cleanSuggestion(raw);
    await ctx.db.patch(suggestionId, pieces.length ? { status: "ready", pieces } : { status: "failed", pieces: undefined });
    return null;
  },
});

/** Daily (crons.ts): suggestion rows older than 24 h, and usage days the limits no longer read. */
export const sweepSuggestions = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();
    const old = await ctx.db
      .query("pieceSuggestions")
      .withIndex("by_createdAt", (q) => q.lt("createdAt", now - SUGGESTION_TTL_MS))
      .take(SWEEP_BATCH);
    for (const r of old) await ctx.db.delete(r._id);
    const oldDays = await ctx.db
      .query("aiUsage")
      .withIndex("by_dayKey", (q) => q.lt("dayKey", utcKey(now - USAGE_DAYS_KEPT * DAY_MS)))
      .take(SWEEP_BATCH);
    for (const r of oldDays) await ctx.db.delete(r._id);
    if (old.length === SWEEP_BATCH || oldDays.length === SWEEP_BATCH) await ctx.scheduler.runAfter(0, internal.ai.sweepSuggestions, {});
    return null;
  },
});
