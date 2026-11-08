// Renders apps/web/public/icon.svg to the PNG sizes the PWA manifest and iOS need.
// No dependencies: headless Edge over CDP (same approach as prototypes/shoot.mjs).
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "apps/web/public");
const svg = readFileSync(join(pub, "icon.svg"), "utf8");
const SIZES = { "icon-512.png": 512, "icon-192.png": 192, "apple-touch-icon.png": 180 };
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = 9400 + Math.floor(Math.random() * 400);
const proc = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${join(tmpdir(), "nc-icons-" + PORT)}`, "about:blank"], { stdio: "ignore" });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
for (let i = 0; i < 50 && !ws; i++) {
  try { const t = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((x) => x.type === "page"); if (t) ws = t.webSocketDebuggerUrl; } catch {}
  if (!ws) await wait(200);
}
const sock = new WebSocket(ws);
await new Promise((r) => sock.addEventListener("open", r, { once: true }));
let id = 0; const pending = new Map();
sock.addEventListener("message", (e) => { const m = JSON.parse(e.data); pending.get(m.id)?.(m); pending.delete(m.id); });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
const html = `data:text/html,${encodeURIComponent(`<html><body style="margin:0;background:transparent">${svg.replace("<svg ", '<svg style="display:block;width:100vw;height:100vh" ')}</body></html>`)}`;
for (const [file, size] of Object.entries(SIZES)) {
  await send("Emulation.setDeviceMetricsOverride", { width: size, height: size, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: html });
  await wait(400);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(pub, file), Buffer.from(shot.result.data, "base64"));
}
await send("Browser.close"); sock.close(); proc.kill();
console.log("icons written:", Object.keys(SIZES).join(", "));
