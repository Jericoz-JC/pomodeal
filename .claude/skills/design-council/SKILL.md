---
name: design-council
description: Trigger when the user says "council" or "design council", and after every user-visible UI change in Pomodeal (screens, copy, layout, motion) before it is committed. Runs three independent reviewers on screenshots of the change, applies what they agree on, and loops until all three are satisfied.
---

# Design council

Adapted from tstack's `council` (github.com/t3dotgg/tstack, MIT) for Pomodeal's UI. Small loops, often: every
user-visible change goes to the council before it is committed, not once at the end of a big batch.

## Members

Set in `CLAUDE.md` ("Design council"). Today: a product designer and an accessibility reviewer (WCAG 2.2 AA plus
cognitive) on Claude Opus 5.5, and an art director for taste on Claude Fable 5.2. Use those exactly. If one can't be
reached, say so; don't substitute.

## Before a round

1. Fix what you already know is wrong. Never send the council something you would change anyway.
2. Screenshot only the states the change touches, before and after, at 375 px light and dark, and at 1440 by 900 if
   the desk shows it (`node prototypes/shoot.mjs <dir>` with `ONLY=`). One browser at a time, in the foreground, and
   check no headless Edge is left after it.
3. Make one contact sheet per comparison so each reviewer opens a few images, not dozens.

## A round

Start the three reviewers in parallel, each fresh, read-only, with no shared context and no target score. Give each:

- what Pomodeal is in three sentences, and the founder's rules from `CLAUDE.md` (banned looks; no lines that explain
  basic UI; no labels, shame or streaks);
- what this change was for, in one sentence, and the before and after images;
- references to judge against: Forest, Focusmate, Opal, Things 3, Arc;
- the ask, in under 300 words: a score out of 10 for the change, the top three fixes (screen, element, exact change),
  anything that got worse, and any copy a first-time user would find unclear or that explains the obvious.

Ask for one overall score, not seven categories: the loop needs a clear "satisfied or not".

## After a round

- Make the fixes two or more reviewers agree on, and any accessibility failure, before anything else.
- A fix only one reviewer wants: make it if it serves the change and costs little; otherwise note it and say why not.
- If a reviewer's fix contradicts the founder's ruling, the founder wins. Say so in the log.
- Then start a fresh round with new reviewers. Stop when every reviewer scores 8 or more and names nothing that got
  worse, or after three rounds on one change; then show the founder and let him decide.

## Keep it small

Fight scope creep. A round reviews the change, not the whole app. Anything new a reviewer raises outside the change
goes on a list for the founder, not into this change.

## Log

Add each round to the spec's "Design rounds" table. If the work ends in a PR, put this in its description:

```markdown
## Council review

| Change | Designer | Accessibility | Taste |
| --- | --- | --- | --- |
| Deal ticket, round 1 | 7/10 | 8/10 | 6/10 |
| Deal ticket, round 2 | 8/10 | 9/10 | 8/10 |
```

If a reviewer gives no score, write `no score`. Never invent one.
