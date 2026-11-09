// Spec 008 "Push": the words a block-boundary push carries. Pushes only ever fire at the heads-up and the
// block end of a running session, so the copy is about the block, never a reminder to start one.

import type { Block, SessionState } from "./negotiation";
import { headsUpMs, type PushKind } from "./timer";

/** Declarative Web Push (Safari 18.4+); the service worker reads the same shape on other browsers. */
export interface PushPayload {
  web_push: 8030;
  notification: { title: string; body: string; navigate: string };
}

const capitalize = (s: string) => s.replace(/^./, (c) => c.toUpperCase());

/** How a block is named in a push: what the student typed, "your break" for an unnamed break, plain words when blank. */
function nameOf(b: Block): string | null {
  const label = b.label.trim();
  if (b.type === "break" && label === "Your pick") return "your break";
  return label || null;
}

/** The push text for the current block. Labels can be text the student typed. */
export function pushBody(s: SessionState, kind: PushKind): string {
  const b = s.blocks[s.idx];
  const name = nameOf(b);
  if (kind === "headsUp") {
    const min = Math.round(headsUpMs(s.durMs) / 60_000);
    return `${min} min to wrap up ${name ?? (b.type === "focus" ? "this block" : "your break")}.`;
  }
  const next = s.blocks[s.idx + 1];
  if (b.type === "break") {
    const nextName = next ? nameOf(next) : null;
    return nextName ? `${capitalize(nextName)} is up next.` : "Your break is done.";
  }
  const done = name ? `${capitalize(name)} block is done.` : "This block is done.";
  return next ? `${done} Your break is ready.` : `${done} That was the last block.`;
}

export function pushPayload(s: SessionState, kind: PushKind): PushPayload {
  return { web_push: 8030, notification: { title: "Pomodeal", body: pushBody(s, kind), navigate: "/" } };
}

/** What the service worker hands to `registration.showNotification(title, options)`. */
export interface PushNotice {
  title: string;
  options: { body: string; tag: string; icon: string; data: { navigate: string } };
}

/** Only a path on this site: never another origin, never a script URL. */
function samePath(v: unknown): string {
  return typeof v === "string" && v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : "/";
}

/**
 * The notification a service worker shows for a push (browsers without Declarative Web Push read the same payload).
 * Accepts the parsed payload or its JSON text; null when there is nothing to show. One tag for every block push,
 * so the block end replaces its heads-up instead of stacking under it.
 */
export function notificationFromPush(data: unknown): PushNotice | null {
  let p = data;
  if (typeof p === "string") {
    try { p = JSON.parse(p); } catch { return null; }
  }
  if (!p || typeof p !== "object") return null;
  const n = (p as { notification?: unknown }).notification;
  if (!n || typeof n !== "object") return null;
  const { title, body, navigate, tag } = n as Record<string, unknown>;
  if (typeof body !== "string" || !body.trim()) return null;
  return {
    title: typeof title === "string" && title.trim() ? title : "Pomodeal",
    options: { body, tag: typeof tag === "string" && tag ? tag : "pomodeal-block", icon: "/icon-192.png", data: { navigate: samePath(navigate) } },
  };
}
