# Spec 001: Negotiation Rules

Status: draft (loop 1) · Phase 0 · Concept C1 · Owner: Chris

## Why

The negotiation is the product. Without real terms, "+5 min" is a snooze button with a history. This spec defines what the clock offers at every block boundary, so the rules are identical on web, extension and server, and testable as pure functions in `packages/core`.

## Core principle

**Never block, always price.** Every request is granted in some form. The price is visible before you accept, and every outcome becomes a ledger entry.

## Vocabulary

| Term | Meaning |
| --- | --- |
| **Block** | A timed segment: `focus` or `break` (a break has an activity, e.g. "Reels") |
| **Boundary** | The moment a block ends. Negotiation happens here (or any time mid-block via "+5") |
| **Ask** | A user request: `extend_break`, `extend_focus`, `skip_break`, `end_session` |
| **Offer** | The clock's response: one or two **terms** the user can pick from, plus the override |
| **Ledger entry** | The record of what was asked, what was offered, what was taken |
| **Balance** | Net minutes: bonuses + repaid − borrowed. Shown weekly, never as a streak |

## Ask: extend a break

`askCount` = how many times this break has already been extended.

| askCount | Offer | Ledger kind |
| --- | --- | --- |
| 0 | **Freebie:** +5, no terms | `freebie` |
| 1 | Pick one: **(a) Borrow:** +5 now, next break −5 · **(b) Trade:** +5 now, next focus +5 | `borrow` / `trade` |
| ≥2 | Same as 1, **plus** one required line: "First thing you'll do when you start?" (saved as an intention) | `borrow` / `trade` + intention |
| any | **"I need this":** +5 (or custom), no terms, no question | `override` |

Rules:

- Repayment from a **borrow** comes out of the next break, never below a floor of **2 min**. Overflow carries to the following break, and anything left at session end is written off as `forgiven`. Debt never crosses days.
- A **trade** lengthens the next focus block, capped at **+15 min** total per block. Past the cap, only borrow and override are offered.
- The override is always visible but secondary (text button, not primary).

## Ask: extend focus (the clock offers this)

When a focus block reaches its end and the user hasn't paused or left the app (or tab, with the extension) in the last 5 min, the clock offers:

- **Bonus:** "You're rolling. +10 focus and your break grows by 3?" → `bonus`. Accept or decline with one tap, and auto-decline after 30 s so it never blocks.
- Never offered twice in a row on the same block.

## Ask: skip a break / end early

- Skip break → `skip`. Banked minutes (earned-break mode) or nothing; no praise copy ("no shame" works both ways, so no bragging either).
- End session early → `end_early`, with an optional one-tap reason (done / stuck / life). Not counted against anything.

Built (ADR 0006): `skip` records the block ended early and the minutes it ran; `end_early` records the focus minutes done in the running block and, on a big one, its title. The reason chips aren't built yet.

## The deal itself

- Starting a session → `deal`, with the task (or the big one's title) and the focus length chosen. A deal that replaces a running session files that session's `end_early` first.

## Earned-break mode (optional preset)

- Earn rate: 1 min of break per 3 min of completed focus (configurable 1:2 to 1:5).
- Break length = earned balance (min 3, max 30). Asking beyond the balance = borrow, priced as above.

## Ramp-up (session level)

- A session can start with a tiny focus block (default 8 min). After each focus block completed **without** an override, the next focus default grows by +4 min, up to the user's target (default 25). After an override, it stays the same; it never shrinks as a penalty.

## Pure function API (`packages/core`)

```ts
type Ask =
  | { kind: "extend_break"; minutes?: number }
  | { kind: "extend_focus" }            // clock-initiated bonus
  | { kind: "skip_break" }
  | { kind: "end_early"; reason?: "done" | "stuck" | "life" };

type Term =
  | { kind: "freebie"; addMin: number }
  | { kind: "borrow"; addMin: number; repayFromNextBreakMin: number }
  | { kind: "trade"; addMin: number; addToNextFocusMin: number }
  | { kind: "bonus"; addFocusMin: number; addBreakMin: number }
  | { kind: "override"; addMin: number };

interface Offer { terms: Term[]; requiresIntention: boolean; override: Term }

function makeOffer(session: SessionState, ask: Ask, now: number): Offer;
function applyTerm(session: SessionState, term: Term, now: number, intention?: string): {
  session: SessionState;      // updated blocks/debt
  entry: LedgerEntry;         // what to persist
};
```

Convex mutations call `makeOffer` / `applyTerm`; clients call `makeOffer` only to render optimistically.

## Test cases (write these first)

1. First break extension → single freebie term + override.
2. Second extension → borrow and trade terms, no intention required.
3. Third extension → `requiresIntention: true`.
4. Borrow 10 when next break is 5 → next break 2 (floor), 7 carried. Wait: 5 − 2 floor = 3 repaid, 7 carried.
5. Debt at session end → `forgiven` entry, balance unaffected next day.
6. Trade cap: next focus already +15 → no trade term offered.
7. Bonus not offered if user paused in last 5 min; not offered twice in a row.
8. Ramp-up: 8 → 12 → 16 with no overrides; stays at 12 after an override.
9. Earned mode: 30 min focus at 1:3 → 10 min break; asking +5 beyond = borrow.
10. Override always present in every offer.

## Open questions for Chris

- [x] **Auto vs chosen repayment.** Decided: chosen, with last pick pre-selected for one tap. See [ADR 0005](../decisions/0005-chosen-repayment.md).
- [ ] **Freebie count.** One free +5 per break, or one per session?
- [ ] **Should friends see overrides?** Probably only the weekly balance, opt-in (see spec 004).
- [ ] **The clock's voice.** Does it have a personality ("Fine. But it's coming out of your next break 😏") or stay neutral? Feeds spec 003.

## Design rounds

Prototype: [prototypes/quick-deal/index.html](../../prototypes/quick-deal/index.html) · screenshots in `prototypes/quick-deal/shots/rN/` (`node prototypes/shoot.mjs <dir>`).

Categories: hierarchy / typography / color & contrast / consistency / one clear action / tone / delight. Reference apps scored by the same reviewers: Focusmate 6.5–7, Forest 7.8–8.3, Opal 8.2–8.6, one sec 7.6–7.8, Tiimo 8.1–8.5, Llama Life 7.4–8.

| Round | Reviewer | Scores | Changes |
| --- | --- | --- | --- |
| r1 | Product designer | 6.4 / 6.8 / 6.2 / 7.3 / 6.3 / 7.9 / 4.8 | Baseline (indigo + marigold, Bricolage) |
| r1 | Student, 11:40 PM | 6.7 / 6.8 / 6.0 / 6.2 / 6.3 / 7.6 / 5.6 | |
| r1 | Accessibility | 6.8 / 6.4 / 5.2 / 6.7 / 6.2 / 7.2 / 5.8 | |
| r2 | Chris (human taste pass) | "Looks AI-generated, colors off, the yellow highlight is bad" | Full visual reset with the frontend-design skill: one approval-green accent on grey-green paper; focus vs break shown by solid vs hatched ring; dial with minute ticks; deal as a ticket that gets stamped; ledger as torn stubs; Archivo condensed + Atkinson Hyperlegible; no caps labels, dot separators or mono. Also applied every r1 fix: a primary action on every sheet, dark-mode contrast token, no red/debt styling, sentence-as-control deal card, intention suggestion chips, 44px targets, focus management, no full re-render per minute |
| r3 | Product designer | 7.5 / 7.4 / 8.0 / 7.0 / 7.2 / 8.5 / 5.6 / distinct 6.6 | Scored the r2 reset (new "distinctiveness" category). Verdict: the ticket idea stops after the start screen |
| r3 | Student, 11:40 PM | 7.4 / 7.5 / 7.8 / 7.3 / 6.7 / 8.0 / 6.2 / distinct 6.6 | Heads-up pushed "Ask for 5 more"; third ask felt like a form |
| r3 | Accessibility | 7.8 / 8.2 / 7.3 / 8.0 / 7.5 / 8.6 / 6.6 / distinct 7.2 | Light-mode borders 2.7:1; focus lost on every re-render |
| r3 | Chris | "The green bar next to the insight is a bad UI look" | Removed the accent rail; the insight is now said by the clock |
| r3 → fixes | (applied, scored in r4) | — | Offers are ticket choices with one "Deal" button that stamps the pick; third ask asks for the first thing *before* showing deals; heads-up keeps "Start reading early"; dial has one tick per block minute with 5-min majors and a leading-edge dot, m:ss under 3 min, "Time / Reels is up" at zero; ledger is torn stubs with stamps; Archivo numerals inline (no slashed zeros); --edge to #6F7A72 (3:1+); focus restored after every render; 44px token hit areas; dark sheet raised with an edge |
| r4 | Product designer | 7.4 / 7.5 / 8.0 / 6.7 / 7.3 / 8.8 / 6.5 / distinct 7.6 | Avg 7.5. "Ask for 5 more" broke onto 3 lines (number-wrap bug); ticket idea still faded on the offer sheets |
| r4 | Student, 11:40 PM | 7.3 / 6.9 / 7.8 / 6.5 / 7.6 / 8.4 / 6.2 / distinct 7.1 | Avg 7.2. Borrow math still felt like homework; selected deal hard to see |
| r4 | Accessibility | 7.6 / 7.3 / 8.3 / 7.1 / 7.9 / 8.7 / 7.0 / distinct 7.6 | Avg 7.7. Selected term shown by color only; heads-up not visible; ledger tally contradicted its stamps; background not inert under sheets |
| r4 → fixes | (applied, not yet scored) | — | Buttons are single-line blocks; body numerals lighter; term tickets have side notches + a radio dot (not color-only); borrow copy is before → after; third ask has a Continue button with a preselected first thing; heads-up shows "Two minutes left. Wrap up…", a filled "Start reading now" and a tinted track; time-up shows 0:00; one major tick at 12 only; ledger tally = on the house / from breaks / to focus, stamps in flow, "+5 min of TikTok" titles; sheets make the page inert; chips and check-ins are radio groups; bonus "More time to decide" pauses the timer; Intercept hides the tab bar |
| r5–r10 | Automated council loop (3 reviewers + 1 fixer per round, target 9.8) | Round averages 7.67 → 7.93 → 8.02 → 7.98 → 8.10 → **8.22**; lowest category 5.9 → 7.0 (delight was always lowest) | Plateaued around 8.2 after 6 rounds (~3.1M tokens). Result on branch `design/council-r10`: serial-numbered ticket with stamp box, deal stub on the timer, full minute-tick dial, wrap-up heads-up, deal terms as tear-off tickets. Next gains need human taste and real users, not more AI rounds |
| r11 | Spec 007 council, round 1 (designer, student 11 PM, accessibility; side by side vs r10 and vs Focusmate, Forest, Session, Tiimo; no scores) | — | Long blocks: 30/45/60 in the focus picker; dial ticks follow the block (minor per minute, majors every 5 up to 30, every 15 above); halfway line on 45+; 5 min heads-up on 45+. Two pickers compared: A "Longer…" disclosure vs B both rows shown. Findings: B picked 2–1 ("Longer…" looked disabled, its aria-expanded never read true, 60 felt hidden); "Two 60 min blocks" read as a two-hour commitment and the 10 → 15 min Reels change looked like changed terms; halfway line replaced the next step and pushed "Stop for now" down; majors landed off-centre on 8 and 12 min; picking a length dropped focus to body; heads-up announcement didn't match the screen. All three: our tap picker beats Forest's slider; Focusmate is simpler (3 options); Tiimo's in-session +1 is missed |
| r11 → fixes | (applied, reviewed in r12) | — | Picker B as one radiogroup (aria-checked, "N minutes" names, posinset/setsize across both rows); picking returns focus to the sentence token; long-deal line "Then 15 min of Reels, and one more 60 min block if you want it." (later blocks offered, not owed); halfway in its own reserved slot under the next step, "Halfway. Stretch if you like.", and in the dial's accessible name; majors only when the block divides evenly; heads-up read aloud as "5 minutes to wrap up reading BIO 180 ch. 7." |
| r12 | Spec 007 council, round 2 (same three, vs r11) | — | All three: better than r11 on picker, 60 ticket, dial and halfway; heads-up same. Nothing important new, so the loop stopped. Small items taken: name the break on the ticket, keep "min block" so the line doesn't end on a bare number, posinset/setsize. Logged, not built: "+5 / wrap up early" in a long block's heads-up (needs a new ask in this spec), an end time on long deals, a half-punch on the DEAL stub at halfway (motion branch). Kept on purpose: the reserved halfway slot leaves a small gap above "Stop for now" so nothing moves at minute 30 |
| r12 | Chris (human taste pass) | "Looks good" | Long blocks approved as shown in r12 |
| m0 | Motion pass setup (branch `design/motion`) | — | Stills plateaued on delight, so this pass reviews motion. `node prototypes/shoot-motion.mjs <dir>` records 9 moments (stamp, turn-break, turn-focus, heads-up, time-up, offer-open, offer-pick, ledger, landing) at 375 px in light, dark and reduced motion: a frame strip per variant (60 ms steps) and a side-by-side WebM. Reviewers answer better/worse than last round and than Opal / Things 3 / Arc, with reasons; no scores, no target. Baseline = `main` |
| m1 | Motion designer | Better than `main` on stamp, turn-focus, offer-open, offer-pick, ledger, landing; worse than Things 3 on speed (1.1 s tap to timer, 540 ms dead hold) | First build: stamp press, land at 28 % with rebound, haptic at impact; block change winds the new ring in under a knob lap; heads-up and time-up ripples; sheets rise and slide away; terms tear off a pad, the picked one is stamped; ledger stub tears in; landing stamps a sample ticket and files it. Called the ripples "sonar, the most templated move", the fading stub "paper doesn't fade", three stamps per deal too many, landing "un-stamps" a ticket |
| m1 | Student, 11 PM | Offer-open "clearly better than Opal: the price right away, no lecture"; landing "I'd get it without reading"; nothing childish or judging | Dead time everywhere (stamp hold, grey time-up screen before the sheet, offer-pick hold); "Take my break" looked frozen |
| m1 | Accessibility | Better on most; turn-focus worse (blank dial, title at ~2:1 while fading in); reduced motion crossfades laid two text screens over each other | Found that turn-break never recorded a transition in either round: a real bug on `main` (pausing the bonus timer on focus resized the sheet, so the press slid off "Take my break"). Asked for a heads-up haptic and for the landing to leave the real helper text alone |
| m1 → fixes | (applied, reviewed in m2) | — | Bonus sheet keeps its size when paused; words never fade during a block change (settle only); ring scales in without spinning; number re-inks once at heads-up and time-up (ripples removed), heads-up buzz; time-up sheet arrives with the dim, Used half tears after it lands; stub falls as paper; stamp hold cut (timer at ~0.8 s), ring draws in 450 ms ease-out; tighter term stagger, faster pick; ledger stub arrives already stamped; reduced motion: sheets appear and disappear, no crossfade; landing slides the stamped sample off the fresh ticket, no CTA glow; recorder waits for fonts and uses real pointer presses |
| m2 | Motion designer | Better than m1 on stamp, turn-focus, heads-up ("removing the ripples was right"), time-up ("clearly better than Opal's end screen"), ledger; landing better in intent, worse than Arc (two tickets overlapped at 2.4 s) | Wanted the knob and arc to wind as one object, the stamped ticket to travel into the header chip, bought minutes to visibly arrive on the dial, a lighter "Used" postmark |
| m2 | Student, 11 PM | Faster and calmer almost everywhere; heads-up and offer-open "need no more work"; nothing judging | Same three asks: landing overlap, knob orbiting a full ring "reads like a loading spinner", stamp exit too quick to see |
| m2 | Accessibility | Better on stamp, turn-focus, heads-up, time-up, ledger, landing (no WCAG 2.2.2 issue: runs once, ~2.3 s, cancellable); nothing flashes or pans the viewport | Reduced-motion stamp stayed pale; announce what a deal costs, not just what it bought; stop the repeated full-turn knob orbit |
| m2 → fixes | (applied; final recording, not reviewed again: council stops at 2 rounds) | — | Every ring change winds on from empty with the knob riding its leading edge (new session, new block, bought minutes), 0.6 s gentle ease, after the sheet clears; this drives the ring's registered `--p` (mask repaint only), the one exception to transform/opacity. Stamped ticket shrinks into the header chip (view transition; headless recording can't show it, check on a phone). Stub fall readable (0.3 s). "Used" is a lighter postmark, sooner. Older ledger stubs are pushed down by the new one. Deal announcement includes the cost. Reduced-motion stamp at full ink. Landing: the stamped sample drops toward the pile and is gone before the fresh ticket comes up. Chris kept the wind as the one exception (ADR 0004). Still open: a lasting "new" marker on fresh stubs, flying the picked term into the Ledger tab |
