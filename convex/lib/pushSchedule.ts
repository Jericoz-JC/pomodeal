// Spec 008 "Push": block-boundary pushes are scheduled mutations (`push.fire`), one per pushTimes() entry,
// tagged with the session's version so a fire for a block that has since changed does nothing.
import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { pushTimes } from "../../packages/core/src";

type SessionState = Doc<"sessions">["state"];

export const pushKind = v.union(v.literal("headsUp"), v.literal("blockEnd"));

/** Declarative Web Push (core `PushPayload`); the service worker reads the same shape. */
export const payload = v.object({
  web_push: v.literal(8030),
  notification: v.object({ title: v.string(), body: v.string(), navigate: v.string() }),
});

/** Most devices a student has; a fire sends to the newest this many. */
export const MAX_SUBSCRIPTIONS = 10;

/** The push service says the subscription no longer exists: 404 Not Found or 410 Gone. */
export function isGoneStatus(status: number | undefined): boolean {
  return status === 404 || status === 410;
}

/** Cancels the pushes still pending. One that already ran (or is running) is left alone: cancelling it would throw. */
async function cancelPending(ctx: MutationCtx, ids: Id<"_scheduled_functions">[] | undefined): Promise<void> {
  for (const id of ids ?? []) {
    const job = await ctx.db.system.get("_scheduled_functions", id);
    if (job?.state.kind === "pending") await ctx.scheduler.cancel(id);
  }
}

/**
 * Cancels the session's scheduled pushes and schedules `push.fire` for the current block's heads-up and end,
 * tagged with `state.version`. Stores and returns the new ids.
 */
export async function reschedule(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
  state: SessionState,
  now: number,
): Promise<Id<"_scheduled_functions">[]> {
  await cancelPending(ctx, state.scheduledIds);
  const version = state.version ?? 0;
  const ids: Id<"_scheduled_functions">[] = [];
  for (const { kind, at } of pushTimes(state, now)) {
    ids.push(await ctx.scheduler.runAt(at, internal.push.fire, { sessionId, version, kind }));
  }
  await ctx.db.patch(sessionId, { state: { ...state, scheduledIds: ids } });
  return ids;
}

/** For a session that ended: cancels its pushes and schedules none. */
export async function cancelPushes(ctx: MutationCtx, sessionId: Id<"sessions">, state: SessionState): Promise<void> {
  await cancelPending(ctx, state.scheduledIds);
  await ctx.db.patch(sessionId, { state: { ...state, scheduledIds: [] } });
}
