# Roadmap: Phases and Gates

Each phase ends with a **gate**: a question answered with real usage before the next phase starts. If the gate fails, iterate inside the phase instead of moving on.

Changes from the original thesis: added **Phase 0** (concepts and spikes before code), pulled a **thin social slice** forward into the first beta (it's the phone's only enforcement), and moved YouTube scenes from core to delight.

## Where we are (Nov 11, 2026)

**Since Nov 9, merged:** ledger fix (PR #9, ADR 0006), one sitting per deal (PR #10, spec 010), the visual overhaul and design council (PR #11, spec 011), dark mode with the lamp off (PR #12, spec 013).

**In review:** tonight in a line (spec 012) and the desk overhaul (spec 014), one PR. The planner runs in the screens with tonight kept in the open page; its storage (`nights` table, `nights.print`, `nights.tonight`, `fromNight` on the two start mutations) is the next backend step, in spec 012's "Building it for real". After that: the big-one cards screen in the paper language (the most-named gap in spec 014's benchmarks).

*The rest of this section is as of Nov 9.*

Phase 0's interview gate was skipped on purpose: we launched a closed beta to friends first. Phase 1 is partly live at https://pomodeal.app.

**Live**
- Landing page with a playable deal, one-tap GitHub / Google / Apple sign-in (WorkOS AuthKit, demo social credentials), install hint
- Invite-only beta: invite links (11 per member, unlimited for admins), waitlist screen, account menu
- For members: Quick Deal, the dial with focus and break blocks, the 2-minute heads-up (in-app), asking for time (borrow / trade / override, a first step on the third ask), the bonus offer, end early, today's ledger. All server-side through Convex, so devices stay in sync
- Installable PWA; every push to `main` deploys the site and the backend

**Merged to `main` Nov 9 (PR #4, spec 008):** big ones with a first payment and first move, bookmarks, day-2 and comeback cards, split and spread, the weekly check-in, and the privacy inventory for all of it. Still unchecked on real devices (see `docs/dogfood-log.md`): block-boundary Web Push (heads-up and block end) and optional AI piece suggestions (off unless `AI_SUGGEST_ENABLED`).

**Not built:** the Chrome extension, so nothing blocks or dims sites yet. Its spike (E0) is done as of Nov 9: block ends survive the extension being shut down, the break-over overlay holds up on hostile pages, and the web app can hand the extension a token. Results and the open login decision are in [06-chrome-extension-roadmap.md](06-chrome-extension-roadmap.md#e0-results-nov-9-2026). E1 waits for the screens to move into components.

**Next, in order**
1. Web Push at the heads-up and block end (VAPID keys, push subscriptions table, Convex scheduled action, service worker handler; iPhone needs the installed app)
2. Motion and feel pass on the deal moment (stamp, block change, heads-up), on a branch
3. ~~[`specs/006-privacy-inventory.md`](specs/006-privacy-inventory.md) for the users, invites, sessions and ledger tables, plus the big-ones tables from spec 008~~ Done.

4. Presets and a block builder; history beyond 24 hours
5. Then Phase 1.5 rooms

**Before any public launch:** WorkOS production credentials and a custom auth domain, remove `noindex`, privacy policy, age gate, delete-my-data.

**YouTube, decided:** *scenes* (your own video or stream that plays and pauses with blocks) belong in the web app on desktop, after push notifications; on phone they play only after a tap. *Pausing your YouTube tab when a break ends* belongs to the Chrome extension (E2), because a web page can't control other tabs.

---

## Phase 0: Flesh out before building (1–2 weeks)

No production code. Output is specs in `docs/specs/` and decisions in `docs/decisions/`.

### Concepts to settle

| # | Concept | Output | Suggested skill |
| --- | --- | --- | --- |
| C1 | **Negotiation rules.** Freebie/borrow/override/bonus terms, repayment auto vs chosen, caps | `specs/001-negotiation-rules.md` + pure-function signatures in `packages/core` | brainstorming |
| C2 | **Quick Deal flow.** "What are you doing right now?" → deal in 2 taps | Clickable prototype (HTML artifact), tested on 3–5 friends | frontend-design, design-critique |
| C3 | **Data model.** User, Preset, Session, Block, LedgerEntry, Room, Presence | `specs/002-data-model.md` + draft `convex/schema.ts` | writing-plans |
| C4 | **Visual time.** Draining disk, heads-up, block-switch animation, light/dark | Prototype, accessibility pass (color-blind, reduced motion) | frontend-design, accessibility-review |
| C5 | **Voice and copy.** No-shame, no-label tone; the clock's "personality" when it counters | `specs/003-voice-and-copy.md` with 20 sample lines | ux-copy |
| C6 | **Room social contract.** What friends see by default vs opt-in; nudges allowed or not | `specs/004-rooms-privacy.md` | user-research |
| C7 | **Metrics and instrumentation.** North star, deal-keeping rate, retention; what events to log | `specs/005-metrics.md` | telemetry-designer |
| C8 | **Privacy inventory.** Every field collected, why, retention, who sees it | `specs/006-privacy-inventory.md` (seeds privacy policy + CWS disclosures) | — |

### Technical spikes (throwaway code, in `spikes/`)

S1 Convex scheduler → Web Push on installed iOS PWA · S2 Auth library + extension handshake · S3 MV3 alarms + side panel + overlay · S4 YouTube IFrame control · **S5 iOS Shortcuts intercept**: "When Instagram opens" → open the PWA's Quick Deal URL, and → POST to a Convex HTTP endpoint; check it runs without a prompt and how intrusive the banner is. Details in [02-platform-and-deployment.md](02-platform-and-deployment.md) and concept-v2 §2.3b.

### Research

- Interview 6–8 target students from 2–3 friend groups, Nov 11–18, 2026 (45 min: past-behavior interview, prototype tasks, "use it tonight" commitment test). Plan, guide, screener and notes template: [docs/research/](research/01-interview-plan.md).
- Line up the first 10–20 beta testers as **2–3 existing friend groups**, not individuals.

**Gate 0 (decide Nov 21, 2026):** bargaining described unprompted by most; at least half finish the Quick Deal unaided and react specifically; at least 3 actually use the prototype on a real night; nobody (or only one person) reads it as shaming, babyish or medical. S1 and S2 green. Full criteria in the interview plan.

---

## Phase 1: Solo core PWA (3–4 weeks)

- Quick Deal (front door) + block builder + presets
- Draining-disk timer, 2-min heads-up, server-scheduled block boundaries
- Negotiation at every boundary with the C1 rules; ledger
- Web Push notifications, install-to-home-screen onboarding
- Sign-in, session history, simple ledger view
- Deploy: Vercel/Cloudflare Pages + Convex Cloud

**Gate 1:** The team dogfoods it daily for 1 week. Does each of us start ≥4 sessions that week? Is the override rate under ~50%?

## Phase 1.5: Thin social + closed beta (2 weeks build, 3–4 weeks beta)

- Rooms (invite link, 2–12 people), live presence: focus / break / negotiating / overdue, with timer visible
- One-tap check-ins at block boundaries (starting / stuck / done)
- Opt-in "Intercept" setup (iOS Shortcuts) for 1–3 distracting apps → Quick Deal on open, open/close pings
- Age gate, privacy policy, delete-my-data
- Beta with 2–3 friend groups

**Gate 1.5:** W1 and W4 retention. Do people in rooms start more sessions than solo users? (This decides how much to invest in Phase 3.)

## Phase 2: Chrome extension enforcer (3 weeks)

Detailed plan, permissions and milestones E0–E5: [06-chrome-extension-roadmap.md](06-chrome-extension-roadmap.md). E0 (spike) is done; E1 starts after Phase 1 moves the screens into components.


- Side panel timer, popup Quick Deal
- Break-end enforcement: dim overlay → close tab (user-configurable)
- Domain logging for intention vs reality (domain + time only)
- Optional focus-block domain blocking
- Unlisted Chrome Web Store listing with data disclosures

**Gate 2:** For desktop users, does deal-keeping rate go up with the extension vs without?

## Phase 3: Full study rooms

Shared sessions (synced block stacks), break-only chat with focus-time queueing, voice memos (now decide Convex storage vs R2), opt-in ledger summaries.

## Phase 4: Insights

Weekly recap (best focus windows, most-negotiated activities, net ledger), ramp-up suggestions learned from history. (YouTube scenes may ship earlier on desktop; see "Where we are".)

## Phase 5 (only if the evidence says so): Native mobile

If "it can't stop me on my phone" is the top beta complaint, build a thin native shell (e.g. Expo + Screen Time API on iOS) that reuses `packages/core` and Convex. Apply for Apple's Family Controls distribution entitlement early; approval takes time. Screen Time data stays on-device (shields and private in-app charts only).

---

## Open questions (carried from the thesis, with a proposed answer)

| Question | Proposed answer | Decide in |
| --- | --- | --- |
| Final name | Keep working name; shortlist in concept-v2 §5 | Before CWS listing (Phase 2) |
| Better Auth vs Convex Auth | **Decided:** WorkOS AuthKit via Convex. Spike E0 proved the extension handshake with a test token; which token the extension holds is decided at E1 | Done |
| Convex storage vs R2 | Convex storage until voice memos have real usage | Phase 3 |
| Chat / memo retention | Propose 7 days for chat, 48 h for voice memos | Phase 0 (C6) |
| How to measure | North star + deal-keeping rate + retention + weekly 1-question check-in | Phase 0 (C7) |
| First 10–20 testers | 2–3 existing friend groups; interview during Phase 0 | Phase 0 |
