# Chrome Extension Roadmap

The extension is the **desktop enforcer**: it lives beside your tabs, ends the break you chose by dimming the tab, and records which sites you were on during a block (domain and time only). The PWA stays the home of everything; the extension never has its own source of truth. Built against the Chrome Extension Builder plugin's architecture guidance.

Targets: Chrome and Edge first (Manifest V3, same build), then Brave and Arc (Chromium, no changes), Firefox later only if asked (MV3 differences in side panel and service workers).

## Architecture

```
          ┌──────────── Convex (source of truth) ────────────┐
          │ sessions, ledger, rooms · scheduled block ends   │
          └───────▲──────────────────────────────▲───────────┘
                  │ subscribe / mutate           │ subscribe / mutate
         ┌────────┴────────┐            ┌────────┴──────────────────────────┐
         │ PWA (phone/web) │  token ──► │ Extension                          │
         └─────────────────┘ handshake  │  service worker: alarms, tab events│
                                        │  side panel: dial + deal sheets    │
                                        │  content script: break-over overlay│
                                        │  popup: Quick Deal                 │
                                        └────────────────────────────────────┘
```

| Context | Owns | Never does |
| --- | --- | --- |
| **Service worker** | Convex subscription while awake; `chrome.alarms` at every block end (re-armed from Convex on wake); active-tab domain tracking; telling content scripts to show or clear the overlay | Hold the only copy of timer state; keepalive loops |
| **Side panel** (main UI) | The dial, the deal sheets, Coming up, the ledger, room presence. Reuses the web components | Talk to Chrome APIs directly (messages go through the worker) |
| **Content script** | The "break's over" overlay on the current tab, in a closed shadow root so page CSS can't touch it | Read page content, DOM text or full URLs |
| **Popup** | One-tap Quick Deal and "open side panel" | Anything that would be lost when it closes |
| **Options page** | Enforcement level, blocked domains, data export and delete, sign out | |

Shared code: `packages/core` (rules, timer math) and the UI components from `apps/web` once Phase 1 moves them to components. Build tool: **WXT** (structured entrypoints, Vite underneath, same toolchain as the web app).

## Permissions (each justified for Chrome Web Store review)

| Permission | Why | Notes |
| --- | --- | --- |
| `sidePanel` | Main UI beside the page | |
| `alarms` | Fire block ends while the worker sleeps | 30-second minimum granularity is fine with a 2-minute heads-up |
| `storage` | Settings in `sync`; the auth token in `session` (never synced) | |
| `tabs` | Read the active tab's **domain** for intention vs reality | Only `new URL(tab.url).hostname` is kept; full URLs are dropped in memory |
| `scripting` + host access | Inject the break-over overlay | **Optional permission**, requested the first time someone turns on enforcement, so installing asks for almost nothing |
| `notifications` | Heads-up and block-end when the side panel is closed | |

Not requested: `history`, `webRequest`, `<all_urls>` at install, `cookies` (auth uses the handshake below).

## Auth handshake

The web app and the extension share one account without a password in the extension:

1. The extension's manifest lists the app's domain in `externally_connectable`.
2. Signed into the PWA, the person clicks **Connect extension**; the page calls `chrome.runtime.sendMessage(EXT_ID, { type: "auth/v1", token })`.
3. The worker validates the sender origin against its own allowlist (the manifest match ignores ports, so it isn't enough alone), stores the token in `chrome.storage.session`, and opens a Convex client with it. Refresh goes through the same message. Which token this is, the web app's own or a limited one issued for the extension, is decided at E1 (see E0 results).
4. Until auth lands (Phase 1), the handshake passes the anonymous `deviceId` instead, so the extension and the web app see the same sessions.

Messages are versioned (`auth/v1`, `deal/v1`, …), carry a request id, validate their payloads, and return stable error codes.

## Enforcement levels (the person chooses; never on by default)

1. **Nudge** (default): notification at heads-up and at block end.
2. **Dim:** at break end, the overlay covers the tab with "Reels time is up. Reading is next" plus **Start reading**, **Ask for 5 more** (opens the same deal sheet) and **I need this**. It never traps: a visible close always works, and so does Esc unless the page captures that key itself (see E0 results).
3. **Close:** after a dim that's ignored for 2 minutes, close the tab and reopen the study tab if one was set.
4. **Focus guard:** during focus blocks, opening a site on your own distraction list shows the overlay with "This is break stuff. Take it as a deal?" (the desktop version of the Intercept).

## Privacy model

- Stored per block: `{ domain, seconds }` aggregated in memory and written to Convex when the block ends. No titles, paths, query strings or page content.
- Incognito: off unless the person enables it in Chrome's extension settings.
- Export and delete from the options page and the web app. The Chrome Web Store data disclosure matches this table word for word.

## Milestones

| # | Milestone | Done when | Est. |
| --- | --- | --- | --- |
| E0 | **Spike** (Phase 0 S2 and S3). **Done Nov 9, 2026**, see [E0 results](#e0-results-nov-9-2026) | WXT skeleton with side panel, alarm and overlay survives the worker being killed; handshake passes a token from localhost | 2–3 days |
| E1 | **Side panel timer** | Dial, Coming up and deal sheets in the side panel, live-synced with the phone through Convex (start on phone, see it on desktop within 1 s) | 1 week |
| E2 | **Break-end enforcement** | Nudge and Dim levels, Ask for 5 more from the overlay writes the same ledger entry as the app; optional: pause a playing YouTube tab when the break ends (youtube.com permission requested only when turned on) | 1 week |
| E3 | **Intention vs reality** | Domain/time per block in the ledger ("Planned: reading. Mostly on docs.google.com, 4 min on youtube.com"), with export and delete | 1 week |
| E4 | **Focus guard + Close level** | Distraction list in options; guard overlay; close-after-ignored | 3–4 days |
| E5 | **Store release** | Unlisted Chrome Web Store listing, privacy policy page, data disclosure, screenshots; Edge Add-ons submission | 3–4 days plus review time |

E1 starts after Phase 1 moves the screens into components.

## E0 results (Nov 9, 2026)

Throwaway code in [`spikes/extension`](../spikes/extension/README.md), which has the full findings, how to run it, and the test script. Tested on Edge 157 (Windows 11, headless) against the built extension: 38 of 38 checks pass.

**The three questions, all yes:**

1. **A break ends on time even when Chrome has shut the extension down.** We force-stopped the service worker right after a break started (once, and twice in another run). A fresh worker woke for the `chrome.alarms` alarm and the overlay was up within 0.2 s of the end time. Closing and reopening the browser mid-break also worked: on startup the worker re-armed the alarm from saved state. A break that ended while the browser was closed ends on the next launch.
2. **The break-over overlay can't be hidden or restyled by the page.** It lives in a closed shadow root. A deliberately hostile test page (CSS aimed at hiding it, a patched `attachShadow`) couldn't see inside it or hide it. Focus moves into the overlay and returns to where you were when it closes. On a tab without site access it falls back to a notification.
3. **The web app can hand the extension a login token.** A page on `localhost` sends `auth/v1` with a test token. The worker keeps it in `chrome.storage.session` only (never synced, never logged, gone after a browser restart), replaces it when a new one arrives, and refuses malformed messages with stable error codes.

**The Esc catch.** A page that captures the Escape key for itself (common in web apps with their own dialogs) runs before our listener, so Esc does nothing on that page. The visible close button still works, so the overlay never traps anyone, which is the rule that matters. E2 adds a way out that doesn't depend on the page at all: the toolbar icon or the side panel clears the overlay.

**Other findings E1 has to respect:**

- `externally_connectable` ignores the port: `http://localhost/*` lets every localhost port reach the extension. The worker's own origin allowlist is what keeps other ports out, so it stays.
- Branded Chrome 157 no longer loads unpacked extensions from the command line; Edge 157 still does. Automated tests run on Edge or Playwright's bundled Chromium.
- Alarms under 30 s only fire on time for unpacked builds. Real blocks are minutes long, so this only affects tests.
- In WXT, a content script registered at runtime has its `matches` copied into the required host permissions. Keep `matches` empty so site access stays optional.

**Not checked yet** (these need a person clicking Chrome's own UI): opening the side panel from the toolbar icon, the "allow on all sites" permission prompt, and a restart of a store-installed build. Do these by hand at the start of E1, together with `chrome://` pages, PDFs, sleep and wake, and two windows.

**Open decision for E1: which login the extension gets.** The web app keeps a WorkOS refresh token in `localStorage`. Recommended: the backend (a Convex action) issues the extension its own limited pass instead of the extension holding a copy of the web app's login, so a compromised extension exposes far less. Decide at the start of E1.

## Testing

- `packages/core` unit tests cover the rules (shared, already in place).
- Playwright with the unpacked extension loaded: side panel renders, alarm fires (mocked clock), overlay appears and clears, the handshake rejects other origins.
- Manual checklist per release: restricted pages (chrome://, the Web Store) degrade gracefully; worker restart mid-block; two windows; sleep and wake.
- The design council reviews side panel and overlay screenshots like the phone screens.

## Open questions

- [ ] Which login the extension holds: a limited pass issued by the backend (recommended) or a copy of the web app's token. Decide at the start of E1.
- [ ] Overlay wording and look: it's the most intrusive surface we have, so it gets its own design round.
- [ ] Should "Close" exist at all, or is Dim enough? Decide after E2 dogfooding.
- [ ] Count a background tab playing video (YouTube study music) as "on" that domain? Proposed: only the focused tab counts.
