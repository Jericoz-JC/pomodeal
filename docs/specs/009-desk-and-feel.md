# 009: The desk, the tape and the dial

Status: prototype on branch `claude/desktop-ui-optimization-lnqcbt`. Not merged, not checked signed in.

## Why

The studying happens on a laptop and the app was one 440 px phone column at every window size. Chris also said the phone view still looked AI-made, named the bottom tab bar ("the three stickers") and the dial ("too blocky"), and asked for the overall feel to be worked on, not the mechanics.

## What changed

**No navigation, on any screen size.** The tab bar is gone and nothing replaces it.

- **The ledger is a receipt tape.** Tonight's deals print out of a dark slot as one strip of paper with a torn bottom edge. Each deal is a printed entry between perforations. The totals sit at the bottom under a double rule, one per line with a dotted leader, the way a receipt totals.
- **Phone:** the tape follows the clock on the same page, so you scroll down into it. The count at its head reads "2 new" until the tape has been on screen.
- **Desktop (820 px and up):** two things on a desk. The clock or ticket is a stage on the left, aligned to the wordmark. The tape hangs at the right and stays in view.
- **The room** opens from the line of friends' faces ("Maya, 14 min left", "See room") and has "Back to the clock". On desktop the tape stays beside it. During a focus block the line is company, not a link, as before.
- **Decisions on desktop** (block end, asking for time, planning) rise from the bottom of the stage over the dimmed clock, as they do on a phone. Nothing is blurred and the tape stays readable beside them.

**The wheel keeps its original look and is redrawn so it is smooth.** Rounds 2 and 3 tried a slimmer gauge with a needle, numerals and line work; Chris preferred the wheel as it worked before, but said it looked janky.

- The ring, the track and the ticks are now SVG strokes. The old version cut the ring out of a conic gradient with radial masks, and browsers do not anti-alias hard gradient stops, so every edge was rough.
- The ring is a little slimmer (13 units of a 100-unit radius, was 19), with a hairline rim on each side.
- One tick per minute of this block, longer every 5 (every 15 on long blocks), with round ends.
- The arc has flat ends, so it never shows more time than is left. The knob sits on its leading end.
- The arc's length is written as plain numbers each frame by `syncArcs()`, which reads the ring's `--p`. The CSS animations on `--p` (block start, block change, a deal) still drive it. Safari is unreliable with `calc()` and `var()` in stroke properties, so nothing depends on them.
- A break's hatching is an SVG pattern at a fixed 45 degrees.
- The number in the middle scales with the wheel.

**While a block runs, the clock is printed on the ticket you stamped.** Its head carries the serial and the DEAL stamp, the wheel is its seal, and what comes next sits on the stub under the perforation. All four reviewers' most repeated note in rounds 1 to 3 was that the ticket vanished once a block started.

**Smaller things**

- The browser tab's title shows the time left and what it is for, so the timer is readable behind your notes.
- Going between the clock and the room keeps each one's scroll position; coming back to the clock starts at the top. Loading a big one onto the ticket scrolls smoothly instead of jumping.
- The empty stamp box is a faint impression of the stamp, not a dashed box.
- Dark mode: lighter paper for tickets and tape, a deeper green button with light text, a brighter break arc.
- "Keep screen on" is hidden on desktop.
- Sam's row says "Checked in stuck at 10:38pm" instead of carrying a bold "Stuck" label.
- `prototypes/shoot.mjs` takes `BROWSER=/path/to/chromium`, so it runs on Linux and macOS.

## Not in this change

- The landing page (`apps/web/src/landing.ts`) still has the old dial.
- Keyboard shortcuts for Deal, ask for more and stop.
- An always-on-top mini dial (Chrome's Document Picture-in-Picture).
- The Chrome extension. Its plan is `docs/06-chrome-extension-roadmap.md`; milestone E0 is the next step.
- A native app. An installed desktop PWA already gives a window, and only the extension can act on tabs.

## Open for Chris

- Which scrolling animation looked off? This change fixed the jump when a big one loads, the scroll position carried between sections, and content being cut by the fixed bar (the bar is gone). If it was something else, say which screen.
- Reviewers asked in every round for "See room" during focus. The earlier ruling was that the room is not a door out while you focus. Left as ruled.
- Reviewers found "Next break 5 → 2 min. 2 more come out of later breaks." hard to follow, and "Bigger than one block?" and "All big ones" vague. Copy was left alone.
- The room list and the split sheet's steppers are the parts reviewers still call generic.

## Design rounds

Scored per the build loop by four independent reviewers who never saw each other's notes or a target: a product designer and an accessibility reviewer on Opus 5.5, a stressed student and an art director on Fable 5.2. Fresh reviewers each round. Scores are designer / student / accessibility / art director, 1 to 10. The first row of each round is the phone, the second is desktop.

| Round | Hierarchy | Typography | Color | Consistency | One action | Tone | Delight | Distinct | Space | Overall | What changed after it |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| r1 phone | 7 / 7 / 7 / 7 | 7 / 7 / 7 / 8 | 7 / 7 / 6 / 7 | 6 / 6 / 7 / 6 | 7 / 7 / 7 / 8 | 8 / 7 / 7 / 8 | 6 / 6 / 7 / 6 | 7 / 7 / 8 / 7 | | 7 / 7 / 7 / 7 | Friends line became a sentence with "See room"; tape follows the page; totals moved to the foot of the tape; stamps tilted; "Stuck" label removed |
| r1 desktop | 6 / 5 / 5 / 5 | 7 / 7 / 7 / 7 | 7 / 7 / 6 / 7 | 6 / 6 / 6 / 6 | 5 / 4 / 5 / 5 | 8 / 7 / 7 / 8 | 6 / 5 / 6 / 5 | 6 / 6 / 7 / 6 | 5 / 4 / 4 / 5 | 6 / 5 / 5 / 6 | Three columns cut to a stage and the tape; room column and its second green button removed; header rule removed; slot made a dark slit; new dial |
| r2 phone | 7 / 8 / 7 / 8 | 7 / 8 / 7 / 8 | 7 / 7 / 6 / 7 | 6 / 7 / 7 / 6 | 7 / 8 / 8 / 8 | 8 / 8 / 8 / 8 | 6 / 7 / 7 / 6 | 7 / 8 / 7 / 7 | | 7 / 7 / 7 / 7 | Dial rebuilt as one instrument (rosette moved into the track, numerals out to the scale, thin needle); stamp box ghost; used stub darker |
| r2 desktop | 6 / 6 / 6 / 6 | 7 / 7 / 7 / 7 | 7 / 7 / 6 / 7 | 6 / 6 / 6 / 6 | 6 / 7 / 7 / 7 | 8 / 8 / 8 / 8 | 5 / 6 / 6 / 5 | 6 / 7 / 6 / 6 | 4 / 5 / 5 / 5 | 5 / 6 / 6 / 6 | Stage aligned to the wordmark; dial sized so the friends line fits; decisions laid on the stage instead of a dialog; tape kept beside the room; larger deal sentence; dark button and paper |
| r3 phone | 7 / 8 / 8 / 8 | 7 / 8 / 8 / 8 | 7 / 7 / 7 / 7 | 6 / 7 / 7 / 6 | 7 / 8 / 7 / 8 | 8 / 8 / 9 / 8 | 7 / 7 / 7 / 6 | 7 / 8 / 8 / 7 | | 7 / 7 / 7 / 7 | Running block moved onto the stamped ticket; wheel returned to its original look as SVG strokes (Chris's call, with a research pass on methods); no numeral repeats the centre number |
| r3 desktop | 6 / 7 / 6 / 6 | 7 / 8 / 7 / 7 | 7 / 7 / 7 / 7 | 5 / 6 / 5 / 6 | 6 / 7 / 7 / 7 | 8 / 8 / 9 / 8 | 6 / 6 / 6 / 5 | 6 / 7 / 7 / 6 | 4 / 5 / 5 / 5 | 5 / 6 / 6 / 6 | Decisions rise over the dimmed clock again instead of replacing it (round 3's bare stage scored worse); sheet padding restored; action buttons capped at 340 px; tape type tightened at 1024 px |
| r4 phone | 8 / 8 / 7 / 8 | 7 / 8 / 7 / 8 | 7 / 7 / 6 / 7 | 7 / 7 / 6 / 6 | 8 / 8 / 7 / 8 | 8 / 9 / 8 / 8 | 7 / 7 / 7 / 7 | 7 / 8 / 7 / 7 | | 7 / 7 / 7 / 7 | "Keep screen on" moved under the ticket; one bold tick on short blocks; rim outlines removed; finer break hatch; squarer buttons; room names in the heading face |
| r4 desktop | 6 / 7 / 6 / 7 | 7 / 8 / 7 / 7 | 7 / 7 / 6 / 7 | 5 / 6 / 5 / 6 | 7 / 7 / 6 / 7 | 8 / 9 / 8 / 8 | 6 / 6 / 6 / 6 | 6 / 7 / 7 / 6 | 4 / 5 / 5 / 5 | 6 / 6 / 6 / 6 | Stage raised to the wordmark; wheel sized so the friends line fits at 1440 by 900; sheets match the stage width, end inside the window and dim the whole desk |
| r5 phone | 7 / 8 / 8 / 8 | 7 / 8 / 8 / 8 | 7 / 7 / 6 / 7 | 7 / 7 / 7 / 6 | 7 / 8 / 7 / 8 | 8 / 8 / 8 / 8 | 6 / 7 / 7 / 6 | 7 / 8 / 8 / 7 | | 7 / 7 / 7 / 7 | Stopped here. Darker wheel track and a more opaque dim behind desktop sheets were made after this round and not re-scored |
| r5 desktop | 7 / 7 / 7 / 7 | 7 / 8 / 7 / 7 | 7 / 7 / 6 / 7 | 6 / 6 / 7 / 6 | 7 / 7 / 7 / 7 | 8 / 8 / 8 / 8 | 6 / 6 / 6 / 5 | 6 / 7 / 7 / 6 | 5 / 5 / 5 / 5 | 6 / 6 / 6 / 6 | |

**Where it stopped.** Five rounds, twenty independent reviews. Phone held at 7 overall from every reviewer in every round. Desktop went from 5 to 6 overall and its hierarchy, one-action and consistency scores each rose a point or two. The 9 out of 10 consensus Chris asked for was not reached, and more polish will not reach it: rounds 3 to 5 changed sub-scores but not one overall score.

What every reviewer in rounds 4 and 5 says is holding it at 7 and 6:

1. **The room** is an avatar list with pill check-ins and carries none of the ticket idea.
2. **Sheets** (block end, asking for time, the split planner with its plus and minus steppers) are stock bottom sheets on phone and a rounded panel on desktop. Three desktop treatments were tried; none scored better than the others.
3. **The green button.** Reviewers want the stamp itself to be the action instead of a full-width button under a ghost stamp.
4. **Desktop is still a phone column beside a tape.** They want the running ticket laid out for width (wheel on the left, title, next step and stop on the right) and the tape to print the running deal live.
5. **Copy:** "Bigger than one block?", "All big ones", "Tap" on a laptop, "2h 5", and the borrow sentence.

Items 1 to 4 change how screens work, not how they look, and item 3 changes the product's main interaction, so they were left for Chris to rule on.

## Research: a smooth wheel

A dedicated research pass (Fable 5.2, web sources) on how to draw a draining ring well:

- Hard stops in `conic-gradient()` and in `radial-gradient()` masks are not anti-aliased, which is why the old wheel's rims stair-stepped, most visibly on a 1x desktop monitor ([CSSWG thread](https://lists.w3.org/Archives/Public/public-css-archive/2023Jul/0188.html)).
- The standard method is an SVG circle with `stroke-dasharray`, as in [progressbar.js](https://github.com/kimmobrunfeldt/progressbar.js), [react-countdown-circle-timer](https://github.com/vydimitrov/react-countdown-circle-timer) and [circular-progress-bar](https://github.com/tomickigrzegorz/circular-progress-bar) (all MIT). Nothing was copied from them; the technique is generic.
- Use flat caps with a separate knob, write plain numbers from script, avoid `pathLength` and negative offsets (Safari bugs), and do not stack a same-width track under the arc.
- No CC0 or MIT dial artwork was worth using; generated ticks look better than a stock dial.
- Not checked here: Safari and a 1x desktop monitor. Both need a look on real hardware.
