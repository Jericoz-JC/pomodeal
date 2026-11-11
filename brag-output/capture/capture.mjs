// Records clips of the real Pomodeal prototype for the launch video: every frame is stepped on a fake clock
// (fakeclock.js) and screenshotted at 2 to 3 device pixels per CSS pixel, so the app is sharp and motion is exact.
// Usage: node capture.mjs <clip|all> [--sheet]     --sheet writes a contact sheet (4 frames a second) instead of a clip
import { createServer } from "node:http";
import { readFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { spawn, execFileSync } from "node:child_process";
import { resolve, dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { CLIPS } from "./clips.mjs";

const here = dirname(fileURLToPath(import.meta.url)), repo = resolve(here, "../..");
const { chromium } = createRequire(import.meta.url)("playwright");
const want = process.argv[2] || "all", SHEET = process.argv.includes("--sheet");
const FPS = 60, OUT = name => resolve(here, name.startsWith("desk") ? "../desk-ad/assets/clips" : "../phone-ad/assets/clips"), SHEETS = resolve(here, "sheets");
mkdirSync(SHEETS, { recursive: true });

// the prototype has no charset tag: serve it as UTF-8 so its "×" and quotes come through
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".css": "text/css" };
const server = createServer((q, s) => {
  try { const p = join(repo, decodeURIComponent(q.url.split("?")[0])); s.writeHead(200, { "content-type": TYPES[extname(p)] || "application/octet-stream" }); s.end(readFileSync(p)); }
  catch { s.writeHead(404); s.end(); }
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}/prototypes/quick-deal/index.html`;

/* what the recording adds to the page: the prototype's own control bar hidden, and a finger or pointer to follow */
const CSS = `.proto{display:none!important} html{scrollbar-width:none} ::-webkit-scrollbar{display:none}
#__cur{position:fixed;left:0;top:0;z-index:99999;pointer-events:none;will-change:transform}
#__cur.touch{width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:rgba(22,32,27,.26);box-shadow:0 0 0 1.5px rgba(255,255,255,.75),0 2px 10px rgba(0,0,0,.18)}
#__cur.mouse{width:22px;height:30px}`;
const ARROW = `<svg viewBox="0 0 22 30" width="22" height="30"><path d="M2 2v22l5.6-5.2 3.7 8.6 3.4-1.5-3.7-8.5H19z" fill="#16201b" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

async function record(browser, clip) {
  const ctx = await browser.newContext({ viewport: { width: clip.w, height: clip.h }, deviceScaleFactor: clip.dpr, isMobile: !!clip.touch, hasTouch: !!clip.touch, colorScheme: clip.scheme || "light" });
  await ctx.addInitScript({ path: join(here, "fakeclock.js") });
  const page = await ctx.newPage();
  page.on("pageerror", e => console.warn(`  page error: ${e.message}`));
  await page.goto(`${base}#${clip.hash}`);
  await page.addStyleTag({ content: CSS });
  await page.evaluate(([touch, arrow]) => { const c = document.createElement("div"); c.id = "__cur"; c.className = touch ? "touch" : "mouse"; if (!touch) c.innerHTML = arrow; c.style.opacity = "0"; document.body.append(c); }, [!!clip.touch, ARROW]);
  await page.evaluate(() => document.fonts.ready.then(() => true));
  await page.evaluate("speed = 1");
  if (clip.setup) await page.evaluate(clip.setup);
  for (let i = 0; i < 90; i++) await page.evaluate(() => __advance(1000 / 60)); // let the first render and its entrances settle
  await page.evaluate(() => document.fonts.ready.then(() => true));

  /* the finger: where it is, where it is going */
  const cur = { x: clip.cursor?.[0] ?? clip.w * .7, y: clip.cursor?.[1] ?? clip.h * .8, from: null, on: 0, down: false };
  const centre = async sel => { const b = await page.locator(sel).first().boundingBox(); if (!b) throw new Error(`${clip.name}: nothing matches ${sel}`); return [b.x + b.width * (clip.aim?.[sel]?.[0] ?? .5), b.y + b.height * (clip.aim?.[sel]?.[1] ?? .5)]; };
  /* the script is a list of timed steps (ms from the clip's start) */
  const steps = [];
  const api = {
    at: (t, fn) => steps.push({ t, fn }),
    /* move in over `lead` ms, press at t, release 90 ms later */
    tap: (t, sel, lead = 420) => {
      steps.push({ t: t - lead, fn: async () => { const [x, y] = await centre(sel); cur.from = { x: cur.x, y: cur.y, tx: x, ty: y, t0: now, dur: lead }; cur.show = true; } });
      steps.push({ t, fn: async () => { const [x, y] = await centre(sel); cur.x = x; cur.y = y; cur.from = null; cur.down = true; await page.mouse.move(x, y); await page.mouse.down(); } });
      steps.push({ t: t + 90, fn: async () => { cur.down = false; await page.mouse.up(); } });
    },
    type: (t, text, per = 55) => { [...text].forEach((ch, i) => steps.push({ t: t + i * per, fn: () => page.keyboard.type(ch) })); return t + text.length * per; },
    key: (t, k) => steps.push({ t, fn: () => page.keyboard.press(k) }),
    js: (t, code) => steps.push({ t, fn: () => page.evaluate(code) }),
    /* glide to a point and rest there */
    move: (t, x, y, dur = 400) => steps.push({ t, fn: () => { cur.from = { x: cur.x, y: cur.y, tx: x, ty: y, t0: now, dur }; } }),
    hide: t => steps.push({ t, fn: () => { cur.show = false; } }),
    /* press at one element, drag by (dx, dy) over dur */
    drag: (t, sel, dx, dy, dur = 600, lead = 420) => {
      steps.push({ t: t - lead, fn: async () => { const [x, y] = await centre(sel); cur.from = { x: cur.x, y: cur.y, tx: x, ty: y, t0: now, dur: lead }; cur.show = true; } });
      steps.push({ t, fn: async () => { const [x, y] = await centre(sel); cur.x = x; cur.y = y; cur.down = true; await page.mouse.move(x, y); await page.mouse.down(); cur.from = { x, y, tx: x + dx, ty: y + dy, t0: now, dur, held: true }; } });
      steps.push({ t: t + dur + 60, fn: async () => { cur.down = false; cur.from = null; await page.mouse.up(); } });
    },
  };
  let now = 0;
  clip.script(api);
  steps.sort((a, b) => a.t - b.t);

  const total = Math.round(clip.dur * FPS / 1000), every = SHEET ? 15 : 1;
  const tmp = join(SHEETS, `.${clip.name}`); rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
  mkdirSync(OUT(clip.name), { recursive: true }); const file = join(OUT(clip.name), `${clip.name}.mp4`);
  const ff = SHEET ? null : spawn("ffmpeg", ["-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "png", "-i", "-",
    "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-c:v", "libx264", "-preset", "slow", "-crf", "8", "-pix_fmt", "yuv420p", "-g", "30", "-movflags", "+faststart", file], { stdio: ["pipe", "inherit", "inherit"] });
  let si = 0, shots = 0;
  for (let f = 0; f < total; f++) {
    now = f * 1000 / FPS;
    while (si < steps.length && steps[si].t <= now) await steps[si++].fn();
    if (cur.from) {
      const k = Math.min(1, (now - cur.from.t0) / cur.from.dur), e = ease(k);
      cur.x = cur.from.x + (cur.from.tx - cur.from.x) * e; cur.y = cur.from.y + (cur.from.ty - cur.from.y) * e;
      if (cur.from.held) await page.mouse.move(cur.x, cur.y);
      if (k >= 1 && !cur.from.held) cur.from = null;
    }
    cur.on += ((cur.show && !clip.touch ? 1 : 0) - cur.on) * .3; // no finger drawn on the phone: the app's own stamps and sheets show each press
    await page.evaluate(([dt, x, y, on, down]) => {
      __advance(dt);
      const c = document.getElementById("__cur"); if (c) { c.style.transform = `translate(${x}px, ${y}px) scale(${down ? .8 : 1})`; c.style.opacity = on.toFixed(3); }
    }, [1000 / FPS, cur.x, cur.y, cur.on, cur.down]);
    if (f % every === 0) {
      const png = await page.screenshot({ type: "png", scale: "device" });
      if (ff) { if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once("drain", r)); }
      else { (await import("node:fs")).writeFileSync(join(tmp, `${String(shots).padStart(4, "0")}.png`), png); }
      shots++;
    }
  }
  if (ff) { ff.stdin.end(); await new Promise(r => ff.on("close", r)); console.log(`${clip.name}: ${total} frames, ${clip.w * clip.dpr}x${clip.h * clip.dpr} -> ${file}`); }
  else {
    const cols = Math.min(shots, clip.w > 600 ? 4 : 8), sw = clip.w > 600 ? 640 : 300;
    execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-framerate", "1", "-i", join(tmp, "%04d.png"), "-vf", `scale=${sw}:-1,tile=${cols}x${Math.ceil(shots / cols)}:padding=6:color=0x8a938c`, "-frames:v", "1", join(SHEETS, `${clip.name}.png`)]);
    console.log(`${clip.name}: sheet of ${shots} frames (one every 250 ms) -> ${join(SHEETS, `${clip.name}.png`)}`);
  }
  rmSync(tmp, { recursive: true, force: true });
  await ctx.close();
}

const browser = await chromium.launch();
try { for (const c of CLIPS) if (want === "all" || want.split(",").includes(c.name)) await record(browser, c); }
finally { await browser.close(); server.close(); }
