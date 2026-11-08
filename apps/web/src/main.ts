// v0.2 shell: the screens are still the design prototype (synced from prototypes/quick-deal by
// scripts/sync-prototype.mjs). This module wires the PWA and the Convex connection so the
// backend is live from day one; Phase 1 moves the screens to components backed by convex/sessions.ts.
import { ConvexClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const url = (import.meta.env.VITE_CONVEX_URL as string | undefined) || undefined;

function deviceId(): string {
  try {
    const k = "pomodeal.device";
    const existing = localStorage.getItem(k);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(k, id);
    return id;
  } catch {
    return "anonymous";
  }
}

if (url) {
  const client = new ConvexClient(url);
  client.onUpdate(api.sessions.current, { deviceId: deviceId() }, (s) => {
    document.documentElement.dataset.backend = "live";
    if (s) console.info("[pomodeal] running session", s._id);
  });
  (window as unknown as { nc: unknown }).nc = { client, api, deviceId: deviceId() };
} else {
  console.info("[pomodeal] VITE_CONVEX_URL not set; running without the backend");
}
