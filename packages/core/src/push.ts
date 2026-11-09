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
