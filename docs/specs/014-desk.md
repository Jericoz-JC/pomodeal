# Spec 014: The desk

Status: prototype on branch `claude/desk-overhaul-e0a655` (from `claude/day-planner-b00906`). Not merged. Owner: Chris.
Builds on: the desk and the tape (009), the look (011), tonight in a line (012), dark with the lamp off (013).

## Why

On a phone Pomodeal ranked 2nd on taste behind Things 3. On a desk (judged at 1440 by 900) it ranked 3rd to 4th against Things 3, Sunsama, Opal and Structured: a phone ticket in a large empty field, tonight as small print on a narrow tape, dead space between the dial and the tape while a block runs. Chris: "overhaul desktop view beyond just a larger screen… carefully have best UX around adding and looking at such things, maybe a few more features."

## What it is

At 820 px and up the desk holds three things at their own scale:

1. **The ticket**, the hero: top left, a size up (the deal's sentence 2.375rem, DEAL 3.5rem at 1200 px and up), lying on the pad it tore from.
2. **The tape**, hanging at the right: only what has printed (Today's deals, the totals, the week's note). Still to come leaves it on a desk.
3. **The roll**, along the desk's front edge, while tonight is being written or is printed: tonight still to come as one length of unprinted tape, drawn to scale across the whole desk.

### The roll

- **A sitting** is a panel as long as its minutes, with its name and length ("30 min, 1 of 2"). **A break** between sittings is a hatched length, as on the dial. The deal's own break says its name on a scrap of desk ("Reels, 10 min").
- **While you type tonight's line** the roll is a dashed outline that grows with each comma; the item still being typed is a fainter outline before you close it. Pressing an outline opens that item's sizes on the ticket, as pressing its size in the sentence does.
- **Printed**, it is paper a step under the ticket, names in full ink; the next sitting is the full sheet. Its far end is torn at round half-holes.
- **Paid** time is wet ink: a solid green foot grows along the running sitting as the dial pays it, and when the block ends its Done stamp lands on that sitting, inked. Nothing waits in an empty stamp box: a sitting is planned until it is paid.
- **Above it:** "2h 5 min of focus" at its start and "Done around **10:34**pm" at its end, one size in every state.
- **Under it:** a scale in the dial's ticks: a tick every 5 minutes from now, longer every 15, each hour from now counted ("1h", "2h"). It measures; it is not a clock. The night's one clock time is "Done around" (spec 012 rules out clock start times for sittings).
- It spans at least two hours, so a short night reads as short.

### Adding several things

- **On home**, with nothing planned, the names you already use (open big ones with their next piece's length, then today's deals) stand at the front edge on one line, to scale, with short dividers between them and no scale under them, after the word "Tonight,". Pressing a name opens tonight's ticket with it in the sentence; pressing "Tonight," opens it empty. On a desk this is the way in, so the ticket's "Plan tonight" link steps aside while names are on offer (it stays on a phone, and on a desk with nothing to offer).
- **On tonight's ticket**, under the sentence, the same names you haven't used yet are printed choices with their lengths; one press adds one, at its known size. They step aside while you type.
- **Typing** works as spec 012 says; every comma lands a panel on the roll at once, with the new finishing time.

### Looking at the night

One glance along the front edge: the order, each thing's size against the others, the breaks, what's paid (green foot and Done), what's next (the full sheet), how long is left and when it ends. While a block runs, the name sits beside the dial and the roll lies under both, so the running screen has no dead centre; the line under the dial that named what's next goes on a desk because the roll says it. The phone keeps that line.

### Decisions

- **The done sheet** sits between the header and the roll, with a strip of dimmed desk between them; the roll stays lit above the dim: the Done stamp lands on the roll while you decide. The sheet's own night strip goes on a desk (the roll is the night). Under it, on a desk, the finished clock steps off instead of peeking over the paper.
- **Asking for time** rises over the dimmed clock as before (spec 009).
- **Short windows** (under 800 px tall): the roll is shorter, and under a sheet it steps away so the decision has the height.

## What stays the same

- **The phone.** Every change is inside `@media (min-width: 820px)`, behind `WIDE.matches`, or on elements hidden below 820 px. Shots at 390 by 844 match the original side by side.
- **The rules.** No change to `packages/core`, the negotiation, the night's sizes and parsing, or the six-item limit.
- **The backend.** The roll draws only from what the screen already has: the night (spec 012's planned `nights` row and its one query), today's ledger, the open big ones, the running session and the clock. No new query, table, field or round trip. Nothing new is stored, so the privacy inventory is unchanged.
- **Speed.** No libraries, images or requests. The roll's HTML is rebuilt only when it changes; while a block runs, each frame writes one `transform` on the green foot (no layout, no repaint of the roll). The tape's snap to a whole row reads layout once per render.

## Code

All in `prototypes/quick-deal/index.html`:

- Markup: one `<section id="roll">` in `.desk`, hidden below 820 px.
- JS, the `spec 014: the desk` block: `addable()` (names not yet in tonight), `nightAdd()` (choices on tonight's ticket), `addKnown()`, `rollModel()` (the segments: paid, running, next, planned, draft), `rollPieces()` (home), `rollView()`, `paintRoll()` (called from `render()`), `inkRoll()` (called from `tick()`), `snapTape()`. Hooks: `nightTicket()`, `bindNight()`, `renderSheet()` (the `sheet-done` class).
- CSS, one `@media (min-width: 820px)` block after the desk's: the grid gains a `roll` row, the ticket's scale, the roll, the running layout, the done sheet, short windows.

Built for real, `apps/web` gets this with the prototype sync; the roll reads `app.night` (spec 012's bridge) where the prototype reads `night`.

## Design rounds

Two designers on Claude Fable 5.2 each built a desk direction in their own copy of the prototype; a checker on Claude Opus 5.5 read both against `settled.md` and cost; then the council (product designer and primary user on Claude Opus 5.5, taste on Claude Fable 5.2, with `settled.md`, fresh each round) picked one. Benchmarks: three fresh reviewers each round ranking the desk on taste against App Store screenshots of Things 3 (Mac), Sunsama (iPad), Structured (iPad) and Opal, kept out of the repo.

### Two directions

| Direction | Designer | Primary user | Taste |
| --- | --- | --- | --- |
| A, a run of tickets: the night as a row of sitting tickets under the deal ticket | 5.5/10 | 6/10 | 6/10 |
| B, three objects on a desk: the roll along the front edge | 7.5/10 | 8/10 | 7.5/10 |

All three picked B: "the first desk that uses the whole width", "the first time the desk looks like my night at a glance". A was "the old layout with the tape's contents moved under the ticket". Taken from A: the names you already use, on home.

The checker found both cleanly gated and within the backend budget, preferred A on cost, and named what B had to lose before it could ship. All of it was done: clock hours under the roll (spec 012 rules out clock start times), pasting a list into the line (a change to the line's parsing), a drop-shadow filter re-rasterized every frame, the roll showing for a lone quick deal, and the tape cut mid-row.

### Benchmarks

| Round | Designer | Primary user | Taste | Built after it (two or more agreed) |
| --- | --- | --- | --- | --- |
| before | 5.5 to 6, 3rd to 4th | 6, 3rd to 4th | 6 to 6.5, 3rd to 4th | |
| b1 | 7.5, 2nd | 7.5, 2nd | 7.8, 2nd | Done around at caption size while running; the line under the dial that repeated the roll gone on a desk; no empty Done box on any panel; the draft a dashed outline, the printed roll paper with names in full ink; the tape ends on a whole row; names on home as loose pieces at the front edge; the roll kept lit under the done sheet with the Done stamp landing on it; "of focus" in every state |
| b2 | 7.5, 2nd | 8, 2nd | 7.5, 2nd | Home's names one continuous hairline length on the roll's scale, "Tonight," on its line; the deal's break named; one size for Done around; the roll's far end torn; printed dark paper a clear step above the outline; the done sheet below the header; "Stop for now" on the margin |
| b3 | 7.5, 2nd | 8, 2nd | 8, 2nd | Stopped: the council's three-round cap. Made after it, as two or more asked: home's names stand on a line with no scale under them (they read as a night already planned); "Tonight," opens tonight, and the ticket's "Plan tonight" steps aside on a desk while names are on offer (two ways in was one too many); a strip of desk between the done sheet and the roll; the running sitting a clearer step in dark; a break says only its name at 1024 |

Things 3 ranked first in every review; the desk moved from 3rd to 4th to 2nd in all nine benchmark reviews. What reviewers said it does better: one grid and one type rhythm, so its empty space looks meant; one loudest thing per screen.

## Open, for Chris

- **The running desk**: the name sits beside the dial and the roll lies under both. `settled.md` says a running block is "the dial alone on the desk" (no card, no stamp, no label); the roll is none of those, but it is a second object. One reviewer each round flagged it for you.
- **Dragging to reorder** on the roll (spec 012 left dragging for you; direction A built it, B didn't).
- **Hours under the roll** as clock times ("8pm, 9pm") instead of "1h, 2h" from now: the B designer's first version had them; they read as start times, which spec 012 rules out.
- **Pasting a list** (one per line) into tonight's line, which the B designer also built: it would change the line's parsing, so it's out.
- **The tape's copy** on a desk: "Big one, 30 min of focus" reads as jargon to two reviewers; "No. 0415, focus" as cryptic to one (specs 008 and 009, outside this change).
- **The tape while the done sheet is open** still says "now, Running" while the roll says Done (one reviewer).
- **Alignment**: the ticket's top (y 183) and the tape's (y 75) don't share a line; the header sits between (one reviewer each round). On the running desk, "Stop for now" is on the margin while the room line sits under the dial (taste, b3).
- **Home on a desk** now holds the ticket and the names at the front edge, with empty desk between them and under the tape (all three in b3 named the space; one wanted the names pulled up, which would take them off the front edge).
- **"Keep the timer on top"** still shows in the header over the done sheet (primary user, b3).
- **A ticket sentence at a desk size** broke as "30 min of / History paper." in two reviewers' light shot: the headless browser had not loaded Archivo for that shot. Not seen with the font loaded; worth a look on a real laptop.

## Not verified

- Safari and Firefox (`:has()` drives the roll's space; both support it in current versions), a real laptop at other sizes than 1440 by 900 and 1024 by 768, and live mode (`body.live`) offsets, which are set by reading the CSS, not shot.
- Pressing names and the roll's outlines, typing, Print and the green foot were driven in the app's browser pane with script events at 1440 by 900; not by hand.

Shots, 1440 by 900: `014-shots/desk-before.png`, `desk-after-light.png`, `desk-after-dark.png` (home, writing tonight, printed, a sitting running, the done sheet, big ones on home) and `directions.png` (A and B, printed and running). The competitor App Store screenshots stayed out of the repo.
