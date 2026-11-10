# E0 extension spike (throwaway)

Milestone E0 from [docs/06-chrome-extension-roadmap.md](../../docs/06-chrome-extension-roadmap.md), covering Phase 0 spikes S2 (handshake) and S3 (alarms, side panel, overlay). This code proves platform behaviour and then gets thrown away. **Nothing here goes into `apps/`.** E1 starts a clean `apps/extension` and copies ideas from here, not files.

Not an npm workspace (the root only lists `apps/*` and `packages/*`), so Cloudflare's `npm run build` never touches it.

## Run it

```bash
cd spikes/extension
npm install
npx wxt build                      # product build: .output/chrome-mv3
SPIKE_E2E=1 npx wxt build          # test build: also pre-grants http://localhost/*
node test/e2e.mjs                  # needs the test build; headless Edge, about 4 minutes
node test/e2e.mjs --headed         # same, with a visible window
npm run fixtures                   # serve the fixture pages on :5174 and :5199 for manual poking
```

Load by hand: edge://extensions (or chrome://extensions) → Developer mode → Load unpacked → `.output/chrome-mv3`. The pinned key gives the ID `higlkgdggjekbokkgpmojpmbjbmgenal` everywhere.

## What's here

| File | Job |
| --- | --- |
| `entrypoints/background.ts` | Service worker. Starts and ends blocks, owns `chrome.alarms`, reconciles storage against alarms on every boot, injects the overlay, takes the `auth/v1` handshake |
| `entrypoints/sidepanel/` | Side panel: ring and remaining time (from `endsAt`), test-block buttons, overlay permission, link status, worker log |
| `entrypoints/overlay.content.ts` | Break-over overlay in a closed shadow root, injected on demand, never declared in the manifest |
| `lib/protocol.ts` | Versioned messages, validators, stable error codes |
| `test/e2e.mjs` | 38 checks against the built extension in branded Edge |
| `test/fixtures/` | A hostile page (aggressive CSS, patched `attachShadow`, optional Esc-swallowing) and a stand-in for the web app's Connect extension button |
| `test/probe.mjs` | One-liner that tells you whether a browser still accepts `--load-extension` |
| `spike-key.json` | Public key only (pins the ID). The private half was never saved |

## Results (Edge 157.0.4341.42, Windows 11, headless, 9 Nov 2026)

38/38 checks pass. The full output is in `test/results/results.json` after a run, along with screenshots.

### Worked

- **Alarm survives the worker being killed.** A 20 s break, worker force-stopped right after start (CDP `ServiceWorker.stopAllWorkers`, confirmed by `workerVersionUpdated` → `stopped`): a fresh worker instance booted, the alarm fired 0 s late, and the overlay was on the page 0.1–0.2 s after `endsAt`. Same result with two kills in one break.
- **Browser restart mid-break.** Closed the browser 3 s into a 40 s break, reopened 5 s later: the boot reconcile found the block running with no alarm, re-armed it with 31 s left, and the overlay appeared 0.2 s after `endsAt`.
- **Break ends while the browser is closed.** On the next launch the reconcile ended it ("via reconcile, 8 s after endsAt"), then fell back to a notification because the active tab was the extension's own page.
- **Closed shadow root holds up against a hostile page.** `host.shadowRoot` is `null` to the page. The page's patched `Element.prototype.attachShadow` never saw the call, because content scripts run in an isolated world with their own prototypes. Rules like `[style] { display: none !important }` and `pomodeal-overlay { z-index: -1 !important }` lost to the host's inline `!important` styles. No magenta or Comic Sans got into the shadow root.
- **Overlay focus.** Focus moves to "Start reading" on show, Esc closes the overlay, and focus goes back to the input the person was typing in. The choice (`close`, `start-next`) reaches the worker.
- **No host access → clean fallback.** On a tab without host permission, `executeScript` fails with a clear message, and the worker logs it and sends a notification instead.
- **Handshake from localhost.** `chrome.runtime.sendMessage(EXT_ID, { type: "auth/v1", requestId, token })` from `http://localhost:5174` is accepted. The token goes to `storage.session` only, never to `storage.local` or the log. A stopped worker wakes for the message, and a second `auth/v1` replaces the token (the refresh path). Wrong token shape, oversized token, missing `requestId` and unknown type each get a stable error code.
- **Permissions at install:** `sidePanel`, `alarms`, `storage`, `scripting`, `notifications`, with `<all_urls>` only as an **optional** host permission. The product build has no `host_permissions` and no `tabs`. Neither was needed, because `tabs.query({ active: true })` returns the tab id without the URL.
- **Branded Edge still loads unpacked extensions from the command line.** Branded Chrome 157 does not (Chrome dropped `--load-extension` in 137). So automated tests run on Edge, or on Playwright's bundled Chromium.

### Did not work, or works with a catch

- **`externally_connectable` ignores the port.** `http://localhost/*` lets *every* localhost port talk to the extension (5199 reached the worker). The worker's own origin allowlist is what refused it. E1 must keep a worker-side allowlist and never trust the manifest match alone.
- **A page can swallow our Esc.** A page that calls `stopImmediatePropagation()` on Escape at window capture (common in web apps with their own modals) runs before our listener, so Esc does nothing. The visible close button, Enter and Tab still work, so the overlay never traps, but "Esc always works" isn't something we can promise. A page could also eat clicks the same way. E2 needs a way out that doesn't depend on the page: clicking the toolbar icon or the side panel's "End" should clear the overlay.
- **The automated run can't accept Chrome's permission prompt.** `permissions.request` needs a real click in browser UI. The e2e build pre-grants `http://localhost/*`, and `127.0.0.1` stands in for an ungranted site. The real "Allow the overlay on all sites" flow is **not yet checked by hand**.
- **The real side panel isn't automated.** `sidePanel.open` needs a user gesture on browser UI, so the tests open `sidepanel.html` as a tab at 360 px. Opening it from the toolbar icon (`openPanelOnActionClick`) is **not yet checked by hand**.
- **Command-line loading looks like a fresh install on every launch** (`onInstalled: install`, no `onStartup`, alarms gone). That makes the restart test stricter than reality, since the reconcile had to re-arm the alarm, but it means a Web Store install's restart behaviour (where alarms usually persist and `onStartup` fires) is **not yet seen**.
- **Alarm timing below 30 s is a dev-only luxury.** The 20 s alarms fired on time because unpacked extensions skip the 30 s minimum. Packed builds get clamped to 30 s. That's fine for real blocks (minutes long, with a 2-minute heads-up) but tests against a packed build need ≥30 s blocks.
- **Noisy reconcile.** When an alarm wakes the worker, the boot reconcile runs at the same moment, finds the alarm already consumed, and logs `alarm-missing` even though the alarm path then ends the block. That's harmless, because `endBlock` is serialized and idempotent, but E1 should skip the reconcile end when the alarm listener is about to handle it (for example, by running the reconcile after the alarm listener has run, or by treating "overdue by under 5 s" as the alarm's job).
- **The plugin's static checker gives three false positives on WXT output.** Its `Function(` pattern is case-insensitive and matches every `function(` (no `eval` or `new Function` in the bundles, confirmed with a case-sensitive grep). Its asset check can't resolve WXT's root-relative `/chunks/…` paths on Windows. The only real finding was version `0.0.0`, now `0.0.1`.
- **WXT gotcha:** a `registration: "runtime"` content script's `matches` gets copied into `host_permissions`. Leave `matches: []` or the optional permission turns into a required one.

## What E1 needs

1. **A real token to hand over.** The web app now uses WorkOS AuthKit with a refresh token in `localStorage` (`apps/web/src/main.ts`). E1 decides what the extension gets: the short-lived access token plus a refresh path through `auth/v1`, or a separate, narrower extension token minted by a Convex action. A Convex-minted token is better, because the extension shouldn't hold the web app's refresh token. In both cases the worker opens a `ConvexClient` with it while awake.
2. **A Connect extension button in the web app.** Get the extension ID from config (the Web Store ID in production, the pinned dev ID locally). Detect the extension with `ping/v1` (if `chrome.runtime` is missing or the call throws, the extension isn't installed), then send `auth/v1`. Add `https://pomodeal.app` and the Vite dev origin to the worker's allowlist, not just the manifest.
3. **Re-arm from Convex, not from local storage.** The spike's source of truth is `storage.local`. In E1 that's a cache: on every worker boot, read the active session from Convex, re-create the alarm at `endsAt`, then run the same idempotent end path. Keep the local copy so an offline wake can still end a break.
4. **A Web Store dev key.** Upload a draft to the Chrome Web Store once and copy its public key into the dev manifest, so the unpacked dev build and the store build share one ID. Otherwise `externally_connectable` callers need two IDs.
5. **Shared UI.** The side panel here is throwaway vanilla TS. E1 needs Phase 1's component move (`packages/ui`) so the dial, deal sheets and Coming up render the same way as on the phone. Package the fonts (Archivo, Atkinson Hyperlegible) into the extension rather than loading them from Google Fonts.
6. **Panel reads.** Writes go to the worker as messages, and reads come from `storage.onChanged`. That kept the panel live through worker restarts with no keepalive. Keep that split, and add a Convex subscription in the panel or worker for state from the phone.
7. **Manual checks to run once in branded Chrome and Edge:** open the side panel from the toolbar icon. Accept and revoke "Allow the overlay on all sites". See the overlay and the fallback on `chrome://`, the Web Store and a PDF. Restart a store-installed build mid-break. Sleep and wake the laptop. Try two windows.
8. **A Playwright suite in `apps/extension`** modelled on `test/e2e.mjs`, on Edge or bundled Chromium, with ≥30 s blocks against a packed build.
9. **Privacy inventory.** E0 stores no user behaviour. The only new stored fields are the block record and the worker log (local) and the token (session). When E1 or E3 stores anything about the person (the extension's token, then domain and time per block), `docs/specs/006-privacy-inventory.md` gets updated in the same change.
