# Pomodeal

A study timer that negotiates with you instead of fighting you, plus small private study rooms for friend groups. Built for students whose brains bargain with time. Never position it as an ADHD or health product.

## Read first

- [docs/01-concept-v2.md](docs/01-concept-v2.md): current concept (supersedes the original thesis where they differ)
- [docs/03-roadmap.md](docs/03-roadmap.md): current phase and its gate
- [docs/04-build-loop.md](docs/04-build-loop.md): how every feature gets built

## Current phase

**Phase 1: solo core, in a closed beta.** Live at https://pomodeal.app (invite-only, noindex). What's live and what's next: the "Where we are" section of [docs/03-roadmap.md](docs/03-roadmap.md).

Chris chose to launch to friends before interviewing, so Phase 0's interview gate was skipped on purpose. Interviews stay optional ([docs/research/](docs/research/01-interview-plan.md)); session notes go in `docs/research/sessions/` (first names only, never in a public repo, never record diagnoses).

Every push to `main` deploys the site **and** the production Convex backend (Cloudflare runs `npm run build`). Do design and feature work on a branch and ask before merging.

## Architecture (target)

- `apps/web`: React + Vite + Tailwind PWA (primary product, phone-first)
- `apps/extension` (not started): WXT Manifest V3 extension (desktop enforcer, side panel)
- `packages/core`: pure TS timer math, negotiation rules, ledger. Both clients and Convex call it.
- `packages/ui` (not started): shared React components. Today the screens are the prototype engine in `prototypes/quick-deal/index.html`, bridged to Convex by `apps/web/src/main.ts`
- `convex/`: schema, functions, scheduled block boundaries, Web Push

## Commands

- `npm test`: core negotiation rules (vitest). `npm run dev` + `npx convex dev`: local app + backend. `npm run build`: deploys Convex first when `CONVEX_DEPLOY_KEY` is set (CI), then syncs the prototype into `apps/web` and builds the PWA (`build:web` is the web part alone).
- `apps/web/index.html` is generated from `prototypes/quick-deal/index.html`; edit the prototype.
- Commits and PRs: no AI co-author trailers or "Generated with" footers (Chris's rule; the repo is public).
- Versioning and release steps: `docs/05-deploy-and-versioning.md`. Tag every release, update `CHANGELOG.md`.

## Conventions

- Time is computed from stored `startedAt` + duration, never from ticking intervals. Block boundaries are Convex scheduled functions.
- Negotiation logic lives only in `packages/core` as pure functions and is changed test-first.
- Check every UI change at 375 px width and in dark mode.
- The extension records active-tab **domain and time only**: never full URLs or page content.
- Copy follows `docs/specs/003-voice-and-copy.md` once it exists: no labels, no shame, no streaks.
- Any new stored user-behavior field updates `docs/specs/006-privacy-inventory.md` in the same change.
- Decisions go in `docs/decisions/NNNN-title.md` (context, decision, consequences).
- Adding and removing tasks is one flow ([spec 017](docs/specs/017-and-then.md)): tonight is one line, the ticket holds its first item, and the open end ("you're done") is the only place things are added. Don't add a second way in, a second ticket or another stamp on home.
- Design council: run the `design-council` skill (`.claude/skills/design-council`, adapted from tstack's `council`) on every user-visible change before committing it, in small rounds. Members: a product designer and "the primary user" (a capable student who studies with it nightly) on Claude Opus 5.5, an art director for taste on Claude Fable 5.2. Reviewers get `.claude/skills/design-council/settled.md`; check every fix against it before building.
- Pomodeal is built for Chris's taste; he is the primary user. Accessibility is not a design driver.
- No copy that explains basic UI ("Tap an underlined word…", "Drag the line…", "One tap."), and no keyboard-key badges on controls. Users are people like Chris.
- Before any UI work, load the frontend-design skill (and Design plugin skills for critique/a11y). Chris rejected the first visual pass as "AI-generated": avoid indigo/purple + yellow highlights, all-caps eyebrow labels, `·` separators, monospace data labels, and the identical rounded-card kit.
- Current visual direction (prototype r2): one "approved" green accent on grey-green paper; focus = solid ring, break = hatched ring; the deal is a ticket that gets stamped; Archivo condensed for numbers/headings, Atkinson Hyperlegible for text.
- Screenshot every UI state with `node prototypes/shoot.mjs <out-dir>` (Edge + CDP, phone size, light and dark) before review. Desktop: `WIDTH=1440 HEIGHT=900`. Off Windows: `BROWSER=/path/to/chromium`.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
