# Spec 015: The standing ticket

Status: prototype on branch `claude/home-cards-857ede` (from `main` after PR #13). Not merged. Owner: Chris.
Issues: Jericoz-JC/pomodeal#18 (big-one cards read as a stock kit), Jericoz-JC/pomodeal#20 (home after a task leaves a blank band on a phone).
Builds on: big ones (008), the look (011), the desk (014).

## Why

The big-one cards were the most-named reason in spec 014's benchmark rounds that Pomodeal did not rank first: a list-of-cards kit next to the rest of the app. Its "Start 30 min" badges had different sizes and tilts, it used "…" overflow menus, and quick deals hid behind a dashed "+ Or make a quick deal ⌄" row. On his phone, Chris found that after finishing a task home showed those cards, the folded row and the room line, then a large blank band down to the bottom of the screen.

## What it is

Home is the deal ticket, standing open, with the next big one already written into it.

- **The ticket** says "30 min of History paper." at the big one's own length, then its next step and progress ("Start with: claim for paragraph 2", "45 min done so far"), with DEAL on the stub. One press on DEAL starts it at that length with no break, the same start the card's stamp made (`startCard`: no extra stub on the tape, no new big one). The length is still a word you can change.
- **Take a break first** is a quiet line on the ticket. It writes the break into the sentence ("10 min of Reels, then 30 min of History paper.").
- **The name on the ticket** carries a dark-ink hairline, not the green rule of a word you can change. Pressing it opens that big one's jobs: Split, Spread, Start fresh, Set aside, Delete. The "…" buttons are gone. Take a break first moved from that menu onto the ticket.
- **The other big ones** are written lines under the ticket ("20 min of Orgo problem set 4"), two at most, so home shows three big ones as before. Each line has one Start die that starts that big one at its length in one press. The die is the same size, tilt and words on every line. At rest it is DEAL's die before it is inked (double rule, square corners, a slight tilt, in ink); pressed, it lands green, so green stays wet ink. Pressing a line (its words, not underlined) swaps that big one onto the ticket. The die is in the light ink in dark mode, never brighter than the ticket.
- **Quick deal** and **All big tasks** are two quiet links under the lines. Quick deal swaps the ordinary deal onto the ticket, and the line for the big one it replaced takes you back. All big tasks opens the full list, which uses the same written lines and dies.
- **A comeback** keeps its smaller first move on the ticket ("15 min of Lit review."), with "**It's still here.** Start with: …" in one line and, when its plan slipped, "Re-spread what's left" beside Take a break first.
- **On a desk** the lines run the ticket's width at one 48 px pitch, their dies centred on the line at its right edge, under the DEAL stub. One 18 px gap runs between the lines, the links, the room row and the roll. The room comes from a home ticket a step tighter (its body's padding), so the ticket keeps the tape's top line; the second council asked to lift the ticket instead, which would have broken that line.

After a task (#20), home is a full ticket with the next big one and DEAL, the lines, and the room row. There is no folded row and no blank band.

## What stays the same

- **Every job.** Start each big one at its length in one press. Its jobs: Take a break first (now on the ticket), Split, Spread, Start fresh, Set aside, Delete. Comeback, Start with, progress, Re-spread, All big tasks, the quick deal (open it and come back), and the room row.
- **The rules and the backend.** No change to `packages/core`, Convex or `apps/web/src/main.ts`, which reads only `window.pomodealApp`. The card's start path is unchanged. Nothing new is stored, so the privacy inventory is unchanged.
- **Tonight.** With sittings planned, home is spec 012's as before. A big one home put on the ticket comes off when tonight is planned, or when it is gone.

## Code

`prototypes/quick-deal/index.html` only, in the home and cards code:

- `swapHome`, `fcDirect`, `seat`, `seatHome` (called from `render` before drawing, never while drawing) and `reink`.
- `cardsView` (the lines), `goStamp` (the die), the `fromCard` branch of `ticket`, `startView`, the All big tasks rows in `panelBody`, and the `[data-load]`, `#quickopen` and `#breakfirst` handlers.
- `#shake` hands a seated big one to `startCard`. The stamp-slam click handler covers the die.
- Removed: `bigCard`, `bigRow`, `quickDoor` and the `.bigones`, `.bigcard` and `.quickrow` CSS. Added: `.swaps`, `.swapline` and `.ministub.go1`, plus a desk block.

`prototypes/shoot.mjs` gains a `cards-quick` state (the quick deal swapped on).

## Design rounds

The loop from the design council skill's "How big a loop" for a redesign. Two designers on Claude Fable 5.2 each built a direction in their own copy of the prototype. A checker on Claude Opus 5.5 read both against `settled.md` and cost. The council (designer and primary user on Opus 5.5, taste on Fable 5.2) picked one. Then came benchmark rounds with three fresh reviewers each, ranking "novel design feel and polish" for phone and desk against App Store screenshots of Things 3, Opal, Structured and Sunsama (iTunes Search API, kept out of the repo).

### Two directions

| Direction | Designer | Primary user | Taste |
| --- | --- | --- | --- |
| A, "The book": the big ones as one perforated sheet of written deals, a Start stamp each down a stub column, the blank deal as the last ticket | 6/10 | 6.5/10 | 7.5/10 |
| B, "The standing ticket": the deal ticket always open with the next big one written in, the others as lines under it | 8/10 | 8/10 | 6/10 |

The designer and the primary user picked B: one clear action, DEAL as the solid die, and no blank band. The art director picked A for its one object. The checker preferred A on cost and correctness. As in spec 014, B was built and everything the checker named was fixed first:

- the big one now starts through `startCard` at its own length (B had sent it through DEAL at a picker length and printed an extra tape stub);
- state no longer changes while drawing;
- the desk's negative-margin hack is gone.

From A came the written lines ("20 min of …") and one identical stamp.

### Benchmarks: novelty and polish, phone and desk

| Round | Designer | Primary user | Taste | Built after it (two or more agreed) |
| --- | --- | --- | --- | --- |
| r1 | phone 3rd 7.5, desk 3rd 7 | phone 3rd 8, desk 2nd 8 | phone 2nd 7.5, desk 2nd 7.5 | line stamps dry until pressed; three big ones on home, so the room row is back on screen; desk lines to the sentence column; no unanswered comeback question; menu lines that explained the obvious cut |
| r2 | phone 4th 7.5, desk 2nd 8 | phone 3rd 7.5, desk 2nd 7 | phone 3rd 8, desk 2nd 7.5 | the line stamp as DEAL's dry die; desk links back under the lines; room row clear of the roll; names with an ink hairline; Re-spread as a quiet line; "sign" and "size guess" copy |
| r3 | phone 3rd 7.5, desk 2nd 8 | phone 3rd 7.5, desk 2nd 8 | phone 3rd 8, desk 2nd 7.5 | the die in full ink; desk lines the ticket's width, dies under the stub |
| r4 | phone 3rd 7.5, desk 2nd 8 | phone 3rd 8, desk 2nd 7.5 | phone 3rd 8, desk 2nd 7.5 | Stopped: the reviewers trade complaints (line width, where the die sits, menu sublines cut then restored, "size guess" called jargon then asked for). Made after it, as all three asked: desk dies flush with the ticket's right edge, air under the ticket, the comeback's two links on one row, a shorter Start fresh line |

Then, at Chris's request, the session that wrote spec 014 ran its own council on the result (fresh reviewers, same models and `settled.md`):

| Round | Designer | Primary user | Taste | Built after it (all three agreed; Chris said go) |
| --- | --- | --- | --- | --- |
| c1 | phone 3rd 7.5, desk 2nd 7 (before 5.5) | phone 3rd 7.5, desk 2nd 7.5 (before 6) | phone 1st 8, desk 2nd 7.5 (before 5) | desk lines at one pitch with the die centred and one gap down to the roll; no underline on a line (the whole line swaps), an ink hairline on the ticket's name; the die in the light ink in dark mode, with DEAL's tilt and worn rubber |

All three in c1 called it clearly better than before, with nothing template-made left on home.

Every reviewer in every round named Pomodeal the most novel of the five. On polish, the phone settled at 3rd behind Opal and Things 3 (one lit hero object with nothing competing; one row rhythm and one kind of control). The desk settled at 2nd behind Things 3 (one grid). Before this change the cards screen was the most-named weakness in spec 014's rounds. Here the kit complaints narrowed round by round, from the whole screen (cards, badges, "…", the dashed row) to the line's Start die, which the art director still called web-button drawing in r4, and the column of identical dies in All big tasks.

## Open, for Chris

- **Jobs for a big one not on the ticket** take two presses: swap it on, then press its name. The "…" did it in one. All four rounds named it. A long-press on a line would make it one press, but it is hidden.
- **The line's length and the roll's** can differ ("20 min of Orgo" on the line, Orgo 45 min on the roll). The line shows the card's first payment and the roll the next piece. Spec 014 had the same gap.
- **The quick deal on a phone** stacks four quiet lines under the ticket (Needs more than one sitting?, Skip Reels, the big one's line, All big tasks). A gap now groups the last two; the first two are spec 012's.
- **The menu's sublines** were trimmed to Spread, Start fresh, Set aside and Delete. Reviewers went back and forth on Split's.

## Not verified

- Swapping, the quick deal and back, the jobs from the name, Take a break first, and both start paths (DEAL on a seated big one, a line's die) were driven with script clicks in headless Edge at 375 and 1440. Starting a big one at its own length with no break was confirmed. Nothing was tried by hand, on a real phone, or in live mode (`body.live`, Convex).
- Safari and Firefox.
- The phone shots carry the prototype's demo bar (about 160 px), so they were taken 975 px tall to show a 375 by 812 phone's screen under it.

Shots: `015-shots/`. They cover the phone at 375 in light and dark (two big ones, three, a comeback, the quick deal, the jobs, All big tasks, re-spread) and the desk at 1440 by 900 (three big ones in light and dark, the quick deal, re-spread). `before.png` and `desk-before.png` show the old screen, and `directions.png` shows A and B as built. The competitor screenshots stayed out of the repo.
