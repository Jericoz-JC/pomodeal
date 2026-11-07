# Platform and Deployment

**Decision: the PWA is the product; the Chrome extension is the enforcer.** Both talk to one Convex backend. Native mobile is a later, evidence-driven option.

## Options compared

| | PWA (web app) | Chrome extension | Native mobile (later) |
| --- | --- | --- | --- |
| Reaches phone | Yes (install to home screen) | No | Yes |
| Reaches laptop | Yes | Yes (Chrome/Edge/Brave/Arc) | No |
| Can enforce break end | No (can only notify) | Yes: dim/close tabs, block domains | Yes on iOS via Screen Time API (FamilyControls), Android via accessibility/usage APIs |
| Can see what you're doing | No | Yes: active tab domain | Yes, with heavy permissions |
| Distribution | A URL. No review | Chrome Web Store review (unlisted listing works for beta), or load unpacked | App Store / Play review, $99/yr Apple |
| Build cost | Lowest | Medium (MV3 quirks) | Highest |
| Role | **Phase 1: home of everything** | **Phase 2: desktop enforcer + side panel** | **Phase 5+: only if phone enforcement is the #1 ask** |

Why not extension-first: the extension can't reach the phone, which is where the distraction is, and the Chrome timer category is commodity (Lofidoro, Daydream). The PWA proves the negotiation loop; the extension adds teeth on desktop.

## PWA: how to deploy

- **Stack:** React + Vite + Tailwind + `vite-plugin-pwa` (manifest, service worker, install prompt).
- **Hosting:** Vercel or Cloudflare Pages (free tier, preview deploy per branch). Convex Cloud for the backend (free tier covers the beta).
- **Notifications:** Web Push (VAPID) sent from a Convex action. iOS supports Web Push only for PWAs installed to the home screen (iOS 16.4+), so onboarding must walk users through "Add to Home Screen".
- **Timing:** every block boundary is a Convex scheduled function (`scheduler.runAt`) that flips state and sends the push. Clients only *render* remaining time from `startedAt + duration`. Nothing depends on a background tab or a suspended iOS PWA staying alive.
- **Offline:** cache the app shell; a running block keeps rendering offline from the stored timestamps; negotiations made offline queue and sync.

## Extension: how to deploy

- **Stack:** WXT (Manifest V3), sharing React components and Convex client code with the web app via a monorepo package.
- **Surfaces:**
  - **Side panel** (Chrome Side Panel API): the timer lives beside any tab. This is the main extension UI.
  - **Content script overlay:** the dim/"break's over" overlay on the tab when a break ends.
  - **Popup:** minimal Quick Deal.
- **Background:** MV3 service workers get killed when idle, so use `chrome.alarms` for block boundaries (≥30 s granularity is fine with a 2-min heads-up) and Convex subscriptions when awake. Never hold timer state only in memory.
- **Auth handshake:** the web app passes the session to the extension through `externally_connectable` messaging (the page on our domain calls `chrome.runtime.sendMessage(extensionId, token)`). No password entry in the extension.
- **Permissions (keep minimal for review and trust):** `tabs` (to read the active tab's domain), `alarms`, `storage`, `sidePanel`, `scripting` for the overlay. Record **domain + time only**; never full URLs or page content. Matches the privacy section of the thesis and the Chrome Web Store data disclosure.
- **Beta distribution:** unlisted Chrome Web Store listing (link-only), or load-unpacked for the first friend group.

## Repo shape

```
negotiation-clock/
  apps/
    web/          React + Vite PWA
    extension/    WXT extension
  packages/
    core/         pure TS: timer math, negotiation rules, ledger (heavily unit-tested)
    ui/           shared React components (draining disk, block cards)
  convex/         schema, queries, mutations, scheduled jobs, push
  docs/
```

`packages/core` matters most: the negotiation rules are pure functions (`(session, request) → offer`) that both clients and Convex call, so the deal is identical everywhere and testable without a browser.

## Things to verify in Phase 0 spikes (don't trust this doc, prove it)

1. Convex `scheduler.runAt` → Web Push lands on an installed iOS PWA within a few seconds of the boundary.
2. Auth library choice: Better Auth (Convex component) vs Convex Auth. Check current maturity and whether the extension handshake works with each.
3. `externally_connectable` token handoff web → extension, and token refresh.
4. MV3 alarm + side panel + content-script overlay survives the service worker being killed.
5. YouTube IFrame API play/pause on block change (desktop only for now).
