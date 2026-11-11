# Spec 012: Tonight in a line

Status: prototype on branch `claude/day-planner-b00906`. Not built for real, not merged. Owner: Chris.
Research: [Planning several things for one day](../research/reports/Planning%20several%20things%20for%20one%20day.md).
Builds on: the deal ticket (specs 001, 007, 010), big ones and pieces (008), the tape (009), the look (011).

## Why

Chris: "I have 2 or 3 assignments and maybe I can segment it out… a more intuitive way to plan, a new novel way to add in multiple things for a day." Today a night is one deal at a time: you make a deal, it ends, "Another round?" offers more of the same thing. To work on three things you make three deals from scratch, and nothing shows the night as a whole. Big ones can be split and spread over days (spec 008), but that is per assignment, from a card's menu, and doesn't answer "what am I doing tonight, and in what order?"

## What it is

You write tonight as one sentence on a ticket, the way you write a deal. Type the assignments with commas between them:

> history paper 1h, orgo set 4, bio ch 7

and the ticket turns them into a sentence of things you can change:

> **Tonight,** <u>2 × 30 min</u> of <u>History paper</u>, <u>45 min</u> of <u>Orgo problem set 4</u>, then <u>20 min</u> of <u>BIO 180 ch. 7</u>.

Stamp **Print**. Tonight's sittings print on the tape, unprinted, under "Still to come". The deal ticket now holds the first one, and each deal you make takes the next one off the list. Nothing new to manage: every sitting is an ordinary deal, a sitting on a big one is that big one's next sitting, and the tape is still the record of the night.

Nobody in the research does this: the apps that take several things at once split on new lines (Things, Todoist) or hand the job to an AI (Structured, Tiimo, Todoist, Sunsama). Splitting one typed line on commas, and showing what was understood as the sentence itself, is open ground.

## Words

| Thing | In the UI | In code |
| --- | --- | --- |
| The plan for tonight | **tonight** ("Plan tonight", "Change tonight") | `night` |
| One item in the sentence | (its name) | `night.items[i]` |
| One deal-sized part of an item | **sitting** ("2 × 30 min") | a sitting, from `sittingsOf(night)` |
| The unprinted part of the tape | **Still to come** | `.tocome` |

Never: "schedule", "agenda", "to-do", "plan" as a noun on screen, "overdue", "missed", "behind".

## The flow

### 1. Open it

On the home screen, at the top right of the ticket, a link: **Plan tonight**. It turns the deal ticket into tonight's ticket, which keeps its serial. Under the ticket, where a deal keeps its quiet line, the way back: **Just one deal**.

### 2. Type the line

The sentence starts **"Tonight,"** with the cursor after it. You type names and, if you like, a size after each one. A comma or Enter closes an item: it becomes underlined words in the sentence ("45 min of Orgo problem set 4,") and the cursor waits after it for the next. Backspace in an empty spot opens the last item back up as text. Up to 6 items.

What a closed item understands, and nothing else (no symbols to learn):

- **A size at the end:** `45`, `45m`, `45 min`, `1h`, `1h30`, `90`, `2h`. Snapped to the nearest size on offer (below). No size: a big one's usual length, otherwise 20 min.
- **A name you already use:** if every word typed starts a word of an open big one's title, or of a deal on today's tape ("orgo set 4" → "Orgo problem set 4", "bio ch 7" → "BIO 180 ch. 7"), the item takes that exact name. That is the only sign of the match; nothing says "matched". A big one with pieces brings its next piece along ("Problems 5 to 8").

### 3. Change anything by tapping it

Every underlined word is a button, as on the deal ticket:

- **A size** opens the size choices, the deal's length picker in the same printed boxes: **15 min, 20 min, 30 min, 45 min**, then past a hairline **2 × 30 min, 2 × 45 min, 3 × 30 min, 3 × 45 min**. Picking a two- or three-sitting size cuts the item into sittings with a break between them, and the sentence says so: "2 × 30 min of History paper". No − and +, no number field.
- **A name** opens a one-line field to rename it, with **Do this first** (moves it to the front; not on the first item) and **Take it out** as links. Typing the line in another order does the same.

Under the sentence, one line said calmly, after a rule: **"2h 15 min of focus. Done around 11:15pm."** The finishing time counts the breaks between sittings (spec 010's break between rounds: 5 min after a quick length, a quarter of a long one) from now. If it runs past midnight it still just says the time.

### 4. Print

The stub's stamp is **Print**, the size of DEAL. It's dashed and quiet until the line has an item. Pressing it:

- prints tonight's sittings to the tape, in the sentence's order (an item's sittings one after another), under **Still to come**, with the total beside the heading;
- puts the first sitting on the deal ticket: "10 min of Reels, then 30 min of History paper." with its "Start with:" line when it's a big one. The break is yours to pick as on any deal;
- swaps the home link to **Change tonight**, which opens tonight's ticket again with what's left.

While a night is printed, the big-one cards step back (they are in the night already; Change tonight, then Just one deal, brings them back), so the home screen has one ticket and one stamp. Under the ticket, in the place of "Needs more than one sitting?", one quiet line says the rest of the night: **"Then History paper again, Orgo problem set 4 and BIO 180 ch. 7."** On a phone the tape is below the fold, so this line is how the night stays in view.

### 5. The tape

The top of the tape, above its first printed deal, is the unprinted part: **Still to come**, then one row per sitting with its length in the time column ("30 min" where a printed row has "9:52pm") and its name; a second line only when there is something to add ("Problems 5 to 8", "1 of 2"). Every row is in one faint ink except the next one, in full ink. A perforation separates them from the printed deals below.

### 6. Through the night

- **DEAL** on the loaded ticket starts that sitting; its row leaves Still to come and the deal prints below as usual.
- **The done sheet** ("That was the deal.") offers the next sitting as "Another round?": "5 min of Reels, then 45 min of Orgo problem set 4." One stamp, the same ticket as today. **Done for now** and **Keep going for 10 more minutes** work as they do.
- **While a block runs**, the line under the dial names what's next: "Then Orgo problem set 4." instead of "Then you're done.", when there's a next sitting.
- **Anything else is still allowed.** A quick deal on something not in the line leaves the line alone. Changing the loaded ticket's task (tapping its name) makes it a plain deal; the sitting stays on the list.
- **Stop for now** on a sitting takes it off the list like a finished one: the tape already shows how long it ran.

### 7. When the night runs out

At the local day's turn, rows still under Still to come leave the tape without a word. A big one's sittings were never more than its next sittings: its card is still there tomorrow with its open terms. A plain item is simply gone. Nothing anywhere says what was planned and not done.

## Edge cases

| Case | What happens |
| --- | --- |
| Print with nothing typed | Can't: the stamp is dashed (as on "Name a piece to save") |
| A typed name with nothing after the comma (", ,") | Skipped |
| One item | Fine: tonight is one sitting or a few of one thing |
| The same name twice | Two items, kept in the order typed |
| A size typed that isn't on offer ("50") | Snapped to the nearest choice (45 min) |
| Seventh item | The field stops taking commas; the sixth stays open |
| A name longer than 80 characters | Cut at 80, as a big one's title is |
| Plan tonight while a block is running | Not offered: the link only shows on the home screen |
| Change tonight after some sittings are done | Opens with only what's left |
| Plan again on a new night | Starts empty |
| Reload or another device | Prototype: in memory only. Built for real: stored per local day (below) |

## Copy

| Where | Words |
| --- | --- |
| Home link (no night) | Plan tonight |
| Home link (night printed) | Change tonight |
| Sentence opener | Tonight, |
| Multi-sitting size | 2 × 30 min of History paper |
| The rest of tonight, under the ticket | Then History paper again, Orgo problem set 4 and BIO 180 ch. 7. |
| Reorder link | Do this first |
| Fit line | 2h 15 min of focus. Done around 11:15pm. |
| Stamp | Print |
| Back to a single deal | Just one deal |
| Name field link | Take it out |
| Tape section | Still to come |
| Tape row second line | Problems 5 to 8 / 1 of 2 |
| Under the dial | Then Orgo problem set 4. |

No line explains the UI: there is no "type commas", "tap a word", "drag to reorder".

## Building it for real: how it fits the existing app

Read against the code on this branch (November 10, 2026). The point of the design is that a night adds **one small record and no new kind of session**: every sitting starts through the two mutations that start deals today, so the timer, negotiation, ledger, done sheet, push and big-one bookkeeping all work unchanged.

### What it reuses, unchanged

| Piece | Where | How tonight uses it |
| --- | --- | --- |
| A deal and its session | `packages/core/src/session.ts` `buildSession`, `dealProblem`; `convex/sessions.ts` `start` | A plain sitting is a Quick Deal with `task` = the item's name and `focusMin` = the sitting's length. Every size on offer (15, 20, 30, 45) is already in `FOCUS_LENGTHS`, so `dealProblem` accepts it. |
| A big one's sitting | `convex/tasks.ts` `startFromCard`; `cardsFor` in `bigOne.ts` | A sitting on a big one starts exactly as its card's Start stamp does, with `taskId`. Minutes worked, open terms, pieces, bookmarks and comebacks are untouched. |
| The next round | `session.ts` `nextRound`, `breakBetween`, `repayDebt` | The done sheet's "Another round?" becomes the next sitting instead of `nextRound(s)`; the break between rounds and borrowed minutes come off it the same way. |
| The tape | `convex/sessions.ts` `today`; ledger kinds (ADR 0006, 0007) | The printed part is unchanged: each sitting files `deal` and `done` or `end_early` as now. Still to come is drawn from the night, not from the ledger. |
| Name matching | `tasks.open` (already subscribed in `apps/web/src/main.ts`), today's ledger | Names match against open big ones and today's deals, which the client already has. No new query. |
| Local days | `packages/core/src/days.ts`, `dayKey()` in `apps/web/src/days.ts` | A night belongs to the local day key the client sends, as big ones' worked days do. |

### What is new

**`packages/core/src/night.ts`, test-first** (pure, no clock or zone):

| Function | Does |
| --- | --- |
| `NIGHT_SIZES`, `NIGHT_MAX_ITEMS` (6) | the eight sizes as `[sittings, minutes]`, from `FOCUS_LENGTHS` |
| `parseNightItem(raw, known)` | the trailing size (`45m`, `1h30`, `2h`, a bare `45` only when it's a size), snapped to `NIGHT_SIZES`; the name matched against `known` (every typed word starts a word of the name) |
| `sittingsOf(items)` | the flat list in sentence order, each `{ title, taskId?, minutes, k, of, piece? }` |
| `nightFit(sittings, nowMs)` | focus minutes and the finishing time, breaks from `breakBetween` |
| `nightRound(session, sitting)` | the next round's `QuickDeal` for a sitting (the "Another round?" ticket) |
| `nightProblem(input)` | validation for Convex: 1–6 items, titles 1–80 characters, sizes in `NIGHT_SIZES` |

Tests first: "orgo set 4" keeps its 4; "history paper 1h" is 2 × 30; "bio ch 7" matches "BIO 180 ch. 7" and not "BIO 180 midterm"; "50" snaps to 45; seven items are refused; a 2 × 45 item is two 45-minute sittings with a quarter-length break between them in `nightFit`.

**Convex** (read `convex/_generated/ai/guidelines.md` first):

```ts
// convex/schema.ts
nights: defineTable({
  userId: v.id("users"),
  dayKey: v.string(),                       // local day, from the client
  items: v.array(v.object({ title: v.string(), taskId: v.optional(v.id("tasks")), sittings: v.number(), minutes: v.number() })),
  taken: v.number(),                        // sittings started so far
  printedAt: v.number(),
}).index("by_userId_and_dayKey", ["userId", "dayKey"]),
```

- `nights.print({ dayKey, items })`: `nightProblem`, checks each `taskId` is the caller's (`ownTask`), replaces the day's row (taken 0).
- `nights.tonight({ dayKey })`: the caller's row for that day, or null.
- `sessions.start` and `tasks.startFromCard` gain `fromNight: v.optional(v.boolean())`. When true, the same transaction bumps that day's `taken` by one, so a sitting can't be taken twice from two devices or a retry.
- `crons.ts`: a daily sweep deletes nights more than 2 days old, so a night really does vanish (spec section 7).

**The bridge, `apps/web/src/main.ts`:** `Backend` gains `printNight(items)`, and `start` / `startFromCard` pass `fromNight`. One more subscription, `nights.tonight` for today's key (re-subscribed at local midnight like the cards), pushed to the screen with `app.night(doc)`. The prototype keeps the night in memory (`night`, `loadNight`, `nightRound` in `prototypes/quick-deal/index.html`); built for real, those read `app.night`'s doc instead.

**Privacy:** `docs/specs/006-privacy-inventory.md` gains the `nights` table in the same change: item titles are coursework text, like big-one titles; only the student reads them; deleted after 2 days; deleting a big one clears its `taskId` from any night that names it.

**Events** (spec 008's table): `night_printed` with the item count, nothing typed.

### Order of work

1. `night.ts` and its tests (`npm test`).
2. Schema, `nights.print` and `nights.tonight`, `fromNight`, the sweep; Convex tests in `convex/test`.
3. Bridge and the prototype reading `app.night`; privacy inventory; event.
4. Phone and laptop dogfooding on a dev deployment before anything reaches `main`.

## Out of scope

- Reordering by dragging rows on the tape (the primary user asked in rounds 0 and 2). "Do this first" in a name's choices covers the common case; dragging is for Chris.
- Clock start times for sittings, a calendar, or anything that reshuffles on its own.
- Planning another day than tonight (spreading a big one stays spec 008's Spread).
- Planning breaks in the line; each sitting's break is picked on its deal as today.
- AI anywhere in this flow.
- Turning a new multi-sitting item into a big one automatically.

## Design rounds

Council: product designer and primary user on Claude Opus 5.5, taste on Claude Fable 5.2, each with `settled.md`, fresh each round. Benchmarks: Structured, Tiimo, Todoist, Akiflow, Sunsama, Amie, Things 3.

### Round 0: three directions

Three directions, drafted by Claude Fable 5.2 from the research, mocked up as prototype screens (desk 1440 by 900 and phone 375, light and dark; screenshots in `012-shots/directions-*`):

1. **Tonight in a line**: type the night as one sentence, stamp it, sittings print on the tape.
2. **Tear a book**: write tonight's tickets one after another into a book, bound with a spine of stubs.
3. **Pull the tape**: pull a length of blank tape (1h, 1h 30, 2h, 3h) and tear it into sittings, as the split sheet does for one big one.

| Direction | Designer | Primary user | Taste |
| --- | --- | --- | --- |
| Tonight in a line | 8/10 | 8/10 | 7.5/10 |
| Pull the tape | 6/10 | 6/10 | 6.5/10 |
| Tear a book | 4/10 | 4/10 | 4.5/10 |

All three picked the line: "the deal sentence I already use", "three assignments in under twenty seconds", "the only one that is unmistakably Pomodeal". The tape asks how long before it asks what; the book is "a to-do list in costume".

Fixes taken into this spec (two or more reviewers): no line saying which names matched (the name snaps to the big one's exact title instead); "50 min of History paper in 2 sittings" read as total or each, so the size says "2 × 30 min"; the stamp as large as DEAL and the sentence set so the ticket isn't crowded; one faint ink for Still to come with only the next row in full; the tape in the sentence's order; the phone footer and long sentence. Kept from the reviewers' praise: "Done around 10:30pm" and "Just one deal".

Not taken: dragging tape rows to reorder (one reviewer; a new interaction, for Chris); one item per line on the ticket (would turn the sentence into line items, which `settled.md` rules out).

### Round 1: the built screens

On the overhaul's base (rebased onto `d7c340f`: the hidden home heading, the DEAL die, the dial alone). Desk 1440 by 900 and phone 375, light and dark.

| Round | Designer | Primary user | Taste | Fixed after it (two or more agreed) |
| --- | --- | --- | --- | --- |
| 1 | 7.5/10 | 8/10 | 7.5/10 | No "Make a deal" heading over tonight's ticket; "Then History paper, 2 of 2." under the dial; no "Make a quick deal instead" on a sitting loaded from tonight; the size choices in a two-column grid; the fit line one sentence with both numbers in Archivo, never broken before the time. One reviewer each, cheap: no "finished?" while more sittings of the same big one wait tonight; "bio ch 7" matches the deal's own task ("BIO 180 ch. 7", not "Reading BIO 180 ch. 7"); the tape's perforation starts and ends on a hole |

Not taken: thinner underlines on names than on sizes (taste only; `settled.md` says the words you can change are underlined, all alike); one row per sitting on the tape while it runs (designer only; the tape's running row is spec 009's, outside this change); dragging tape rows to reorder (for Chris, as in round 0).

Shots: `012-shots/after-desk-light.png`, `after-desk-dark.png`, `after-phone-light.png`, `after-phone-dark.png`.

### Round 2: benchmark, with and without the planner

Each reviewer ranked twelve apps on taste from App Store screenshots (the council's nine: Forest, Opal, Structured, Session, Flow, Tiimo, Things 3, one sec, Focus Friend; plus Sunsama and Notion from this research) against Pomodeal's home and start screens at 1440 by 900 and 375, light and dark: once without the planner, once with it.

| Reviewer | Without the planner | With the planner | The planner itself (vs Structured, Tiimo, Things 3, Sunsama) |
| --- | --- | --- | --- |
| Designer | 4th, 7.5/10 | 3rd, 8/10 | 7.5/10 |
| Primary user | 6th, 7.5/10 | 3rd, 8.5/10 | 7.5/10 |
| Taste | 4th, 7.5/10 | 3rd, 8/10 | 7.5/10 |

Above Pomodeal with the planner: Things 3 and Opal (designer, taste), Structured and Things 3 (primary user). What they do better: Things 3's one calm measure and its quiet "This Evening"; Opal's single hero figure and depth; Structured's whole night as a shape; Session's intention and dial on one screen. Why the planner itself stops at 7.5: no reordering, and on a phone the night disappears below the fold once printed.

Fixed after it: the rest of the night as a quiet line under the ticket (designer, primary user); "of" for every size, not "on" for multi-sitting ones (taste, primary user); Still to come's faint rows one step darker (taste, primary user); "Just one deal" under the ticket (designer); no day name on tonight's ticket, the desk header says it (taste); "Do this first" in a name's choices (primary user, and round 0).

Not taken, for Chris: the tape card's "Try it tonight" beside "Change tonight" (demo-only sample insight; two reviewers); Still to come above "Today's deals" rather than under its heading (designer); the tonight sentence at the deal's full size with a narrower Print stub (taste); naming the sitting on "Another round?" ("…then History paper, 2 of 2", primary user).

### Round 3

| Round | Designer | Primary user | Taste | After it |
| --- | --- | --- | --- | --- |
| 3 | 8/10 | 8/10 | 8/10 | Stopped: all three at 8, and the council's three-round cap. Made, as all three asked: the "Then…" line a step smaller and fainter, with a gap before the Skip link; "of" kept with the name it belongs to, so no line ends on "of" (taste) |

### Open, for Chris

- **"Change tonight" floats** above the ticket's corner, and the ticket moves down about 40 px when Print lands (all three in round 3). Set it on the ticket's serial row, opposite "No. 0415", in both states.
- **"Another round?" when the next sitting is a different task** (History into Orgo) isn't another round; "Next up?" was suggested (primary user, designer).
- **Done around 10:24pm after Print** lives only on the tape; the primary user wants it on the "Then…" line too.
- **Done for now with sittings left:** the night stays printed (section 6); the designer wants that said in the spec only, as it now is.
- **The tape's perforation** under Still to come shows a small notch at its left end (designer, taste).
- **Reordering by dragging** tape rows, beyond "Do this first".

### Ranking, in short

Without the planner Pomodeal ranked 4th, 6th and 4th of twelve on taste (7.5 from each reviewer); with it, 3rd from all three (8, 8.5, 8). The planner itself ended at 8, 8, 8. Shots: `012-shots/after-*.png`. The competitor App Store screenshots stayed out of the repo.
