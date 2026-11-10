import { readFileSync } from "node:fs";
import { defineConfig } from "wxt";

// The public half of a throwaway key pins the unpacked extension ID, so the
// localhost handshake page can address it. The private half was never saved.
const spikeKey = JSON.parse(readFileSync(new URL("./spike-key.json", import.meta.url), "utf8")) as { key: string; id: string };

export default defineConfig({
  webExt: { disabled: true },
  manifest: {
    name: "Pomodeal extension spike (E0)",
    description: "Throwaway spike: side panel, alarm-driven block end, break-over overlay, localhost handshake.",
    key: spikeKey.key,
    minimum_chrome_version: "116",
    action: { default_title: "Open Pomodeal" },
    permissions: ["sidePanel", "alarms", "storage", "scripting", "notifications"],
    // Product plan: host access is an optional permission requested when someone turns on enforcement.
    // The spike asks for it from the side panel, see "Allow the overlay".
    optional_host_permissions: ["<all_urls>"],
    // Automation can't click Chrome's permission prompt, so the e2e build pre-grants localhost only.
    // 127.0.0.1 stays ungranted and stands in for "a tab we can't draw on".
    ...(process.env.SPIKE_E2E ? { host_permissions: ["http://localhost/*"] } : {}),
    externally_connectable: {
      matches: ["http://localhost/*", "https://pomodeal.app/*"],
    },
  },
});
