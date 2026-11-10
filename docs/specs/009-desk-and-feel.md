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
- Keyboard shortcuts and the always-on-top wheel: added in round 7, item 4 below.
- The Chrome extension. Its plan is `docs/06-chrome-extension-roadmap.md`; milestone E0 is the next step.
- A native app. An installed desktop PWA already gives a window, and only the extension can act on tabs.

## Open for Chris

- Which scrolling animation looked off? This change fixed the jump when a big one loads, the scroll position carried between sections, and content being cut by the fixed bar (the bar is gone). If it was something else, say which screen.
- The split sheet's steppers are the part every reviewer still calls generic.

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
| r6 phone | 7 / 7 / 8 / 8 | 7 / 8 / 7 / 8 | 7 / 7 / 6 / 7 | 6 / 6 / 7 / 6 | 7 / 6 / 7 / 7 | 8 / 8 / 8 / 9 | 6 / 7 / 7 / 7 | 7 / 8 / 8 / 7 | | 7 / 7 / 7 / 7 | Defects only, not re-scored: friend rings visible in dark mode, "Break you chose" on one line, term stamp inside its slot and darker, serial numerals match on the tape, friends line hidden under a sheet, hint says "Press DEAL to start", every filled button carries the stamp's double rule |
| r6 desktop | 6 / 7 / 7 / 7 | 7 / 8 / 7 / 7 | 7 / 7 / 6 / 7 | 5 / 6 / 6 / 6 | 6 / 6 / 7 / 7 | 8 / 8 / 8 / 8 | 5 / 6 / 6 / 6 | 6 / 7 / 7 / 6 | 4 / 5 / 5 / 5 | 5 / 6 / 6 / 6 | |

## Round 6: the rulings Chris lifted

After round 5 Chris said to break the existing rulings, his own included. Round 6 did the four things every reviewer had named:

- **The stamp is the action.** The green Deal button is gone. The Deal control is the stamp's face, large and outlined on the ticket's stub; pressing it slams and inks it, and it travels to the head of the running ticket. Terms are taken by stamping their ticket, which shows a faint impression until you do. The control is still a real button named "Deal".
- **The room is on paper.** Each friend is the stub of the ticket they are on, with their wheel on the stub end. A check-in is a stamp.
- **Sheets are paper.** No grab handle or rounded corners: a length of paper torn across the top (and the bottom on desktop).
- **The running ticket is laid out for width on desktop**: the wheel on the stub end, the title and next step beside it past a perforation. The tape prints the running deal as its first line.
- **"See room" shows during focus too**, reversing the earlier ruling that the room is not a door out while you focus.
- **Copy:** "Bigger than one sitting?", "All big tasks", "Click" instead of "Tap" on a wide window, "2h 5m", and "3 min from your next break (5 → 2), 2 from later breaks."

**Where it stopped.** Six rounds, twenty-four independent reviews. Every reviewer scored the phone 7 overall in every round. Desktop went from 5 to 6 and stayed there. The 9 out of 10 consensus Chris asked for was not reached, and round 6 shows that the structural changes do not reach it either: reviewers approved each one and then named the next thing.

What they name now:

1. Desktop still reads as a phone column beside a tape. About a third of the stage is empty in most states. They want the ticket to fill the stage height and the number to be readable from across a desk.
2. The other filled green buttons ("Start reading", "Save pieces", "Start 14 min with Maya") should be stamps too.
3. The split planner's plus and minus steppers, the "..." menus and the "Or make a quick deal" row are stock controls.
4. The room as five identical stubs reads as cards in costume to two of four reviewers; they want one roster sheet.
5. After the press the DEAL stamp shrinks to a small tag; they want it to stay large on the running ticket.

A score that does not move in six rounds, while the named problems change every round, says the panel's 7 is about as far as screenshots of this design will go. The next information worth having is from people using it: Chris on a real night, then the friend group.

## Round 7: Chris's list, one item at a time

Branch `design/desk-feel`, cut from this one. No review council: Chris judges each item from screenshots and clips.

### 1. Asking for time

The product's signature moment, and the least crafted screen. The negotiation rules (`packages/core`, and the prototype's mirror of them) are unchanged.

- **The clock speaks.** Your ask is quoted small at the top, right-aligned: “5 more minutes of Reels?”. The clock's answer is the largest text on the sheet, said by the wheel itself: a small copy of the timer, with a ring of ticks so it reads as a clock face and not a spinner. It is drawn on the scale it will have if you agree. What is left of this block is the solid arc with the knob; the 5 minutes on offer wait after it as a pale green arc, which is the stretch the big wheel winds on once you stamp. It stays current while the sheet is open without redrawing the sheet.
- **Each term is one plain sentence in your own words.** No "5 → 2" figure. "**Take them from my next break.** It goes from 5 minutes to 2, and the other 2 come off later breaks." "**Add them to my next reading block.** It goes from 8 minutes to 13." "**5 more minutes, on the house.** You're back to reading at 10:46pm." The edge cases have their own sentences: no break left, or a next break already at the 2-minute floor.
- **Taking a term is a stamp.** Each ticket has a stub past a perforation carrying the DEAL stamp's face, clean double-ruled rubber. On a desk it rises under the pointer. Pressing the ticket lifts the stamp off the stub at once, brings it down hard at 200 ms, squashes and rebounds. On impact the ink texture appears, the ticket is driven down, the whole sheet takes a 2 px knock, and phones that can vibrate buzz. The other ticket falls away and the sheet closes at about 760 ms. With reduced motion the stamp is simply inked and the other ticket fades.
- **One press, everywhere.** The free one is a ticket you stamp too; the separate Deal button under it is gone. ADR 0005 holds: the repayment picked last time has a green edge and says "You picked this last time", and stamping it is one press, so the extra Deal button under the terms is gone as well.
- The "keep going" offer at the end of a focus block uses the same sentence ticket, with an empty impression on its stub, but still has its green Deal button. That button becomes a stamp in item 3.

Not verified: Safari (desktop and iPhone) and a real phone. The haptic buzz only exists on Android Chrome; iOS has no vibration API. The motion was judged from 60 ms frame strips and a real-time clip in headless Edge, not by hand on a device.

### 2. Motion: four moments

Judged from real-speed recordings (`prototypes/shoot-motion.mjs`, which now records a desk too with `WIDTH=1440 HEIGHT=900`, and has a working `tape` moment in place of the old ledger tab), phone and desktop, light, dark and reduced motion. What the "before" clips showed, and what changed:

- **The DEAL stamp.** Before: pressing it made it vanish for a frame (it restarted from transparent), nothing moved for about 300 ms after it landed, then the screen cut to the running ticket. The view transition that was meant to carry the stamp ran in Chrome but not in Safari before 18 or Firefox, and is not captured by recordings. Now it uses the same stamp language as the terms: it lifts at once, comes down at 200 ms with the ink, and the ticket takes the knock. At 400 ms it comes off its stub, which tears away underneath; at 620 ms the running ticket is drawn and the stamp itself flies to its place at the head, shrinking as it goes, and hands over to the one printed there. Plain transforms, so every browser gets it. A spacer holds its place, so the ticket does not shrink while the stub tears.
- **The tape printing a new line.** Before: the new stub dropped in at an angle while the older ones were pushed, which read as a shuffle; on a phone it played below the fold where nobody saw it. Now the tape feeds the line out from under "now": the gap opens at a receipt printer's pace and the line rides down into it, then its stamp is inked. It waits for the sheet to leave. On a phone it prints when the tape scrolls into view.
- **The block turn.** Before: the title swapped under the leaving sheet. Now the old title leaves up through the top of its line, and the new one rises in from under it, each clipped to the line it crosses; then the ring winds as before. Words never fade.
- **The heads-up.** Before: the number faded in from 35 % and grew, which read as a flicker. Now it is pressed again like a date stamp (lifted, down, a small rebound, no fade), and "min to wrap up" prints in left to right after it lands. Time up uses the same press.
- Reduced motion: the DEAL stamp inks in place and the running ticket appears; the tape line and the heads-up words simply appear; nothing flies, feeds or rises.

Known and left: when the new title has more lines than the old one, the wheel steps down by a line at the start of the turn. Not verified: Safari (desktop and iPhone), a real phone's frame rate, and a 60 Hz desktop by eye; the clips are headless Edge.

### 3. Finishing the metaphor

- **One action language.** Every remaining filled green button is now a stamp: the same double-ruled rubber face as DEAL, carrying its words ("Start reading", "Start reading now", "Save pieces", "Sign it", "Keep it", "Start 14 min with Maya"), tilted a little, rising under the pointer on a desk. Pressing one slams and inks it, and the button does its job once the stamp has landed (280 ms; at once with reduced motion). A stamp that is not ready yet ("Name a piece to save") is an empty dashed impression. The big one card's green start tab is a stamp face on the card's paper too. The "keep going" offer is now a ticket you stamp, like the terms; its separate Deal button is gone.
- **A large DEAL stamp stays on the running ticket.** About three times the old tag, inked, at the head of the ticket on a phone, and in the empty lower corner past the perforation on a desk. The stamp you pressed flies into it (item 2).
- **The split planner is one ticket torn into pieces.** No plus and minus steppers and no number fields. Each piece is a length of one ticket, as long as its minutes (a fixed base plus 1 px a minute), ending at a tear line: a row of punched holes with a notch at the edge and the piece's minutes sitting on it like a tab. Pull a tear line and the piece above it gets longer or shorter in 5 minute notches, with everything after it moving down; phones that can vibrate tick at each notch. For the keyboard and screen readers each tear line is a vertical slider ("Length of Problems 5 to 8", "45 minutes"): arrows move 5 minutes, Page Up and Down 15, Home and End the limits. "Add a piece" sits at the ticket's open end. A stamped piece carries a small "Done" stamp. The rules (5 to 240 minutes in 5 minute steps, up to 12 pieces) are unchanged.

Not done in this item: the "..." menus and the "Or make a quick deal" row (also named as stock controls in round 6), and the room as one roster sheet. Not verified: dragging a tear line on a real phone (it was driven with synthetic pointer events and the keyboard), Safari, VoiceOver.

### 4. The desk stage

- **The running ticket fills the stage.** At a desk it is no longer a short wide strip with the wheel at one end. It is laid out like the phone's: the head carries what the block is and the large DEAL stamp, the wheel fills the middle, and what comes next is on the stub. It is as tall as the window allows. The wheel is sized by whichever runs out first, the window's height or the stage's width: about 430 px at 1440 by 900, about 470 px at 1920 by 1080, never under 240 px. The number scales with it, from about 65 px to about 125 px tall. The way out ("Stop for now", "Start reading now") and the room line share one row under the ticket, so nothing falls below the fold.
- **Keyboard shortcuts.** D deals: the DEAL stamp, the free 5 minutes, the repayment you picked last time, or the offer to keep going. 1 and 2 take the first or second term. M asks for more time where the clock offers it. S stops where a Stop is on screen. A key presses the same control a click would, so it stamps, announces and moves focus the same way. Nothing fires while you type, with Ctrl, Alt or Cmd held, or on a key repeat. The key is printed small on the control it presses (desk only, a fine pointer that can hover), and each control carries `aria-keyshortcuts`.
- **The wheel on top.** In Chrome and Edge on a desk, "Keep the wheel on top" (beside the date, while a block runs) floats a small always-on-top window with the block, the wheel and the number, drawn from the same stored time as the tab. It only shows; deals are made in the tab, and at time up it says "Back in the tab to choose." Where the browser has no Document Picture-in-Picture the control is not offered; where it has the API but refuses the window (embedded views), it says so once and stops offering it.
- Fixed on the way: the stage was pulled up over the date line, so a control there could not be clicked.

Not verified: the floating window itself. Headless Edge and the app's own browser pane both refuse to open one, so only the refusal path was exercised; the window's contents were checked by drawing them into a frame of the same size. It needs a look in desktop Chrome or Edge. Safari and Firefox do not offer it. Shortcuts were driven with synthetic key events, not a person at a keyboard with a screen reader running.

## Invites

Chris reported that he invited a friend and could see nothing. An investigation (Opus 5.5, read-only) found this is mostly as built: an invite only lets someone into the beta, and friends, rooms and presence do not exist in the backend yet. The live Room says "open soon". Fixed on this branch:

- A used ticket now says who joined and when ("Maya joined Nov 9"): first name only, shown only to the member who made the ticket. `users` has a new `by_inviteId` index; no new stored field. The privacy inventory row for `displayName` is updated.
- The invite code is kept in `localStorage`, so it survives sign-in finishing in another tab.
- A dropped connection during the claim no longer throws the code away; a reload tries again.
- "Make an invite ticket" says so when it fails.

Not fixed: an invite made from the command line belongs to nobody and shows in no one's list. A code opened in an in-app browser (Messages, Instagram) is still lost if sign-in finishes in a different browser. Whether Chris's friend actually finished signing in was not checked, because that means reading production data.

## Research: a smooth wheel

A dedicated research pass (Fable 5.2, web sources) on how to draw a draining ring well:

- Hard stops in `conic-gradient()` and in `radial-gradient()` masks are not anti-aliased, which is why the old wheel's rims stair-stepped, most visibly on a 1x desktop monitor ([CSSWG thread](https://lists.w3.org/Archives/Public/public-css-archive/2023Jul/0188.html)).
- The standard method is an SVG circle with `stroke-dasharray`, as in [progressbar.js](https://github.com/kimmobrunfeldt/progressbar.js), [react-countdown-circle-timer](https://github.com/vydimitrov/react-countdown-circle-timer) and [circular-progress-bar](https://github.com/tomickigrzegorz/circular-progress-bar) (all MIT). Nothing was copied from them; the technique is generic.
- Use flat caps with a separate knob, write plain numbers from script, avoid `pathLength` and negative offsets (Safari bugs), and do not stack a same-width track under the arc.
- No CC0 or MIT dial artwork was worth using; generated ticks look better than a stock dial.
- Not checked here: Safari and a 1x desktop monitor. Both need a look on real hardware.
