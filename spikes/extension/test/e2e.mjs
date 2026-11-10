// E0 spike checks against the real built extension in branded Edge.
// Build first:  SPIKE_E2E=1 npx wxt build      Run:  node test/e2e.mjs
import { chromium } from "playwright";
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { startFixtures } from "./fixture-server.mjs";

const EXT = resolve(".output/chrome-mv3");
const ID = JSON.parse(readFileSync("spike-key.json", "utf8")).id;
const OUT = resolve("test/results");
const PROFILE = mkdtempSync(join(tmpdir(), "pd-e2e-"));
const HEADLESS = !process.argv.includes("--headed");
const LOCAL = "http://localhost:5174";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, pass, observed) => {
  results.push({ name, pass: !!pass, observed });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${observed !== undefined ? `  ->  ${typeof observed === "string" ? observed : JSON.stringify(observed)}` : ""}`);
};

const stopFixtures = startFixtures();
let ctx;
async function launch() {
  ctx = await chromium.launchPersistentContext(PROFILE, {
    channel: "msedge",
    headless: HEADLESS,
    viewport: { width: 1100, height: 760 },
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
  });
  return ctx;
}
const worker = async () => ctx.serviceWorkers().find((w) => w.url().includes(ID)) ?? ctx.waitForEvent("serviceworker", { timeout: 10000 });

// A tab on an extension page, used only to read storage (doesn't wake or keep alive the worker).
let panel;
async function openPanel() {
  panel = await ctx.newPage();
  await panel.goto(`chrome-extension://${ID}/sidepanel.html`);
  return panel;
}
const readLocal = () => panel.evaluate(() => chrome.storage.local.get(["block", "log"]));
const readSession = () => panel.evaluate(() => chrome.storage.session.get(null));

async function startBlock(kind, seconds, label = "Reels", next = "Reading") {
  await panel.fill('input[name="label"]', label);
  await panel.fill('input[name="next"]', next);
  // The preset buttons are fixed; send the same message the form sends so tests can pick any length.
  const res = await panel.evaluate((m) => chrome.runtime.sendMessage(m), { type: "block/start/v1", requestId: "e2e" + Date.now() % 1e6, kind, seconds, label, next });
  if (!res?.ok) throw new Error("start failed " + JSON.stringify(res));
  return (await readLocal()).block;
}

// Force-stop every service worker, the way Chrome does after 30 s idle or under memory pressure.
// Returns true once CDP reports our worker's running status as "stopped".
async function killWorker(page) {
  const cdp = await ctx.newCDPSession(page);
  const status = new Map();
  let resolveStopped;
  const stopped = new Promise((r) => (resolveStopped = r));
  cdp.on("ServiceWorker.workerVersionUpdated", ({ versions }) => {
    for (const v of versions) {
      if (!v.scriptURL.includes(ID)) continue;
      status.set(v.versionId, v.runningStatus);
      if (v.runningStatus === "stopped") resolveStopped(true);
    }
  });
  await cdp.send("ServiceWorker.enable");
  await wait(200);
  if ([...status.values()].every((s) => s === "stopped") && status.size) resolveStopped(true); // already asleep
  await cdp.send("ServiceWorker.stopAllWorkers");
  const ok = await Promise.race([stopped, wait(5000).then(() => false)]);
  await cdp.send("ServiceWorker.disable").catch(() => {});
  await cdp.detach().catch(() => {});
  return ok;
}

const overlayState = (page) =>
  page.evaluate(() => {
    const host = document.querySelector("pomodeal-overlay");
    if (!host) return null;
    const cs = getComputedStyle(host);
    const r = host.getBoundingClientRect();
    return {
      shadowRootVisibleToPage: host.shadowRoot !== null,
      leakedViaPatchedAttachShadow: window.__leaked.length,
      display: cs.display, zIndex: cs.zIndex, position: cs.position,
      coversViewport: r.width >= innerWidth - 1 && r.height >= innerHeight - 1,
      focusIsInOverlay: document.activeElement === host,
    };
  });

async function waitForOverlay(page, ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const s = await overlayState(page);
    if (s) return { ...s, appearedAt: Date.now() };
    await wait(250);
  }
  return null;
}

async function waitForLog(what, sinceAt, ms = 45000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const { log = [] } = await readLocal();
    const hit = log.find((e) => e.what === what && e.at >= sinceAt);
    if (hit) return hit;
    await wait(500);
  }
  return null;
}

const logSince = async (t) => ((await readLocal()).log ?? []).filter((e) => e.at >= t).map((e) => `${e.boot} ${e.what}${e.detail ? ` (${e.detail})` : ""}`);

try {
  // ---------- load ----------
  await launch();
  const sw = await worker();
  check("Edge loads the unpacked build; ID matches the pinned key", sw.url() === `chrome-extension://${ID}/background.js`, sw.url());
  await openPanel();
  const firstBoot = (await readLocal()).log?.at(-1)?.boot;

  // ---------- handshake ----------
  const hs = await ctx.newPage();
  await hs.goto(`${LOCAL}/handshake.html`);
  check("chrome.runtime.sendMessage exists on http://localhost:5174", await hs.evaluate(() => typeof chrome?.runtime?.sendMessage === "function"));
  const send = (page, msg) => page.evaluate(([id, m]) => chrome.runtime.sendMessage(id, m).catch((e) => ({ thrown: String(e.message) })), [ID, msg]);
  const ping = await send(hs, { type: "ping/v1", requestId: "p1" });
  check("ping/v1 answers with the version", ping?.ok === true && ping.version === "0.0.1", ping);
  const TOKEN_A = "synthetic-token-a-" + "x".repeat(40);
  const authA = await send(hs, { type: "auth/v1", requestId: "a1", token: TOKEN_A });
  check("auth/v1 from localhost:5174 is accepted", authA?.ok === true && authA.requestId === "a1", authA);
  let sess = await readSession();
  check("token lands in storage.session", sess.auth?.token === TOKEN_A && sess.auth.origin === LOCAL, { origin: sess.auth?.origin });
  const localDump = JSON.stringify(await panel.evaluate(() => chrome.storage.local.get(null)));
  check("token never appears in storage.local or the log", !localDump.includes(TOKEN_A));
  check("bad token shape is refused with a stable code", (await send(hs, { type: "auth/v1", requestId: "a2", token: "short" }))?.code === "bad_payload");
  check("oversized token is refused", (await send(hs, { type: "auth/v1", requestId: "a3", token: "x".repeat(5000) }))?.code === "bad_payload");
  check("unknown message type is refused", (await send(hs, { type: "deal/v9", requestId: "a4" }))?.code === "unknown_type");
  check("message without requestId is refused", (await send(hs, { type: "auth/v1", token: TOKEN_A }))?.code === "bad_payload");

  const otherPort = await ctx.newPage();
  await otherPort.goto("http://localhost:5199/handshake.html");
  const portRes = await otherPort.evaluate(() => typeof chrome?.runtime?.sendMessage === "function");
  const portAuth = portRes ? await send(otherPort, { type: "auth/v1", requestId: "o1", token: TOKEN_A }) : null;
  check("localhost:5199 reaches the worker (manifest match ignores port) but the worker refuses it", portRes && portAuth?.code === "origin_not_allowed", { reachable: portRes, reply: portAuth });
  await otherPort.close();

  const ip = await ctx.newPage();
  await ip.goto("http://127.0.0.1:5174/handshake.html");
  const ipRes = await ip.evaluate(() => window.pomodealConnect("synthetic-token-from-127"));
  check("127.0.0.1 is outside externally_connectable: no chrome.runtime at all", ipRes?.code === "extension_not_reachable", ipRes);
  await ip.close();

  check("worker force-stop works (CDP ServiceWorker.stopAllWorkers)", await killWorker(hs));
  const TOKEN_B = "synthetic-token-b-" + "y".repeat(40);
  const t0 = Date.now();
  const authB = await send(hs, { type: "auth/v1", requestId: "b1", token: TOKEN_B });
  check("auth/v1 wakes a stopped worker and refreshes the token", authB?.ok === true && (await readSession()).auth?.token === TOKEN_B, authB);
  const refresh = await waitForLog("auth-refreshed", t0, 5000);
  check("refresh is logged as a refresh from a new worker instance", refresh && refresh.boot !== firstBoot, refresh && `${refresh.boot}: ${refresh.detail}`);
  await hs.close();

  // ---------- round A: 20 s break, worker killed, overlay on a hostile page ----------
  const page = await ctx.newPage();
  await page.goto(`${LOCAL}/hostile.html`);
  let block = await startBlock("break", 20);
  await page.bringToFront();
  await page.focus("#search");
  check("A: worker stopped right after the break started", await killWorker(page));
  const ovA = await waitForOverlay(page, 75000);
  check("A: overlay appears after the worker was killed", !!ovA, ovA && `${((ovA.appearedAt - block.endsAt) / 1000).toFixed(1)} s after endsAt`);
  const logA = await logSince(block.startedAt);
  check("A: a new worker instance handled the alarm", logA.some((l) => l.includes("alarm-fired")) && logA.some((l) => l.includes("worker-boot")), logA);
  check("A: closed shadow root: host.shadowRoot is null to the page", ovA && !ovA.shadowRootVisibleToPage);
  check("A: page's patched attachShadow never saw the overlay (isolated world)", ovA && ovA.leakedViaPatchedAttachShadow === 0);
  check("A: hostile page CSS can't hide or sink the host", ovA && ovA.display === "block" && ovA.zIndex === "2147483647" && ovA.coversViewport, ovA && { display: ovA.display, zIndex: ovA.zIndex });
  check("A: focus moved into the overlay", ovA?.focusIsInOverlay);
  await page.screenshot({ path: join(OUT, "overlay-light.png") });
  await page.keyboard.press("Escape");
  await wait(300);
  check("A: Esc closes the overlay", (await overlayState(page)) === null);
  check("A: focus returns to where it was", (await page.evaluate(() => document.activeElement?.id)) === "search");
  check("A: the overlay's choice reaches the worker", !!(await waitForLog("overlay-action", block.startedAt, 5000)));

  // ---------- round B: dark, page swallows Esc, worker killed twice ----------
  await page.goto(`${LOCAL}/hostile.html?swallow=1`);
  await page.emulateMedia({ colorScheme: "dark" });
  block = await startBlock("break", 20);
  await page.bringToFront();
  await killWorker(page);
  await wait(10000);
  check("B: worker stopped a second time mid-break", await killWorker(page));
  const ovB = await waitForOverlay(page, 75000);
  check("B: overlay appears after two kills", !!ovB, ovB && `${((ovB.appearedAt - block.endsAt) / 1000).toFixed(1)} s after endsAt`);
  await page.screenshot({ path: join(OUT, "overlay-dark.png") });
  await page.keyboard.press("Escape");
  await wait(300);
  const stillUp = (await overlayState(page)) !== null;
  check("B: a page that eats Esc at window capture blocks our Esc (known limit)", stillUp, { swallowed: await page.evaluate(() => window.__swallowed) });
  await page.keyboard.press("Enter");
  await wait(300);
  check("B: Enter on the focused primary button still works", (await overlayState(page)) === null);
  const actB = await waitForLog("overlay-action", block.startedAt, 5000);
  check("B: action recorded as start-next", actB?.detail === "start-next", actB?.detail);
  await page.emulateMedia({ colorScheme: "light" });

  // ---------- round C: tab without host access ----------
  const ipPage = await ctx.newPage();
  await ipPage.goto("http://127.0.0.1:5174/hostile.html");
  block = await startBlock("break", 10);
  await ipPage.bringToFront();
  await killWorker(ipPage);
  const unavailable = await waitForLog("overlay-unavailable", block.startedAt, 60000);
  check("C: no host access: overlay fails cleanly", !!unavailable, unavailable?.detail);
  check("C: falls back to a notification", !!(await waitForLog("notified", block.startedAt, 5000)));
  await ipPage.close();

  // ---------- side panel screenshots (as a tab at side-panel width) ----------
  await startBlock("break", 120);
  await panel.setViewportSize({ width: 360, height: 900 });
  await panel.bringToFront();
  await wait(1200);
  await panel.screenshot({ path: join(OUT, "panel-light.png"), fullPage: true });
  await panel.emulateMedia({ colorScheme: "dark" });
  await wait(300);
  await panel.screenshot({ path: join(OUT, "panel-dark.png"), fullPage: true });
  await panel.emulateMedia({ colorScheme: "light" });
  await panel.evaluate(() => chrome.runtime.sendMessage({ type: "block/end-now/v1", requestId: "end1" }));
  await panel.setViewportSize({ width: 1100, height: 760 });

  // ---------- restart: browser closed mid-break, reopened before it ends ----------
  block = await startBlock("break", 40);
  await wait(3000);
  await ctx.close();
  await wait(5000);
  await launch();
  await openPanel();
  const after = await ctx.newPage();
  await after.goto(`${LOCAL}/hostile.html`);
  await after.bringToFront();
  check("R1: session token is gone after a browser restart", !(await readSession()).auth);
  const alarmsAfter = await panel.evaluate(() => chrome.alarms.getAll());
  check("R1: an alarm is armed after restart (the log says whether the reconcile re-armed it)", alarmsAfter.length === 1, alarmsAfter.length ? `scheduled ${((alarmsAfter[0].scheduledTime - block.endsAt) / 1000).toFixed(1)} s from endsAt` : "no alarm");
  const ovR = await waitForOverlay(after, 75000);
  check("R1: overlay still appears after a restart mid-break", !!ovR, ovR && `${((ovR.appearedAt - block.endsAt) / 1000).toFixed(1)} s after endsAt`);
  check("R1: log across restart", true, await logSince(block.startedAt));
  if (ovR) await after.keyboard.press("Escape");

  // ---------- restart: break ends while the browser is closed ----------
  block = await startBlock("break", 8);
  await ctx.close();
  await wait(15000);
  await launch();
  await openPanel();
  const endedR2 = await waitForLog("block-ended", block.startedAt, 30000);
  check("R2: an overdue break ends on next launch", !!endedR2, endedR2 && `${endedR2.detail}`);
  check("R2: log across restart", true, await logSince(block.startedAt));
} catch (e) {
  check("run finished without throwing", false, String(e?.stack ?? e));
} finally {
  await ctx?.close().catch(() => {});
  await stopFixtures();
  const edge = results.length;
  writeFileSync(join(OUT, "results.json"), JSON.stringify({ when: new Date().toISOString(), browser: "msedge", headless: HEADLESS, results }, null, 2));
  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n${edge - failed}/${edge} passed. Results and screenshots in ${OUT}`);
  process.exit(failed ? 1 : 0);
}
