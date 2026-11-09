import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/**
 * Spec 008 "Suggest pieces" is on only when AI_SUGGEST_ENABLED is "true" and a key is set, so a deployment without a
 * key never shows a button that can only fail. The app is complete with it off.
 */
export function aiEnabled(): boolean {
  return process.env.AI_SUGGEST_ENABLED === "true" && !!process.env.ANTHROPIC_API_KEY;
}

/** Deletes every suggestion row for a big one (saved, dismissed, replaced by a newer request, or the big one deleted). */
export async function clearSuggestions(ctx: MutationCtx, taskId: Id<"tasks">): Promise<void> {
  const rows = await ctx.db.query("pieceSuggestions").withIndex("by_taskId", (q) => q.eq("taskId", taskId)).take(50);
  for (const r of rows) await ctx.db.delete(r._id);
}
