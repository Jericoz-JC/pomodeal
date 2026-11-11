# 011: One paper, one voice

Status: prototype on branch `claude/ui-overhaul-0c7137`. Not merged.

## Why

Chris, looking at the running dial and the new done sheet (spec 010) at 375 px: "make UI prettier, there are some inconsistencies", "I don't like the sharp triangle edges", "need to overhaul UI look a lot; a lot of the core app is good". The flows, the copy and the ticket, stamp and deal idea stay. This round is the look only: no negotiation rules, Convex code or copy meaning change.

## Audit (before)

Every state in `prototypes/shoot.mjs` at 375 px light and dark, and at 1440 by 900.

**Edges.** Four different torn edges, all sharp: a 6 px sawtooth on the right of every ticket, stub, term, room stub, big-one card and ministub (`--zig`); a 16 px sawtooth across the top of every sheet; the same across the top and bottom of desktop sheets; a 14 px sawtooth at the foot of the tape. The landing page shares `--zig`.

**Type.** Archivo is set at eleven widths (70, 72, 74, 75, 76, 78, 80, 82, 85, 86, 88 %) and six weights, chosen per rule. On the done sheet the kept ticket's "8 min of reading BIO 180 ch. 7" is Archivo condensed at 24 px while the next round's "5 min of Reels, then 12 min of BIO 180 ch. 7." is bold Atkinson at 17 px: the same kind of line in two voices, side by side. Term tickets lead in bold Atkinson; every other ticket is titled in Archivo. Text links are Atkinson, buttons Archivo. Digits in Atkinson get its slashed zero ("10 more minutes of reading") wherever a string skips `N()`. The dial's number is a third width again (70 %).

**Actions.** Four looks for "press this": the stamp (double green rule), a full-width outline in grey (`.secondary`), an underlined Atkinson link, a dashed box (`.quickrow`, `.pushask`), plus a red outline for Delete. Choices have three more: grey filled pills (lengths, the weekly question), dashed ink boxes (sizes, kinds, "finished?"), and the printed checkbox.

**Paper.** The kept ticket's stub on the done sheet is a separate grey card at 72 % opacity, tilted and pushed off the ticket, so it reads as a second, lesser object. "Reading" is capitalised mid-sentence when a title starts with a capital, and `lower()` would turn "BIO midterm" into "bIO midterm".

## The plan

### Edge: torn on the perforation

A ticket is torn from a book along a row of punched holes, so a torn edge shows the holes it was torn through: a row of round half-holes. Round, small, no points. One edge, used everywhere paper was torn: the right side of every ticket and stub, both facing sides of a torn-off stub, the top of every sheet (top and bottom on a desk), the foot of the tape, the landing page. Tickets tear along 3 px holes every 10 px; sheets and the tape, being bigger paper, along 5 px holes every 15 px (round 1: at ticket size a sheet's edge read as a dashed border). The perforation printed inside a ticket uses the ticket pitch, so the inside and the edge read as one thing.

### Type: two widths, one scale

Archivo for what you glance at or press; Atkinson Hyperlegible for what you read. Archivo comes in two widths only:

| Role | Face | Size (phone) | Used for |
| --- | --- | --- | --- |
| Numeral | Archivo 76 %, 800 | dial scales with the wheel; 34 px tallies | the dial, tallies, a big one's tab, the room's minutes |
| Title XL | Archivo 76 %, 800 | 34 px | screen headings, the running ticket's name |
| Title L | Archivo 76 %, 760 | 24 px | sheet headings, the tape heading |
| Title M | Archivo 76 %, 760 | 21 px | anything printed as a ticket's name: the kept ticket, the next round, a term's offer, ledger stubs, cards, "Another round?" |
| Action | Archivo 86 %, 700 | 19 px buttons, 17 px chips, 16 px links | every button, link, chip and choice |
| Meta | Archivo 86 %, 600 | 15 px | serials, a length on a stub |
| Text | Atkinson 400 / 700 | 17 px, 15 px small, 14 px captions | sentences |

Digits inside Atkinson text are always set as Archivo numerals (`.num`), checked by script across every state.

### Actions: three levels, same order on every sheet

1. **Stamp**: commits you. The green double rule, on a ticket's stub or on its own.
2. **Plain button**: the other way out ("Done for now", "Never mind", "Start reading instead"). A paper button: the ticket's card fill, a 1.5 px ink hairline (3.9:1), the ticket's 6 px corners, words in the action face. Quieter than a stamp, plainly a button (round 3: a grey slab read as disabled). Delete is this button in the delete colour.
3. **Link**: the quiet way out ("10 more minutes of reading", "Stop for now", "No terms. I need this."). A sentence in Atkinson, soft ink, a plain 1 px underline in its own colour; its digits are Archivo numerals like any sentence's. (Round 1 tried links in the action face; all three reviewers found them louder than the stamp.)

### Choices: one printed box

Every choice (lengths, sizes, kinds, the weekly question, "finished?", the ask's suggestions) is the same printed box: a solid hairline at rest, inked with the stamp's double green rule and a tick when picked. No grey pills, no dashed boxes for choices. Dashed means something not written yet: a stamp that can't be pressed yet, and "Or make a quick deal", an empty ticket you open.

### Paper: one ticket, one stub

A kept or used stub is the same paper as its ticket, torn off a few pixels to the left on the same baseline with a slight tilt, its torn side showing the half-holes. Done is full ink; Used (a break's stub) is soft. Each ticket prints its name in Title M and explains itself in Text under it.

### The room

One roster: the room is a single sheet of ticket paper with a hairline between people, not a stack of torn stubs.

### Colour

One approved green on grey-green paper, focus solid, break hatched. Dark mode (round 1): ticket paper is a clear step lighter and a little warmer than the ground (#36403B on #18201C), the green is calmer and inkier (#7CC29D), edges are lighter (#87968C, 3.5:1 on paper). The wheel's track is the paper inked 17 % and tinted green, so a break's arc stays at 3:1 or more on it in both themes.

### Desk

A decision sheet is sized to what it says and fed up from the bottom of the stage, torn across its top, with the dimmed running ticket above it, as on a phone. Keyboard keys are printed inside the control they press, never across its corner.

### Copy

Chris, during the round: "a lot of the messaging can be more cleared up". A pass over every visible line in every state (248 unique lines, dumped by script) with `design:ux-copy`. Clarity only: no rule and no meaning changes.

| Was | Now | Why |
| --- | --- | --- |
| Bigger than one sitting? | Needs more than one sitting? | It asks about the task, not the ticket |
| First payment on History paper: 15 min. | First sitting on History paper: 15 min. | "Payment" was a metaphor to decode; "sitting" is the word the rest of the app uses |
| Break you chose | Your break | Pairs with "Focus" |
| Take them from my next round's break. If I'm done for now, they're cleared. | Take them from my next break. If I stop after this, I don't owe them. | "Cleared" didn't say what happens to you |
| 5 borrowed minutes come off your next round's break. If you're done for now, they're cleared. | You borrowed 5 minutes. They come off your next break, and if you stop here you don't owe them. | Same |
| 10 more minutes of reading | Keep going for 10 more minutes | Says what the link does; the tape already says "Kept going for 10 more" |
| Turn on taps at block ends | Get a notification when a block ends | "Taps" was our word, not the phone's |
| Your Intercept shortcut opened this. | Your Instagram shortcut opened this. | "Intercept" is a name nobody has seen |
| 45 min in / 2 stamped | 45 min done so far / 2 pieces done | Progress in plain words |
| Picking her next block / Checked in stuck at 10:38pm | Picking a next block / Checked in at 10:38pm: stuck | No guessed pronouns; the check-in reads in order |
| Clears the bookmark and your gut size / bookmark and all | Clears your next step and your size guess / notes and all | "Bookmark" and "gut size" are internal names |
| Ledger tag +Focus | Traded | A word, like every other tag |
| Not this one | Make a quick deal instead | Says where it goes |
| Press DEAL to start. Tap an underlined part to change it. | Tap an underlined word to change it, then press DEAL. | In the order you do it |
| Skip the break, start reading | Skip Reels, start reading now | Before any break has started, "the break" had nothing to point at (council r3) |
| Ask for 5 more minutes | Ask for 5 more minutes of Reels | Says more of what (council r3) |
| No terms. I need this. | Just give me the 5 minutes | Both r3 reviewers; says what it does |
| Your gut said 2h. | You guessed 2h. | Council r3 |
| Keep the wheel on top | Keep the timer on top | "Wheel" is our word for it (council r3) |

### Checked against the banned looks

No indigo, purple or yellow. No all-caps eyebrow labels (DEAL, Done and Used are stamp words, not labels). No `·` separators. No monospace. No identical rounded cards: tickets are torn paper with square torn sides; stamps have a 9 px radius that nothing else uses; paper buttons and choices share the tickets' 6 px corners.

## Design rounds

Independent reviewers, read-only, no shared context, never told a target: a product designer and an accessibility reviewer on Opus 5.5, an art director for taste on Fable 5.2. Fresh reviewers each round. References: Forest, Focusmate, Opal, Things 3, Arc. Scores are hierarchy / typography / color & contrast / consistency / one action / tone / delight.

| Round | Reviewer | Phone (before) | Phone (after) | Desktop (after) | What they found |
| --- | --- | --- | --- | --- | --- |
| r1 | Designer | 6 7 7 5 6 8 6 | 6 7 7 6 5 8 6 | 5 6 7 5 5 8 5 | "A careful polish, not an overhaul." Plain buttons and links as heavy as the stamp; quick deal became the loudest thing on the home screen; desktop sheets let the ticket peek; key hints on corners |
| r1 | Accessibility | 7 6 7 6 7 8 7 | 7 7 7 7 7 8 7 | 6 6 7 6 6 8 6 | Dark break arc 2.80:1 on its track; green focus ring on green stamps; dark ticket edge 3.01:1; ledger tags hardest text in the app; narrow links harder to read |
| r1 | Taste (distinct 7) | 6 6 6 5 7 8 7 | 7 7 6 7 7 8 7 | 5 6 6 6 6 7 5 | Dark paper murky, mint reads neon; sheet scallop too shallow; ledger micro-stamps; room rows still a card kit |
| r2 | Designer | 6 6 7 5 7 8 6 | 7 8 7 6 7 9 7 | 5 7 6 5 6 8 5 | Full-height desktop sheets read as empty slabs and hide the header; "Done for now" outweighs the next-round ticket; ticket right edges look clipped at 375 px; key hints out of sight |
| r2 | Accessibility | 6 6 7 6 7 8 6 | 7 7 7 7 7 8 7 | 6 7 6 6 6 8 6 | Dark stamped term text 4.25:1; dark focus arc 2.93:1 on its track; dark sheet has no edge; hidden key hints can't be found; small soft hints |
| r2 | Taste (distinct 7) | 6 6 6 5 7 8 6 | 7 8 7 7 7 9 7 | 5 7 6 5 6 8 5 | Desktop sheets "a modal that lost its layout"; offer tickets look like form fields beside the paper; dark accent too pastel; the black slot looks imported |
| r3 | Designer | 6 6 7 5 6 9 6 | 7 7 8 6 7 9 7 | 5 5 7 6 6 9 6 | The grey "Done for now" slab reads as disabled; still five action looks; desktop is a phone column in a 1440 frame; Orgo row has no container; the ledger peeks in under a heavy bar |
| r3 | Accessibility | 7 7 6 6 7 9 7 | 8 8 7 8 7 9 8 | 6 6 6 7 6 9 7 | Grey slabs 1.14:1 on the sheet; faded key badges 3.4–3.6:1; pressable outlines at --edge-half 2.0–2.2:1; split tear lines are drag-only (2.5.7); an underline means both "editable" and "link" |
| r3 | Taste (distinct 7) | 7 7 7 5 7 8 7 | 8 7 7 6 8 9 8 | 6 6 7 5 7 8 6 | Grey slabs "belong to a different app"; outlined sheet tickets a second ticket language; dark paper still one slab; desktop start ticket floats |

**After r1:** links back to Atkinson with a plain underline; plain buttons a hairline; "Or make a quick deal" an unwritten dashed ticket again; key hints only on hover and focus; an ink focus ring on stamps; dark paper lighter and warmer, a calmer green, lighter edges; a tinted wheel track; ledger tags single-ruled, wider and nearly level; the room one roster; a deeper sheet edge; desktop sheets full height (reverted after r2).

**After r2:** desktop sheets sized to their content and fed up from the bottom of the stage, torn on top only, with the running ticket visible above; tickets you press are outlined all the way round their torn shape, with no inset rule; "Done for now" a quiet filled slab with no outline; key hints printed at 75 % inside the control; the dark track takes 8 % ink so both arcs stay at 3:1; stamped term text in ink; the start hint, serials and room captions a size up; room dividers visible in dark; the slot ink instead of black; dark sheets a step lighter.

**After r3 (not re-scored):** the plain way out is a paper button (card fill, a 1.5 px ink hairline, 6 px corners), the same on every sheet; pressable tickets keep a solid 3:1 outline round their torn shape (accessibility over taste: taste wanted none); the kept and used tickets on a sheet are plain paper with the paper shadow; key badges at full strength, edged in ink; the tape's slot a mid-grey slit; the r3 copy lines in the Copy table.

### Where it stopped

Three rounds, nine reviews. Phone went from about 6 to 7–8 in every reviewer's eyes, with tone at 9; every reviewer named the sawtooth gone and the done sheet fixed as clear wins. Desktop moved less (5 to 6), and all three say why: the stage is still a phone column beside the tape.

### Open, for Chris

- **Desktop layout.** A wider stage (a 520–560 px column) and larger body type at 1024 px and up. A layout change, not a look change, so left for its own round.
- **Split tear lines are drag-only** (WCAG 2.5.7). Keyboard arrows work; a tap-only way (tap the minutes for − and +) is an interaction change.
- **One underline, two meanings.** Words you can change on the deal and links share the underline; a dashed green underline for editable words was suggested.
- **Cards.** The second big task is a bare row beside the first one's full ticket; two reviewers want both as tickets.
- **Ledger tags "Deal" and "Done"** read as synonyms to a newcomer.
- **Stamps vs plain buttons in the same slot.** "Start reading" (a stamp) and "Done for now" (a paper button) sit in the same place on sibling sheets; that is the rule (a stamp commits, a paper button declines), but two reviewers read it as two dialects.

### After r3, with Chris

Chris: "why are we not taking the review seriously, especially for desktop". The open items above were fixed instead of parked:

- **Desktop.** The app is 1360 px wide (was 1200), the stage up to 860 px, and type is a step larger (17 px base) on desks 1200 px and up. The deal you are about to stamp is a landscape ticket at a desk: the sentence on the left, the DEAL stub on the right past a vertical perforation, the same build as the terms.
- **Split** (WCAG 2.5.7): − and + beside each piece's minutes, 5 minutes a press, with the same limits as the keyboard. Dragging still works.
- **Editable words vs links:** the words you can change on the deal have a dashed green underline; links keep a plain soft one.
- **Cards:** every waiting big one is a ticket; the second and third are slim tickets under the first.
- **Ledger:** the tag for a deal you made reads "Started", so it no longer reads as a synonym of "Done".

Chris also ruled on instructions and key hints:

- **No lines that explain basic UI.** Removed: "Tap an underlined word to change it, then press DEAL.", the split's "Slide a dotted line…", "One tap." on the room check-in, "Change any of them before you save." after suggested pieces, the empty list's "Tick “Needs more than one sitting?”…", and the landing's "Pick what you're on, then press DEAL." (now "What are you on right now?"). Kept: the iPhone install steps, which describe Safari's hidden menu, not this app.
- **No key badges** on controls. The shortcuts still work and are announced through `aria-keyshortcuts`.
- A try at printing the deal as two line items ("Your break / 10 min / Reels", "Then / 8 min / BIO 180 ch. 7") was rejected; the sentence stays.

### Council c4 to c6 (the design-council loop)

From here every change went to the council in small rounds (`.claude/skills/design-council`, adapted from tstack's `council`). One score out of 10 per reviewer; fixes two or more agreed on were made before the next round; three rounds on one change, then the founder decides.

| Change | Designer | Accessibility | Taste | Fixed after it |
| --- | --- | --- | --- | --- |
| c4: desk layout, sentence without instructions, card stack, split steppers, ledger tag | 7/10 | 7/10 | 7/10 | quieter split row; slim cards get the Start stamp; untagged deal rows; solid green underline; "then the first 15 min of History paper."; DEAL level with the sentence on desk |
| c5: those fixes | 7/10 | 7.5/10 | 7/10 | ledger tag under the time; stacked mini stamp; sizes on one line; sticky stub shadow and scroll padding; heavier −/+ with limits; "2h 5 min"; big ones keep capitals |
| c6: those fixes | 7/10 | 7.5/10 | 6.5/10 | first move asked before size and kind; slim stamps lead on the left, 14 px words; DEAL centred and larger on desk; desk start centred beside the tape; tag column in em; "building something", "The first one's free", "Kept going 10 more minutes" |

Not taken, with why: boxes round − and + (accessibility, c6) after two reviewers asked for bare glyphs in c5; a grip on the tear line (designer, c6); "Needs more than one sitting" as a statement (taste); duplicate piece names spoken with their position (accessibility), left for the split's own round.

### Chris on the council (after c6)

Chris: the reviewers felt like they were "making features in isolation", and the split's − and + went against how the app (and most apps) picks time. He is the primary user and doesn't want accessibility to drive design.

- The split's − and + steppers are removed: they were added only for WCAG 2.5.7 and undid round 7's ruling ("No plus and minus steppers"). The tear line's grip is back.
- The council's accessibility reviewer is replaced by **the primary user**: a capable student who studies with Pomodeal nightly.
- Reviewers now get `.claude/skills/design-council/settled.md`, Chris's decisions. Every proposed fix is checked against it, and against how the app already does the same job, before it is built. Anything that re-opens a decision goes to Chris as a question.
