// Screenshot every prototype state at true phone size, light and dark.
// Usage: node prototypes/shoot.mjs <out-dir> [page=quick-deal/index.html]
// No dependencies: launches Edge with remote debugging and drives it over CDP (Node 22 has WebSocket built in).
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { launchEdge, pageSocketUrl } from "../scripts/headless-edge.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(process.argv[2] || join(here, "shots"));
const page = resolve(here, process.argv[3] || "quick-deal/index.html");
const STATES = ["start", "intercept", "running", "focus", "heads-up", "boundary", "offer-free", "offer-terms", "offer-intention", "done", "done-borrowed", "ledger", "room",
  // spec 007: long blocks
  "picker-focus", "picker-60", "start-60", "long-running", "long-halfway", "long-heads-up",
  // spec 008: big ones
  "bigone-chip", "bigone-ticket", "bigone-ticket-typed", "bigone-boundary", "bigone-boundary-piece",
  "cards", "cards-comeback", "cards-more", "cards-menu", "cards-delete", "cards-all", "cards-breakfirst", "cards-quick", "running-wakelock", "offer-terms-repay",
  // spec 008: push permission button, iPhone install sheet
  "push-ask", "install-ios",
  // spec 008: planning on the card
  "split", "split-exam", "split-pieces", "spread", "spread-exam", "spread-due", "respread", "cards-respread",
  // spec 008: optional AI, "Suggest pieces" in the split sheet
  "split-ai-consent", "split-ai-filled",
  // spec 008: weekly check-in
  "checkin", "checkin-cards",
  // spec 012: tonight in a line
  "tonight-empty", "tonight-typing", "tonight-line", "tonight-size", "tonight", "tonight-running", "tonight-done"];
// ONLY=a,b limits a run to some states (quick review loops); WIDTH=375 checks the narrowest phone; HEIGHT=1400 sees a long screen whole
const only = process.env.ONLY ? process.env.ONLY.split(",") : null;
const WIDTH = Number(process.env.WIDTH) || 390;
const HEIGHT = Number(process.env.HEIGHT) || 844;
// BROWSER=/path/to/chromium runs this on Linux or macOS

mkdirSync(out, { recursive: true });

// one browser, closed with everything it started however this script ends (scripts/headless-edge.mjs)
const edge = launchEdge({ prefix: "nc-shoot", args: ["--disable-gpu", "--hide-scrollbars"] });
const wait = ms => new Promise(r => setTimeout(r, ms));

const wsUrl = await pageSocketUrl(edge.port);
const ws = new WebSocket(wsUrl);
await new Promise(r => ws.addEventListener("open", r, { once: true }));
let id = 0; const pending = new Map();
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
// a call the browser never answers fails after 30 s instead of hanging with the browser open
const send = (method, params = {}) => new Promise((r, j) => { const i = ++id; const t = setTimeout(() => j(new Error(`${method} timed out`)), 30000); pending.set(i, m => { clearTimeout(t); r(m); }); ws.send(JSON.stringify({ id: i, method, params })); });

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: WIDTH, height: HEIGHT, deviceScaleFactor: Number(process.env.SCALE) || 2, mobile: WIDTH < 820 });
const base = pathToFileURL(page).href;
for (const scheme of ["light", "dark"]) {
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: scheme }] });
  for (const s of STATES.filter(x => !only || only.includes(x))) {
    // a capture now and then stalls after many shots in one browser: load the state again and retry once
    let shot;
    for (let tryNo = 1; !shot; tryNo++) {
      await send("Page.navigate", { url: "about:blank" });
      await send("Page.navigate", { url: `${base}#${s}` });
      await wait(1200); // first render
      // web fonts can be slow: a shot taken before they load shows fallback type, so wait for them (up to 8 s)
      await send("Runtime.evaluate", { expression: "Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 8000))]).then(() => document.fonts.status)", awaitPromise: true, returnByValue: true });
      try { shot = await send("Page.captureScreenshot", { format: "png" }); }
      catch (e) { if (tryNo >= 2) throw e; console.warn(`${s}-${scheme}: ${e.message}, retrying`); }
    }
    writeFileSync(join(out, `${s}-${scheme}.png`), Buffer.from(shot.result.data, "base64"));
  }
}
await send("Browser.close").catch(() => {}); ws.close(); edge.close();
console.log(`Wrote screenshots to ${out}`);
