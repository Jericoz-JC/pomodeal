// Spec 008 "Push": turning on taps at block ends on this device. The browser's permission prompt only ever
// comes from the student's tap on "Turn on taps at block ends" (main.ts → the prototype's button).
import type { ConvexClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

/** "unavailable": this browser or build can't take pushes (no VAPID key, no service worker, subscribe failed). */
export type PushResult = "granted" | "denied" | "unavailable";

const vapidKey = ((import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) || "").trim();

/** Web Push works in this tab: desktop Chrome/Edge/Firefox, Android Chrome, an installed iPhone app (not an iPhone Safari tab). */
export function pushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/** This build has a VAPID key. Without one no device can be subscribed, so nothing offers taps or the install sheet. */
export const pushConfigured = (): boolean => vapidKey.length > 0;

/** The VAPID public key (base64url) as the bytes PushManager.subscribe wants. */
function keyBytes(b64url: string): Uint8Array<ArrayBuffer> {
  const b64 = (b64url + "=".repeat((4 - (b64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
const sameBytes = (a: ArrayBuffer | null | undefined, b: Uint8Array) => {
  if (!a || a.byteLength !== b.length) return false;
  const x = new Uint8Array(a);
  return x.every((v, i) => v === b[i]);
};
const within = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timed out")), ms))]);

/**
 * Asks for notification permission (call it straight from a tap: Safari only prompts inside a user gesture),
 * subscribes this device and saves the subscription. Never throws.
 */
export async function enablePush(convex: ConvexClient): Promise<PushResult> {
  if (!pushSupported() || !vapidKey) return "unavailable";
  let permission: NotificationPermission;
  try {
    // first thing, before any await, so the prompt is still inside the tap
    permission = await Notification.requestPermission();
  } catch {
    return "unavailable";
  }
  if (permission !== "granted") return "denied";
  try {
    const key = keyBytes(vapidKey);
    // no service worker (a dev server, or registration failed) would wait forever
    const reg = await within(navigator.serviceWorker.ready, 10_000);
    let sub = await reg.pushManager.getSubscription();
    if (sub && !sameBytes(sub.options.applicationServerKey, key)) { await sub.unsubscribe(); sub = null; }
    sub ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
    const { endpoint, keys } = sub.toJSON();
    if (!endpoint || !keys?.p256dh || !keys?.auth) return "unavailable";
    await convex.mutation(api.push.subscribe, { endpoint, p256dh: keys.p256dh, auth: keys.auth });
    return "granted";
  } catch (e) {
    console.error("[pomodeal] push subscribe failed", e);
    return "unavailable";
  }
}
