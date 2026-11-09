import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { logEvent } from "./lib/events";
import { requireMember } from "./lib/members";
import { ownTask } from "./lib/tasks";

/** Events only the client can see (a card shown, an install, push turned on). Kinds only, never text. */
export const logClient = mutation({
  args: {
    kind: v.union(v.literal("comeback_shown"), v.literal("comeback_started"), v.literal("install_done"), v.literal("push_enabled")),
    taskId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, { kind, taskId }) => {
    const user = await requireMember(ctx);
    if (taskId) await ownTask(ctx, user, taskId);
    await logEvent(ctx, user._id, kind, taskId ? { taskId } : undefined);
  },
});
