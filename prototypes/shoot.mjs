// Screenshot every prototype state at true phone size, light and dark.
// Usage: node prototypes/shoot.mjs <out-dir> [page=quick-deal/index.html]
// No dependencies: launches Edge with remote debugging and drives it over CDP (Node 22 has WebSocket built in).
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(process.argv[2] || join(here, "shots"));
const page = resolve(here, process.argv[3] || "quick-deal/index.html");
const STATES = ["start", "intercept", "running", "focus", "heads-up", "boundary", "offer-free", "offer-terms", "offer-intention", "bonus", "ledger", "room"];
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = 9333 + Math.floor(Math.random() * 500);
const profile = join(tmpdir(), `nc-shoot-${Date.now()}`);

mkdirSync(out, { recursive: true });

const proc = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--disable-gpu", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
const wait = ms => new Promise(r => setTimeout(r, ms));

let wsUrl;
for (let i = 0; i < 50 && !wsUrl; i++) {
  try { const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); wsUrl = list.find(t => t.type === "page")?.webSocketDebuggerUrl; } catch {}
  if (!wsUrl) await wait(200);
}
if (!wsUrl) { console.error("Edge did not start"); proc.kill(); process.exit(1); }

const ws = new WebSocket(wsUrl);
await new Promise(r => ws.addEventListener("open", r, { once: true }));
let id = 0; const pending = new Map();
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
const base = pathToFileURL(page).href;
for (const scheme of ["light", "dark"]) {
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: scheme }] });
  for (const s of STATES) {
    await send("Page.navigate", { url: "about:blank" });
    await send("Page.navigate", { url: `${base}#${s}` });
    await wait(1200); // fonts + first render
    const shot = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(join(out, `${s}-${scheme}.png`), Buffer.from(shot.result.data, "base64"));
  }
}
await send("Browser.close").catch(() => {}); ws.close(); proc.kill();
console.log(`Wrote ${STATES.length * 2} screenshots to ${out}`);
