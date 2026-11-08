import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const block = v.object({
  type: v.union(v.literal("focus"), v.literal("break")),
  label: v.string(),
  min: v.number(),
  added: v.optional(v.number()),
});

export const sessionState = v.object({
  blocks: v.array(block),
  idx: v.number(),
  startedAt: v.number(),
  durMs: v.number(),
  askCount: v.number(),
  debt: v.number(),
  bonusOffered: v.boolean(),
});

export default defineSchema({
  // Beta members. A row exists only after someone signs in with WorkOS AND claims an invite.
  users: defineTable({
    tokenIdentifier: v.string(),
    displayName: v.string(),
    role: v.union(v.literal("member"), v.literal("admin")),
    inviteId: v.union(v.id("invites"), v.null()),
    invitedBy: v.union(v.id("users"), v.null()),
    inviteAllowance: v.number(),
    joinedAt: v.number(),
  }).index("by_tokenIdentifier", ["tokenIdentifier"]),

  // Invite tickets. createdBy is null for founder invites made from the CLI.
  invites: defineTable({
    code: v.string(),
    createdBy: v.union(v.id("users"), v.null()),
    maxUses: v.number(),
    uses: v.number(),
    note: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_createdBy", ["createdBy"]),

  sessions: defineTable({
    userId: v.id("users"),
    state: sessionState,
    status: v.union(v.literal("running"), v.literal("ended")),
    createdAt: v.number(),
  }).index("by_userId_and_status", ["userId", "status"]),

  ledger: defineTable({
    userId: v.id("users"),
    sessionId: v.id("sessions"),
    at: v.number(),
    kind: v.string(),
    blockLabel: v.string(),
    minutes: v.number(),
    intention: v.optional(v.string()),
  }).index("by_userId_and_at", ["userId", "at"]),
});
