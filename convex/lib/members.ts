import { ConvexError } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/** The signed-in beta member, or null when signed out or not yet invited. */
export async function currentMember(ctx: QueryCtx | MutationCtx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
}

/** Throws unless the caller is a signed-in beta member. Identity always comes from the token, never from args. */
export async function requireMember(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const user = await currentMember(ctx);
  if (!user) throw new ConvexError({ code: "NOT_A_MEMBER", message: "Sign in with an invite to use Pomodeal." });
  return user;
}

/** Throws unless the caller is a signed-in admin (spec 016: the sign-ups screen). */
export async function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const user = await requireMember(ctx);
  if (user.role !== "admin") throw new ConvexError({ code: "NOT_ADMIN", message: "Only admins can do that." });
  return user;
}
