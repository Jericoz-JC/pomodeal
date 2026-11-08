import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { currentMember, requireMember } from "./lib/members";

/** Each member can hand out this many single-use invites (a room holds 12, including you). */
export const DEFAULT_ALLOWANCE = 11;
// No 0/O/1/I/L so codes survive being read aloud or retyped.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function newCode(): string {
  let s = "";
  for (let i = 0; i < 8; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

/** Where the signed-in person stands: signed out, signed in without an invite, or a member. */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { status: "signedOut" as const };
    const user = await currentMember(ctx);
    if (!user) return { status: "waitlist" as const };
    const mine = await ctx.db.query("invites").withIndex("by_createdBy", (q) => q.eq("createdBy", user._id)).collect();
    const given = mine.reduce((n, i) => n + i.maxUses, 0);
    return {
      status: "member" as const,
      displayName: user.displayName,
      role: user.role,
      invitesLeft: user.role === "admin" ? null : Math.max(0, user.inviteAllowance - given),
    };
  },
});

/** Accept an invite: turns a signed-in WorkOS account into a beta member. */
export const claim = mutation({
  args: { code: v.string(), displayName: v.string() },
  handler: async (ctx, { code, displayName }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "SIGNED_OUT", message: "Sign in first." });
    const existing = await currentMember(ctx);
    if (existing) return { already: true };

    const invite = await ctx.db.query("invites").withIndex("by_code", (q) => q.eq("code", code.trim().toUpperCase())).unique();
    const now = Date.now();
    if (!invite) throw new ConvexError({ code: "INVITE_NOT_FOUND", message: "That invite code doesn't exist. Check the link." });
    if (invite.uses >= invite.maxUses) throw new ConvexError({ code: "INVITE_USED", message: "That invite has already been used. Ask your friend for a new one." });
    if (invite.expiresAt && invite.expiresAt < now) throw new ConvexError({ code: "INVITE_EXPIRED", message: "That invite has expired. Ask your friend for a new one." });

    await ctx.db.patch(invite._id, { uses: invite.uses + 1 });
    const name = displayName.trim().slice(0, 40) || "New member";
    await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      displayName: name,
      role: "member",
      inviteId: invite._id,
      invitedBy: invite.createdBy,
      inviteAllowance: DEFAULT_ALLOWANCE,
      joinedAt: now,
    });
    return { already: false };
  },
});

/** A member's invite tickets, newest first. */
export const myInvites = query({
  args: {},
  handler: async (ctx) => {
    const user = await currentMember(ctx);
    if (!user) return [];
    const mine = await ctx.db.query("invites").withIndex("by_createdBy", (q) => q.eq("createdBy", user._id)).order("desc").collect();
    return mine.map((i) => ({ code: i.code, uses: i.uses, maxUses: i.maxUses, createdAt: i.createdAt }));
  },
});

/** Make one single-use invite ticket, within the member's allowance. */
export const createInvite = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireMember(ctx);
    if (user.role !== "admin") {
      const mine = await ctx.db.query("invites").withIndex("by_createdBy", (q) => q.eq("createdBy", user._id)).collect();
      const given = mine.reduce((n, i) => n + i.maxUses, 0);
      if (given >= user.inviteAllowance) throw new ConvexError({ code: "NO_INVITES_LEFT", message: "You've used all your invites." });
    }
    let code = newCode();
    while (await ctx.db.query("invites").withIndex("by_code", (q) => q.eq("code", code)).unique()) code = newCode();
    await ctx.db.insert("invites", { code, createdBy: user._id, maxUses: 1, uses: 0, createdAt: Date.now() });
    return code;
  },
});

/** Founder invites, run from the CLI: npx convex run beta:seedInvite '{"maxUses":5,"note":"founders"}' (add --prod for production). */
export const seedInvite = internalMutation({
  args: { maxUses: v.number(), note: v.optional(v.string()), expiresInDays: v.optional(v.number()) },
  handler: async (ctx, { maxUses, note, expiresInDays }) => {
    let code = newCode();
    while (await ctx.db.query("invites").withIndex("by_code", (q) => q.eq("code", code)).unique()) code = newCode();
    const now = Date.now();
    await ctx.db.insert("invites", {
      code, createdBy: null, maxUses, uses: 0, note, createdAt: now,
      ...(expiresInDays ? { expiresAt: now + expiresInDays * 86_400_000 } : {}),
    });
    return code;
  },
});

/** Make a member an admin (unlimited invites): npx convex run beta:makeAdmin '{"displayName":"Chris"}' */
export const makeAdmin = internalMutation({
  args: { displayName: v.string() },
  handler: async (ctx, { displayName }) => {
    const matches = (await ctx.db.query("users").collect()).filter((u) => u.displayName === displayName);
    if (matches.length !== 1) throw new ConvexError(`Expected exactly one member named ${displayName}, found ${matches.length}`);
    await ctx.db.patch(matches[0]._id, { role: "admin" });
    return matches[0]._id;
  },
});
