# Pausing a block and logging off-task minutes

Research for [issue #15](https://github.com/Jericoz-JC/pomodeal/issues/15) and [draft ADR 0008](../../decisions/0008-no-pause-step-out.md). November 11, 2026. Desk research only: paper abstracts and summaries found by web search, plus product pages and store listings. No paper was read in full and no app was installed, so effect sizes come from abstracts and app behaviour comes from what the makers say. Nothing here is from talking to students.

The question: a beta tester wanted to pause, including while on a break. Today a block keeps running whatever you do. Should a block or a break be pausable, should off-task minutes be recorded instead, or neither?

## Short answer

- **No study found tests a pause button in a study timer.** The evidence is adjacent: who controls breaks, whether a record helps, and what slack does to persistence.
- That evidence does not say pausing hurts results. It says free, unpriced control over breaks makes sessions and breaks longer and feels worse, with no gain in work done; that a written record helps; and that a small amount of slack with a cost keeps people going better than a rigid rule or free slack.
- Most timers let you pause, so a new user will look for it. The strict ones are the exception and usually offer strictness as a choice.
- Pomodeal already has the right mechanism. Stepping away in the middle of a focus block is one more thing to ask for, and "add the minutes back at the end" is the pause, with a price and a line on the tape. A break is never paused: "Ask for 5 more" already covers it.

## What the studies say

| Finding | Source | What it means here |
| --- | --- | --- |
| 87 university students in real self-study. Those who chose their own breaks had longer sessions and longer breaks, and reported more fatigue and distraction and less concentration and motivation than those on fixed 24/6 or 12/3 schedules. Task completion did not differ. | Biwer, Wiradhany, oude Egbrink and de Bruin 2023, *British Journal of Educational Psychology* | A break you can stop and start at will drifts longer and feels worse. This is the closest evidence against a free pause. |
| 94 students, two-hour sessions, fixed 25/5 against Flowtime and self-chosen breaks. Motivation fell faster on the fixed schedule; no overall difference in productivity, task completion or flow. | Smits, Wenzel and de Bruin 2025, *Behavioral Sciences* | Same lab, opposite lean. Together the two say rigid and free schedules get about the same work done. Neither supports a claim that pausing ruins a session. |
| Goals with a small "emergency reserve" (slack you may use, at a cost) were preferred and led to more persistence than the same goal with no slack or an easier goal. People try not to spend the reserve. A 2021 follow-up found reserves help people carry on after a missed day. One small student replication in dieting found no effect. | Sharif and Shu 2017, *Journal of Marketing Research*; 2021, *OBHDP* | The strongest support for a pause that exists but costs something. It is also the idea behind "never block, always price". |
| 138 experiments, about 20,000 people: prompting people to monitor progress improved goal attainment (d = 0.40). Larger when the monitoring left a physical record (0.43 against 0.29). Mostly health studies. | Harkin and others 2016, *Psychological Bulletin* | A record is worth having, and a written one more than a remembered one. Supports the tape, and supports putting stepped-away minutes on it. |
| Eight weeks, 24 people, the same computer-use data shown two ways. Only the group shown their distracting time improved; the group shown their productive time did not. | Kim and others 2016 (TimeAware), CHI | Showing the off-task minutes is what moves behaviour. A "Studied" total that hides them does less. Small sample. |
| After breaking a rule they set for themselves, people often do worse than people who had no rule (the "what-the-hell" effect). First shown in dieting; later work questions its size. | Soman and Cheema 2004; Cochran and Tesser 1996, through summaries | A clock that keeps running while you are plainly gone can make the block feel already lost. A way to step out and come back inside the deal avoids that. This is an inference, not a tested result for timers. |
| 414 undergraduates: a phone break during a hard task restored less than other breaks, and no better than no break. | Kang and Kurtzberg 2019, *Journal of Behavioral Addictions* | A pause spent on Reels is not rest. No reason to make it free. Lab task with word puzzles. |
| Longer and more demanding interruptions take longer to come back from. | Monk, Trafton and Boehm-Davis 2008; Altmann and Trafton | Supports a short, fixed step-out (5 minutes) over an open-ended pause, and supports asking for the first thing you'll do on the way back, which spec 001 already does on a third ask. |
| People who track by hand lapse and stop; the cost of logging is the most common reason. | Epstein and others 2015, 2016 (personal informatics) | A manual "I'm off task" switch will be forgotten at exactly the moments it is for. Nobody taps a button before drifting. |

The original technique is stricter than any of this: a pomodoro is indivisible, and an interrupted one is void and restarted. That comes from secondary descriptions; the book itself was not checked.

## What students will expect, from the apps they know

Read from product pages and store listings on November 11, 2026, not from use.

| App | Pause | Notes |
| --- | --- | --- |
| Forest | Leaving the app kills the tree. Recent versions add a pause of up to 5 minutes, on a paid tier, with a switch to turn it off. | A third-party report says some users find the new pause makes the app too easy to get around. The strictest well-known timer moved toward a short, limited pause. |
| Session | Pause from the app, widget, Live Activity and Siri. | Free pause is the default in the mainstream. |
| Focus To-Do | "Pause and resume" is a listed feature. | No off switch found. |
| TodoTicked, AppBlock | A strict mode in settings that removes pause. | Strictness as an opt-in. |
| SimpliFocus | A pause limit you set. | Slack with a cap. |
| Focus: Live Timer | Counts how many times you paused and shows it in the summary. | Pause plus a record. |
| YPT (Yeolpumta) | Counts study time in the app; leaving needs an "allowed apps" mode. | A store review asks for a way to leave the app with the timer still on. |
| Focusmate | No pause; you tell your partner in chat if you step away. | The record is social. |

So a student arriving from another timer expects a pause button, and expects it to be free. The apps built on commitment either refuse it or cap it. Nobody found prices it or prints it as part of the session's record.

## What the tester's request is, in Pomodeal's terms

Two different wants are inside "let me pause":

1. **Stop the clock while I'm away**, so I still get my full block when I come back.
2. **Don't count minutes I didn't study**, so the total is true.

And there are two places it could apply:

- **In a break.** A break on Reels that can be paused is a break with no end. "Ask for 5 more" is already the way to get more break, with a price from the second ask. Nothing to add.
- **In a focus block.** Here there is a real gap. If you drift for 5 minutes in a 20 minute block, the only choices today are to let the clock run, after which the tape says 20 minutes studied, or "Stop for now", which ends the deal. The first makes the record less honest, not more: the clock was honest and the total was not.

## Options

### 1. Change nothing

The clock runs; the tape counts the block's minutes.

- Core, tape, privacy: no change.
- For: simplest; nothing to game; matches Chris's view.
- Against: "Studied" overstates on any night with drift, and the tape is supposed to be the honest record. Leaves the tester's second want unanswered. New users will look for pause and find only "Stop for now".

### 2. Log it, clock untouched

Record minutes away without moving anything.

- **2a, live:** a quiet "Step out" during a focus block and "Back" on return.
- **2b, afterwards:** on the done sheet, one choice about the block just finished (all of it, most of it, about half).
- Core: 2a needs an away interval on the session and `focusMinutesDone` net of it; 2b needs only a field on the `done` entry. Neither touches block boundaries, so scheduled functions and pushes are unchanged.
- Tape: a grey line under the deal ("Stepped out, 6 min"), and "Studied" becomes net.
- Privacy: one new self-reported number per block. No detection.
- For: answers the second want; small; keeps the clock exactly as Chris wants it.
- Against: 2a depends on tapping before drifting, which the tracking research says people won't do; 2b is a guess after the fact. Does nothing for the first want. Risks reading as a confession, which the voice rules forbid, so the words matter.

### 3. Stepping out is something you ask for (recommended)

A new ask in a focus block, priced with the terms that already exist. The clock never stops.

- **Step out for 5.** The clock answers with terms, as it does for a break:
  - **Add it back:** the block ends 5 minutes later. This is the pause, as a trade. Capped like any trade (15 minutes a block, 75 minute ceiling).
  - **Take it from my break:** the block ends on time and the next break is 5 shorter (floor 2), as a borrow.
  - **I need this:** nothing owed, as an override.
- Whichever is picked, the tape prints the step-out and "Studied" leaves those minutes out.
- No first one free. A free step-out is a free pause, and the reserve research says the cost is what makes slack work. (Open for Chris; a first free one per night is the gentler version.)
- A step-out ends by itself after its 5 minutes: the dial simply carries on. It cannot be left open, so a session can never sit paused.
- For: answers both wants; uses the product's own idea instead of a setting; gives a new user something to press where they expect pause; makes `canOfferBonus`'s unused `pausedInLast5Min` real.
- Against: the largest change. One more ask to learn. Needs the server to total studied minutes first (ADR 0006 notes it can't yet).

### 4. A setting that allows free pausing

- Core: paused time shifts `startedAt`; boundaries rescheduled; a paused session needs a timeout.
- For: what a new user expects.
- Against: there is no settings screen; it forks behaviour between people in the same room later; it is the self-regulated condition from Biwer; the override rate risk in concept v2 gets a second, quieter door. A pause in a break has no meaning at all.

## Effect of option 3 on `packages/core`, the tape and privacy

**Rules (`packages/core`, test-first; spec 001 gains a section):**

- `Ask` gains `{ kind: "step_out"; minutes?: number }` (5 by default), valid only in a focus block.
- `makeOffer` for it returns trade (if under the caps), borrow and the override. No freebie.
- `SessionState` gains the minutes stepped out in the current block, and the end of a running step-out if one is open. Time is still computed from `startedAt` and duration: "add it back" lengthens `durMs`, exactly as a trade lengthens a block today.
- `focusMinutesDone` subtracts stepped-out minutes, which also corrects the minutes credited to a big one and the `done` and `end_early` entries.
- `canOfferBonus` is told the truth: no bonus within 5 minutes of a step-out.
- `LedgerKind` gains `step_out`.
- Tests to write first: step-out refused in a break; trade term absent at the cap; borrow carries into the next deal's break (ADR 0007); net minutes on `done` and `end_early`; bonus withheld after a step-out; a second step-out in the same block.

**Server:** "add it back" moves the block's end, so the heads-up and block-end pushes are rescheduled. The session `version` check already drops stale ones. One optional push when the 5 minutes are up.

**Tape:** one line per step-out in the grey ink used for `skip` and `end_early`, never red, with what was agreed ("added back", "from the break"). "Studied" is net. The wording and whether it counts as a deal in the tape's head go to the design council.

**Privacy:** two new stored things, both self-reported: a `step_out` ledger row (time, minutes, the term taken) and the stepped-out minutes on the session. No app names, no detection, no reason asked. Add both to spec 006 in the same change. Rooms should not show a step-out; that belongs with spec 001's open question about friends seeing overrides.

**Not in this:** detecting off-task time. The Intercept shortcut and the extension could log it automatically later (app name or domain, and time). That is a privacy decision of its own and not needed for this.

## What would change the recommendation

- If two or three students, asked what they last paused a timer for, all mean "someone talked to me" or "bathroom", the 5 minute step-out covers it. If they mean "I want to stop the clock for half an hour", that is "Stop for now" and a new deal, and nothing needs building.
- If Chris wants the block's end never to move, drop "add it back" and option 3 becomes option 2a with a price.
- Two questions for this are added to the [first-run test](First-run%20test%20of%20the%20ticket,%20stamp%20and%20tape.md).

## Sources

Biwer and others 2023: pubmed.ncbi.nlm.nih.gov/36859717. Smits, Wenzel and de Bruin 2025: pmc.ncbi.nlm.nih.gov/articles/PMC12292963. Sharif and Shu 2017: doi 10.1509/jmr.15.0231, summary at anderson-review.ucla.edu/emergency-reserves; 2021 follow-up at chibe.upenn.edu/publications/nudging-persistence-after-failure-through-emergency-reserves. Harkin and others 2016: eprints.whiterose.ac.uk/91437. TimeAware: hcil.snu.ac.kr/research/timeaware. Kang and Kurtzberg 2019: pmc.ncbi.nlm.nih.gov/articles/PMC7044622. Monk and others 2008: interruptions.net/literature/Monk-JEPA08.pdf. Epstein and others 2015: my.eng.utah.edu/~cs5540/au16/readings/PersonalInformatics-Epstein2015.pdf. What-the-hell effect: spring.org.uk (summary). Pomodoro rules: wikipedia.org/wiki/Pomodoro_Technique, pomodo.io cheat sheet. Apps: forestapp.cc and its store listings, stayinsession.com/changelog, Focus To-Do and YPT App Store listings, appblock.app help, support.focusmate.com (community rules).
