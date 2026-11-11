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

> **Tonight,** <u>2 × 30 min</u> on <u>History paper</u>, <u>45 min</u> of <u>Orgo problem set 4</u>, then <u>20 min</u> of <u>BIO 180 ch. 7</u>.

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

On the home screen, beside "Make a deal", a link: **Plan tonight**. It turns the deal ticket into tonight's ticket. The ticket's head keeps its serial and the date ("No. 0425, Tuesday"). Under the ticket, the quiet way back: **Just one deal**.

### 2. Type the line

The sentence starts **"Tonight,"** with the cursor after it. You type names and, if you like, a size after each one. A comma or Enter closes an item: it becomes underlined words in the sentence ("45 min of Orgo problem set 4,") and the cursor waits after it for the next. Backspace in an empty spot opens the last item back up as text. Up to 6 items.

What a closed item understands, and nothing else (no symbols to learn):

- **A size at the end:** `45`, `45m`, `45 min`, `1h`, `1h30`, `90`, `2h`. Snapped to the nearest size on offer (below). No size: a big one's usual length, otherwise 20 min.
- **A name you already use:** if every word typed starts a word of an open big one's title, or of a deal on today's tape ("orgo set 4" → "Orgo problem set 4", "bio ch 7" → "BIO 180 ch. 7"), the item takes that exact name. That is the only sign of the match; nothing says "matched". A big one with pieces brings its next piece along ("Problems 5 to 8").

### 3. Change anything by tapping it

Every underlined word is a button, as on the deal ticket:

- **A size** opens the size choices, the deal's length picker in the same printed boxes: **15 min, 20 min, 30 min, 45 min**, then past a hairline **2 × 30 min, 2 × 45 min, 3 × 30 min, 3 × 45 min**. Picking a two- or three-sitting size cuts the item into sittings with a break between them, and the sentence says so: "2 × 30 min on History paper". No − and +, no number field.
- **A name** opens a one-line field to rename it, with **Take it out** as a link.

Under the sentence, one line said calmly, after a rule: **"2h 15 min of focus. Done around 11:15pm."** The finishing time counts the breaks between sittings (spec 010's break between rounds: 5 min after a quick length, a quarter of a long one) from now. If it runs past midnight it still just says the time.

### 4. Print

The stub's stamp is **Print**, the size of DEAL. It's dashed and quiet until the line has an item. Pressing it:

- prints tonight's sittings to the tape, in the sentence's order (an item's sittings one after another), under **Still to come**, with the total beside the heading;
- puts the first sitting on the deal ticket: "10 min of Reels, then 30 min of History paper." with its "Start with:" line when it's a big one. The break is yours to pick as on any deal;
- swaps the home link to **Change tonight**, which opens tonight's ticket again with what's left.

While a night is printed, the big-one cards step back (they are in the night already; "All big tasks" stays as the way to the rest), so the home screen has one ticket and one stamp.

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
| Multi-sitting size | 2 × 30 min on History paper |
| Fit line | 2h 15 min of focus. Done around 11:15pm. |
| Stamp | Print |
| Back to a single deal | Just one deal |
| Name field link | Take it out |
| Tape section | Still to come |
| Tape row second line | Problems 5 to 8 / 1 of 2 |
| Under the dial | Then Orgo problem set 4. |

No line explains the UI: there is no "type commas", "tap a word", "drag to reorder".

## Built for real (not in this change)

- `packages/core`, test-first: `parseNightItem(raw, knownNames)` (size and name matching), `sittingsOf(items)`, `nightFit(sittings, nowMs)` (total and finishing time), `NIGHT_SIZES`.
- Convex: one `nights` row per user per local day key (`{ userId, dayKey, items: [{ title, taskId?, sittings, sittingMin }], printedAt, takenSittings }`), index `by_userId_and_dayKey`. Deleted after 2 days. The deal started from a sitting carries `taskId` as today.
- `docs/specs/006-privacy-inventory.md` gains the `nights` table in the same change (item titles are coursework text, like big-one titles).

## Out of scope

- Reordering sittings by dragging rows on the tape (the primary user asked for it in round 0; typing the line in another order does it today). For Chris.
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
