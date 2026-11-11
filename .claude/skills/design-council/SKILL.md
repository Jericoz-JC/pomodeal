---
name: design-council
description: Trigger when the user says "council" or "design council", and after every user-visible UI change in Pomodeal (screens, copy, layout, motion) before it is committed. Three reviewers judge screenshots of the change against Chris's settled decisions; fixes are checked against those decisions before they are built; the loop runs until all three are satisfied.
---

# Design council

Adapted from tstack's `council` (github.com/t3dotgg/tstack, MIT). Small loops, often: every user-visible change goes to
the council before it is committed, not once at the end of a big batch.

## Members

Pomodeal is built for Chris's taste; he is its primary user. Set in `CLAUDE.md` ("Design council"):

- **Product designer** (Claude Opus 5.5): hierarchy, one clear action, a consistent system.
- **The primary user** (Claude Opus 5.5): a capable student who studies with Pomodeal every night, on a phone and a
  laptop, and would pay for it. Wants it fast, intuitive, good-looking, never babying. Judges: would I enjoy using this
  tonight, is anything slower or more confusing than before, does anything explain what I already get?
- **Art director** (Claude Fable 5.2): taste only. Beautiful, consistent, distinctive, not template-made.

Accessibility is not a review lens for this product. If a member can't be reached, say so; don't substitute.

## Before a round

1. Fix what you already know is wrong. Never send the council something you would change anyway.
2. Screenshot only the states the change touches, before and after, at 375 px light and dark, and at 1440 by 900 if
   the desk shows it (`node prototypes/shoot.mjs <dir>` with `ONLY=`). One browser at a time, in the foreground, and
   check no headless Edge is left after it.
3. Make one contact sheet per comparison, so each reviewer opens a few images, not dozens.

## A round

Start the three reviewers in parallel, each fresh, read-only, with no target score. Give each:

- what Pomodeal is in three sentences;
- `settled.md` (in this folder) in full: these are decisions, not suggestions;
- what this change was for, in one sentence, and the before and after images;
- references: Forest, Focusmate, Opal, Things 3, Arc;
- the ask, in under 300 words: a score out of 10 for the change, the top three fixes (screen, element, exact change),
  anything that got worse, and any copy that is unclear or explains the obvious.

Ask for one overall score: the loop needs a clear "satisfied or not".

## After a round

Before building any fix, check it:

1. Does it contradict `settled.md`? Then don't build it. If the reviewer has a point, ask Chris.
2. Does the app already do this job somewhere? Then reuse that pattern (time is picked from choices; commitments are
   stamps). Never invent a new control to satisfy a reviewer.
3. Would Chris, using it tonight, notice it as better? If not, skip it.

Then make the fixes that pass and that two or more reviewers agree on. A fix only one wants: make it if it passes and
costs little; otherwise note it and say why not. Start a fresh round with new reviewers. Stop when every reviewer scores
8 or more and names nothing that got worse, or after three rounds on one change; then show Chris and let him decide.

## Keep it small

Fight scope creep. A round reviews the change, not the whole app. Anything new a reviewer raises outside the change
goes on a list for Chris, not into this change.

## Log

Add each round to the spec's "Design rounds" table. If the work ends in a PR, put this in its description:

```markdown
## Council review

| Change | Designer | Primary user | Taste |
| --- | --- | --- | --- |
| Deal ticket, round 1 | 7/10 | 8/10 | 6/10 |
| Deal ticket, round 2 | 8/10 | 9/10 | 8/10 |
```

If a reviewer gives no score, write `no score`. Never invent one.
