import {
  ALARM_PREFIX,
  LOG_LIMIT,
  parseExternal,
  parseInternal,
  requestIdOf,
  type AuthRecord,
  type Block,
  type ErrorCode,
  type LogEntry,
  type ShowOverlayMsg,
} from "@/lib/protocol";

// Origins allowed to hand the extension a token. The manifest's externally_connectable
// decides which pages can reach us at all; this list decides which ones we believe.
const ALLOWED_ORIGINS = new Set(["http://localhost:5173", "http://localhost:5174", "https://pomodeal.app"]);

export default defineBackground(() => {
  const boot = crypto.randomUUID().slice(0, 6);

  // One write queue per worker instance: storage is read-modify-write, and the
  // boot reconcile can race the alarm event that woke us.
  let queue: Promise<unknown> = Promise.resolve();
  const serial = <T>(fn: () => Promise<T>): Promise<T> => {
    const run = queue.then(fn, fn);
    queue = run.catch(() => {});
    return run;
  };

  const log = (what: string, detail?: string) =>
    serial(async () => {
      const { log = [] } = (await browser.storage.local.get("log")) as { log?: LogEntry[] };
      log.push({ at: Date.now(), boot, what, detail });
      await browser.storage.local.set({ log: log.slice(-LOG_LIMIT) });
    });

  const getBlock = async () => ((await browser.storage.local.get("block")) as { block?: Block }).block;

  async function startBlock(kind: Block["kind"], seconds: number, label: string, next: string) {
    const now = Date.now();
    const block: Block = { id: crypto.randomUUID().slice(0, 8), kind, label, next, startedAt: now, endsAt: now + seconds * 1000, status: "running" };
    await serial(async () => {
      await browser.alarms.clearAll();
      await browser.storage.local.set({ block });
      await browser.alarms.create(ALARM_PREFIX + block.id, { when: block.endsAt });
    });
    await log("block-started", `${kind} ${seconds}s, alarm ${ALARM_PREFIX}${block.id}`);
    return block;
  }

  // Idempotent: whichever of (alarm, boot reconcile, manual) gets here first ends the block.
  async function endBlock(id: string, via: NonNullable<Block["endedVia"]>) {
    const ended = await serial(async () => {
      const block = await getBlock();
      if (!block || block.id !== id || block.status !== "running") return null;
      const done: Block = { ...block, status: "ended", endedAt: Date.now(), endedVia: via };
      await browser.storage.local.set({ block: done });
      await browser.alarms.clear(ALARM_PREFIX + id);
      return done;
    });
    if (!ended) return;
    await log("block-ended", `via ${via}, ${Math.round((ended.endedAt! - ended.endsAt) / 1000)}s after endsAt`);
    if (ended.kind === "break") await showOverlay(ended);
    else await notify(ended, "focus block done");
  }

  async function showOverlay(block: Block) {
    const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true });
    if (tab?.id === undefined) return notify(block, "no active tab");
    try {
      await browser.scripting.executeScript({ target: { tabId: tab.id }, files: ["/content-scripts/overlay.js"] });
      const msg: ShowOverlayMsg = { type: "overlay/show/v1", block: { id: block.id, label: block.label, next: block.next } };
      await browser.tabs.sendMessage(tab.id, msg);
      await log("overlay-shown");
    } catch (e) {
      // Restricted pages (chrome://, the Web Store, PDF viewer) and tabs without host access land here.
      await log("overlay-unavailable", String((e as Error)?.message ?? e).slice(0, 120));
      await notify(block, "overlay unavailable");
    }
  }

  async function notify(block: Block, why: string) {
    await browser.notifications.create(`block-${block.id}`, {
      type: "basic",
      iconUrl: browser.runtime.getURL("/icon/128.png"),
      title: block.kind === "break" ? `${block.label} time is up` : "Focus block done",
      message: block.kind === "break" ? `${block.next} is next.` : "Take the break you planned.",
    });
    await log("notified", why);
  }

  // Runs on every worker start: make storage and alarms agree again.
  async function reconcile() {
    const block = await getBlock();
    if (!block || block.status !== "running") return;
    const alarm = await browser.alarms.get(ALARM_PREFIX + block.id);
    if (alarm) return; // Chrome still holds it; it will fire (immediately, if overdue).
    if (block.endsAt <= Date.now()) {
      await log("alarm-missing", "block overdue on boot");
      await endBlock(block.id, "reconcile");
    } else {
      await browser.alarms.create(ALARM_PREFIX + block.id, { when: block.endsAt });
      await log("alarm-rearmed", `${Math.round((block.endsAt - Date.now()) / 1000)}s left`);
    }
  }

  const fail = (requestId: string | null, code: ErrorCode) => ({ ok: false as const, requestId, code });

  // ---- listeners: all registered synchronously, before any await ----

  browser.runtime.onInstalled.addListener(({ reason }) => {
    void browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    void log("installed", reason);
  });
  browser.runtime.onStartup.addListener(() => void log("browser-startup"));

  browser.alarms.onAlarm.addListener((alarm) => {
    if (!alarm.name.startsWith(ALARM_PREFIX)) return;
    const late = Math.round((Date.now() - alarm.scheduledTime) / 1000);
    void log("alarm-fired", `${alarm.name}, ${late}s late`).then(() => endBlock(alarm.name.slice(ALARM_PREFIX.length), "alarm"));
  });

  browser.runtime.onMessage.addListener((raw, sender, sendResponse) => {
    // Only our own pages and our own content script, never another extension.
    if (sender.id !== browser.runtime.id) return false;
    const msg = parseInternal(raw);
    if (!msg) {
      sendResponse(fail(requestIdOf(raw), "bad_payload"));
      return false;
    }
    // Classify by URL, not by sender.tab: an extension page opened in a tab also has a tab.
    const fromExtensionPage = !!sender.url?.startsWith(browser.runtime.getURL("/"));
    const fromOverlay = !!sender.tab && !fromExtensionPage;
    void (async () => {
      switch (msg.type) {
        case "block/start/v1": {
          if (!fromExtensionPage) return sendResponse(fail(msg.requestId, "sender_not_allowed"));
          const block = await startBlock(msg.kind, msg.seconds, msg.label.trim(), msg.next.trim());
          return sendResponse({ ok: true, requestId: msg.requestId, blockId: block.id });
        }
        case "block/end-now/v1": {
          if (!fromExtensionPage) return sendResponse(fail(msg.requestId, "sender_not_allowed"));
          const block = await getBlock();
          if (!block || block.status !== "running") return sendResponse(fail(msg.requestId, "no_block"));
          await endBlock(block.id, "manual");
          return sendResponse({ ok: true, requestId: msg.requestId });
        }
        case "overlay/action/v1": {
          if (!fromOverlay) return sendResponse(fail(msg.requestId, "sender_not_allowed"));
          // E2 turns ask-more into a real deal through Convex. The spike only records the choice.
          await log("overlay-action", msg.action);
          return sendResponse({ ok: true, requestId: msg.requestId });
        }
      }
    })().catch(() => sendResponse(fail(msg.requestId, "internal")));
    return true; // async sendResponse
  });

  browser.runtime.onMessageExternal.addListener((raw, sender, sendResponse) => {
    const origin = sender.origin ?? (sender.url ? new URL(sender.url).origin : "");
    if (!ALLOWED_ORIGINS.has(origin)) {
      void log("external-rejected", `origin ${origin || "unknown"}`);
      sendResponse(fail(requestIdOf(raw), "origin_not_allowed"));
      return false;
    }
    const msg = parseExternal(raw);
    if (msg === null || msg === "unknown_type") {
      void log("external-rejected", msg ?? "bad_payload");
      sendResponse(fail(requestIdOf(raw), msg ?? "bad_payload"));
      return false;
    }
    if (msg.type === "ping/v1") {
      sendResponse({ ok: true, requestId: msg.requestId, version: browser.runtime.getManifest().version });
      return false;
    }
    void (async () => {
      const record: AuthRecord = { token: msg.token, origin, at: Date.now() };
      const { auth: prev } = (await browser.storage.session.get("auth")) as { auth?: AuthRecord };
      await browser.storage.session.set({ auth: record });
      // Never log the token: length and whether it replaced one is enough to debug.
      await log(prev ? "auth-refreshed" : "auth-stored", `from ${origin}, ${msg.token.length} chars`);
      sendResponse({ ok: true, requestId: msg.requestId });
    })().catch(() => sendResponse(fail(msg.requestId, "internal")));
    return true;
  });

  void log("worker-boot").then(reconcile);
});
