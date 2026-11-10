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
- **Decisions on desktop** (block end, asking for time, planning) are laid on the stage in place of the clock. There is no dialog box, blur or dim; the tape stays readable.

**The dial is one instrument**, read from the outside in:

- a numeral at every 5 minutes (every 15 on long blocks) and the block's length at the top;
- one tick per minute of this block;
- the ring: time left is solid ink (hatched for a break), time gone is engine-turned line work, like the printing on tickets and banknotes;
- a paper plate with the number;
- one thin needle at the leading end, pointing at the scale.

Numerals scale with the dial. The room's small rings are unchanged.

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
