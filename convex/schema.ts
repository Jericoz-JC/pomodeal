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
  // Spec 008 push scheduling (Task 7/13). Optional: production sessions predate them.
  version: v.optional(v.number()),
  scheduledIds: v.optional(v.array(v.id("_scheduled_functions"))),
});

export const taskType = v.union(v.literal("writing"), v.literal("problems"), v.literal("exam"), v.literal("project"));

export const piece = v.object({
  title: v.string(),
  minutes: v.number(),
  plannedDay: v.optional(v.string()), // local date key, set only by a signed spread
  stampedAt: v.optional(v.number()),
});

/** Spec 008 "events.kind". Events never hold typed text. */
export const eventKind = v.union(
  v.literal("big_one_named"),
  v.literal("first_payment_started"),
  v.literal("comeback_shown"),
  v.literal("comeback_started"),
  v.literal("bookmark_written"),
  v.literal("split_saved"),
  v.literal("spread_signed"),
  v.literal("ai_requested"),
  v.literal("ai_accepted"),
  v.literal("install_done"),
  v.literal("push_enabled"),
  v.literal("push_sent"),
  v.literal("push_failed"),
);

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
    lastRepay: v.optional(v.union(v.literal("borrow"), v.literal("trade"))), // ADR 0005 pre-selection
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
    taskId: v.optional(v.id("tasks")), // the big one this session works on (spec 008)
    notedIdx: v.optional(v.number()), // last focus block whose block-end notes were handled
  })
    .index("by_userId_and_status", ["userId", "status"])
    .index("by_taskId", ["taskId"]),

  ledger: defineTable({
    userId: v.id("users"),
    sessionId: v.id("sessions"),
    at: v.number(),
    kind: v.string(),
    blockLabel: v.string(),
    minutes: v.number(),
    intention: v.optional(v.string()),
  }).index("by_userId_and_at", ["userId", "at"]),

  // A big one (spec 008): a task bigger than one block, worked through ordinary Quick Deal sessions.
  tasks: defineTable({
    userId: v.id("users"),
    title: v.string(),
    taskType: v.optional(taskType),
    gutMin: v.optional(v.number()),
    workedMin: v.number(),
    openTermsMin: v.union(v.number(), v.null()),
    firstMove: v.string(),
    bookmark: v.optional(v.string()),
    pieces: v.optional(v.array(piece)),
    dueDay: v.optional(v.string()), // local date key, asked only on the card
    spreadSignedAt: v.optional(v.number()),
    aiSuggested: v.boolean(), // true if accepted pieces came from a suggestion
    status: v.union(v.literal("open"), v.literal("done"), v.literal("set_aside")),
    lastWorkedAt: v.optional(v.number()),
    lastFocusMin: v.optional(v.number()),
    workedDays: v.array(v.string()), // local date keys with a block on this big one, newest 30
    createdAt: v.number(),
  }).index("by_userId_and_status", ["userId", "status"]),

  // Web Push subscriptions (spec 008), one per device. An endpoint belongs to whoever subscribed it last.
  pushSubscriptions: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    createdAt: v.number(),
    lastSuccessAt: v.optional(v.number()),
  })
    .index("by_endpoint", ["endpoint"])
    .index("by_userId", ["userId"]),

  // Spec 008 "Suggest pieces": transient AI output, one row per request, deleted on save, dismiss, a newer request,
  // deleting the big one, or the daily sweep after 24 h. Pieces are already cleaned by core (cleanSuggestion).
  pieceSuggestions: defineTable({
    userId: v.id("users"),
    taskId: v.id("tasks"),
    status: v.union(v.literal("pending"), v.literal("ready"), v.literal("failed")),
    pieces: v.optional(v.array(v.object({ title: v.string(), minutes: v.number() }))),
    createdAt: v.number(),
  })
    .index("by_taskId", ["taskId"])
    .index("by_createdAt", ["createdAt"]),

  // Spec 008 AI limits: requests per member per local day (10), summed per day for the global cap (300).
  aiUsage: defineTable({
    userId: v.id("users"),
    dayKey: v.string(),
    count: v.number(),
  })
    .index("by_userId_and_dayKey", ["userId", "dayKey"])
    .index("by_dayKey", ["dayKey"]),

  // Spec 008 weekly check-in: one answer per member per week (weekKey is the Sunday's local day key).
  checkIns: defineTable({
    userId: v.id("users"),
    weekKey: v.string(),
    answer: v.union(v.literal("better"), v.literal("same"), v.literal("worse")),
    at: v.number(),
  })
    .index("by_userId_and_weekKey", ["userId", "weekKey"])
    .index("by_at", ["at"]),

  // Beta metrics. Kinds and timings only, never titles, bookmarks or any typed text.
  events: defineTable({
    userId: v.id("users"),
    kind: eventKind,
    taskId: v.optional(v.id("tasks")),
    ms: v.optional(v.number()),
    at: v.number(),
  }).index("by_kind_and_at", ["kind", "at"]),
});
