import { ConvexError } from "convex/values";
import { isDayKey } from "../../packages/core/src";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/** Loads a big one that belongs to `user`. Someone else's and a deleted one look the same: not found. */
export async function ownTask(ctx: QueryCtx | MutationCtx, user: Doc<"users">, taskId: Id<"tasks">): Promise<Doc<"tasks">> {
  const task = await ctx.db.get(taskId);
  if (!task || task.userId !== user._id) throw new ConvexError({ code: "NOT_FOUND", message: "That big one isn't here." });
  return task;
}

/** Day keys come from the client's local calendar; reject anything that isn't a real "YYYY-MM-DD". */
export function checkDayKey(dayKey: string | undefined): void {
  if (dayKey !== undefined && !isDayKey(dayKey)) throw new ConvexError({ code: "BAD_DAY", message: "That isn't a day." });
}

export function badBigOne(message: string): never {
  throw new ConvexError({ code: "BAD_BIG_ONE", message });
}
