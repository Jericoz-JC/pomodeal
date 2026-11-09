# Proposal (product/UX seat): "Down Payment" phase

**Thesis:** A big task gets *started* before it gets *planned*. The first deal is a small down payment with a named first move, and every block ends with a bookmark, so tomorrow's start is one tap and a missed day costs nothing.

Evidence behind it: if-then plans and concrete first moves are the strongest initiation lever (learning_science §1; effect shrinks to d 0.15–0.35 after 2024 correction, feasibility §6). Ovsiankina resumption supports stopping with a next step (learning_science §2). Planners get abandoned for setup cost, guilt and silent re-planning, while Goblin Tools is stateless (product_ux §1–2).

## Core flow: "I have a paper due Friday"

1. **Quick Deal.** The user types "paper due Friday". A chip offers *"Bigger than one block?"*. Tapping it opens the task card.
2. **Task card (one screen).** Fields: title (prefilled), type (Writing / Problems & code / Exam study / Project), due ("this week" or a date), and gut size (1h / 2h / 3h / 4h+). Defaults work, so the user can skip everything.
3. **Down payment deal.** A ticket: *"First payment on Paper: 30 min. First move: open the doc, write one ugly sentence. Deal?"* The first move is editable and the suggestion depends on type. The user stamps it and the block runs. The remainder is saved as **open terms**: gut size minus the block.
4. **Block end.**
   - *Bookmark:* "Next time, start with…" (one line, skippable).
   - *Done stamp:* the type's done-criterion (for writing, "messy draft of intro exists?").
   - *Then, optionally, "Plan the rest?"* The splitter (manual) shows "your pieces add up to 3h40, gut said 2h" and proposes sessions spread evenly before Friday, which the user signs or edits. Optional "Suggest pieces" (AI) appears here, never before the first block.
5. **Day 2.** Opening the app, the Quick Deal leads with *"Paper: your bookmark says 'counterargument paragraph'. 30 min?"* One tap starts it. If installed, a push at the planned time opens the same screen.
6. **After a missed day.** No counts, no red. *"Paper's still on the table. Smaller first move today? 15 min."* A re-plan is proposed and the user signs it; it is never reshuffled silently, which avoids Motion's top complaint. The user can also clear owed time. A "fresh start Monday" offer appears only when the user is off-track, never as a way to defer an on-track task (learning_science §1 backfire).

Progress uses the small-area rule: "2 stamped" until halfway, then "2 to go".

## Week by week

- **W1 (foundations):**
  - Privacy-inventory spec.
  - `packages/core` (test-first): task/plan model (title, type, due, estimate, open terms, bookmark, segments), down-payment deal, open-terms math.
  - Versioned scheduler (`{blockId, version}`) and server-offset clock.
  - Task card plus down payment ticket with the first-move line.
- **W2 (re-entry):**
  - Bookmark at block end and type done-stamps.
  - Day-2 resume on Quick Deal and the missed-day repair screen.
  - Small-area progress.
  - Install-to-home-screen onboarding, timed to the first "remind me?" moment.
- **W3 (reach):**
  - Declarative Web Push: heads-up, block end, and one daily off-peak "next due" sweep.
  - Wake lock on the ring.
  - Manual splitter with gut-vs-pieces and even-spaced suggest-then-sign.
- **W4 (polish + optional AI):**
  - AI "suggest pieces": Haiku 5.5, opt-in per request, rate-limited, scrubbed, stores only the accepted segments.
  - Motion pass on the stamp.
  - Weekly check-in.
  - 375 px / dark-mode pass, then invite the friends.

## Features

| # | Feature | Call | Reason |
|---|---|---|---|
| 1 | Web Push (heads-up, block end) | **IN W3** | Day-2 nudge needs it. Treat it as a courtesy, since timers stay client-side (feasibility risk 1) |
| 2 | Motion/feel pass | **IN, stamp only, W4** | The stamp is the progress moment. Block-change and heads-up motion wait |
| 3 | Privacy inventory spec | **IN W1** | New free text (titles, bookmarks) plus optional AI is a new data class (feasibility risk 3) |
| 4 | Presets + block builder | **LATER** | The segment plan does the builder's job for big tasks, and 30/45/60 already exist |
| 5 | History > 24 h | **IN per-task only** | A plan carries its own sessions. Global history waits for the recap |
| 6 | Earned-breaks mode | **LATER** | No break scheme wins (Smits 2025). Fold in the Flowtime-style default only if W3 has slack |
| 7 | Repayment auto vs chosen | **IN as an ADR: chosen** | Open terms are re-offered, not auto-deducted (Sunsama prompt option; Motion complaint) |
| 8 | iOS Shortcuts Intercept | **LATER (recipe)** | Banners, loops, lands in Safari (feasibility §4). Not worth a phase week |
| 9 | Rooms + presence | **LATER** | Thin evidence (learning_science §3), 8-job concurrency (feasibility risk 5) |
| 10 | Weekly recap + ramp-ups | **LATER** | Needs global history. Recap must avoid streak-like scoring |
| 11 | Weekly one-question check-in | **IN W4** | Cheap, and it is a success measure |
| 12 | Install onboarding | **IN W2** | The whole iOS reach depends on it (feasibility risk 2) |
| N1 | "Bigger than one block?" + down payment deal | **IN W1** | Start before plan |
| N2 | First-move line (if-then) | **IN W1** | Strongest initiation evidence |
| N3 | Bookmark at block end | **IN W2** | Ovsiankina; no product owns re-entry (product_ux §3) |
| N4 | Type done-stamps + small-area progress | **IN W2** | Makes fuzzy tasks finishable (Koo & Fishbach; retrieval to criterion) |
| N5 | Open terms + missed-day repair | **IN W2** | Overdue badges drive guilt; self-compassion raises effort (Breines & Chen) |
| N6 | Manual splitter, gut vs pieces, even spacing | **IN W3** | Unpacking corrects the planning fallacy; people space their own deadlines badly (Ariely) |
| N7 | Optional AI "suggest pieces" | **IN W4, cut first** | Costs under $10 for the beta, but no evidence it beats a hand-typed step |
| N8 | Wake lock, server offset, versioned scheduler | **IN** | Small, and they prevent whole bug classes |

## Four task types

| Type | Default first move | Segment unit | Done stamp |
|---|---|---|---|
| Writing | "Open the doc, one ugly sentence" | Section | Messy draft exists (revise is a separate segment) |
| Problems / code | "Problem 1 until stuck" | N problems | Attempted, stuck-question written |
| Exam study | "Self-quiz topic 1 without notes" | Topic | Recalled each item once. The splitter requires at least 2 separate days |
| Project | "Decide one thing: ___" | Decision or artifact | "Decided X" / "sketch of Y exists" |

## Success at end of beta (8–15 friends)

- Median under 60 s from typing a big task to the first block running, without AI.
- At least 70% of big tasks get a second session on a different day.
- A bookmark is written on at least 60% of big-task block ends, and resumes that start from a bookmark happen sooner (directional).
- After a missed day, at least half of returning users start a block in that same session.
- Weekly check-in: most answers say "better than usual". Zero shame mentions in follow-up chats.
- Logged as context, not targets: install rate, and AI opt-in plus how many suggested pieces are deleted or edited.

## Top risks, and the cut order

1. **Becoming a planner (Motion/Marvin creep).** Guard: the plan is offered only *after* the first block, and stays to one screen.
2. **Install and push gaps hide day 2.** Guard: resume lives on app open. Push only adds to it.
3. **AI slows or patronizes the start, and privacy.** Guard: AI is optional, comes after the first block, never blocks Start, and is opt-in per request.

**Cut first if time runs out:** (1) AI suggest, (2) motion pass, (3) even-spacing suggestion (keep the manual splitter), (4) the weekly check-in becomes a chat question.

## Round 2

### Votes
- **A. Down-payment length: user picks, default 15, with 30 one tap away.** Procrastination is mood repair, so the first minute should be as cheap as possible (learning_science §1, Sirois & Pychyl). Spiciness is praised because the user sets how hard it feels (product_ux §1). It is one pure rule in core.
- **B. Motion pass: LATER.** I concede. No note links animation to starting, and the existing stamp already marks the moment (learning_science and feasibility both say so).
- **C. Task-scoped history: IN.** It costs nothing extra: it is the segment list already stored on the task, which the day-2 card and the "2 stamped / 2 to go" progress need anyway. General history stays LATER.
- **D. Presets/builder, rooms, recap: LATER, not CUT.** A 4-week phase shouldn't delete roadmap items. Rooms are part of the product thesis in CLAUDE.md. The recap can be made safe by the voice spec, which doesn't exist yet. Presets are covered by type templates for now.
- **E. Name: "big one" in the UI, `bigTask` in code.** "Deal" already means one block. "Contract" sounds binding, so missing a session reads as breaking it, which is a shame risk (product_ux §2 on guilt surfaces). In copy, the user's own title does most of the work: "Paper: 2 stamped".
- **F. Exam studying across 2+ days: a default the user can override.** A hard rule contradicts negotiation, and the night-before exam is real. The spread proposal defaults to two days with a one-line why (spacing evidence; learning_science §2).
- **G. Keep these four:**
  1. ≥70% of big tasks get a first block started within 2 min of creation.
  2. ≥60% of multi-day tasks get a session on a second day.
  3. ≥50% of comeback screens lead to a block started that day.
  4. Most weekly check-ins say "better than usual", and nobody reports feeling judged.

### Scores
**Learning science "First Move": 8/10**
1. The stamp screen gets crowded: split, bookmark and AI suggestion all land on the reward moment. Only the bookmark should appear there; offer splitting from the card later.
2. Showing the due date only as "this week / next week" hides the actual Friday. Tu & Soman supports adding the period label next to the date, not replacing it. Also, cutting wake lock before push saves nothing, since it is a dozen lines.

**Feasibility "Down Payment" (contract): 7/10**
1. `planContract()` runs at creation with five inputs (type, due, gut, feel dial, title) and shows the summed plan *before* the first block. That breaks the start-before-planning point all three of us agree on, and it recreates setup cost (product_ux §2).
2. The copy names the miss and frames progress as debt: "Yesterday's payment didn't happen", "1 of 5 paid", "contract". Learning science says the comeback screen should never show what was missed. CUTting rooms and recap also overreaches the phase.

Its schema, versioned scheduler and "zero duplicate pushes" check are the strongest engineering detail of the three. Keep them.

### Changes to my proposal
- Down payment: default 15, with 30 offered.
- Motion pass moves to LATER.
- Install onboarding moves to W3, next to push.
- Bookmark rate drops from targets to a logged number.
- Adopt feasibility's W1 schema and "zero duplicate pushes" as an engineering check, not a beta success metric.
- The stamp screen asks only for the bookmark. "Plan the rest?" moves to the day-2 card.

### Sign-off
I would sign a merged plan that resolves A–G by majority: **yes-if** no plan is computed or shown before the first block runs, and "contract" never appears in user-facing copy.
