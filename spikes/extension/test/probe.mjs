// Can this browser load the unpacked build from the command line?
import { chromium } from "playwright";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
const ext = resolve(".output/chrome-mv3");
const channel = process.argv[2]; // "msedge", "chrome", or undefined for bundled Chromium
const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), "pd-probe-")), {
  channel, headless: false,
  args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
});
let [sw] = ctx.serviceWorkers();
sw ??= await ctx.waitForEvent("serviceworker", { timeout: 8000 }).catch(() => null);
console.log(channel ?? "chromium", ctx.browser()?.version?.() ?? "", sw ? `loaded: ${sw.url()}` : "NOT loaded");
await ctx.close();
