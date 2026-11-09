# Spec 007: Study lengths

Status: draft (loop 1) · Phase 1 · Owner: Chris · Decision: [0003-study-lengths](../decisions/0003-study-lengths.md)

## Why

Beta students want bigger focus blocks than 5–20 min: roughly 20, 30, 40 and 60. The app's spirit is "start small, grow, never shame", so long blocks have to fit that instead of turning Pomodeal into a deep-work stopwatch. This spec covers which lengths to offer, how long sessions are built, how breaks scale, what happens mid-block, and how the negotiation terms behave when the block is an hour.

## Research

Evidence strength is marked **strong**, **moderate**, **weak** or **marketing**. Nothing here is a health claim, and none of it goes in product copy.

### What other apps offer

| App | Lengths | What we take from it |
| --- | --- | --- |
| Pomodoro (Cirillo) | 25 focus / 5 break, 15–30 after four | The default everyone knows. Fixed, not a ramp. |
| Focusmate | 25, 50, 75 min sessions | Three lengths, no more. 50 is reported as the usual pick (forum and review posts, **weak**: no official data). 75 is the longest, and Focusmate adds a 15 min buffer after it. Some users report 75 is harder to match. |
| Flow Club | 30, 60, 90, 120, 180 min | A 60 min session is about 50 min of muted work plus a short check-in. Long sessions are a group ritual there; we're solo-first. |
| Forest | Slider, 10 to 120 min in 5 min steps (180 in some versions, unconfirmed) | A free slider makes "how long?" a decision. We want a choice, not a decision. |
| Session (macOS/iOS) | Custom intent + length, timer keeps running past the end | Keeps going if you're not done, without asking. Close to our bonus offer. Preset lengths not published. |
| Tiimo | Visual timer; preset pages 5–30 min, +1 min while running | Even a planner built for brains that bargain stops its presets at 30. |

Takeaway: three lengths is the norm for anything over 25 (Focusmate 25/50/75). Nobody who leads with "start small" puts 90+ in the main picker.

### What the studies say

- **Fixed vs self-chosen breaks, students (moderate).** Biwer et al. 2023 (*Br. J. Educ. Psychol.*, 87 students): fixed breaks (24 min work / 6 break, or 12 / 3) gave better mood and similar task completion in less time than self-chosen breaks. The self-chosen group studied *and* rested longer and reported more fatigue. Smits, Wenzel & de Bruin 2025 (*Behav. Sci.*, 61+ students): 25/5 breaks made fatigue rise faster during the session, but there were no overall differences in fatigue, motivation, productivity, task completion or flow. A 2025 MDPI study reports the reverse of Biwer on mood. **Read together: planned breaks don't hurt and may help mood; no single ratio wins.** Both fixed-break studies used about 1 minute of break per 4 minutes of work.
- **Micro-breaks (moderate).** Albulescu et al. 2022 (PLOS One meta-analysis, 22 studies): breaks of 10 min or less preserve vigor and reduce fatigue; no overall performance effect. Longer breaks helped performance more, less so on demanding tasks.
- **Attention over time (strong for vigilance tasks, transfer to studying is weak).** In classic vigilance tasks most of the drop happens in the first 15–20 min, sooner under heavy load. That is about watching for rare signals, not reading a chapter, so it can't set a maximum. It does say the first minutes matter most, which is the case for starting small.
- **Sitting (moderate, no cognitive payoff shown).** Light activity breaks during long sitting don't reliably improve cognition in students (Wu et al. 2023: one small gain in task switching; a meta-analysis found breaks "neither improved nor impaired" cognition). Prolonged sitting is defined there as more than 30 min. So a stretch prompt is a comfort nicety, not a performance tool.
- **52/17 (marketing).** A 2014 DeskTime blog post about its own users. Not peer-reviewed, never replicated, and DeskTime's own 2021 repeat found 112/26. Don't cite it as evidence.
- **90-minute ultradian blocks (weak).** The ~90 min cycle is solid during sleep. Kleitman's waking "basic rest-activity cycle" has small, inconsistent evidence and was disputed early on. Not a reason to offer 90.

Sources: [Biwer 2023](https://cris.maastrichtuniversity.nl/en/publications/understanding-effort-regulation-comparing-pomodoro-breaks-and-sel), [Smits 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12292963/), [Albulescu 2022 (coverage)](https://www.fox5ny.com/news/regular-micro-breaks-work-boost-energy-levels-study-2022), [vigilance decrement](https://en.wikipedia.org/wiki/Vigilance_(psychology)), [Wu 2023, breaking up sitting](https://pubmed.ncbi.nlm.nih.gov/36434768/), [DeskTime on 52/17](https://desktime.com/blog/52-17), [BRAC](https://en.wikipedia.org/wiki/Basic_rest%E2%80%93activity_cycle), [Focusmate features](https://focusmate.com/features), [Focusmate 75 min](https://focusmate.com/?p=2578), [Flow Club](https://help.flow.club/en/articles/782977), [Forest timer range](https://www.lynda.com/iOS-tutorials/Stay-task-Forest-app/114903/2375907-4.html), [Session](https://stayinsession.com/learn/getting-started-with-session-pomodoro-app), [Tiimo focus timer](https://www.tiimoapp.com/product/focus).

## Answers

### Which lengths, and how many?

**Quick: 5, 8, 12, 15, 20 (unchanged). Longer: 30, 45, 60.** Eight lengths in all, shown as two rows in one picker: the quick row first, then the longer row past a hairline with "Longer blocks come with longer breaks." (Council r1 chose this over hiding the longer row behind a "Longer…" chip: the chip looked disabled, cost a tap, and made 60 feel like a choice you weren't meant to make.)

- 20 is already offered and stays the top of the quick row.
- **45, not 40.** It's a class period, it's three quarters of the dial, and it sits halfway between Focusmate's 25 and 75. 40 lands on no landmark.
- **60 is the ceiling of the picker.** Past 60 the evidence for one unbroken block is weak, and Focusmate's 75 is already the longest anyone offers as a preset. Trades and the bonus can still stretch a block to 75 (see below), so a student who's rolling is never cut off.
- No 90. If beta students ask for it, revisit with data from the ledger, not from the ultradian claim.

### Ramp, or full length from the start?

**Long blocks start at the length you chose and stay there.** The quick lengths keep the ramp.

- Picking 60 is a deal. Opening at 20 after someone asked for 60 overrules them, which is the opposite of "the clock never says no".
- The ramp exists to make *starting* easy. Someone choosing 60 has already decided; the first block of the Quick Deal (the reels you're already on) still does the starting work.
- Growing past the chosen length (60 → 64 → 68) would push past the ceiling for no reason.
- The ramp now uses `nextFocusLength` with a target of `max(25, focusMin)`, so it matches spec 001's "grows +4 up to the target (default 25)". **Changed rule:** 20 ramps 20 → 24 → 25 (it used to go to 28, past the spec's own target). 8 still goes 8 → 12 → 16.

### Rounds

A session with 45 or 60 min blocks has **2 focus blocks**; everything else keeps 3. That keeps one session to about 90–120 min of focus (30×3 = 90, 45×2 = 90, 60×2 = 120). After that you make a new deal, which is one tap.

### How breaks scale

| Focus | Breaks between focus blocks | Ratio |
| --- | --- | --- |
| 5–20 (quick) | 5, then 7 (unchanged) | generous on purpose: short sessions are about starting |
| 30 | 8, 8 | about 1:4 |
| 45 | 11 | 1:4 |
| 60 | 15 | 1:4 |

**Rule: a long block's break is a quarter of it, rounded.** 1:4 is what both student studies used for their fixed breaks, sits between Pomodoro's 1:5 and earned mode's 1:3, and keeps a 60's break at 15 min (Focusmate's buffer after 75). The first break, the one you're already on, is still whatever you picked (5/10/15/20). Earned-break mode is unchanged (1:3, 3 to 30).

### Does a 60 need a mid-block check-in?

**No check-in, no sound, no push. A silent halfway line instead.**

- A check-in is an interruption. Smits 2025 found that breaking more often made fatigue rise faster, and Session and Focusmate both let long blocks run untouched.
- But a student 30 minutes into a chapter at 11 PM can lose track of an hour. So on focus blocks of **45 min or more**, a reserved line under "Then Reels for 15 min." says **"Halfway. Stretch if you like."** for **3 minutes** at the midpoint, then empties again. The next step never disappears and nothing on the screen moves (council r1). No vibration, no sheet, nothing to dismiss, and no live-region announcement; the dial's accessible name reads "28 minutes left, halfway" during those minutes, so a screen reader user who checks finds it.
- Stretching is offered as comfort, never as health advice (see the sitting research: no cognitive payoff shown).

### Heads-up on long blocks

Wrapping up a chapter takes longer than wrapping up a reel. **Blocks of 45 min or more get a 5-minute heads-up** (in practice these are focus blocks); everything else keeps 2 minutes. Same words ("5 min to wrap up"), same calm treatment.

### Asks, trades, the bonus and the cap

| Term | Short blocks | Long blocks | Why |
| --- | --- | --- | --- |
| Ask (extend a break) | +5 | **+5** (unchanged) | Asks happen on breaks, and long-session breaks are 8–15 min. Five more minutes is still the size of "one more reel". Bigger asks would make each ask cost more. |
| Borrow | from the next break, floor 2 | unchanged | Long breaks have more room to repay, so less carries over as debt. |
| Trade | +5 to next focus, cap +15 per block | unchanged, **and never past 75 min** | 60 + 15 = 75, so the cap and the ceiling agree for every offered length. The ceiling guards future custom lengths. |
| Bonus | +10 focus, break +3 | **+10 / +3, only if the block stays at or under 75** | |
| Override | +5, no terms | unchanged | |

**Is +10 still a meaningful bonus on a 60?** As a share, no (17% vs 125% on an 8). As minutes, yes: it's the same ten minutes of reading. The bonus exists so the clock doesn't cut you off mid-paragraph, not to scale a reward. Making it +15 or +20 would push a 60 to 80 minutes, past where anyone offers a block. A 60 that was already traded up to 70 doesn't get the offer.

**New constant: `FOCUS_CEILING_MIN = 75`.** No focus block grows past it through trades or the bonus. Overrides only extend breaks, so they're unaffected.

### Validating a deal

Convex `start` now rejects a focus length that isn't one of the eight, and a break outside 1–30 min (`dealProblem` in core). Old saved deals in `localStorage` all use the quick lengths, so nothing breaks.

## The dial at 40–60 min

- **Ticks follow the block, not a 60-minute clock face.** One minor tick per block minute, so an 8 min block has 8 ticks and a 60 has 60 (about 14 px apart on a 288 px dial; still legible). Traded blocks get their extra ticks.
- **Majors:** every 5 min for blocks up to 30, every 15 min above 30 (quarters on a 60, thirds on a 45), **only when the block divides evenly**. An 8, a 12 or a traded 13 shows just the 12 o'clock major, so no heavy tick lands off-centre (council r1). The 12 o'clock tick stays the longest.
- **Countdown format: whole minutes all the way up.** "60 / minutes left", never "1:00:00" or "1 hr". Under 30 s it counts seconds, as today.

All three are pure functions in `packages/core` (`dialTicks`, `headsUpMs`, `isHalfway`).

## Copy

Follows the voice: no labels, no shame, no streaks, no "deep work".

| Where | Copy |
| --- | --- |
| Above the long chips | "Longer blocks come with longer breaks." |
| Under a long deal | "Then 15 min of Reels, and one more 60 min block if you want it." / "Then 8 min of Reels, and two more 30 min blocks if you want them." (With no break chosen: "Then a 15 min break, …".) The break is named the way the running screen names it. Later blocks are offered, not owed: each one starts only when you tap Start after the break. |
| Halfway, 45+ | "Halfway. Stretch if you like." |
| Heads-up, read aloud | "5 minutes to wrap up reading BIO 180 ch. 7." (the same words as the screen) |
| Heads-up | "5 min to wrap up" (same pattern as "2 min to wrap up") |
| Stopping a long block early | Unchanged: "Stop for now". The minutes you did count in "min studied". |

Never: "deep work warrior", "beast mode", "you can do it", "you only made it 20 minutes", any count of long blocks in a row.

## Out of scope

- 90 min or longer presets; a free slider.
- Per-user custom lengths (the ceiling is ready for them).
- Push notifications for halfway (it stays silent by design).

## Open questions (from the council)

- **"+5 / wrap up early" in a long block's heads-up.** The student and designer both missed a way to stretch or finish early in the last 5 minutes of a focus block (Tiimo has +1). It would be a new kind of ask (`extend_focus` by the user), so it needs its own rule in spec 001 first.
- **An end time on long deals** ("done around 11:56pm"). Useful, but it's one more number on the ticket; try it in dogfooding.
- **A half-punch on the DEAL stub at halfway.** Belongs with the motion pass (`design/motion`).

## Privacy

No new stored field. The deal shape (`activity`, `breakMin`, `task`, `focusMin`) and the session state are unchanged; only the allowed values grew. `docs/specs/006-privacy-inventory.md` does not need a change for this feature.

## Test cases (written first)

1. The offered focus lengths are 5, 8, 12, 15, 20, 30, 45, 60; `isLongFocus` is true from 30.
2. 8 ramps 8 → 12 → 16; 20 ramps 20 → 24 → 25; 30, 45 and 60 hold their length.
3. 45 and 60 build 2 focus blocks; 30 and below build 3.
4. Breaks between focus blocks: 5, 7 for quick; 8, 11, 15 for 30, 45, 60.
5. Trade is not offered when the next focus would pass 75.
6. Bonus is offered on a 60, not on a 70.
7. Heads-up is 5 min on blocks of 45+, 2 min otherwise.
8. Halfway is true for 3 min after the midpoint of a 45+ focus block, never on breaks or shorter blocks.
9. Dial ticks: 10 → 10 minors, majors every 5; 60 → 60 minors, majors every 15; 8, 12, 13 and 50 → only the 12 o'clock major.
10. `dealProblem` rejects a 40 min focus and a 0 min break.
