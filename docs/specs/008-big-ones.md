# Spec 008: Big ones

Status: approved for planning (loop 1) · Phase 1, next 4 weeks · Owner: Chris · Decisions: [0004-chosen-repayment](../decisions/0004-chosen-repayment.md)
Research: [Starting and splitting big tasks](../research/reports/Starting%20and%20splitting%20big%20tasks.md) (literature, competitors, feasibility, council record)
Depends on: spec 007 (study lengths) being merged, since this spec uses its length set and ramp.

## Why

Pomodeal gets people into one block. It doesn't yet help with the work students actually put off: a paper, a problem set, an exam, a project that needs 2 to 4 hours, often over several days. Planners solve this with a plan up front, and that's where people bounce: setup cost, overdue lists, and AI that reshuffles their week. Starter tools get you going and then forget the task exists.

A three-seat research council (learning science, product/UX, skeptic engineer) reviewed the evidence and signed one phase. Its thesis: **start a big task before planning it.** Pay a small first block now with a named first move, leave a bookmark, and let planning wait until day 2, when it's optional. A missed day never shows up as a miss.

Which arrow of the core loop (concept-v2 §3) this improves: **distracted → Quick Deal** for big tasks, and the return trip **recap → next block** across days.

## Evidence in one paragraph

The best-supported starting lever is a concrete if-then plan: d = .15 to .36 across 642 tests depending on bias correction (Sheeran, Listrom & Gollwitzer 2025), and if-then wording beats schedule wording (.43 vs .29) while adding detail to the cue seemed to hurt. Procrastination is mostly short-term mood repair, so the first minute should be cheap. Unpacking a task into pieces corrects optimistic estimates. People tend to resume interrupted tasks (Ovsiankina), which is what the bookmark leans on; the Zeigarnik memory effect did not replicate and is not a reason for anything here. Spacing and self-testing are strong for exam study. Evenly spreading other task types has thin support (the classic self-imposed-deadlines study was retracted in 2026). None of this goes in product copy as a claim.

## Words

Use these words everywhere: screens, code comments, docs.

| Thing | Word in the UI | In code |
| --- | --- | --- |
| A task bigger than one block | **big one** (shown by its own title, e.g. "Paper") | `tasks` table, `Task` type |
| One block of work | **deal** (unchanged) | session / block (unchanged) |
| The first block of a big one | first payment (ticket copy only) | `isFirstPayment` |
| The line saying what to do first | **first move** | `firstMove` |
| The note left for next time | **bookmark** ("Next time, start with…") | `bookmark` |
| Parts of a big one | **pieces** | `pieces` |
| Time the big one still needs | **open terms** (never shown as a debt or a count) | `openTermsMin` |
| Coming back after a gap | (no label in the UI) | `comeback` |

Never in the UI: "contract", "overdue", "late", "missed", "behind", "streak", "failed", any count of days away. "Deal" stays the word for one block.

## Flows

### Day 1: name it, two optional taps, start

1. On Quick Deal the student types what's next, e.g. "Paper due Friday". Under the field a chip reads **"Bigger than one block?"** It is always visible on Quick Deal and never pre-selected.
2. Tapping it turns the deal into a big one and shows two rows of chips, both skippable, both one tap:
   - **Type:** Writing · Problems & code · Exam study · Project
   - **Gut size:** 1h · 2h · 3h · 4h+
   (The `·` here is spec notation, not UI; the chips are separate buttons.)
3. The ticket reads: **"First payment on Paper: 15 min."** with the first-move line under it: **"When I sit down, I'll first: open the doc and write one ugly sentence."** The first move is prefilled from the type (table below) or blank-with-placeholder if no type, and fully editable. One tap switches 15 to **30**. The break the student plans before it works exactly as today.
4. Stamp. The block runs. **No split, plan, due-date or piece screen exists before this point.** Nothing else is asked.

A big one's sessions are ordinary Quick Deal sessions with a `taskId`. The first payment uses the existing 15 min length and the existing ramp, so later blocks in that session grow 15 → 19 → 23 as usual and are offered, not owed.

### End of a focus block that belongs to a big one

The stamp screen shows **at most two prompts**, both skippable:

1. **Bookmark:** "Next time, start with…" (one line, empty, placeholder from the type). If the student skips it, the old bookmark stays.
2. **Done:** "Finished {current piece}?" when there are pieces, otherwise "Is {title} done for now?" Buttons: **"Yes, stamp it"** / **"Not yet"** (default focus on "Not yet").

Whatever happens, minutes worked are added and **open terms** are updated: `gut − worked`, floored at 0. If no gut size was given, open terms stay empty (`null`) and no number is ever shown. "Yes" on a piece stamps the piece; "Yes" with no pieces sets the big one to `done`.

Splitting, spreading and the AI never appear on this screen.

### Day 2 and later: the card leads

Opening the app, Quick Deal shows up to **3 cards** for open big ones above the field, most recently worked first. Older ones sit behind **"All big ones"**.

- Card: **"Paper"**, then **"Start with: claim for paragraph 2"** (the bookmark, or the first move if no bookmark), then the progress line, then one button: **"30 min"** (the length last used on this big one; 15 if none).
- One tap starts a deal whose first move is the bookmark. The student can still pick a break first, as on any Quick Deal.
- The card's **⋯** menu: Split into pieces · Spread over the days left · Start fresh on this one · Set aside · Delete.

**Progress line** (small-area rule): with pieces, "{n} stamped" until half are stamped, then "{n} to go". Without pieces but with a gut size, "{h}h {m} in" until half the gut size, then "about {h}h {m} left". With neither, "{h}h {m} in". Exam study counts topics, never hours: an exam big one with no pieces shows no progress line until it's split.

### Planning lives on the card, all optional

**Split into pieces** opens a sheet with slots from the type (table below). The student edits titles and minutes, adds or removes rows. Under the list, without comment: **"Your pieces add up to 3h 40. Your gut said 2h."** In week 4, a **"Suggest pieces"** button can fill the slots (see AI below). Saving stores the pieces; the gut size is kept, never overwritten.

**Spread over the days left** asks for the due day if missing (date picker, "Due when?"), then proposes one piece or a slice of open terms per day, evenly, from today. With no pieces and no gut size there is nothing to spread, so the menu item opens Split first. The student **signs** ("Sign it") or drags pieces between days. Exam study defaults to **two or more separate days** when at least two days are left, with one line under it: **"Two shorter days usually stick better than one long night. Change it if you need to."** If only one day is left, it plans one day and shows no warning.

A spread is never applied without a signature, and the app never reshuffles on its own.

### Coming back after a gap

`isComeback` is true for an open big one when either:
- a spread is signed and a planned day before today passed with no block on this big one, or
- 2 or more calendar days (local time) passed since it was last worked, and open terms are not 0.

Then that big one's card (shown first) reads: **"Paper's still here."** / **"Smaller first move today?"** with a shrunk first move ("Read your last paragraph and fix one sentence" for writing; per-type table below) and a **15 min** button. Nothing on the screen says how long it's been or what was planned.

Two more options on that card, in the ⋯ menu as usual: **"Start fresh on this one"** clears open terms, bookmark and spread (pieces stay, unstamped ones stay unstamped) and **"Set aside"** moves it out of the cards without deleting it.

If a spread had been signed, after the comeback block ends the stamp screen still shows only its two prompts; the next time the card is opened, it offers **"Re-spread what's left?"** as a one-line link, which opens the spread sheet pre-filled. Sign or edit.

No "fresh start Monday" offers anywhere: the fresh-start pattern can backfire into "I'll start next week".

## Four types, one engine

The types change only placeholders, units and defaults.

| | Writing | Problems & code | Exam study | Project |
| --- | --- | --- | --- | --- |
| Default first move | Open the doc and write one ugly sentence | Do problem 1 until you're stuck / Run it and read the first error | Quiz yourself on topic 1 without notes | Decide one thing: ___ |
| Comeback first move | Read your last paragraph and fix one sentence | Reread your stuck question | Recall three things from last time | Look at the last thing you made |
| Piece unit | Section | Problem set or feature | Topic | Decision or thing you make |
| Split slots | Intro · Body · Body · Conclusion · Revise | Problems 1–3 · 4–6 · 7–9 | Topic 1 · Topic 2 · Topic 3 | Decide · Sketch · Build · Check |
| Done question for a piece | Messy draft exists? | Tried each one, stuck ones written down? | Recalled each item once without notes? | Decided or made? |
| Bookmark placeholder | Claim for paragraph 2 | The question I'm stuck on | Weak spot: … | Next visible thing: … |
| Spread default | Even over days left | Even over days left | 2+ separate days | Even over days left |

No type picked: blank first move with placeholder "The very first thing you'll do", no split slots (one empty row), even spread.

## Rules (pure functions in `packages/core`, test-first)

New file `packages/core/src/bigOne.ts`, exported from the index:

| Function | Does |
| --- | --- |
| `firstPaymentMinutes(task, comeback)` | 15 for a new big one or a comeback; otherwise the last focus length used on it |
| `openTerms(gutMin, workedMin)` | `null` without a gut size, else `max(0, gut − worked)` |
| `progressLabel(task)` | the small-area line above, as structured data (`{ kind: "stamped" | "toGo" | "in" | "left", n | minutes }`) |
| `proposeSpread(task, todayKey, dueKey)` | even plan of pieces (or open-terms slices) over days; exam forces 2+ distinct days when possible |
| `isComeback(task, workedDays, todayKey)` | the rule in "Coming back after a gap"; `workedDays` is the set of local date keys with a block on this big one |
| `firstMoveFor(type, comeback)` | the per-type default from the table |
| `splitSlots(type)` | the per-type slot titles |
| `bigOneProblem(input)` | validation for Convex: title 1–80 chars, first move and bookmark ≤ 140, pieces ≤ 12, piece minutes 5–240, gut one of 60/120/180/240 |

Days are passed as local date keys (`"2026-11-08"`), computed on the client from the device's time zone, so core never reads a clock or a zone. Convex queries never read `Date.now()`; the client calls these functions with `now`.

## Data model

```ts
// convex/schema.ts additions
tasks: defineTable({
  userId: v.id("users"),
  title: v.string(),
  taskType: v.optional(v.union(v.literal("writing"), v.literal("problems"), v.literal("exam"), v.literal("project"))),
  gutMin: v.optional(v.number()),
  workedMin: v.number(),
  openTermsMin: v.union(v.number(), v.null()),
  firstMove: v.string(),
  bookmark: v.optional(v.string()),
  pieces: v.optional(v.array(v.object({
    title: v.string(),
    minutes: v.number(),
    plannedDay: v.optional(v.string()),   // local date key, set only by a signed spread
    stampedAt: v.optional(v.number()),
  }))),
  dueDay: v.optional(v.string()),         // local date key, asked only on the card
  spreadSignedAt: v.optional(v.number()),
  aiSuggested: v.boolean(),               // true if accepted pieces came from a suggestion
  status: v.union(v.literal("open"), v.literal("done"), v.literal("set_aside")),
  lastWorkedAt: v.optional(v.number()),
  lastFocusMin: v.optional(v.number()),
  createdAt: v.number(),
}).index("by_userId_and_status", ["userId", "status"]),

// users gains
lastRepay: v.optional(v.union(v.literal("borrow"), v.literal("trade"))),  // ADR 0004 pre-selection

// sessions gains
taskId: v.optional(v.id("tasks")),        // + index by_taskId for task-scoped history
// sessionState gains
version: v.number(),                      // bumped on every change; scheduled pushes check it
scheduledIds: v.array(v.id("_scheduled_functions")),

pushSubscriptions: defineTable({ userId, endpoint, p256dh, auth, createdAt, lastSuccessAt? })
  .index("by_userId", ["userId"]).index("by_endpoint", ["endpoint"]),
checkIns: defineTable({ userId, weekKey, answer: "better" | "same" | "worse", at })
  .index("by_userId_and_weekKey", ["userId", "weekKey"]),
pieceSuggestions: defineTable({ userId, taskId, status: "pending" | "ready" | "failed", pieces?, createdAt })
  .index("by_taskId", ["taskId"]),        // transient: deleted on accept, dismiss, or after 24 h
aiUsage: defineTable({ userId, dayKey, count }).index("by_userId_and_dayKey", ["userId", "dayKey"]),
events: defineTable({ userId, kind, taskId?, ms?, at }).index("by_kind_and_at", ["kind", "at"]),
```

**Task-scoped history** is a bounded query over `sessions` by `taskId` plus their ledger entries; no new store. General history beyond 24 hours stays out of this phase.

`events.kind` values: `big_one_named`, `first_payment_started` (with `ms` from naming), `comeback_shown`, `comeback_started`, `bookmark_written`, `split_saved`, `spread_signed`, `ai_requested`, `ai_accepted`, `install_done`, `push_enabled`, `push_sent`, `push_failed`. Events never hold titles, bookmarks or any typed text.

## Push (week 3)

- Fires **only at block boundaries of a running session**: the heads-up (2 min, or 5 min on 45+ blocks, per spec 007) and block end. No daily reminders, no "time to work on Paper", nothing when no session is running.
- Pattern: every mutation that changes the running block (`start`, `ask`, `next`, `bonus`, `end`) bumps `state.version`, cancels the old `scheduledIds` and schedules new internal mutations with `ctx.scheduler.runAt`. Each scheduled mutation checks `{ sessionId, version }` and no-ops if stale, then schedules an internal Node action that sends the push and writes the result back with an internal mutation. Actions run at most once and are never retried; a failed send is logged as `push_failed`, not retried.
- Payload uses the Declarative Web Push format (Safari 18.4+), with a service-worker handler for other browsers. It opens the app on the running session. iOS gets no action buttons; Android may later.
- Copy (heads-up): "2 min to wrap up {block label}." Block end of a break: "{next label} is up next." Block end of focus: "{label} block is done. Your break is ready." Final wording goes through the voice pass during build.
- Release check: zero duplicate pushes for a session in the Convex logs over a day of dogfooding.

## Install onboarding (week 3, same release as push)

Shown once, after the student's first finished block, only when the app is not installed (`display-mode: standalone` false): **"Want a tap when your break ends?"** / **"Add Pomodeal to your Home Screen and it can tell you."** iPhone: a three-step Share → Add to Home Screen picture. Android: the browser's install prompt. Dismiss: **"Not now"** (never shown again unless they open Settings). After install, the first time a session starts, ask for notification permission from a button tap: **"Turn on taps at block ends"**.

## Wake lock

On the running screen during a focus block, a small toggle **"Keep screen on"**, off by default, remembered per device in `localStorage`. Uses the Screen Wake Lock API where supported (installed iOS 18.4+, Android Chrome); hidden where not. Released on break and session end.

## Optional AI: "Suggest pieces" (week 4, first to cut)

- Only inside the Split sheet. First use shows: **"This sends the title, type and size of this big one to Anthropic to suggest pieces. Nothing else. They keep it up to 30 days."** Buttons: **"Suggest pieces"** / **"I'll split it myself"**. Asked once per device, shown again from Settings.
- Sent: title (emails and phone numbers stripped on the client), type, gut size, days left. Never the bookmark, never other big ones.
- Flow: mutation checks the per-user limit (**10 a day**) and a global cap (**300 a day**), writes a `pending` suggestion and schedules an internal action. The action calls **Claude Haiku 5.5** (`claude-haiku-5-5`) with structured output (`{ pieces: [{ title, minutes }] }`, strict schema, max 12 pieces enforced in core after parsing) at low effort, then writes `ready` or `failed` with an internal mutation. The sheet subscribes to the suggestion.
- The suggestion fills the slots; the student edits. Only pieces the student saves are stored; the suggestion row is deleted on save or dismiss, and a daily cron deletes any left after 24 hours.
- On failure: **"Couldn't get suggestions right now. Your slots are still here."** The app is complete with this switched off (`AI_SUGGEST_ENABLED` env var).

## Weekly check-in (week 4)

Once per week (first open on or after Sunday, local time), a card above Quick Deal: **"Did this week go better than usual?"** Buttons: **"Better" / "About the same" / "Worse"**, plus an × to skip. One answer per week. No follow-up question in the app; Chris asks testers how it felt in person.

## Repayment (decided)

Repayment stays **chosen**: from the second ask, the student picks borrow or trade, and the option they picked last time is pre-selected so it's one tap. Recorded in [ADR 0004](../decisions/0004-chosen-repayment.md). No rule change in `packages/core` beyond remembering the last pick.

## What success looks like at the end of the beta

With 8 to 15 friends these are descriptive numbers, not significance tests:

1. **≥ 70%** of big ones have their first payment running within 2 minutes of naming, without AI.
2. **≥ 60%** of big ones that stay open past their first day get a block on a second day.
3. **≥ 50%** of comeback cards lead to a block in the same visit.
4. Most weekly check-ins say "Better", and nobody tells Chris it felt judging.

Logged as context only: install rate, push-enabled rate, bookmark rate, AI opt-in and accept rate, gut-vs-actual minutes per type. An internal Convex query Chris runs from the dashboard computes all of these from `events`, bounded to the beta window.

## Privacy

New stored behaviour fields: the last repayment choice, task titles, types, gut sizes, minutes worked, first moves, bookmarks, pieces, due days, planned days, statuses, timestamps; push subscription endpoints and keys; weekly check-in answers; event kinds and timings; AI usage counts; transient AI suggestions. All of them go into `docs/specs/006-privacy-inventory.md` in **week 1, before the fields exist**, together with the existing `users`, `invites`, `sessions` and `ledger` tables (the inventory doesn't exist yet). Titles and bookmarks are coursework text: only the student can read them, rooms never see them, and AI requests send only what the disclosure says. Delete on a big one deletes it and unlinks its sessions. Retention for `events`: deleted at the end of the beta.

## Weeks

| Week | Build | Done when |
| --- | --- | --- |
| 1 | Privacy inventory (006) for all tables. ADR 0004. `bigOne.ts` rules test-first. `tasks` table, `sessions.taskId`, `state.version`. Server-offset clock: `start` returns `serverNow`; client renders from the offset. | `npm test` covers every rule in the test list; schema deploys to dev |
| 2 | The starting flow: chip, type and gut chips, first-payment ticket with first move, block-end bookmark and done, open terms, day-2 cards with progress, wake lock toggle, events. Screenshots at 375 px light and dark; design rounds per the build loop. | A tester goes from typing a title to a running block in under a minute, with no planning screen |
| 3 | Split sheet with gut-vs-pieces, spread with sign, exam default, comeback card, re-spread link. Web Push (scheduler + version check + declarative payload), push subscriptions, install onboarding. | Real-device test on an iPhone (18.4+, installed) and an Android phone; zero duplicate pushes in a day of dogfooding |
| 4 | Weekly check-in. Optional "Suggest pieces". Metrics query. Hardening, changelog, version tag, invite testers. | Everything works with `AI_SUGGEST_ENABLED` off |

**Cut order if time runs out:** the AI suggester, then wake lock, then the heads-up push (keep block-end push), then re-spread (keep the comeback card). What's left still ships the phase: first payment, bookmark, open terms, day-2 card, comeback card.

## Calls made on the council's open questions

Chris approved the phase without answering these; these are the defaults this spec uses. Change any of them before planning.

| Question | Call |
| --- | --- |
| Does the comeback block default to 15 min? | Yes. A comeback is a first payment again. |
| What is a missed day? | The `isComeback` rule above (a signed planned day passed, or 2+ days since last worked with open terms left). |
| Open terms with no gut size? | Stored as `null`; no number shown, ever. The card still appears. |
| When is the due date asked? | Only on the card, when the student chooses Spread. "Due Friday" typed in the title is not parsed. |
| Is "big one" right? | Yes for now; revisit when the voice spec (003) exists. |
| App badge? | Not this phase. |
| 30-day vendor retention for AI? | Acceptable with the per-device disclosure above, opt-in per request. |
| Tester devices? | Chris checks iPhone models and iOS versions before week 3; push and wake lock need iOS 18.4+ installed. |
| How is "nobody felt judged" collected? | In person, by Chris. Optional interview notes go in `docs/research/sessions/` under the usual rules (first names only, no diagnoses, not in a public repo). |

## Out of scope

General history beyond 24 hours, presets and the block builder, earned-breaks mode, rooms, the weekly recap, the iOS Shortcuts intercept (documented as a power-user recipe later, not built), the motion pass, daily or scheduled reminders, calendar import, app badge, notification action buttons, parsing dates from titles, AI anywhere except Split.

## Test cases (written first)

1. `openTerms(120, 45)` is 75; `openTerms(120, 150)` is 0; `openTerms(undefined, 45)` is `null`.
2. `firstPaymentMinutes` is 15 for a new big one, 15 on a comeback, and the last focus length otherwise.
3. `isComeback` is false the day after a block, true 2 local days later with open terms left, false 2 days later if open terms are 0, and true when a signed planned day passed with no block on it.
4. `isComeback` uses local date keys: a block at 23:50 and an open at 00:10 the next day is 1 day, not 0 and not 2.
5. `progressLabel`: 4 pieces with 1 stamped is "1 stamped"; with 3 stamped is "1 to go"; no pieces with gut 120 and 45 worked is "45 in"; with 90 worked is "about 30 left"; no pieces and no gut is "45 in"; an exam with no pieces has no label.
6. `proposeSpread` for exam with 3 topics and 4 days left uses at least 2 distinct days; with 1 day left uses 1 day; writing with 4 pieces and 4 days uses one piece a day.
7. `proposeSpread` never schedules a day before today or after the due day.
8. `firstMoveFor` returns the table's text for each type, comeback and not; no type returns an empty first move.
9. `bigOneProblem` rejects an empty title, an 81-character title, 13 pieces, a 4-minute piece and a 90-minute gut size.
10. The deal built for a first payment of 15 is a normal Quick Deal session (15 → 19 → 23 ramp) with `taskId` set.
11. A scheduled push with an old `version` does nothing; a session changed twice in a row schedules one heads-up and one block end, not two of each.
12. The AI limiter refuses the 11th request for a user on one day and the 301st across users, without calling the action.
