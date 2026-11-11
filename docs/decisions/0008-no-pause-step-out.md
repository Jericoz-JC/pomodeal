# 0008: No pause; stepping out is something you ask for

Date: 2026-11-11 · Status: draft, for Chris to decide. Nothing is built and no rule has changed.

## Context

A beta tester wanted to pause, including during a break ([issue #15](https://github.com/Jericoz-JC/pomodeal/issues/15)). Today a block keeps running whatever you do, and Chris's view is that this is part of the honest record. The request holds two wants: stop the clock while I'm away, and don't count minutes I didn't study.

The research ([Pausing a block and logging off-task minutes](../research/reports/Pausing%20a%20block%20and%20logging%20off-task%20minutes.md)) found no study of a pause button itself. The nearby evidence: breaks people control freely run longer and feel worse with no more work done; a written record helps, and showing the off-task part helps most; a little slack with a cost keeps people going better than none or than free slack. Most timers pause for free; the strict ones cap it or make strictness a setting.

One gap is real. If you drift for 5 minutes in a 20 minute focus block, the tape still says 20 minutes studied. The clock was honest and the total was not.

## Decision (proposed)

- **No pause button, in a break or a focus block, and no setting for one.** The clock never stops.
- **A break is not paused.** More break is "Ask for 5 more", as now.
- **In a focus block, stepping out is a new ask**, priced with the terms spec 001 already has:
  - Add it back: the block ends 5 minutes later (a trade, under the same caps).
  - Take it from my break: the next break is 5 shorter, floor 2 (a borrow).
  - I need this: nothing owed (the override).
- **No free first step-out.**
- **A step-out lasts its 5 minutes and ends by itself.** A session can never sit paused.
- **Every step-out prints on the tape, and "Studied" leaves those minutes out**, along with the minutes credited to a big one.
- **Nothing detects off-task time.** A step-out is only ever something the student asked for.

## Consequences

- Spec 001 gains a "step out" ask and its test cases; `packages/core` changes test-first: `Ask` and `LedgerKind` gain `step_out`, the session records minutes stepped out, `focusMinutesDone` is net of them, and `canOfferBonus` gets a real "stepped out in the last 5 minutes".
- "Add it back" moves a block's end, so the heads-up and block-end pushes are rescheduled, as after a trade.
- The server has to total studied minutes before the tape can show a net figure (ADR 0006 left that on the device).
- Privacy inventory: a `step_out` ledger kind and the stepped-out minutes on the session, both self-reported, in the same change. Rooms don't show step-outs.
- The tape line, its words and where "Step out" sits on a running block are user-visible, so they go to the design council against `settled.md`.
- A student who wants to stop for longer than a few minutes uses "Stop for now" and makes a new deal.

## Alternatives considered

- **Change nothing.** Simplest, and the clock stays as Chris wants it, but the studied total overstates.
- **Log it only** (a "Step out" and "Back" switch, or one choice on the done sheet). Small and moves no boundary. It depends on tapping before drifting, or on a guess afterwards, and does nothing for the first want. The fallback if this decision is too big: the done-sheet choice.
- **A setting for free pausing.** What people arriving from other timers expect. There is no settings screen, it splits behaviour between people who will share rooms, and it gives the override a second, unlogged door.

## Open, for Chris

- Should the block's end ever move? If not, drop "add it back": stepping out is then always paid from the break or overridden.
- One free step-out a night, or none?
- 5 minutes only, or a choice of lengths?
- Ask two or three students what they last paused a timer for before building (added to the first-run test for issue #17).
