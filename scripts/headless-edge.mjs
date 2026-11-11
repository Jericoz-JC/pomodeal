// Launch a headless Edge (or BROWSER=/path/to/chromium) for a CDP script, and make sure every process it starts is gone
// when the script ends, however it ends.
//
// Why: on Windows `proc.kill()` ends only Edge's main process; its renderer, GPU and utility processes keep running.
// A script killed mid-run (Ctrl+C, a timeout, a task manager) leaves the whole browser behind, and if Edge's main process
// dies first its children are orphaned, so even killing "the tree" from its PID finds nothing. Leftovers from screenshot
// runs once piled up to about 400 processes and froze the machine.
//
// How: every process of this browser carries its own temporary --user-data-dir on its command line, so teardown kills
// every browser process whose command line names that profile, whoever its parent is, then deletes the profile.
// - It runs on a normal exit, on an error, and on Ctrl+C or a terminate signal.
// - A small detached watchdog does the same if this script is force-killed and none of that gets to run.
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const WIN = process.platform === "win32";
export const EDGE = process.env.BROWSER || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";

/* kills every process whose command line names the profile folder; the same code runs in the watchdog */
const SWEEP = `function sweep(profile, win) {
  const { spawnSync } = require("node:child_process");
  const tag = require("node:path").basename(profile);
  if (win) spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command",
    "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*" + tag + "*' -and $_.ProcessId -ne $PID -and $_.Name -ne 'node.exe' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"],
    { stdio: "ignore", windowsHide: true });
  else spawnSync("pkill", ["-9", "-f", tag], { stdio: "ignore" });
  for (let i = 0; i < 10; i++) { try { require("node:fs").rmSync(profile, { recursive: true, force: true }); break; } catch { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200); } }
}`;
const sweep = new Function("require", `${SWEEP}; return sweep;`)(await import("node:module").then(m => m.createRequire(import.meta.url)));

/** Start a headless browser with remote debugging on `port`. Returns { proc, port, profile, close }. */
export function launchEdge({ port, prefix = "nc-edge", args = [] } = {}) {
  port ??= 9333 + Math.floor(Math.random() * 600);
  const profile = join(tmpdir(), `${prefix}-${Date.now()}-${process.pid}`);
  const proc = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-first-run",
    ...(process.platform === "linux" ? ["--no-sandbox"] : []), ...args, "about:blank"], { stdio: "ignore", windowsHide: true });

  // the watchdog: once this script is gone, it sweeps the browser's processes and its profile, then exits. It must
  // outlive this script however it is stopped, so it is never in this script's process tree or job.
  const dogFile = `${profile}.watchdog.cjs`;
  writeFileSync(dogFile, `${SWEEP}
    const parent = ${process.pid}, profile = ${JSON.stringify(profile)}, win = ${WIN};
    const alive = p => { try { process.kill(p, 0); return true; } catch { return false; } };
    setInterval(() => { if (alive(parent)) return; sweep(profile, win); try { require("node:fs").rmSync(__filename, { force: true }); } catch {} process.exit(0); }, 1000);`);
  // On Windows a tool that stops this script may kill its whole job object, and every process started from here is in
  // that job (Edge's browser process breaks away from it, so it survives). The watchdog is created by WMI instead,
  // which puts it outside the job.
  const dog = WIN
    ? spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand", Buffer.from(
        `Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = '"${process.execPath}" "${dogFile}"' } | Out-Null`, "utf16le").toString("base64")],
        { detached: true, stdio: "ignore", windowsHide: true })
    : spawn(process.execPath, [dogFile], { detached: true, stdio: "ignore" });
  dog.unref();

  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    try { dog.kill(); } catch {}
    try { proc.kill(); } catch {}
    sweep(profile, WIN);
  };
  process.once("exit", close);
  for (const sig of ["SIGINT", "SIGTERM", "SIGHUP", "SIGBREAK"]) process.once(sig, () => { close(); process.exit(130); });
  process.once("uncaughtException", e => { close(); console.error(e); process.exit(1); });
  process.once("unhandledRejection", e => { close(); console.error(e); process.exit(1); });
  return { proc, port, profile, close };
}

/** Wait for the browser's debugging endpoint; returns the first page target's WebSocket URL, or exits with an error. */
export async function pageSocketUrl(port, tries = 50) {
  for (let i = 0; i < tries; i++) {
    try { const t = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(x => x.type === "page"); if (t) return t.webSocketDebuggerUrl; } catch {}
    await new Promise(r => setTimeout(r, 200));
  }
  console.error("Edge did not start"); process.exit(1); // the exit handler closes the browser
}
