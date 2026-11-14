# Pomodeal

**A study timer that makes deals with you.**

Most timers fight you: the break ends, the alarm goes off, you ignore it. Pomodeal negotiates instead. You plan the break you're going to take anyway ("10 minutes of Reels, then reading"), and when you want more time, the clock gives it to you on honest terms you can see.

Live as an invite-only beta at **[pomodeal.app](https://pomodeal.app)**.

## How a deal works

1. **Make a deal.** What are you doing right now, and what's next? "10 min of Reels, then 30 min of reading" is the whole deal: your break, then one focus block.
2. **Ask for more.** The first extra 5 minutes are on the house. After that, every extension has terms: borrow from your next round's break, or trade it for a longer focus block. "I need this" always works too.
3. **The deal ends when it says it does.** When the focus block is up, that was the deal. You can stamp another round in one tap (a little longer each time, with a shorter break), take 10 more minutes, or be done for now. Nothing starts on its own.
4. **The ledger keeps score honestly.** Every deal, what you did and time borrowed, repaid and earned, with no streaks, no labels, no shame.

### Big ones: start before you plan

For a 2 to 4 hour task that spans days (a paper, a problem set, exam prep), Pomodeal doesn't open with a planner.

1. **A first payment.** Name the task and you get a 15-minute first block with one first move you write yourself ("open the doc and write one ugly sentence"). No plan comes before it.
2. **A bookmark.** When a block ends, leave one line: "Next time, start with...".
3. **Open terms, never overdue.** Unfinished time is kept, so the next day opens on a one-tap card that starts from your bookmark.
4. **A kind comeback.** Miss a day and the app shows nothing you missed. It offers a smaller first move.
5. **Plan when you want to.** Splitting into pieces and spreading them over the days left are optional, on the day-2 card. Nothing reshuffles without your say.

## Status

Phase 1 of the [roadmap](docs/03-roadmap.md), in a closed beta with friends.

**Live in the beta**
- Landing page with a playable deal; one-tap GitHub, Google and Apple sign-in; invite-only (members invite friends)
- Quick Deal, the timer dial, the heads-up, asking for time (borrow, trade, "I need this"), the end of a deal (another round, 10 more minutes, done for now), today's ledger
- Study blocks from 5 to 60 minutes; long blocks get a quarter-length break and a 5-minute heads-up
- Big ones: first payment, bookmark, day-2 and comeback cards, split and spread
- A weekly one-tap check-in ("Did this week go better than usual?")
- Synced across phone and laptop; installable as an app, with a Keep screen on option
- Light and dark, with a dark mode that dims the paper instead of putting pale tickets on black

**Merged Nov 14, being checked in the beta**
- One way to add and remove tasks ([spec 017](docs/specs/017-and-then.md)): the ticket's sentence ends "And you're done", and those words are where you add one thing or six. Tonight is that one line, stored per day. Press any name to change it, take it out ("Not tonight") or do it first; "Just this one" clears the rest; Stop for now keeps your place.
- The desk: on a laptop, tonight lies along the front edge as a roll drawn to scale over a clock, which you can drag to reorder and which fills in green as you study

**Built, still being checked**
- Push notifications at the heads-up and block end. The code is shipped; it still needs to be tested on real iPhones and Android phones. On iPhone, push only works once the app is installed to the Home Screen.
- Optional AI piece suggestions. Built and switched off. When on, it's one opt-in tap per suggestion and sends only the task's title, type and size.

**Not built yet**
- **Blocking.** Nothing in Pomodeal blocks or dims apps or sites today. On desktop, that's the job of the planned [Chrome extension](docs/06-chrome-extension-roadmap.md), which hasn't been started. On a phone, a web app can't block other apps at all, so Pomodeal relies on reminders and, later, friends.
- Rooms: small private rooms for friend groups, with live presence (who's focusing, who's on a break)
- Presets and history beyond a single night

## The research behind it

Before building big ones, we reviewed the research on procrastination, planning and studying, the apps students already use, and what phones and browsers actually allow. Three reviewers wrote separate proposals, scored each other's work, and merged them into one plan. Every cited DOI was checked against Crossref. The full write-up is [Starting and splitting big tasks](docs/research/reports/Starting%20and%20splitting%20big%20tasks.md), with the working notes in [docs/research/research_notes](docs/research/research_notes/).

**The main finding:** students get going on a big task when the first step is small, concrete and named by them. Planning helps after they've started, not before. The hard moments are the first minute and the morning after a missed session, and a detailed plan helps with neither.

| What the research says | How strong | What Pomodeal does with it |
| --- | --- | --- |
| Procrastination is mostly avoiding a bad feeling now, at your future self's expense ([Sirois & Pychyl 2013](https://doi.org/10.1111/spc3.12011)) | Well established | Lower the cost of the first minute instead of adding pressure: Quick Deal starts from what you're already doing |
| If-then plans ("when I sit down, I'll first...") are the best-supported way to get started. The effect is smaller than once thought: d = 0.65 in a 2006 meta-analysis, about d = 0.15 to 0.35 after bias corrections in a 2025 update across 642 tests ([Sheeran, Listrom & Gollwitzer 2025](https://doi.org/10.1080/10463283.2024.2334563)) | Strong, small effect | One short first move you write yourself on the deal ticket. No AI-written ten-step plan, because a plan you didn't write isn't yours |
| Breaking a task into pieces gives more realistic time estimates ([Kruger & Evans 2004](https://doi.org/10.1016/j.jesp.2003.11.001)), but nothing says it has to happen before you start | Moderate | Splitting is optional and waits for the day-2 card |
| People tend to go back to tasks they were interrupted in. The popular claim that unfinished tasks stay in memory didn't hold up in a 2025 meta-analysis ([Ghibellini & Meier 2025](https://ideas.repec.org/a/pal/palcom/v12y2025i1d10.1057_s41599-025-05000-w.html)) | Moderate | The bookmark: stop with a written next step so restarting is easier |
| Students who were kind to themselves after a failed test studied longer for the retest ([Breines & Chen 2012](https://doi.org/10.1177/0146167212445599)) | Moderate | The comeback card: no counts, no red, nothing "overdue", just a smaller first move |
| Spacing study over days and testing yourself beat cramming and rereading ([Cepeda et al. 2006](https://doi.org/10.1037/0033-2909.132.3.354); [Dunlosky et al. 2013](https://doi.org/10.1177/1529100612453266)) | Strong | Spreading exam study puts it on two or more days, with a one-line reason you can overrule, and exam progress counts topics, not hours |
| In two small student trials, no break scheme beat the others ([Smits et al. 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12292963/); [Biwer et al. 2023](https://pubmed.ncbi.nlm.nih.gov/36859717/)) | Small trials | Block lengths are choices; we don't claim any length is optimal |
| In a field study of one sec, an app that pauses before distracting apps, the option to dismiss the pause had the strongest effect ([one sec / Max Planck study](https://one-sec.app/max-planck-study)) | One field study | "I need this" always works, and nothing re-plans without your signature |

**What we won't claim.** Some popular productivity claims failed replication or were never tested, so they stay out of the app: "your willpower is running low" (ego depletion), "21 days to a habit", "25 minutes is the optimal focus length", "15 minutes is the magic number", and learning styles. Pomodeal is about how you work. It isn't a health or diagnostic product.

**Honest limits.** The best-supported effects are small. The three reviewers were all AI models from one provider, so they likely share blind spots; interviews with students would test the plan better. And a beta of friends can't measure long-term use, so the beta measures starting instead:

- at least 70% of big ones have a first block running within 2 minutes of being named
- at least 60% of multi-day big ones get a session on a second day
- at least 50% of comeback cards lead to a block in the same visit
- most weekly check-ins say "better than usual", and nobody reports feeling judged

## What we're working towards

Every feature has to pass one test: does it make the next start cheaper? Next, in order:

1. Finish checking push notifications on real phones
2. Rooms for friend groups, because on a phone, friends seeing your break ended is the only nudge a web app can give
3. The Chrome extension: on desktop, it dims the tab when the break you chose is over, and records which sites you were on (domain and time only)

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
- [One ticket, one sitting](docs/specs/010-one-sitting.md): how a deal ends, and the next round
- [Research: starting and splitting big tasks](docs/research/reports/Starting%20and%20splitting%20big%20tasks.md) and the [big ones spec](docs/specs/008-big-ones.md)
- [Privacy inventory](docs/specs/006-privacy-inventory.md): every stored field, why, and who sees it
- [Build loop](docs/04-build-loop.md): how features and designs get built and reviewed
- [Chrome extension roadmap](docs/06-chrome-extension-roadmap.md)
- [Stack and hosting](docs/07-stack-and-hosting.md), [deploy and versioning](docs/05-deploy-and-versioning.md), [launch and beta access](docs/08-launch-and-beta-access.md)
- [Changelog](CHANGELOG.md)

## Privacy

Pomodeal stores your deals, ledger and big ones so they sync between your devices. Every stored field is listed in the [privacy inventory](docs/specs/006-privacy-inventory.md). AI suggestions are off unless you ask for one, and they send only a task's title, type and size. The planned Chrome extension records the active tab's **domain and time only**, never full URLs or page content.
