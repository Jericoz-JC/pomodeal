# 0004: The dial's ring winds on by animating its fill

Date: 2026-11-08 · Status: accepted (Chris, after the motion pass on `design/motion`)

## Context

The motion pass started with a rule: animate only `transform` and `opacity`, because those are cheap for the browser. The first block-change design followed it: the new ring scaled in while the knob ran a separate lap. In both council rounds all three reviewers (motion designer, student at 11 PM, accessibility) said the same thing: the knob orbiting a ring that was already full read as a loading spinner and hid what changed. They asked for the ring and knob to wind on as one object. That needs the ring's fill (`--p`, a registered custom property that drives the conic mask) to animate. A transform can't do it.

## Decision

- The ring winds on from empty with the knob riding its leading edge whenever the ring changes. That covers a new session, a new block, and minutes you just bought. It runs for 0.6 s with a gentle ease-out, once the sheet has cleared.
- It's the one exception to transform/opacity in the motion block. It repaints only the ring's mask for that 0.6 s.
- Everything else keeps the rule.
- Reduced motion skips the wind: the ring is simply there.

## Consequences

- Rules from a brief are defaults, not laws. When reviewers and testing show a clearer result, change the rule and write down why, the way this record does.
- If the wind ever shows jank on a low-end phone, the fallback is a plain fade-in of the full ring, not a return to the separate knob lap.
