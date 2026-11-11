// Spec 008 "Push": taps at the heads-up and the end of a block in a running session. Never a daily reminder,
// never when no session runs. `fire` is scheduled by lib/pushSchedule.reschedule; `send` (pushNode.ts) runs once,
// is never retried, and reports back through `recordResult`.
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, internalQuery, mutation } from "./_generated/server";
import { pushPayload } from "../packages/core/src";
import { logEvent } from "./lib/events";
import { requireMember } from "./lib/members";
import { MAX_SUBSCRIPTIONS, pushKind } from "./lib/pushSchedule";

const MAX_ENDPOINT = 2048;
const MAX_KEY = 256;

function checkSubscription(endpoint: string, p256dh: string, auth: string) {
  let ok = endpoint.length <= MAX_ENDPOINT && p256dh.length > 0 && p256dh.length <= MAX_KEY && auth.length > 0 && auth.length <= MAX_KEY;
  try {
    ok = ok && new URL(endpoint).protocol === "https:";
  } catch {
    ok = false;
  }
  if (!ok) throw new ConvexError({ code: "BAD_SUBSCRIPTION", message: "That push subscription doesn't look right." });
}

// ---------- the student's devices ----------

/** Saves this device's push subscription. Deduped by endpoint; an endpoint someone else had moves to the caller. */
export const subscribe = mutation({
  args: { endpoint: v.string(), p256dh: v.string(), auth: v.string() },
  returns: v.null(),
  handler: async (ctx, { endpoint, p256dh, auth }) => {
    const user = await requireMember(ctx);
    checkSubscription(endpoint, p256dh, auth);
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { userId: user._id, p256dh, auth });
      return null;
    }
    await ctx.db.insert("pushSubscriptions", { userId: user._id, endpoint, p256dh, auth, createdAt: Date.now() });
    return null;
  },
});

/** Removes this device's subscription, only if it is the caller's. */
export const unsubscribe = mutation({
  args: { endpoint: v.string() },
  returns: v.null(),
  handler: async (ctx, { endpoint }) => {
    const user = await requireMember(ctx);
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
      .first();
    if (existing && existing.userId === user._id) await ctx.db.delete(existing._id);
    return null;
  },
});

// ---------- scheduled sending ----------

/**
 * At a block boundary: does nothing unless the session is still running at the version it was scheduled for
 * (any change since, or ending it, makes this fire stale). Otherwise schedules one send per device.
 */
export const fire = internalMutation({
  args: { sessionId: v.id("sessions"), version: v.number(), kind: pushKind },
  returns: v.null(),
  handler: async (ctx, { sessionId, version, kind }) => {
    const s = await ctx.db.get(sessionId);
    if (!s || s.status !== "running" || (s.state.version ?? 0) !== version) return null;
    const subs = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", s.userId))
      .order("desc")
      .take(MAX_SUBSCRIPTIONS);
    const message = pushPayload(s.state, kind);
    for (const sub of subs) {
      await ctx.scheduler.runAfter(0, internal.pushNode.send, { subscriptionId: sub._id, payload: message });
    }
    return null;
  },
});

/** Spec 010: the brake's alert, one push per admin device (each admin's newest MAX_SUBSCRIPTIONS). */
export const notifyAdmins = internalMutation({
  args: { title: v.string(), body: v.string() },
  returns: v.null(),
  handler: async (ctx, { title, body }) => {
    const admins = await ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "admin")).collect();
    for (const admin of admins) {
      const subs = await ctx.db
        .query("pushSubscriptions")
        .withIndex("by_userId", (q) => q.eq("userId", admin._id))
        .order("desc")
        .take(MAX_SUBSCRIPTIONS);
      for (const sub of subs) {
        await ctx.scheduler.runAfter(0, internal.pushNode.send, {
          subscriptionId: sub._id,
          payload: { web_push: 8030 as const, notification: { title, body, navigate: "/" } },
        });
      }
    }
    return null;
  },
});

/** What `send` needs to deliver: the endpoint and keys, or null if the subscription is gone. */
export const subscription = internalQuery({
  args: { subscriptionId: v.id("pushSubscriptions") },
  returns: v.union(v.object({ endpoint: v.string(), p256dh: v.string(), auth: v.string() }), v.null()),
  handler: async (ctx, { subscriptionId }) => {
    const sub = await ctx.db.get(subscriptionId);
    return sub ? { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth } : null;
  },
});

/** One send's result: push_sent, or push_failed once (never retried). Gone deletes the subscription. */
export const recordResult = internalMutation({
  args: { subscriptionId: v.id("pushSubscriptions"), ok: v.boolean(), gone: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { subscriptionId, ok, gone }) => {
    const sub = await ctx.db.get(subscriptionId);
    if (!sub) return null;
    if (ok) {
      await ctx.db.patch(subscriptionId, { lastSuccessAt: Date.now() });
      await logEvent(ctx, sub.userId, "push_sent");
      return null;
    }
    if (gone) await ctx.db.delete(subscriptionId);
    await logEvent(ctx, sub.userId, "push_failed");
    return null;
  },
});
