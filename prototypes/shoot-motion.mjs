// Record each motion moment at true phone size (375 px), light, dark and reduced motion, so motion can be reviewed
// the way screenshots are. For every moment it writes:
//   <moment>-<variant>.png   a frame strip: one frame every STEP ms from just before the trigger, labelled with the time
//   <moment>.webm            a real-time clip with light | dark | reduced side by side (if the browser can encode it)
// Usage: node prototypes/shoot-motion.mjs <out-dir> [moment ...]
//   Moments: stamp, turn-break, turn-focus, heads-up, time-up, offer-open, offer-pick, ledger, landing
// No new dependencies: Edge over CDP (like shoot.mjs), Page.startScreencast for frames, the browser's own
// MediaRecorder for the clip. "landing" starts Vite in-process (apps/web, production env) to render the signed-out page.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(process.argv[2] || join(here, "quick-deal/shots/motion"));
const only = process.argv.slice(3);
const app = pathToFileURL(resolve(here, "quick-deal/index.html")).href;
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const W = 375, H = 812, STEP = 60;
const wait = ms => new Promise(r => setTimeout(r, ms));

/* each moment: where it starts, optional setup, the trigger (an expression returning the trigger time), how long to
   watch, and the part of the screen the strip crops to (CSS px). */
/* a click is a real pointer press at the element's center (a scripted .click() leaves focus rings a tap would not) */
const click = sel => ({ tap: sel });
const MOMENTS = {
  "stamp": { url: `${app}#start`, trigger: click("#shake"), ms: 1500, crop: [0, 40, W, 470] },
  "turn-break": { url: `${app}#bonus`, trigger: click("#bonusno"), ms: 1000, crop: [0, 40, W, 520] },
  "turn-focus": { url: `${app}#boundary`, trigger: click("#go"), ms: 1000, crop: [0, 40, W, 520] },
  "heads-up": { url: `${app}#running`, setup: "speed = 1", trigger: "(() => { vnow = S.startedAt + S.durMs - 120000 + 30; return Date.now(); })()", ms: 1500, crop: [0, 110, W, 560] },
  "time-up": { url: `${app}#running`, setup: "speed = 1", trigger: "(() => { vnow = S.startedAt + S.durMs - 30; return Date.now(); })()", ms: 1700, crop: [0, 0, W, H] },
  "offer-open": { url: `${app}#boundary`, setup: "S.askCount = 1", trigger: click("#ask2"), ms: 900, crop: [0, 300, W, H] },
  "offer-pick": { url: `${app}#offer-terms`, trigger: click('[data-term="0"]'), ms: 1200, crop: [0, 300, W, H] },
  "ledger": { url: `${app}#offer-terms`, setup: `seedLedger(); document.querySelector('[data-term="1"]').click()`, settle: 1500, trigger: click("#tab-ledger"), ms: 1200, crop: [0, 40, W, 700] },
  "landing": { landing: true, ms: 3800, step: 120, crop: [0, 200, W, 580] },
};
const VARIANTS = [
  { key: "light", scheme: "light", reduce: false },
  { key: "dark", scheme: "dark", reduce: false },
  { key: "reduced", scheme: "light", reduce: true },
];

mkdirSync(out, { recursive: true });

let vite = null;
async function landingUrl() {
  if (vite) return vite.url;
  await import(pathToFileURL(resolve(here, "../scripts/sync-prototype.mjs")).href);
  const { createServer } = await import("vite");
  const root = resolve(here, "../apps/web");
  process.chdir(root); // vite.config.ts finds the repo's .env files relative to the working directory
  const server = await createServer({ root, configFile: join(root, "vite.config.ts"), mode: "production", logLevel: "error", server: { port: 5190 + Math.floor(Math.random() * 200), strictPort: true } });
  await server.listen();
  vite = { server, url: server.resolvedUrls.local[0] };
  /* warm up: the first load pre-bundles dependencies and may reload the page, which would eat the recording */
  const t = await openTab(); await t.send("Page.navigate", { url: vite.url }); await wait(6000); await t.close();
  return vite.url;
}

const PORT = 9333 + Math.floor(Math.random() * 500);
const proc = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${join(tmpdir(), `nc-motion-${Date.now()}`)}`, "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required", "about:blank"], { stdio: "ignore" });
let up = false;
for (let i = 0; i < 50 && !up; i++) { try { await fetch(`http://127.0.0.1:${PORT}/json/version`); up = true; } catch { await wait(200); } }
if (!up) { console.error("Edge did not start"); proc.kill(); process.exit(1); }

/* one CDP connection per tab. Every recording gets a fresh tab: a screencast does not restart cleanly in a reused one. */
const errors = [];
async function openTab() {
  const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener("open", r, { once: true }));
  let id = 0; const pending = new Map(), listeners = new Set();
  ws.addEventListener("message", e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    else if (m.method) listeners.forEach(f => f(m));
  });
  const send = (method, params = {}) => new Promise((r, j) => {
    const i = ++id, timer = setTimeout(() => { pending.delete(i); j(new Error(`${method} timed out`)); }, 120000);
    pending.set(i, m => { clearTimeout(timer); r(m); }); ws.send(JSON.stringify({ id: i, method, params }));
  });
  const evaluate = async expr => {
    const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }).catch(e => { throw new Error(`${e.message}: ${expr.slice(0, 80)}`); });
    if (r.result?.exceptionDetails) throw new Error(`${expr.slice(0, 80)}: ${r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text}`);
    return r.result?.result?.value;
  };
  listeners.add(m => { if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); });
  await send("Page.enable"); await send("Runtime.enable");
  const close = async () => { ws.close(); await fetch(`http://127.0.0.1:${PORT}/json/close/${t.id}`).catch(() => {}); };
  return { send, evaluate, listeners, close };
}

async function record(m, v) {
  const { send, evaluate, listeners, close } = await openTab();
  await send("Page.bringToFront"); // a background tab gets no animation frames: only timers would run
  await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 2, mobile: true });
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: v.scheme }, { name: "prefers-reduced-motion", value: v.reduce ? "reduce" : "no-preference" }] });
  const frames = [];
  listeners.add(msg => {
    if (msg.method !== "Page.screencastFrame") return;
    frames.push({ t: msg.params.metadata.timestamp * 1000, data: msg.params.data });
    send("Page.screencastFrameAck", { sessionId: msg.params.sessionId }).catch(() => {});
  });
  const cast = () => send("Page.startScreencast", { format: "jpeg", quality: 82, maxWidth: W * 2, maxHeight: H * 2 });
  let t0;
  if (m.landing) {
    const url = await landingUrl();
    await cast(); t0 = Date.now(); await send("Page.navigate", { url });
  } else {
    await send("Page.navigate", { url: m.url }); await wait(600);
    await evaluate("document.fonts.ready.then(() => true)"); await wait(400); // never record a font swap
    if (m.setup) { await evaluate(m.setup); await wait(m.settle || 200); }
    await cast(); await wait(250);
    if (m.trigger.tap) {
      const [x, y] = await evaluate(`(() => { const r = document.querySelector(${JSON.stringify(m.trigger.tap)}).getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
      await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
      t0 = await evaluate("Date.now()");
      await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
    } else t0 = await evaluate(m.trigger);
  }
  await wait(m.ms + 150);
  await send("Page.stopScreencast"); await close();
  return { t0, frames: frames.map(f => ({ at: f.t - t0, data: f.data })) };
}

let rv = null; // the tab that renders strips and clips
/* review pages go through a temp file: large pages are too slow to push through Runtime.evaluate */
const pages = join(tmpdir(), `nc-motion-pages-${Date.now()}`); mkdirSync(pages, { recursive: true });
let pageN = 0;
async function openPage(html) {
  const f = join(pages, `p${++pageN}.html`); writeFileSync(f, html);
  await rv.send("Page.bringToFront"); // background tabs get no animation frames
  await rv.send("Page.navigate", { url: pathToFileURL(f).href });
  await rv.evaluate("new Promise(r => document.readyState === 'complete' ? r() : addEventListener('load', () => r()))");
}

/* the frame on screen at time `at`: the last one delivered at or before it (the screencast only sends changes) */
const frameAt = (frames, at) => { let best = frames[0]; for (const f of frames) if (f.at <= at) best = f; return best; };

async function strip(name, m, v, rec) {
  const [cx, cy, cw, ch] = m.crop, times = [];
  const step = m.step || STEP;
  for (let t = -step; t <= m.ms; t += step) times.push(t);
  const scale = cw > 300 && ch > 600 ? 0.5 : 1; // whole-screen moments shrink so the strip stays readable
  const cols = scale < 1 ? 8 : 6;
  const cells = times.map(t => { const f = frameAt(rec.frames, t); return `<figure><div style="width:${cw * scale}px;height:${ch * scale}px"><img src="data:image/jpeg;base64,${f.data}" style="width:${W * scale}px;margin:${-cy * scale}px 0 0 ${-cx * scale}px"></div><figcaption>${t < 0 ? "before" : `${t} ms`}</figcaption></figure>`; }).join("");
  const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:16px;background:#9aa39c;font:600 13px system-ui}h1{font-size:15px;margin:0 0 10px}
    .g{display:grid;grid-template-columns:repeat(${cols},max-content);gap:10px}figure{margin:0}figure div{overflow:hidden;border-radius:6px;box-shadow:0 0 0 1px #0003}figcaption{padding-top:3px}</style>
    <h1>${name}, ${v.key}: one frame every ${step} ms from the trigger</h1><div class="g">${cells}</div>`;
  await openPage(html);
  const size = await rv.evaluate("[document.documentElement.scrollWidth, document.documentElement.scrollHeight]");
  const shot = await rv.send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: size[0], height: size[1], scale: 1 }, captureBeyondViewport: true });
  writeFileSync(join(out, `${name}-${v.key}.png`), Buffer.from(shot.result.data, "base64"));
}

/* light | dark | reduced side by side, played back at real speed into the browser's own WebM encoder */
async function clip(name, m, recs) {
  const lead = 400, tail = 700, dur = lead + m.ms + tail;
  const tracks = recs.map(r => ({ key: r.v.key, frames: r.rec.frames.map(f => ({ at: f.at, src: `data:image/jpeg;base64,${f.data}` })) }));
  await openPage(`<!doctype html><meta charset="utf-8"><body style="margin:0"><script>window.TRACKS = ${JSON.stringify(tracks).replace(/</g, "\u003c")};</script>`);
  const b64 = await rv.evaluate(`(async () => {
    const tracks = window.TRACKS, W = ${W}, H = ${H}, lead = ${lead}, dur = ${dur}, gap = 12, label = 30;
    for (const t of tracks) for (const f of t.frames) { f.img = new Image(); await new Promise(r => { f.img.onload = f.img.onerror = r; f.img.src = f.src; }); }
    const c = document.createElement("canvas"); c.width = (W * 3 + gap * 4); c.height = H + label + gap; document.body.append(c);
    const g = c.getContext("2d");
    if (!window.MediaRecorder || !c.captureStream) return null;
    const rec = new MediaRecorder(c.captureStream(30), { mimeType: "video/webm", videoBitsPerSecond: 6e6 }), parts = [];
    rec.ondataavailable = e => parts.push(e.data);
    const draw = at => {
      g.fillStyle = "#9aa39c"; g.fillRect(0, 0, c.width, c.height);
      tracks.forEach((t, i) => { let best = t.frames[0]; for (const f of t.frames) if (f.at <= at) best = f;
        const x = gap + i * (W + gap); g.drawImage(best.img, x, gap, W, H);
        g.fillStyle = "#16201b"; g.font = "600 16px system-ui"; g.fillText(t.key === "reduced" ? "reduced motion" : t.key, x, H + gap + 21); });
    };
    draw(-lead); rec.start();
    const start = performance.now();
    await new Promise(done => { const loop = () => { const at = performance.now() - start - lead; draw(Math.min(at, dur - lead)); if (at < dur - lead) requestAnimationFrame(loop); else done(); }; requestAnimationFrame(loop); });
    rec.stop(); await new Promise(r => rec.onstop = r);
    const buf = new Uint8Array(await new Blob(parts, { type: "video/webm" }).arrayBuffer());
    let s = ""; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return btoa(s);
  })()`);
  if (b64) writeFileSync(join(out, `${name}.webm`), Buffer.from(b64, "base64"));
  else console.warn(`no MediaRecorder: skipped ${name}.webm`);
}

try {
  rv = await openTab();
  for (const [name, m] of Object.entries(MOMENTS)) {
    if (only.length && !only.includes(name)) continue;
    /* record every variant before building any review page: screenshots of big pages stall the screencast */
    const recs = [];
    for (const v of VARIANTS) {
      /* a fresh tab now and then comes up without painting; one retry covers it */
      let rec = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try { rec = await record(m, v); } catch (e) { console.warn(`${name} ${v.key}: ${e.message.slice(0, 120)}`); rec = null; }
        if (rec && rec.frames.length >= (v.reduce ? 2 : 10)) break;
      }
      if (!rec || !rec.frames.length) console.warn(`${name} ${v.key}: no frames`); else recs.push({ v, rec });
    }
    for (const r of recs) await strip(name, m, r.v, r.rec);
    if (recs.length === 3) await clip(name, m, recs);
    console.log(`${name}: ${recs.map(r => `${r.v.key} ${r.rec.frames.length} frames`).join(", ")}`);
  }
} finally {
  if (errors.length) console.error("Page errors:\n" + [...new Set(errors)].join("\n"));
  proc.kill();
  if (vite) await vite.server.close();
}
console.log(`Wrote motion strips and clips to ${out}`);
process.exit(0); // the in-process Vite server keeps Node alive otherwise
