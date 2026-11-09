import { v } from "convex/values";
import { internalQuery, type QueryCtx } from "./_generated/server";
import type { EventKind } from "./lib/events";

const CAP = 5000; // rows read per kind; a beta of 8 to 15 friends stays far under it
const TWO_MIN_MS = 120_000;
const DAY_MS = 86_400_000;

/** Whole-number percentage, or null when there is nothing to divide by (never NaN). */
const pct = (num: number, den: number): number | null => (den === 0 ? null : Math.round((num / den) * 100));

/** Events of one kind in [fromAt, toAt). */
function eventsOf(ctx: QueryCtx, kind: EventKind, fromAt: number, toAt: number) {
  return ctx.db
    .query("events")
    .withIndex("by_kind_and_at", (q) => q.eq("kind", kind).gte("at", fromAt).lt("at", toAt))
    .take(CAP);
}

/**
 * The beta's success numbers (spec 008, "What success looks like"), over [fromAt, toAt) in epoch ms.
 * Internal: run it from the Convex dashboard (Functions, metrics:beta, Run function) with
 * {"fromAt": <ms>, "toAt": <ms>}. A query never reads the clock, so the window is an argument.
 *
 * Definitions (each percentage is a whole number, or null when its denominator is 0):
 * - firstPaymentWithin2MinPct: big_one_named events whose big one has a first_payment_started with ms < 120000, over
 *   big_one_named events. Big ones with an ai_accepted event are left out of both ("without AI"). An event with no
 *   taskId can't be matched to AI use and is kept.
 * - secondDayPct: from tasks created in the window, at least a day before toAt, that either are still open or were
 *   worked on 2+ days (so a big one finished or set aside on day one is not a miss): the share with
 *   workedDays.length >= 2. Read from tasks.workedDays, the newest 30 local days, not from events.
 * - comebackStartedPct: comeback_started over comeback_shown events (counts, not distinct cards).
 * - checkIns: answers whose `at` falls in the window, by answer.
 * Context only. "Active members" are the distinct members with any event in the window except push_sent and
 * push_failed (those are the server's, not the member's):
 * - installRate: members with install_done, over active members.
 * - pushEnabledRate: members with push_enabled, over active members.
 * - bookmarkRate: members with bookmark_written, over active members.
 * - aiAcceptRate: ai_accepted over ai_requested events.
 * Gut-vs-actual minutes per type is not computed here (it needs task rows by type; read them from the tasks table).
 */
export const beta = internalQuery({
  args: { fromAt: v.number(), toAt: v.number() },
  handler: async (ctx, { fromAt, toAt }) => {
    const [named, firstPay, shown, started, bookmark, aiAsked, aiAccepted, installed, pushed, split, spread] = await Promise.all([
      eventsOf(ctx, "big_one_named", fromAt, toAt),
      eventsOf(ctx, "first_payment_started", fromAt, toAt),
      eventsOf(ctx, "comeback_shown", fromAt, toAt),
      eventsOf(ctx, "comeback_started", fromAt, toAt),
      eventsOf(ctx, "bookmark_written", fromAt, toAt),
      eventsOf(ctx, "ai_requested", fromAt, toAt),
      eventsOf(ctx, "ai_accepted", fromAt, toAt),
      eventsOf(ctx, "install_done", fromAt, toAt),
      eventsOf(ctx, "push_enabled", fromAt, toAt),
      eventsOf(ctx, "split_saved", fromAt, toAt),
      eventsOf(ctx, "spread_signed", fromAt, toAt),
    ]);

    // Metric 1
    const withAI = new Set(aiAccepted.flatMap((e) => (e.taskId ? [e.taskId as string] : [])));
    const noAI = <T extends { taskId?: string }>(e: T) => !e.taskId || !withAI.has(e.taskId);
    const namedNoAI = named.filter(noAI);
    const quick = new Set(
      firstPay.filter((e) => noAI(e) && e.ms !== undefined && e.ms < TWO_MIN_MS && e.taskId).map((e) => e.taskId as string),
    );
    // Events without a taskId can't be paired, so they count one for one.
    const quickUnlinked = firstPay.filter((e) => !e.taskId && e.ms !== undefined && e.ms < TWO_MIN_MS).length;
    const firstPaymentWithin2MinPct = pct(Math.min(namedNoAI.length, quick.size + quickUnlinked), namedNoAI.length);

    // Metric 2
    const tasks = await ctx.db.query("tasks").order("desc").take(CAP); // newest first; filtered on createdAt below
    const judged = tasks.filter(
      (t) => t.createdAt >= fromAt && t.createdAt <= toAt - DAY_MS && (t.status === "open" || t.workedDays.length >= 2),
    );
    const secondDayPct = pct(judged.filter((t) => t.workedDays.length >= 2).length, judged.length);

    // Weekly check-ins
    const answers = await ctx.db
      .query("checkIns")
      .withIndex("by_at", (q) => q.gte("at", fromAt).lt("at", toAt))
      .take(CAP);
    const checkIns = { better: 0, same: 0, worse: 0 };
    for (const c of answers) checkIns[c.answer] += 1;

    // Context only
    const active = new Set<string>();
    for (const list of [named, firstPay, shown, started, bookmark, aiAsked, aiAccepted, installed, pushed, split, spread]) {
      for (const e of list) active.add(e.userId);
    }
    const members = (list: { userId: string }[]) => new Set(list.map((e) => e.userId)).size;

    return {
      firstPaymentWithin2MinPct,
      secondDayPct,
      comebackStartedPct: pct(started.length, shown.length),
      checkIns,
      installRate: pct(members(installed), active.size),
      pushEnabledRate: pct(members(pushed), active.size),
      bookmarkRate: pct(members(bookmark), active.size),
      aiAcceptRate: pct(aiAccepted.length, aiAsked.length),
    };
  },
});
