# Changelog

## Unreleased

- Closed beta live at https://pomodeal.app: Cloudflare Worker + Convex production + WorkOS AuthKit with one-tap GitHub / Google / Apple sign-in.
- Invite-only beta: invite codes and links, 11 invites per member, waitlist, admin commands.
- Landing page with a playable deal ticket (four design-council rounds), install hint, noindex for the closed beta.
- App screens after design-council rounds 5–10 (average 7.67 → 8.22).
- Phase 1: members' screens run on the real backend (start, ask, next, bonus, end, today's ledger), synced across devices.
- Build: `npm run build` deploys Convex first when `CONVEX_DEPLOY_KEY` is set, so every push to `main` ships site and backend together.
- Longer study blocks: 30, 45 and 60 min next to 5–20 (spec 007). Long blocks hold their length, get a quarter-length break, a 5 min heads-up and a quiet halfway line; no block grows past 75 min. Quick deals of 20 now ramp to 25, not 28.

- Renamed to **Pomodeal** (docs, package names, PWA manifest, device-id key). Tagline: "A study timer that makes deals with you."
- Stack and hosting plan (`docs/07-stack-and-hosting.md`): Cloudflare Pages + Convex + WorkOS AuthKit, plus invite list, rate limits and a kill switch to stay in free tiers; Cloudflare `_headers` for the service worker.

## v0.2.0 (2026-11-07)

- Monorepo with npm workspaces: `apps/web`, `packages/core`, `convex/`.
- `packages/core`: negotiation rules (freebie, borrow, trade, override, bonus, ramp-up, earned breaks) and timer math as pure functions, with 15 tests covering spec 001.
- Convex backend: sessions and ledger tables; start / ask / next / end mutations; current-session and today's-ledger queries.
- Installable PWA shell (Vite + vite-plugin-pwa) serving the design prototype, with icons and an offline service worker.
- Vercel config that deploys Convex and builds the web app on every push to `main`.
- Chrome extension roadmap (`docs/06-chrome-extension-roadmap.md`).

## v0.1.0 (2026-11-07)

- Concept v2, platform and deployment plan, roadmap with gates, build loop with the design-review council.
- Spec 001 negotiation rules; Phase 0 research kit.
- Clickable Quick Deal prototype after design round 4, plus the screenshot script.
