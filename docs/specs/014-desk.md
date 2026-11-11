# Spec 014: The desk

Status: prototype on branch `claude/desk-overhaul-e0a655` (from `claude/day-planner-b00906`). Not merged. Owner: Chris.
Builds on: the desk and the tape (009), the look (011), tonight in a line (012), dark with the lamp off (013).

## Why

On a phone Pomodeal ranked 2nd on taste behind Things 3. On a desk (judged at 1440 by 900) it ranked 3rd to 4th against Things 3, Sunsama, Opal and Structured: a phone ticket in a large empty field, tonight as small print on a narrow tape, dead space between the dial and the tape while a block runs. Chris: "overhaul desktop view beyond just a larger screen… carefully have best UX around adding and looking at such things, maybe a few more features." Then: "got to rank first in novelty design feel compared to the competitors… has to feel polished compared to giants… bring good features if it makes sense to the mobile view."

## What it is

At 820 px and up the desk holds three things at their own scale:

1. **The ticket**, the hero: top left, a size up (the deal's sentence 2.375rem, DEAL 3.5rem at 1200 px and up), lying on the pad it tore from.
2. **The tape**, hanging at the right: only what has printed (Today's deals, the totals, the week's note). It starts on the same line as the ticket, ends at its last whole entry, and its head says only what's new ("2 new").
3. **The roll**, along the desk's front edge, while tonight is being written or is printed, and on home when there are names to offer: tonight as one length of unprinted tape, drawn to scale across the whole desk.

The desk keeps one rhythm by constant gaps rather than stretched objects: ticket and tape share a top line, the room row sits a step under the last quiet line, and the roll sits a step under the longer of the stage and the tape (it sticks to the window's foot only when the desk runs taller than the window). The quiet lines under the ticket ("Needs more than one sitting?", "Skip Reels, start reading now", "Just one deal") start on the ticket's own edge.

### The roll

- **A sitting** is a panel as long as its minutes, with its name and length ("30 min, 1 of 2"). **A break** between sittings is a hatched length, as on the dial. Both ends of the roll are torn at round half-holes.
- **The caption** is one quiet sentence: what's left on the left ("10 min of Reels, then 2h 5 min of focus", naming the deal's own break), "Done around **10:34**pm" on the right, one size in every state.
- **Under it**, a clock in the dial's ticks: a tick every 5 minutes, longer each quarter hour, each hour named ("8pm"). Chris ruled for clock hours (spec 012 had ruled out clock times for sittings; the roll shows where they fall without assigning start times).
- **While you type tonight's line** the roll is a dashed outline that grows with each comma; the item still being typed is a fainter outline. Pressing an outline opens that item's lengths on the ticket.
- **Printed**, it is paper a step under the ticket, names in full ink; the next sitting is the full sheet.
- **Paid** time is wet ink: a solid green foot grows along the running sitting as the dial pays it (one `transform` per frame), and when the block ends its Done stamp lands on that sitting, inked, top right. Nothing waits in an empty stamp box.
- **Drag a length** along the roll to change tonight's order: any item while writing, anything not yet started once printed (Chris asked for dragging; spec 012 had left it for him). A green mark shows where it lands; a press without a drag does what it did. When the first sitting changes, the ticket reloads with it.

### Adding several things

- **On home**, with nothing planned, the names you already use (open big ones with their next piece's length, then today's deals) lie on the roll in outline, at its height and place, as tonight would be if you took them all, with the finishing time on the right. Pressing a name opens tonight's ticket with it in the sentence; pressing "Tonight," in the caption opens it empty. On a desk this is the way in, so the ticket's "Plan tonight" link steps aside while names are on offer (it stays on a phone).
- **On tonight's ticket**, phone and desk, the names you haven't used yet sit under the sentence as words in ink, one underline each; one press adds one at its known length. They step aside while you type.
- **Paste a list**, phone and desk: a list copied from notes (one per line, bullets or numbers) lands as the sentence's items (Chris).
- **Typing** works as spec 012 says; every comma lands a panel on the roll at once, with the new finishing time.
- **Lengths**: on a desk the choices are two printed lines of words (single sittings, then several), the chosen one green and underlined like a word you can change; on a phone they stay spec 012's printed boxes in two columns. Either way the chosen length is its green ink with no check glyph, as in the deal's own picker.

### Looking at the night

One glance along the front edge: the order, each thing's size against the others, the breaks, what's paid (green foot and Done), what's next (the full sheet), how long is left and when it ends, against the clock. While a block runs the name sits beside the dial with "Stop for now" under it, the room row keeps its left edge, and the roll lies under both (Chris kept this; the dial is still alone, with no card, stamp or label); the line under the dial that named what's next goes on a desk because the roll says it. On a phone the strip under the sentence is the roll in miniature: paper lengths torn at both ends, hatched breaks, the next one inked, paid ones green.

### Decisions

- **Every decision sheet on a desk** hangs from the line the ticket and the tape start on.
- **The done sheet** stops a strip above the roll, which stays lit over the dim with its clock, so the Done stamp lands on the roll while you decide. Its two ways out share one row ("Done for now" and "Keep going for 10 more minutes"); its tab carries its Done stamp clear of the minutes. The finished clock steps off the desk under any sheet instead of being sliced by it.
- **Short windows** (under 800 px tall): the roll is shorter, and under a sheet it steps away so the decision has the height.

### Smaller things, phone and desk

- The ring's end is a clean cut along the radius, like the tick at 12, not a pale pill (spec 011's paper notch read as a glitch to every reviewer for three rounds; Chris may want it back).
- The quiet line's box is an empty stamp box (dashed), not a form control.
- The tape no longer says "Big one" or the serial: "30 min of focus"; under the done sheet its running row says "Time's up".
- "Keep the timer on top" hides while a sheet is open.
- The empty line shows its whole example on a phone.

### The sign-in page

The landing page no longer plays a staged first look (a sample ticket stamped and filed before anyone touched anything; Chris: "kinda tacky"). It opens on the ticket at rest; pressing DEAL still stamps it.

## What stays the same

- **The phone's layout.** Desk work is inside `@media (min-width: 820px)`, behind `WIDE.matches`, or on elements hidden below 820 px. Phone changes are the ones listed above, each benchmarked at 375.
- **The rules.** No change to `packages/core`, the negotiation, the night's sizes, or the six-item limit. Pasting a list only turns line breaks into the commas the line already reads.
- **The backend.** The roll draws only from what the screen already has: the night (spec 012's planned `nights` row and its one query), today's ledger, the open big ones, the running session and the clock. Reordering writes the item list the line already writes. No new query, table, field or round trip; nothing new is stored, so the privacy inventory is unchanged.
- **Speed.** No libraries, images or requests. The roll's HTML is rebuilt only when it changes; while a block runs each frame writes one `transform`. The tape's snap to a whole row reads layout once per render; placing a sheet reads two rects when it opens.

## Code

- `prototypes/quick-deal/index.html`: one `<section id="roll">` in `.desk`; the `spec 014: the desk` JS block (`addable`, `nightAdd`, `addKnown`, `rollModel`, `rollPieces`, `rollView`, `paintRoll`, `groupSittings`, `bindRollDrag`, `moveNightItem`, `placeSheet`, `snapTape`, `inkRoll`) with hooks in `nightTicket`, `bindNight` (paste), `renderSheet`, `render` and `tick`; a CSS block after the desk's.
- `apps/web/src/landing.ts`: the first-look sequence and its CSS removed.
- `.claude/skills/design-council/settled.md`: Chris's desk rulings.

Built for real, `apps/web` gets the screens with the prototype sync; the roll reads `app.night` (spec 012's bridge) where the prototype reads `night`, and a reorder writes through `nights.print`.

## Design rounds

Two designers on Claude Fable 5.2 each built a desk direction in their own copy of the prototype; a checker on Claude Opus 5.5 read both against `settled.md` and cost; the council (product designer and primary user on Claude Opus 5.5, taste on Claude Fable 5.2, with `settled.md`, fresh each round) picked one. Then benchmarks: three fresh reviewers each round, ranking against App Store screenshots of Things 3 (Mac and iPhone), Sunsama (iPad), Structured (iPad) and Opal, kept out of the repo. Rounds b1 to b3 ranked taste on the desk; rounds n1 on, after Chris asked for first place in novelty and polish, ranked "novel design feel and polish" on desk and phone.

### Two directions

| Direction | Designer | Primary user | Taste |
| --- | --- | --- | --- |
| A, a run of tickets under the deal ticket | 5.5/10 | 6/10 | 6/10 |
| B, three objects on a desk: the roll along the front edge | 7.5/10 | 8/10 | 7.5/10 |

All three picked B ("the first desk that uses the whole width"). Taken from A: the names you already use, on home. The checker preferred A on cost and named what B had to lose; all of it was done (clock hours and pasting were later asked for by Chris and came back by his ruling).

### Benchmarks: taste, desk

| Round | Designer | Primary user | Taste |
| --- | --- | --- | --- |
| before | 3rd to 4th | 3rd to 4th | 3rd to 4th |
| b1 | 2nd, 7.5 | 2nd, 7.5 | 2nd, 7.8 |
| b2 | 2nd, 7.5 | 2nd, 8 | 2nd, 7.5 |
| b3 | 2nd, 7.5 | 2nd, 8 | 2nd, 8 |

### Benchmarks: novelty and polish, desk and phone

| Round | Designer | Primary user | Taste | Built after it (two or more agreed) |
| --- | --- | --- | --- | --- |
| n1 | desk 2nd 7.5, phone 1st 8.5 | desk 2nd 8, phone 2nd 8 | desk 2nd 8, phone 1st 8.5 | home's names on the front edge; the done sheet on the tape's line; a clean ring end; no clock sliced by a sheet; names on offer as words |
| n2 | desk 2nd 8.6, phone 2nd 8.3 | desk 2nd 7.5, phone 2nd 8.5 | desk 2nd 7.5, phone 1st 8.5 | home's names as the roll itself; the deal's break named in the caption; the done sheet torn at both ends; the tape's slot quiet |
| n3 | desk 2nd 8.4, phone 1st 8.7 | desk 2nd 8.0, phone 1st 8.5 | desk 2nd 8.2, phone 1st 8.7 | no check glyph on a chosen length; the tape says deals once; the quiet line's box |
| n4 | desk 2nd 8.3, phone 2nd 8.5 | desk 2nd 8.4, phone 1st 8.7 | desk 2nd 8, phone 1st 8.5 | home's roll full width with its finish time; the roll's Done clear of its lines |
| n5 | desk 2nd 8.4, phone 2nd 8.5 | desk 2nd 8.4, phone 1st 8.9 | desk 2nd 8.4, phone 1st 8.8 | one place and height for the roll; one caption voice; the done tab |
| n6 | desk 2nd 8.0, phone 2nd 7.5 | desk 2nd 8, phone 2nd 8 | desk 2nd 8, phone 1st 8.5 | lengths in two rows of four; one natural run of names |
| n7 | desk 2nd 8.5, phone 1st 8.8 | desk 2nd 8.3, phone 1st 8.6 | desk 2nd 8.0, phone 1st 8.6 | constant gaps instead of a stretched tape; every sheet from the ticket's line; both roll ends torn |
| n8 | desk 2nd 8.4, phone 2nd 8.2 | desk 2nd 8.3, phone 2nd 8.6 | **desk 1st 8.4**, phone 2nd 7.7 | phone lengths back to spec 012's boxes; the phone strip as the roll in miniature; one left edge under the ticket |
| n9 | desk 2nd 8.0, phone 2nd 7.5 | desk 2nd 8, phone 2nd 8 | **desk 1st 8.6**, phone 2nd 7.8 | lengths as printed words on both sizes; the strip's next sitting as paper, not black; the clock runs the roll's whole length; the room row on the tape's foot |
| n10 | desk 2nd 8.5, phone 2nd 8.3 | desk 2nd 8, phone 2nd 8.5 | desk 2nd 8, phone 2nd 7.5 | Stopped: the reviewers now trade the same complaints back and forth (a strip is "a progress bar" whichever way it is drawn; a picker is "a form kit" as boxes or as words). Made after it, as all three asked again: on a running desk "Stop for now" sits under the name and the room row keeps the left edge it has on every other screen |

Every reviewer in every round named Pomodeal the most novel of the five. On finish it did not reach first: on the desk Things 3 held first in 28 of 30 novelty reviews (the art director put Pomodeal first in n8 and n9), on the phone Pomodeal was first in 14 of 30 (all three in n3 and n7), with Opal or Things 3 above it in the rest. The reviews that put another app first named one or two screens each time, most often the big-one cards (outside this change), the length choices and the strip under the sentence on a phone. Before this work the desk ranked 3rd to 4th on taste; it now ranks 2nd in every review but two, which put it 1st.

## Open, for Chris

- **The big-one cards on a desk** ("Start 30 min" badges, "…" menus, the "+ Or make a quick deal ⌄" row) were named as the most template-looking screen in nearly every novelty round. They are spec 008 and 011 parts, outside this change; worth their own pass.
- **The ring's end**: spec 011's paper notch is now a clean cut, after every reviewer read the notch as a glitch. Yours to reverse.
- **The landing page's DEAL** is an outlined stamp until pressed, where the app's DEAL at rest is a solid die (`settled.md`).
- **Room avatars** (the M, J, P rings) read as stock to two reviewers.

## Not verified

- Safari and Firefox (`:has()` drives the roll's space and the sheets), a real laptop at sizes other than 1440 by 900 and 1024 by 768, and live mode (`body.live`) offsets, which are set from the CSS, not shot.
- Pressing names, typing, Print, dragging on the roll and the green foot were driven with script events in the app's browser pane at 1440 by 900; pasting was not exercised.
- The phone shots carry the prototype's demo bar (about 160 px), so the room row under a running dial sits below their fold; the app has no bar.

Shots, 1440 by 900 light and dark, and 375: `014-shots/`. The competitor screenshots stayed out of the repo.
