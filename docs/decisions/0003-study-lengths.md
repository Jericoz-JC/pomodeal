# 0003: Study lengths up to 60 minutes

Date: 2026-11-07 · Status: proposed

## Context

Beta students asked for focus blocks of roughly 20, 30, 40 and 60 minutes. The picker stopped at 20, and every session ramped up from a small first block. Long blocks have to fit "start small, grow, never shame" without turning the app into a deep-work stopwatch. Research and reasoning: [spec 007](../specs/007-study-lengths.md).

## Decision

- Offer **5, 8, 12, 15, 20** and **30, 45, 60** as two always-visible rows in one picker (the council picked this over a "Longer…" disclosure). 45 rather than 40; nothing past 60 in the picker.
- Quick lengths keep the +4 ramp, now capped at `max(25, chosen)` (20 ramps to 25, not 28). **Long lengths start at full length and hold**: picking 60 is a deal, and the clock doesn't overrule it.
- 45 and 60 build **2 focus blocks**; shorter lengths keep 3.
- Breaks between long blocks are **a quarter of the block** (30 → 8, 45 → 11, 60 → 15). Quick sessions keep 5 and 7.
- **No mid-block check-in.** Focus blocks of 45+ show a silent halfway line for 3 minutes (in its own slot, under the next step) and get a 5-minute heads-up instead of 2.
- A long deal says what comes after, and that it's optional: "Then 15 min of Reels, and one more 60 min block if you want it."
- Asks stay +5, trades stay +5 with the +15 cap, the bonus stays +10 / +3. **No focus block grows past 75 minutes** through trades or the bonus.
- Convex `start` validates the deal's lengths with the same core function.

## Consequences

- The ramp no longer applies to long blocks. If beta students who pick 60 stop early often, revisit with a gentler first long block (for example 45 then 60).
- One more pure rule set in `packages/core`, mirrored in the prototype script until the screens move to `packages/ui`.
- The dial's ticks now follow the block length, so 8 and 60 min blocks look different on purpose.
- No new stored field; the privacy inventory is unchanged.
