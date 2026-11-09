# Proposal (skeptic-engineer seat): "Down Payment"

**Thesis:** A big task becomes a stored *contract* that Pomodeal remembers across days, and starting it means paying one small, concrete first block now; the plan is spread, repaired and (optionally) AI-suggested, but the product is complete with zero AI calls and zero pushes.

Why this and not a planner: the notes agree that the only strongly evidenced starting lever is a concrete if-then first move (learning_science §1), that starter tools die because they forget and planners die because they re-plan without consent (product_ux §1-2), and that on this stack the cheap, robust pieces are pure planning functions plus one Convex document per task (feasibility §2, ideas 1, 5, 6).

## Core flow

**Day 1.** Quick Deal gains a "bigger than one block" path. The user types "Paper due Friday", picks a type chip (writing / problems / exam / project), a due day, a gut estimate (1 to 6 h) and how hard it feels (3-step dial). The pure function `planContract()` returns segments sized to one or two focus blocks, spread evenly over the days left (exam study forced onto at least two days, per spacing evidence), and shows "your pieces add up to 3 h 45; your gut said 2 h" without comment. Instead of starting the plan, the ticket asks for a **down payment**: 15 min (shorter when the dial is "hard") with a type-specific first-move placeholder ("write one ugly sentence", "do problem 1 until stuck"). Tap Start; the existing deal engine runs it. An optional "Suggest segments" button calls Claude; the user edits or deletes any line.

**Block end.** The stamp screen asks one line: "Next time, start with ___" (the **bookmark**). Stored on the contract, never shown as a to-do.

**Day 2.** Home shows the contract card: "Paper, due Fri. 1 of 5 paid. Bookmark: counter-argument paragraph. 45 min?" One tap starts a block whose first move is the bookmark. Progress reads "1 paid" before halfway and "2 to go" after (small-area hypothesis).

**Missed day.** No overdue state exists. The card says "Yesterday's payment didn't happen. Smaller first move today?" with a 15-min down payment and a *proposed* re-spread of remaining segments that the user signs or haggles (suggest-then-sign; Motion's top complaint avoided). Owed time stays as open terms on the ledger and can be written off on request.

## Week by week

**W1: foundations, no UI.** Privacy inventory spec first (gate for new testers). Schema: `contracts` {userId, title, taskType, dueAt?, gutEstimateMin, feel, segments[{title, minutes, criterion, doneAt?}], bookmark?, status, version}; `blocks` gain `contractId?`, `segmentIndex?`, `firstMove?`, `version`, `scheduledIds[]`; `pushSubscriptions` {userId, endpoint, keys, lastSuccessAt}. Core (test-first): `planContract`, `downPayment(feel, preset)`, `proposeRepair(contract, now)`, `progressLabel`. Start mutation returns `serverNow` for a client clock offset. Versioned scheduler: every scheduled boundary carries `{blockId, version}` and no-ops when stale.

**W2: the starting flow.** Big-task entry, first-move line, down payment, bookmark prompt, contract card, wake lock on the ring. Screenshots at 375 px, light and dark.

**W3: day 2 and repair, then push.** Repair flow with suggest-then-sign. Install onboarding pitched at the payoff moment ("Want a tap when the break ends? Add to Home Screen"), hidden when already standalone. Web Push via mutation -> scheduled internal action -> result mutation, declarative payload (`web_push`, `navigate` to the pre-filled deal, `app_badge` = 1). In-app heads-up stays the source of truth.

**W4: optional AI, measurement, release.** "Suggest segments" on Haiku 5.5, low effort, structured output `{segments:[{title,minutes}]}` capped at 6, behind `@convex-dev/rate-limiter` (10/day/user, global cap), client-side scrub of emails and names, only accepted text stored. Weekly one-question check-in. Event instrumentation, changelog, tag.

## Feature placement

| Feature | Call | Reason |
|---|---|---|
| 1 Web Push heads-up and end | IN W3 | Needed for day-2 returns; install-gated and never load-bearing (feasibility §1) |
| 2 Motion pass on deal moment | LATER | No note links feel to starting; first thing cut |
| 3 Privacy inventory | IN W1 | Free-text fields and push endpoints are new categories (feasibility risk 3) |
| 4 Presets and block builder | CUT | Contract replaces the builder for big tasks; no schedule beats another (learning_science §3) |
| 5 History beyond 24 h | LATER | The contract card is the history that matters; retention stats are noise at beta size |
| 6 Earned-breaks mode | LATER | Flowtime scaling is moderately supported but orthogonal to starting; a pure-function change later |
| 7 Repayment auto vs chosen | IN, decided: chosen | Sunsama's prompt option praised, Motion's silent re-plan hated (product_ux §3) |
| 8 iOS Shortcuts Intercept | LATER (recipe doc only) | Mandatory banners, flaky, lands in Safari (feasibility §4) |
| 9 Rooms with presence | CUT this phase | Body-doubling evidence thin; new infra and concurrency bursts on the free tier |
| 10 Weekly recap and ramp-up | CUT | A recap is a shame surface with nothing to recap in 4 weeks |
| 11 Weekly one-question check-in | IN W4 | Half a day; the only outcome signal a friends beta can produce |
| 12 Install onboarding | IN W3 | The gate for push and badge on iOS |
| New: down payment + first move | IN W2 | Implementation intention, the strongest lever (learning_science §1) |
| New: bookmark | IN W2 | Ovsiankina resumption, nobody owns re-entry (product_ux §3) |
| New: even-spread contract + suggest-then-sign repair | IN W1/W3 | Ariely spacing finding; Motion lesson |
| New: optional AI suggester | IN W4, flagged | Under $10/month for the beta; app complete without it |
| New: server-offset clock + versioned scheduler | IN W1 | Removes double-fire and skew bugs before push exists |
| New: wake lock | IN W2 | A dozen lines, iOS 18.4+ |

## Four task types

Writing: segment = section, done = "messy draft exists", revise is its own segment. Problems/coding: segment = N problems, done = attempted, bookmark = the stuck question. Exam: segment = topic, done = "recalled without notes", plan spans at least two days. Open-ended: segment = decision or artifact, first move = "write the one question I need to answer". Only the placeholder strings differ; the engine is the same.

## Success at beta end

Events, not retention: 70% of contracts get a down payment started within 2 min of creation; 50% of contracts receive a second payment on a different day; a bookmark is written on 40% of contract block-ends; repair is accepted at least half the times shown; the AI button is used on under half of contracts (proves the app stands alone) and the monthly Claude bill stays under $5; zero duplicate pushes in Convex logs; install rate among iOS testers measured.

## Top 3 risks and cut order

1. **Install gate.** If friends do not add to Home Screen, push is dead weight. Mitigation: the in-app heads-up already exists; measure install rate in W3 before polishing push.
2. **Scope.** Repair + push + AI is a lot for one person. Cut order: AI suggester, then motion pass, then push. The contract, down payment, bookmark and repair flow are the phase.
3. **Free-text privacy.** Titles and bookmarks are coursework data. Inventory first, store only user-edited text, AI opt-in per request, 30-day vendor retention disclosed to testers.

## Round 2

### Votes

- **A. 15 min, new length, allowed only as the first block of a big task.** One pure rule in core, no new preset, no picker at the moment we are removing decisions (learning_science §1 mood-repair; product_ux §2 setup cost).
- **B. Motion pass: LATER.** No note ties feel to starting; two of three proposals already list it cut-first; a solo W4 is for hardening and release.
- **C. Task-scoped history: IN.** It falls out of the task document for free (segments with `doneAt`); it is a query, not a feature. I change my LATER.
- **D. Builder and recap: CUT; rooms: LATER.** Segments do the builder's job; a recap is a shame surface with per-task calibration covering the useful part; rooms are the concept's Phase 2 and need presence infra (feasibility risk 5).
- **E. UI "big one", table `tasks`, pieces "pieces", unfinished = "open terms".** "Contract" reads legal and turns a missed day into a breach; "deal" is already the block. Plain words rule.
- **F. Exam 2+ days: default, user can override.** The proposal spreads over two days (Cepeda spacing is strong), but a hard rule breaks "I need this always works" and the night-before exam is real; the user haggles it to one day.
- **G. Keep four:** (1) median time from typing a big task to first block running, without AI (target under 60 s / 70% within 2 min); (2) share of big tasks with a session on a second day (60%); (3) after a missed day, half of returning users start a block in that session; (4) bookmark written at 50% of big-task block ends. Log install rate, AI opt-in, edit depth, gut-vs-actual and the check-in as context, not targets.

### Scores

**Learning science, "First Move": 8/10.** Objections: (1) Block one ends with three prompts (split, bookmark, done) at the moment the user wants to leave; that is the Marvin first-week overwhelm in miniature (product_ux §2). Bookmark and done at block end; splitting belongs on the day-2 card. (2) W2 carries nine UI pieces (chip, three questions, first move, down payment, split, bookmark, day-2 ticket, templates, done-criteria) while W4 holds the buffer; the blow-up week has no slack. Minor: storing due as "this week" only (Tu & Soman, single team) starves the re-spread, which needs days left; store a date, display the period.

**Product/UX, "Down Payment": 7.5/10.** Objections: (1) Most scope of the three: UI in W1 on top of foundations, three push types plus a daily "next due" sweep in W3, motion in W4. The sweep implies planned clock times for sessions, which is the planner creeping back; this phase should push only on block boundaries. (2) The default first block is 30 min with 15 reserved for repair, which contradicts the thesis that the first start is the costliest; and the "fresh start Monday" offer adds a flow with a documented backfire mode (learning_science §1) for little gain in four weeks.

### Changes to my proposal

Adopt start-before-plan fully: my flow showed the spread and the gut-vs-pieces comparison before the down payment, which contradicts the shared thesis; both move to after block one, onto the day-2 card. Drop the "how hard does it feel" dial (one fewer field; evidence is Goblin praise only) and make the down payment always 15. Rename `contracts` to `tasks`, "contract" to "big one". Task-scoped history IN. Exam two-day minimum becomes a default.

### Sign-off

**Yes-if** the merged plan caps the load where the three proposals overlap: block end shows at most two prompts (bookmark, done), splitting lives on the day-2 card, and push in this phase fires only at block boundaries, with no planned-time sweep.
