# Negotiation Clock

A study timer that negotiates with you instead of fighting you, plus small private study rooms for friend groups. Built for students whose brains bargain with time. Never position it as an ADHD or health product.

## Read first

- [docs/01-concept-v2.md](docs/01-concept-v2.md): current concept (supersedes the original thesis where they differ)
- [docs/03-roadmap.md](docs/03-roadmap.md): current phase and its gate
- [docs/04-build-loop.md](docs/04-build-loop.md): how every feature gets built

## Current phase

**Phase 0: concepts and spikes.** No production code yet. Work goes into `docs/specs/`, `docs/decisions/`, and throwaway `spikes/`.

Chris chose to launch before interviewing: the design council iterates the prototype toward 10/10, and v0.2 ships the PWA shell + Convex backend (`docs/05-deploy-and-versioning.md`). Interviews are optional and later, using [docs/research/](docs/research/01-interview-plan.md); Gate 0 is decided Nov 21. Session notes go in `docs/research/sessions/` (first names only, never in a public repo, never record diagnoses).

## Architecture (target)

- `apps/web`: React + Vite + Tailwind PWA (primary product, phone-first)
- `apps/extension`: WXT Manifest V3 extension (desktop enforcer, side panel)
- `packages/core`: pure TS timer math, negotiation rules, ledger. Both clients and Convex call it.
- `packages/ui`: shared React components
- `convex/`: schema, functions, scheduled block boundaries, Web Push

## Commands

- `npm test`: core negotiation rules (vitest). `npm run dev` + `npx convex dev`: local app + backend. `npm run build`: syncs the prototype into `apps/web` and builds the PWA.
- `apps/web/index.html` is generated from `prototypes/quick-deal/index.html`; edit the prototype.
- Versioning and release steps: `docs/05-deploy-and-versioning.md`. Tag every release, update `CHANGELOG.md`.

## Conventions

- Time is computed from stored `startedAt` + duration, never from ticking intervals. Block boundaries are Convex scheduled functions.
- Negotiation logic lives only in `packages/core` as pure functions and is changed test-first.
- Check every UI change at 375 px width and in dark mode.
- The extension records active-tab **domain and time only**: never full URLs or page content.
- Copy follows `docs/specs/003-voice-and-copy.md` once it exists: no labels, no shame, no streaks.
- Any new stored user-behavior field updates `docs/specs/006-privacy-inventory.md` in the same change.
- Decisions go in `docs/decisions/NNNN-title.md` (context, decision, consequences).
- Before any UI work, load the frontend-design skill (and Design plugin skills for critique/a11y). Chris rejected the first visual pass as "AI-generated": avoid indigo/purple + yellow highlights, all-caps eyebrow labels, `·` separators, monospace data labels, and the identical rounded-card kit.
- Current visual direction (prototype r2): one "approved" green accent on grey-green paper; focus = solid ring, break = hatched ring; the deal is a ticket that gets stamped; Archivo condensed for numbers/headings, Atkinson Hyperlegible for text.
- Screenshot every UI state with `node prototypes/shoot.mjs <out-dir>` (Edge + CDP, phone size, light and dark) before review.
