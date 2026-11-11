# Spec 013: Dark, with the lamp off

Status: prototype on branch `claude/day-planner-b00906` (one commit, so it can move to the overhaul branch on its own). Owner: Chris.
Replaces spec 011's dark mode ("pale paper with dark ink in dark mode").

## Why

Chris, on the signed-in app in dark mode: "current dark mode looks really bad, it should not be clashing like this… research better color palette application for dark."

What was wrong (every main state shot at 1440 by 900 and 375, dark):

- **Two worlds on one screen.** Tickets, the tape, sheets, cards and the room were pale paper (#D7DDD3) with dark ink on a near-black desk (#0F1412): 13.4:1 between a slab and the desk, so the paper glared. Under a sheet's scrim the pale tape turned to grey mush.
- **Two greens.** Neon mint (#6FD39F) on the desk (the running ring, links) and a deep green die (#0E7447) on the paper.
- **A broken card.** The weekly check-in sat in the pale-paper scope (dark ink) but has no paper of its own, so its question and answers were dark on dark (1.07:1): unreadable.
- **Mixed treatments.** The quick-deal door and the check-in were dark outlines while the cards beside them were pale slabs.

## Research

A designer on Claude Fable 5.2 read Apple's dark mode guidelines, Material's dark theme and its codelab, APCA's guidance and Linear's redesign notes, and checked current App Store screenshots (Linear, Session and others; Things, Flow, Opal and Forest only show light or marketing art). The `design:design-system` skill and the org's skill catalog had nothing on dark palettes. Principles taken:

1. Dark is not an inversion: dim backgrounds, bright foregrounds (Apple).
2. A pale panel glows in a dark room; soften it (Apple).
3. Depth is a small lightness step: higher surfaces are a little lighter (Apple base and elevated; Material's surface overlays).
4. Saturated colour vibrates on dark: use a lighter, duller accent, and little of it (Material).
5. No pure white text (Material; APCA caps large text near Lc 90).
6. Neutrals carry the screen; the accent is one swatch (Linear).

## The palette

The paper dims with the room, and the ticket stays the brightest surface by a clear small step (1.2:1 over the tape). Ink turns light everywhere, so nothing can vanish on the desk. One green, the light theme's hue lifted and dulled, is the stamp, the underline under a word you can change, and the running ring (green is where time is paid); the DEAL die is its deeper fill with light letters and a green inner rule.

| Token | Light (unchanged) | Dark (was) | Dark (now) |
| --- | --- | --- | --- |
| desk `--paper` | #EDEFE9 | #0F1412 | #111513 |
| secondary paper `--stub` | | #1E2421 / pale #C9D0C5 | #1E2420 |
| sheets `--sheet` | | #181E1B / pale #CDD4C9 | #252B27 |
| tickets, cards `--card` | #FBFCF9 | pale #D7DDD3 | #343C36, with a light top rim |
| tape `--tape` | #FFFFFF | pale #DFE4DB | #262C28 |
| ink `--ink` | #1B211D | #E6ECE7 / dark #161B18 on paper | #E2E7E0 |
| soft ink `--soft` | | #A3B0A7 / #46504A | #A4AFA6 |
| torn edge, perforation `--edge` | | #87968C / #5E6961 | #87938A |
| green `--deal` | #1E6A46 | mint #6FD39F / die #0E7447 | #63B48A |
| the DEAL die `--die` | the green | #0E7447, white letters | #327C58, letters #E2E7E0, inner rule #63B48A |
| small green words `--deal-ink` | #17583A | #6FD39F / #0B5C38 | #78C59C |
| selected choice `--sel` | | #23352B / #C2D3C5 | #2F4A3A, its words in ink |
| delete `--gone` | | #E0A08C / #84402E | #DE9480 |
| ring track | | nearly the desk | the desk with 10 % ink |
| dim behind a sheet `--scrim` | | rgba(4, 6, 5, .62) | rgba(8, 10, 9, .72) |

Contrast (WCAG ratio, measured): ink on the ticket 9.1:1, on the tape 11.4:1; soft ink on the ticket 5.0:1; green on the ticket 4.6:1; small green words on the tape 7.0:1; the die's letters on its fill 4.0:1 (large type, 2.75rem and up); the ticket over the tape 1.25:1 and over the desk 1.62:1, where the pale slab was 13.4:1.

## What changed in code

- `prototypes/quick-deal/index.html`: the two dark token blocks take the table above; the pale-paper override for `.ticket, .sheet, .tape, .bigones, .people, .weekask` is gone; the die reads `--die`, `--on-die` and `--die-rule` (light mode falls back to today's die); a selected choice's words use `--sel-ink` (ink in dark, green in light); the weekly check-in's three answers fit one row at 375 px.
- `.claude/skills/design-council/settled.md`: the dark-mode line now says this, by Chris's call.
- Light mode is unchanged.

## Design rounds

Council: product designer and primary user on Claude Opus 5.5, taste on Claude Fable 5.2, each with `settled.md`, fresh each round, before and after at 1440 by 900 and 375.

| Round | Designer | Primary user | Taste | Fixed after it (two or more agreed) |
| --- | --- | --- | --- | --- |
| d1 | 6.5/10 | 7/10 | 7/10 | All: "the clash is gone". The ticket the top step over the tape; a light top rim and stronger perforation; a deeper die with light letters; the ring's track lifted; the check-in on one row on a phone; a lighter green for small green words |
| d2 | 7.5/10 | 7.5/10 | 7.5/10 | The ticket clearly above the tape (1.2:1); a visible rim; a solid deeper die with a green inner rule; a darker dim behind sheets |
| d3 | 8/10 | 8/10 | 8/10 | Stopped: all three at 8, and the council's three-round cap. Made after it, as all three asked: the weekly check-in sits on a sheet with no outline; tickets on a sheet are paper with no drawn outline |

Shots: `013-shots/desk-before.png` and `desk-after.png` (home with the weekly question, and the done sheet), `phone-after.png`.

Open, for Chris (one reviewer each, or outside this change):
- The running ring's dark notch where the arc ends reads as a bite out of the ring now that the ring is duller (two reviewers; the notch is spec 011's "a paper notch, not a knob", so it's yours to call).
- Green links ("See room", "Keep the timer on top") use the stamp's green; one reviewer would set links in ink and keep green for stamps and time paid.
- Copy: "Keep going for 10 more minutes" says minutes where everything else says min; the done stub says "8 min" twice; the tape's running row reads "No. 0412, focus".
