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
3. The worker validates the sender origin, stores the token in `chrome.storage.session`, and opens a Convex client with it. Refresh goes through the same message.
4. Until auth lands (Phase 1), the handshake passes the anonymous `deviceId` instead, so the extension and the web app see the same sessions.

Messages are versioned (`auth/v1`, `deal/v1`, …), carry a request id, validate their payloads, and return stable error codes.

## Enforcement levels (the person chooses; never on by default)

1. **Nudge** (default): notification at heads-up and at block end.
2. **Dim:** at break end, the overlay covers the tab with "Reels time is up. Reading is next" plus **Start reading**, **Ask for 5 more** (opens the same deal sheet) and **I need this**. It never traps: Esc and a visible close always work.
3. **Close:** after a dim that's ignored for 2 minutes, close the tab and reopen the study tab if one was set.
4. **Focus guard:** during focus blocks, opening a site on your own distraction list shows the overlay with "This is break stuff. Take it as a deal?" (the desktop version of the Intercept).

## Privacy model

- Stored per block: `{ domain, seconds }` aggregated in memory and written to Convex when the block ends. No titles, paths, query strings or page content.
- Incognito: off unless the person enables it in Chrome's extension settings.
- Export and delete from the options page and the web app. The Chrome Web Store data disclosure matches this table word for word.

## Milestones

| # | Milestone | Done when | Est. |
| --- | --- | --- | --- |
| E0 | **Spike** (Phase 0 S2 and S3) | WXT skeleton with side panel, alarm and overlay survives the worker being killed; handshake passes a token from localhost | 2–3 days |
| E1 | **Side panel timer** | Dial, Coming up and deal sheets in the side panel, live-synced with the phone through Convex (start on phone, see it on desktop within 1 s) | 1 week |
| E2 | **Break-end enforcement** | Nudge and Dim levels, Ask for 5 more from the overlay writes the same ledger entry as the app | 1 week |
| E3 | **Intention vs reality** | Domain/time per block in the ledger ("Planned: reading. Mostly on docs.google.com, 4 min on youtube.com"), with export and delete | 1 week |
| E4 | **Focus guard + Close level** | Distraction list in options; guard overlay; close-after-ignored | 3–4 days |
| E5 | **Store release** | Unlisted Chrome Web Store listing, privacy policy page, data disclosure, screenshots; Edge Add-ons submission | 3–4 days plus review time |

E0 can start now: it doesn't depend on the UI port. E1 starts after Phase 1 moves the screens into components.

## Testing

- `packages/core` unit tests cover the rules (shared, already in place).
- Playwright with the unpacked extension loaded: side panel renders, alarm fires (mocked clock), overlay appears and clears, the handshake rejects other origins.
- Manual checklist per release: restricted pages (chrome://, the Web Store) degrade gracefully; worker restart mid-block; two windows; sleep and wake.
- The design council reviews side panel and overlay screenshots like the phone screens.

## Open questions

- [ ] Overlay wording and look: it's the most intrusive surface we have, so it gets its own design round.
- [ ] Should "Close" exist at all, or is Dim enough? Decide after E2 dogfooding.
- [ ] Count a background tab playing video (YouTube study music) as "on" that domain? Proposed: only the focused tab counts.
