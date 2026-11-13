import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/** A member keeps a night for today and the two days before it at most (the sweep), so this only bounds the read. */
const NIGHTS_MAX = 10;

/** The member's night for a local day, or null. */
export async function nightOf(ctx: QueryCtx | MutationCtx, userId: Id<"users">, dayKey: string): Promise<Doc<"nights"> | null> {
  return ctx.db
    .query("nights")
    .withIndex("by_userId_and_dayKey", (q) => q.eq("userId", userId).eq("dayKey", dayKey))
    .unique();
}

export const sittingCount = (items: Doc<"nights">["items"]) => items.reduce((a, it) => a + it.sittings, 0);

/**
 * Spec 012: a deal started from tonight takes sitting `index` (0-based) of the day's night, in the deal's own
 * transaction. Taking the same sitting twice (two devices, a retry) counts once. No night that day: nothing to take.
 */
export async function takeSitting(
  ctx: MutationCtx,
  user: Doc<"users">,
  dayKey: string | undefined,
  index: number,
  sessionId: Id<"sessions">,
): Promise<void> {
  if (dayKey === undefined) throw new ConvexError({ code: "BAD_DAY", message: "A sitting from tonight needs the day." });
  if (!Number.isInteger(index) || index < 0) throw new ConvexError({ code: "BAD_NIGHT", message: "That sitting isn't tonight's." });
  const night = await nightOf(ctx, user._id, dayKey);
  if (!night) return;
  const taken = Math.min(sittingCount(night.items), Math.max(night.taken, index + 1));
  if (taken !== night.taken) await ctx.db.patch(night._id, { taken });
  // the deal remembers its sitting, so stopping early can give it back (spec 017)
  await ctx.db.patch(sessionId, { fromNight: index, nightDay: dayKey });
}

/**
 * Spec 017: "Stop for now" keeps your place. A deal that took a sitting and stopped before its time gives it back,
 * if it is still the last one taken (another device may have moved tonight on, or the night may be gone).
 */
export async function giveBackSitting(ctx: MutationCtx, s: Pick<Doc<"sessions">, "userId" | "fromNight" | "nightDay">): Promise<void> {
  if (s.fromNight === undefined || s.nightDay === undefined) return;
  const night = await nightOf(ctx, s.userId, s.nightDay);
  if (night && night.taken === s.fromNight + 1) await ctx.db.patch(night._id, { taken: s.fromNight });
}

/** A deleted big one stays in tonight by its title, unlinked (spec 006). */
export async function unlinkFromNights(ctx: MutationCtx, userId: Id<"users">, taskId: Id<"tasks">): Promise<void> {
  const nights = await ctx.db
    .query("nights")
    .withIndex("by_userId_and_dayKey", (q) => q.eq("userId", userId))
    .take(NIGHTS_MAX);
  for (const n of nights) {
    if (!n.items.some((it) => it.taskId === taskId)) continue;
    await ctx.db.patch(n._id, { items: n.items.map(({ taskId: id, ...it }) => (id === taskId ? it : { ...it, ...(id ? { taskId: id } : {}) })) });
  }
}
