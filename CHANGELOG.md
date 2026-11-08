# Changelog

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
