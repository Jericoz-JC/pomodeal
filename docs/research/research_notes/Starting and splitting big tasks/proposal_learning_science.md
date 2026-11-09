# Proposal (learning-science seat): "First Move"

**Thesis:** a big task should never be planned before it is started. Instead it becomes a chain of small deals. Each deal opens with a written first move, ends with a bookmark, and is re-offered on fresh terms after a missed day. These are the mechanisms with evidence behind them: implementation intentions, concrete construal, unpacking, resumption, and self-compassion. A full plan is not.

## Core flow: "I have a paper due Friday"

1. **Quick Deal, one extra chip.** The user types "History paper" in the existing "what are you doing now" box and taps *This is a big one*. Three one-tap questions follow:
   - **Type:** writing / problem set or code / exam / project.
   - **Due:** shown as "this week" or "next week", not as a date (Tu & Soman).
   - **Gut size:** 1h / 2h / 3h / 4h+. This estimate is stored for later.
2. **First move.** A prompt reads "When I sit down, I'll first…", prefilled by type. For writing: "write one ugly sentence of the intro". The user can edit or accept it. This is the implementation intention.
3. **Down payment.** The first block is offered at 30 min or at 15 min. 15 min is a new length allowed only for the first block of a big task: one pure rule in `packages/core`. The user plans their break as usual, and the block runs.
4. **First block ends.** The existing stamp marks the first payment. Two prompts follow, each skippable:
   - **Split:** three segment slots prefilled from the type template, each sized in blocks. The app shows the segment total next to the gut estimate: "pieces add up to 3h 30, gut said 2h". This is unpacking, done after starting, when the task already has pull (Ovsiankina).
   - **Bookmark:** "Next time, start with…"
   - The optional *Suggest pieces* button (AI) can fill the slots. The user edits them before they are saved.
5. **Day 2.** On opening the app, Home shows the task ticket with the bookmark as the first move: "Paper: start with 'claim for ¶2'. 30 min?" One tap starts it. Before the halfway point the ticket shows stamps earned; after halfway it shows what is left (small-area hypothesis).
6. **After a missed day.** The first screen never shows what was missed. It offers "Smaller first move today?" with a 15-min down payment. After that block, the app *proposes* re-spreading the remaining pieces over the days left. The user signs or haggles, and nothing reshuffles silently. Unfinished pieces are "open terms", never "overdue".

## Weeks

- **Week 1. Foundations, test-first.**
  - Privacy inventory spec, which must be done before any new field exists.
  - Task and segment schema.
  - `packages/core` functions: down-payment rule, segment sum vs gut, re-spread proposal (exam work gets a two-day minimum), small-area progress mode.
  - Versioned scheduler and server-time offset (from the feasibility notes).
- **Week 2. The big-task flow.**
  - Chip, three questions, first move, down payment.
  - Split and bookmark at block end.
  - Day-2 Home ticket.
  - Type templates and done-criteria.
- **Week 3. Re-entry.**
  - Missed-day comeback screen and the suggest-then-sign re-spread.
  - Web Push at heads-up and block end, using the declarative payload.
  - Install onboarding, shown at the moment it pays off ("Want a tap when your break ends?").
  - Wake lock on the ring.
- **Week 4. Optional AI and measurement.**
  - *Suggest pieces* via Haiku: structured output, rate-limited, opt-in per request, with names and emails scrubbed out. Only what the user accepts is stored.
  - Weekly one-question check-in.
  - Event logging for the metrics below.
  - Buffer.

## Feature placement

| Feature | Decision | Reason |
|---|---|---|
| 1 Web Push | IN (wk 3) | Re-entry needs a nudge, but push is only a courtesy layer. Boundaries stay client-side (feasibility risk 1). |
| 2 Motion/feel pass | LATER | Reuse the existing stamp. Polish has no evidence for helping starts. |
| 3 Privacy inventory | IN (wk 1) | Task titles, bookmarks and AI text are a new data category (feasibility risk 3). |
| 4 Presets/block builder | LATER | Type templates cover the need. Builders add setup cost, the leading abandonment cause (product_ux §2). |
| 5 History >24 h | IN, task-scoped only | A task carries its own segment history. General history comes later. |
| 6 Earned breaks | LATER | No break scheme wins for students (Biwer 2023, Smits 2025). It is not a starting lever. |
| 7 Repayment auto vs chosen | IN as an ADR: **chosen**, one-tap accept | Motion's top complaint is re-planning without approval. Signing a proposal is a deal. |
| 8 iOS Intercept | LATER (recipe) | Shortcuts are unreliable, there is a loop risk, and it may land in Safari (feasibility §4). |
| 9 Rooms + check-ins | LATER | Body-doubling evidence is thin. It needs presence infrastructure and burst scheduling. |
| 10 Weekly recap/ramp-ups | LATER | Ramp-ups risk pressure. Per-task gut-vs-actual calibration covers the useful part. |
| 11 One-question check-in | IN (wk 4, tiny) | It is the beta's outcome measure. |
| 12 Install onboarding | IN (wk 3) | iOS install is the gate to push. Ask at the moment it pays off. |
| NEW big-task chip + type templates | IN | Concrete construal; type-specific units (learning_science §4). |
| NEW first move | IN | Implementation intentions. Shrunk to d≈0.15–0.35, but the most reliable lever there is. |
| NEW 15-min down payment | IN | Lowers the cost of the first minute (mood-repair account). |
| NEW split after first block, gut vs sum | IN | Unpacking and segmentation effects (Kruger & Evans; Forsyth & Burt). |
| NEW bookmark | IN | Ovsiankina resumption plus a concrete next action. Not Zeigarnik. |
| NEW comeback + suggest-then-sign re-spread | IN | Self-compassion (Breines & Chen). Nobody owns re-entry (product_ux §3). |
| NEW small-area progress | IN | Koo & Fishbach. Cheap pure function. |
| NEW optional AI *Suggest pieces* | IN, cut first | Optional. Under $10 for the whole beta. No completion evidence. |
| NEW wake lock | IN | A dozen lines. Keeps time externalized on screen. |
| Break scaling, phone-break return ramp, landmark re-plan | LATER | Moderate or thin evidence. Not about starting. |

## Task types

- **Writing.** Pieces are sections. Done means "messy draft exists", and revising is a separate piece. Example bookmark: "claim for ¶2".
- **Problem sets / code.** Pieces are N problems or one feature. Done means "attempted, and I wrote my stuck question". The stuck question becomes the bookmark.
- **Exam.** Pieces are topics. Done means "recalled once without notes" (retrieval practice). The re-spread enforces at least two separate days (spacing).
- **Project.** Pieces are decisions or artifacts ("decided the question", "sketch exists"). These are learning goals, which suit complex work (Locke & Latham).

## Success at beta end (8–15 friends, descriptive, no A/B)

- At least 70% of big tasks get a first block started within 2 minutes of creation.
- At least 60% of multi-day tasks get a session on a second day.
- At least 50% of comeback screens lead to a block started that day.
- A bookmark is written at 50% or more of block ends. Day-2 time-to-start is compared for tasks with and without a bookmark.
- The gut-vs-actual ratio is reported per type. This is the first calibration data.
- Most check-in answers say "better than usual" by week 3, and no one reports feeling judged (5 short chats).

## Top risks

1. **The sheet becomes a planner** (Marvin's first-week overwhelm). Mitigation: three taps to start, splitting comes after starting, and every prompt is skippable.
2. **Push and install fail on iOS,** so day 2 depends on the user opening the app. Mitigation: the Home ticket works without push, and the install rate is measured first.
3. **Evidence oversold.** Segmentation was studied on short lab tasks, and the implementation-intention effect has shrunk. Copy promises nothing, and only behavior is measured.

**Cut order if time runs out:** the AI suggestion, then the wake lock, then push for heads-up (keep block-end push), then the re-spread proposal (keep the comeback screen).

## Round 2

### Votes

- **A. Down-payment length: the user picks, and the default is 15 min.** 30 stays one tap away. The evidence favours making the first minute cheaper (the mood-repair account, learning_science §1), but nothing supports a specific minute count (§1 gaps). So 15 is a default, not a doctrine: one pure rule in core, with no "feel" dial.
- **B. Motion pass: LATER.** Reuse the existing stamp. Nothing in the notes links animation to starting, and the week is better spent on re-entry.
- **C. History over 24 h, scoped to one big task: IN.** It costs one `taskId` on blocks (feasibility's own schema already has it). The second-day and bookmark metrics can't be measured without it.
- **D. LATER for all three; CUT none.**
  - Rooms are a concept-v2 pillar. Their evidence is thin, which argues for delaying them, not deleting them.
  - The recap must come back without scores (no-streaks rule).
  - Presets may still matter for small tasks.
- **E. Name: "task" in the data model; in the UI, the user's own title** ("Paper"). The entry chip says "Bigger than one block?".
  - "Contract" implies breach and penalty, which is a shame risk.
  - "Deal" already means one block.
  - "Big one" is fine as a casual chip, but too vague as a noun.
- **F. Exam across 2+ days: a default the user can override.** Spacing is strong evidence (Cepeda, Dunlosky). But an exam due tomorrow makes a hard rule impossible, and autonomy carries the effect: in one sec's study, the option to dismiss drove the result (product_ux §1).
- **G. Keep these four metrics:**
  1. 70% or more of big tasks have their first block running within 2 min of creation, without AI.
  2. 50% or more of multi-day tasks get a session on a second, different day.
  3. 50% or more of missed-day screens lead to a block started in that same visit.
  4. A majority of weekly check-in answers say "better than usual", and nobody mentions feeling shamed in follow-up chats.

  Bookmark rate, install rate, AI use and the duplicate-push count are logged as engineering context, not as targets.

### Scores

**Product/UX: 8/10.**
1. The install onboarding is pitched in W2 on "remind me?", but push only arrives in W3. Testers would install for a reminder that doesn't exist yet. Ship the two in the same week.
2. The daily "next due" sweep push adds a standing nag channel the evidence doesn't ask for. The 70% target for a second-day session also ignores tasks due tomorrow.

**Feasibility: 7/10.**
1. On day 1, `planContract()` runs, segments are shown, and gut, due date, type and a feel dial are all asked *before* the down payment. That puts planning before starting, which contradicts the consensus and invites Marvin-style setup overwhelm (product_ux §2). Unpacking works just as well after the first block.
2. "Contract" and "1 of 5 paid" frame a missed day as a breach. CUTting rooms and recap from the roadmap also goes beyond this phase's remit. The feel dial has no evidence behind the shorter down payment it produces.

### Changes to my proposal

- Adopt product/UX's chip copy, "Bigger than one block?".
- Store the remainder (gut estimate minus the block) as open terms even if the user never splits, so a day-2 card exists without a plan.
- Move install onboarding into the same week as push.
- Add feasibility's "zero duplicate pushes in Convex logs" as a release check.
- Drop "this week vs date" as a requirement. Keep it as copy for the due chip only.

### Sign-off

I would sign a merged plan that resolves A–G by majority: **yes, if** no split, plan or segment screen appears before the first block runs. Before that block, the only extra inputs are the type and gut-size taps, and both are skippable.
