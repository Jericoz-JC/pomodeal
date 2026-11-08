# Pomodeal

**A study timer that makes deals with you.**

Most timers fight you: the break ends, the alarm goes off, you ignore it. Pomodeal negotiates instead. You plan the break you're going to take anyway ("10 minutes of Reels, then reading"), and when you want more time, the clock gives it to you on honest terms you can see.

Live as an invite-only beta at **[pomodeal.app](https://pomodeal.app)**.

## How a deal works

1. **Make a deal.** What are you doing right now, and what's next? That becomes your first break and your first focus block.
2. **Ask for more.** The first extra 5 minutes are on the house. After that, every extension has terms: borrow from your next break, or trade it for a longer focus block. "I need this" always works too.
3. **The clock deals back.** When focus is going well, it offers you a deal: 10 more minutes of focus for a longer break.
4. **The ledger keeps score honestly.** Time borrowed, repaid and earned, with no streaks, no labels, no shame.

Small private rooms for friend groups (see who's focusing; messages wait until everyone's on a break) are next.

## Status

Phase 1 of the [roadmap](docs/03-roadmap.md), in a closed beta with friends.

| Live | Next |
| --- | --- |
| Landing page with a playable deal | Push notifications at the 2-minute heads-up and block end |
| One-tap GitHub, Google and Apple sign-in | Motion and feel pass on the deal moment |
| Invite-only beta (members invite friends) | Presets, block builder, longer history |
| Quick Deal, timer dial, heads-up, asking for time, bonus offer, today's ledger | Rooms with live presence |
| Synced across phone and laptop; installable as an app | Chrome extension that enforces break endings |

## Stack

- **Web app:** Vite + vite-plugin-pwa, installable on phone and desktop ([apps/web](apps/web))
- **Rules:** the negotiation rules and timer math as pure TypeScript with tests ([packages/core](packages/core)); the app and the backend both use them
- **Backend:** [Convex](https://convex.dev) for data, functions and (soon) scheduled block boundaries ([convex](convex))
- **Sign-in:** [WorkOS AuthKit](https://workos.com) via Convex
- **Hosting:** Cloudflare Workers static assets; every push to `main` deploys the site and the backend

Time is always computed from a stored start time and duration, never from a ticking interval, so a session stays correct across devices and sleeping tabs.

## Repo layout

```
apps/web/            PWA shell: sign-in, invite gate, landing page, Convex bridge
packages/core/       negotiation rules + timer math (vitest)
convex/              schema, members/invites, sessions and ledger functions
prototypes/          the design prototype the app screens come from, plus the screenshot script
docs/                concept, roadmap, specs, decisions, deploy and launch runbooks
scripts/             build, prototype sync, icon generation
```

`apps/web/index.html` is generated from `prototypes/quick-deal/index.html`; edit the prototype.

## Run it locally

Needs Node 22+ and a free Convex account.

```bash
npm install
npx convex dev      # first run creates a dev deployment and provisions WorkOS for localhost
npm run dev         # http://localhost:5173
```

```bash
npm test            # negotiation rules
npm run typecheck
npm run build       # web build (also deploys Convex when CONVEX_DEPLOY_KEY is set, as in CI)
```

Without a backend URL, the app runs as the design demo, so you can click through every screen without signing in.

## Docs

- [Concept v2](docs/01-concept-v2.md): what Pomodeal is and why
- [Roadmap](docs/03-roadmap.md): phases, gates, and where we are
- [Negotiation rules](docs/specs/001-negotiation-rules.md): the deal terms, plus the design review log
- [Build loop](docs/04-build-loop.md): how features and designs get built and reviewed
- [Chrome extension roadmap](docs/06-chrome-extension-roadmap.md)
- [Stack and hosting](docs/07-stack-and-hosting.md), [deploy and versioning](docs/05-deploy-and-versioning.md), [launch and beta access](docs/08-launch-and-beta-access.md)
- [Changelog](CHANGELOG.md)

## Privacy

Pomodeal stores your deals and ledger so they sync between your devices. The planned Chrome extension records the active tab's **domain and time only**, never full URLs or page content.
