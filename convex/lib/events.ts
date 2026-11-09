import type { Infer } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import type { eventKind } from "../schema";

export type EventKind = Infer<typeof eventKind>;

/** Beta metrics (spec 008). Kinds and timings only: never pass titles, bookmarks or any typed text. */
export async function logEvent(
  ctx: MutationCtx,
  userId: Id<"users">,
  kind: EventKind,
  extra?: { taskId?: Id<"tasks">; ms?: number },
): Promise<void> {
  await ctx.db.insert("events", {
    userId,
    kind,
    ...(extra?.taskId ? { taskId: extra.taskId } : {}),
    ...(extra?.ms !== undefined ? { ms: extra.ms } : {}),
    at: Date.now(),
  });
}
