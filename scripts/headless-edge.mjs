// Launch a headless Edge (or BROWSER=/path/to/chromium) for a CDP script, and make sure every process it starts is gone
// when the script ends, however it ends.
//
// Why: on Windows `proc.kill()` ends only Edge's main process; its renderer, GPU and utility processes keep running.
// A script killed mid-run (Ctrl+C, a timeout, a task manager) leaves the whole browser behind. Leftovers from screenshot
// runs once piled up to about 400 processes and froze the machine.
//
// How:
// - teardown kills the whole process tree (taskkill /T /F on Windows, the process group elsewhere) and deletes the
//   temporary profile;
// - it runs on a normal exit, on an error, and on Ctrl+C or a terminate signal;
// - a small detached watchdog process does the same if this script is force-killed and none of that gets to run.
import { spawn, spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const WIN = process.platform === "win32";
export const EDGE = process.env.BROWSER || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";

function killTree(pid) {
  if (!pid) return;
  if (WIN) spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
  else { try { process.kill(-pid, "SIGKILL"); } catch {} try { process.kill(pid, "SIGKILL"); } catch {} }
}

/** Start a headless browser with remote debugging on `port`. Returns { proc, port, profile, close }. */
export function launchEdge({ port, prefix = "nc-edge", args = [] } = {}) {
  port ??= 9333 + Math.floor(Math.random() * 600);
  const profile = join(tmpdir(), `${prefix}-${Date.now()}`);
  const proc = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-first-run",
    ...(process.platform === "linux" ? ["--no-sandbox"] : []), ...args, "about:blank"], { stdio: "ignore", detached: !WIN, windowsHide: true });

  // the watchdog: if this script dies without cleaning up, it kills the browser's tree and removes the profile
  const dog = spawn(process.execPath, ["-e", `
    const { spawnSync } = require("node:child_process"); const { rmSync } = require("node:fs");
    const [parent, pid, profile, win] = [${process.pid}, ${proc.pid}, ${JSON.stringify(profile)}, ${WIN}];
    const alive = p => { try { process.kill(p, 0); return true; } catch { return false; } };
    setInterval(() => {
      if (!alive(pid)) process.exit(0);
      if (alive(parent)) return;
      if (win) spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
      else { try { process.kill(-pid, "SIGKILL"); } catch {} try { process.kill(pid, "SIGKILL"); } catch {} }
      setTimeout(() => { try { rmSync(profile, { recursive: true, force: true }); } catch {} process.exit(0); }, 1500);
    }, 1000);`], { detached: true, stdio: "ignore", windowsHide: true });
  dog.unref();

  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    killTree(proc.pid);
    try { dog.kill(); } catch {}
    // the profile can stay locked for a moment after the kill
    for (let i = 0; i < 5; i++) { try { rmSync(profile, { recursive: true, force: true }); break; } catch { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200); } }
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
