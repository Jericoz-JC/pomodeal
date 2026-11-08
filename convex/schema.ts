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

// Pre-auth beta: a random per-device id stands in for a user until sign-in lands (Phase 1).
export default defineSchema({
  sessions: defineTable({
    deviceId: v.string(),
    state: sessionState,
    status: v.union(v.literal("running"), v.literal("ended")),
    createdAt: v.number(),
  }).index("by_deviceId_and_status", ["deviceId", "status"]),

  ledger: defineTable({
    deviceId: v.string(),
    sessionId: v.id("sessions"),
    at: v.number(),
    kind: v.string(),
    blockLabel: v.string(),
    minutes: v.number(),
    intention: v.optional(v.string()),
  }).index("by_deviceId_and_at", ["deviceId", "at"]),
});
