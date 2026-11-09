"use node";
// Spec 008 "Push": delivers one block-boundary push to one device with the web-push library. Runs at most once
// and is never retried: any failure is logged once as push_failed, and 404/410 also removes the subscription.
import webpush from "web-push";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { isGoneStatus, payload } from "./lib/pushSchedule";

/** A heads-up or block end is useless once the moment has passed: the push service drops it after this long. */
const TTL_SECONDS = 5 * 60;

export const send = internalAction({
  args: { subscriptionId: v.id("pushSubscriptions"), payload },
  returns: v.null(),
  handler: async (ctx, { subscriptionId, payload }) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT;
    if (!publicKey || !privateKey || !subject) {
      console.error("push: VAPID env not set, push not sent");
      await ctx.runMutation(internal.push.recordResult, { subscriptionId, ok: false, gone: false });
      return null;
    }
    const sub = await ctx.runQuery(internal.push.subscription, { subscriptionId });
    if (!sub) return null; // unsubscribed since the fire
    let ok = true;
    let status: number | undefined;
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
        { vapidDetails: { subject, publicKey, privateKey }, TTL: TTL_SECONDS, urgency: "high", timeout: 10_000 },
      );
    } catch (err) {
      ok = false;
      status = (err as { statusCode?: number }).statusCode;
      console.error(`push: send failed${status ? ` with ${status}` : ""}`); // never the endpoint or payload
    }
    await ctx.runMutation(internal.push.recordResult, { subscriptionId, ok, gone: !ok && isGoneStatus(status) });
    return null;
  },
});
