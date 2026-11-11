// Spec 010: the sign-up mode, the brake's limits, and the member counts the brake reads.
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export type BetaSettings = Omit<Doc<"settings">, "_id" | "_creationTime">;
export type BrakeReason = "dayLimit" | "memberCap";

/** Until Chris opens sign-ups from the admin screen, the beta stays invite-only (fail closed). */
export const DEFAULT_SETTINGS: BetaSettings = { key: "beta", signups: "inviteOnly", memberCap: 150, dayLimit: 40 };

const DAY_MS = 86_400_000;

/** The settings row, or the defaults when it doesn't exist yet. */
export async function getBetaSettings(ctx: QueryCtx | MutationCtx): Promise<BetaSettings & { _id?: Id<"settings"> }> {
  const row = await ctx.db.query("settings").withIndex("by_key", (q) => q.eq("key", "beta")).unique();
  return row ?? { ...DEFAULT_SETTINGS };
}

/** Creates the row from the defaults on first write, else patches it. Pass undefined to clear an optional field. */
export async function putBetaSettings(ctx: MutationCtx, patch: Partial<Omit<BetaSettings, "key">>): Promise<void> {
  const row = await ctx.db.query("settings").withIndex("by_key", (q) => q.eq("key", "beta")).unique();
  if (row) await ctx.db.patch(row._id, patch);
  else {
    const doc: BetaSettings = { ...DEFAULT_SETTINGS, ...patch };
    // insert rejects explicit undefined fields
    for (const k of Object.keys(doc) as (keyof BetaSettings)[]) if (doc[k] === undefined) delete doc[k];
    await ctx.db.insert("settings", doc);
  }
}

/** Which limit a join has reached, counting the member just added; the day limit is reported first. */
export function brakeReason(counts: { recent: number; total: number }, s: Pick<BetaSettings, "dayLimit" | "memberCap">): BrakeReason | null {
  if (counts.recent >= s.dayLimit) return "dayLimit";
  if (counts.total >= s.memberCap) return "memberCap";
  return null;
}

/**
 * recent: members who joined in the last 24 hours, or since sign-ups were last reopened if that is later.
 * total: every member. Reads every row: fine for the beta; past a few thousand members use @convex-dev/aggregate.
 */
export async function memberCounts(ctx: QueryCtx | MutationCtx, s: BetaSettings, now: number): Promise<{ recent: number; total: number }> {
  const since = Math.max(now - DAY_MS, s.windowStart ?? 0);
  const recent = (await ctx.db.query("users").withIndex("by_joinedAt", (q) => q.gt("joinedAt", since)).collect()).length;
  const total = (await ctx.db.query("users").collect()).length;
  return { recent, total };
}
