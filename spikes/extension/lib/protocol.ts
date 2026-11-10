// Message and storage contracts shared by the worker, side panel and overlay.
// Every message is versioned, carries a request id, and gets a stable error code back.

export type BlockKind = "focus" | "break";

export interface Block {
  id: string;
  kind: BlockKind;
  /** What this block is for, e.g. "Reels". */
  label: string;
  /** What comes after, e.g. "Reading". */
  next: string;
  startedAt: number;
  endsAt: number;
  status: "running" | "ended";
  endedAt?: number;
  /** "alarm" = chrome.alarms woke the worker; "reconcile" = the worker found it overdue on boot. */
  endedVia?: "alarm" | "reconcile" | "manual";
}

export interface LogEntry {
  at: number;
  /** Random id per service-worker instance, so restarts are visible in the log. */
  boot: string;
  what: string;
  detail?: string;
}

/** Stored in chrome.storage.session (memory only, trusted contexts only). The token itself is never logged or shown. */
export interface AuthRecord {
  token: string;
  origin: string;
  at: number;
}

export const ALARM_PREFIX = "block-end:";
export const LOG_LIMIT = 80;

export type ErrorCode =
  | "bad_payload"
  | "unknown_type"
  | "origin_not_allowed"
  | "sender_not_allowed"
  | "no_block"
  | "internal";

export type Reply<T extends object = {}> = ({ ok: true; requestId: string } & T) | { ok: false; requestId: string | null; code: ErrorCode };

// ---- internal messages (side panel and overlay -> worker) ----

export interface StartBlockMsg {
  type: "block/start/v1";
  requestId: string;
  kind: BlockKind;
  seconds: number;
  label: string;
  next: string;
}
export interface EndBlockMsg {
  type: "block/end-now/v1";
  requestId: string;
}
export interface OverlayActionMsg {
  type: "overlay/action/v1";
  requestId: string;
  blockId: string;
  action: "start-next" | "ask-more" | "need-this" | "close";
}
export type InternalMsg = StartBlockMsg | EndBlockMsg | OverlayActionMsg;

// ---- worker -> overlay ----
export interface ShowOverlayMsg {
  type: "overlay/show/v1";
  block: Pick<Block, "id" | "label" | "next">;
}

// ---- external messages (web app on an allowed origin -> worker) ----
export interface AuthMsg {
  type: "auth/v1";
  requestId: string;
  token: string;
}
export interface PingMsg {
  type: "ping/v1";
  requestId: string;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isId = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length <= 64;
const isText = (v: unknown, max: number): v is string => typeof v === "string" && v.trim().length > 0 && v.length <= max;

export function requestIdOf(m: unknown): string | null {
  return isObj(m) && isId(m.requestId) ? m.requestId : null;
}

export function parseInternal(m: unknown): InternalMsg | null {
  if (!isObj(m) || !isId(m.requestId)) return null;
  switch (m.type) {
    case "block/start/v1":
      if ((m.kind !== "focus" && m.kind !== "break") || !Number.isInteger(m.seconds)) return null;
      if ((m.seconds as number) < 5 || (m.seconds as number) > 4 * 3600) return null;
      if (!isText(m.label, 40) || !isText(m.next, 40)) return null;
      return m as unknown as StartBlockMsg;
    case "block/end-now/v1":
      return m as unknown as EndBlockMsg;
    case "overlay/action/v1":
      if (!isId(m.blockId) || !["start-next", "ask-more", "need-this", "close"].includes(m.action as string)) return null;
      return m as unknown as OverlayActionMsg;
    default:
      return null;
  }
}

// Tokens are opaque printable ASCII (JWT-shaped in production). Cap the size so a page can't hand us megabytes.
const TOKEN_RE = /^[\x21-\x7e]{8,4096}$/;

export function parseExternal(m: unknown): AuthMsg | PingMsg | "unknown_type" | null {
  if (!isObj(m) || !isId(m.requestId)) return null;
  if (m.type === "ping/v1") return m as unknown as PingMsg;
  if (m.type === "auth/v1") return typeof m.token === "string" && TOKEN_RE.test(m.token) ? (m as unknown as AuthMsg) : null;
  return "unknown_type";
}
