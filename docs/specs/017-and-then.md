# Spec 017: And then

Status: building on branch `claude/friendly-johnson-t4ny5v`. Owner: Chris. Decision record: [ADR 0010](../decisions/0010-tonight-is-one-line.md).
Replaces the flow of spec 012 (tonight in a line) and the home lines of spec 015 (the standing ticket). Their look, parser, sizes, tape rows, roll and jobs sheet stay.

## Why

Chris, Nov 13: "Rework the general UI/UX flow for adding and removing one task or multiple tasks. There are multiple stale buttons and illogical reasonings… a mismatch of user experience… if they cancel a task and want to add one task or many tasks. There are two separate ways to do multiple tasks and broken screens in between. Plus desktop."

Four reviewers walked every add, remove and cancel path on a phone and a desk and read the code (two on Claude Opus 5.5, two on Claude Fable 5.2). The cause: Pomodeal held three separate kinds of "something to do" (the quick deal, big ones, tonight), each with its own way in, its own word for taking a thing out, its own lengths and its own meaning of Stop. They shared one ticket by a fixed order (tonight, then a big one, then the quick deal), not by what the student pressed last. What that broke:

- Tonight could not be cancelled or emptied. "Change tonight" then "Just one deal" silently un-printed a night; in live mode the same presses restored it.
- Printing again after a finished sitting wiped it and its Done stamp.
- The same big one read two ways: seated ("30 min of History paper.", name opens its jobs) and loaded from tonight ("10 min of Reels, then 30 min of History paper.", dead name, no lines, no Quick deal, no All big tasks).
- "Quick deal" hid the other big ones. "Just one deal", "Quick deal" and "Make a quick deal instead" were three labels with three behaviours; the third was unreachable.
- "Stop for now" used tonight's sitting up. "Skip Reels" removed the break from every later deal.
- A break button named the wrong task ("Start reading early" before History paper).
- On a desk the roll drew a night nobody planned, with a total and a finishing time, at lengths that disagreed with the ticket; it covered controls under the ticket; it stamped Done on a stopped length; "Plan tonight" was missing and the way in was un-underlined caption text.

Chris picked direction A of two mocked flows ("lgtm do A") and approved the five decisions under "Decided".

## The rule

**Tonight is one line, and the ticket always holds its first item.** There is no second ticket, no draft, no printing, no mode.

The ticket carries one paragraph:

1. **The deal**, large, as today: "10 min of Reels, then 8 min of BIO 180 ch. 7." or, for a big one, "30 min of History paper." with its "Start with:" line.
2. **"After that, …"** for the rest of tonight, in tonight's smaller size, only when there is a rest: "After that, 45 min of Orgo problem set 4 and 20 min of BIO 180 ch. 7."
3. **The close**: "And you're done." With a rest it carries the finishing time: "And you're done around **9:42**pm." (It was "Then you're done"; on a plain deal that said "then" twice. Chris, Nov 14.)

`you're done` is underlined like every word you can change. It is the open end: where one thing or six are added.

## The flow

### Adding

Press **you're done**. The cursor waits after "After that," and the names you already use lie under it as words (open big ones, then today's names; never one already in the line). Type names with commas between them, press Enter, paste a list, or press a name. Every parsing rule of spec 012 section 2 is unchanged. Each item lands as "45 min of Orgo problem set 4" and the cursor waits for the next. Pressing anywhere else, or Escape, closes the cursor. Up to 6 items in the line, the ticket's included; at six, "you're done" is plain text.

The first thing added makes the ticket's own deal the line's first item. Nothing else changes on the ticket.

### Changing

- **A length** opens the length choices. On the ticket's deal: the deal's lengths, as today. In "After that": the same lengths, then past a hairline 2 × 30 min, 2 × 45 min, 3 × 30 min, 3 × 45 min.
- **A name** opens one field, the same everywhere: type over it, with **OK** (not "Done", which sat right above "you're done"). Under the field:
  - on the ticket's own name, the names you already use as words (pressing one puts it on the ticket; if it was later in the line it moves to the front) and, with the quiet ways under them, **All big tasks**, which opens the All big tasks sheet (rows without Start stamps; a row takes the ticket; set-aside ones keep "Bring it back");
  - **Not tonight** (when the line holds more than one thing): the item leaves the line. A big one is back among the names; nothing about it is lost;
  - **Pieces and days** (a big one): its jobs sheet, unchanged (Split into pieces, Spread over the days left, Start fresh on this one, Set aside, Delete);
  - **Do this first** (not on the first item).
  These are one row of quiet links, in this order everywhere.
- Typing a new name over a big one's makes a plain deal; the big one is untouched and back among the names.
- **Just this one**, a link under the ticket, shown only while there is an "After that": the rest leaves the line. No confirm; every name is one press away at the open end.

Leaving is one ladder: Not tonight (off the line), Set aside (off the names, kept in All big tasks), Delete (gone).

### Starting, stopping, finishing

- **DEAL** is the only stamp on home. It starts the ticket's deal.
- **While a block runs** on a phone, the close sits under the dial: "After that, Orgo problem set 4 and BIO 180 ch. 7. And you're done around 9:42pm." or "And you're done." Pressing "you're done" raises a paper sheet with the same paragraph and its cursor, so the line can be added to or changed without stopping. The running item can't be taken out. On a desk the same line sits beside the dial under the name, without the time: the roll says when.
- **Stop for now** leaves the item at the front of the line. The tape prints Stopped with the minutes, as today. It is offered during a break too.
- **The done sheet** is unchanged: "Next up?" offers the next item with the break between rounds; "Another round?" when the line is finished. A finished sitting leaves the sentence and stays on the tape and the roll.
- **Skip Reels, start reading now** skips this deal's break only.
- A big one at the front of the line reads the way a seated one does: no break until "Take a break first".
- Every break button names the block that comes next in the running deal.

### What home looks like

| State | The ticket |
| --- | --- |
| One plain deal | "10 min of Reels, then 8 min of BIO 180 ch. 7." / "And you're done." Under it: "Needs more than one sitting?" and "Skip Reels, start reading now" |
| One big one | "30 min of History paper." / "Start with: …" / "And you're done." Under it: "Take a break first" |
| Several | the deal, "After that, …", the strip, "And you're done around 9:42pm." Under it: "Just this one" (after "Take a break first" when a big one is on the ticket) |
| Mid-night | the next deal, what's left after it, the strip with paid lengths green |
| Night finished | back to one deal |

The break links ("Skip Reels, start reading now", "Take a break first") and "Just this one" share one row of quiet links under the ticket; "Just this one" stays there while a word is being changed.

"Needs more than one sitting?" shows only while tonight is just the ticket and the ticket holds a plain name. It works as today (spec 008). Its choices never slide under the DEAL stub.

### The desk

- The same ticket, with the paragraph as running text. No big-one lines, no Start stamps.
- **The roll** shows only while tonight holds more than the ticket. It mirrors the paragraph: pressing a length opens that item's choices on the ticket; dragging reorders; its dashed tail is the open end. A finished length keeps Done; a stopped one is not stamped. It never shows a total or a finishing time for names nobody chose, and it never covers a control. The finishing time is said once: at home by the ticket (the roll keeps the focus total), while a block runs by the roll.
- A list pasted on home lands at the open end.

## Decided (Chris, Nov 13)

1. **Print goes.** Writing the line commits to nothing; DEAL is the only commitment on home.
2. **Stop for now keeps your place** (was: uses the sitting up, spec 012 section 6).
3. **The desk roll** shows only while tonight holds more than the ticket, and never invents a total.
4. **The words:** "Not tonight" takes one out, "Just this one" clears the rest, "Pieces and days" opens a big one's jobs.
5. **The big-one lines and Start stamps of spec 015 leave home**, on phone and desk. Starting a different big one is its name, a pick, DEAL.

## What goes away

Plan tonight, Change tonight, the "Tonight," ticket, Print, Just one deal, Quick deal, Make a quick deal instead, the big-one lines and their Start stamps, All big tasks as a home link, the roll's "Tonight," lead and its home suggestions, "Take it out" (now "Not tonight"), the fit line as its own row.

## What stays

The deal ticket and DEAL; spec 012's parser, name matching, paste and sizes; the strip; the phone tape's rows above "now"; the roll and its dragging; the done sheet; "Needs more than one sitting?"; the jobs sheet, Split and Spread; the room row.

## Words

| Thing | In the UI |
| --- | --- |
| The open end | you're done |
| The rest of tonight | After that, … |
| Take one out | Not tonight |
| Clear the rest | Just this one |
| A big one's jobs | Pieces and days |
| The full list of big ones | All big tasks (the sheet's own title) |

Never: "plan", "schedule", "agenda", "to-do", "queue", "overdue", "missed", "behind". No line explains the UI.

## Rules and storage

**`packages/core/src/night.ts`** (test-first):

- `nightSizeOk(sittings, minutes)`: one sitting of any length in `FOCUS_LENGTHS` (the ticket's deal can be 5, 8, 12 or 60), or one of the four multi-sitting sizes. `nightProblem` uses it. `NIGHT_SIZES` and `snapNightSize` are unchanged: they are what a typed size snaps to.

**Convex:**

- `nights.print` is the write for every change to the line. The client sends the whole line; with `keepTaken` the sittings already done stay done and must still lead the line unchanged (`NIGHT_CHANGED` otherwise). `night_printed` is logged once, on the day's first write, with the item count.
- `nights.clear({ dayKey })` deletes the day's row. Missing before: a night could not be emptied.
- `sessions` gains `fromNight` (the index of the sitting the deal took) and `nightDay`. When a session that took a sitting stops early, the same transaction gives the sitting back, if it is still the last one taken. A deal that ran its full time keeps it.
- `sessions.start` and `tasks.startFromCard` keep `fromNight`.

**Privacy inventory:** `sessions.fromNight` and `sessions.nightDay` (which sitting of which day's line a deal took; no text).

**The bridge (`apps/web/src/main.ts`):** `printNight(items, keepTaken)` on each change, `clearNight()`, `start` / `startFromCard` with `fromNight` as today. The night the screens show in live mode is the server's.

## Edge cases

| Case | What happens |
| --- | --- |
| The line shrinks to the ticket alone, nothing done yet | The night is cleared; home is one deal |
| Not tonight on the ticket's item | The next item moves up onto the ticket |
| The ticket's name retyped while there is an "After that" | The first item is renamed; the rest stays |
| A big one deleted while in the line | Its item stays by its title, unlinked (spec 006) |
| A big one set aside while in the line | Its sittings still to come leave the line, as with Not tonight; a running one is untouched |
| Not tonight on a split item | Every sitting of it still to come leaves, whatever lengths they now have |
| The line fills while typing or pasting | Nothing is dropped. The cursor stays, and what doesn't fit stays in it as plain, quiet words, not things; no key there can press DEAL. Pressed elsewhere, the words wait at the end of the paragraph, and a press puts them back in the cursor. They land when there is room and they are entered, and go only when deleted or on Escape. Not stored |
| The line fills by pressing a name | The cursor closes and nothing takes the keyboard |
| Six items | "you're done" is plain text |
| A two-sitting item at the front | The ticket holds its first sitting; "After that" starts "30 min more of History paper," |
| Tonight changed on another device | The line follows the server's; an edit that loses the race is dropped and the screen shows the server's line |
| The study day turns | The line is gone without a word, as in spec 012 section 7 |

## Out of scope

Dragging lengths off the roll to remove them; resizing by dragging tear lines on the roll; planning another day; clock start times for sittings; AI in this flow; one shared length picker beyond what is listed above.

## Design rounds

Council: product designer and primary user on Claude Opus 5.5, art director on Claude Fable 5.2, each with `settled.md`, fresh each round.

### Rounds 1 to 3: the built flow (Nov 13 and 14)

| Round | Designer | Primary user | Taste |
| --- | --- | --- | --- |
| 1, first build | 7/10 | 7.5/10 | 7/10 |
| 2, after fix pass 1 | 7.5/10 | 8/10 | 7.5/10 |
| 3, after fix pass 2 | 8/10 | 8/10 | 7.5/10 |

Two acceptance walks (phone and desk, Claude Opus 5.5) ran every add, remove and cancel path against the first build. Neither found a leftover of the old flow or a control under the roll. They found four bugs and a handful of smaller ones, all fixed in pass 1: the line filling handed the keyboard to DEAL; Not tonight left half of a split item; a length choice sat under the stub at 1024 wide; a finished night left a stale task on the ticket; the break between rounds was headed "Your pick"; typed names lost their capitals.

Built from the council:

- Round 1: the finishing time is part of the closing sentence on a phone (it was a 44 px figure that fought the deal); "Take a break first" moved off the ticket to the row of quiet links under it, with "Just this one", which stays while a word is being changed; the open end shows a place to write; the desk stamp stays level with the deal and the roll fits at 1440 by 900.
- Round 2: the names under a field are one wrapping row; the quiet ways keep one order; "All of them" became "All big tasks" (two art directors read it as "add all of them"); the rest's underlines are a step lighter than the deal's; the close under the dial is set like the ticket's; on a desk six things run on as a sentence and the roll's time is a caption while the ticket says it.
- Round 3: the desk's running line says what comes after ("Then you're done." alone read as finishing after this block); the quiet ways fit one row at 375 px; text typed at the open end drops to its own line and can't run off the paper.

Not built, and why:

- Keeping both finishing times on a desk, "Done" on the field and the doubled "then" were left for Chris, who settled all three on Nov 14 (below).
- Keeping each "N min of Name" unbreakable on a desk (round 3) reverses round 2's fix (one thing per line read as a list). Reviewers were trading it back and forth; left as running text.
- Hiding the strip at five things or more; an undo line after "Just this one" (every name is one press away at the open end); a larger finishing time (round 1 asked for it smaller).

Stopped after three rounds, as the council's rules say, and shown to Chris.

### Chris, Nov 14

After seeing the built screens Chris ruled on the four open points:

1. **One finishing time on a desk.** At home the ticket's sentence says it and the roll's header keeps only the focus total; while a block runs the roll says it.
2. **The field's button is "OK".**
3. **The close is "And you're done."** Three reviewers had flagged "…, then 8 min of BIO 180 ch. 7. Then you're done."
4. **No silent drops past six** (the edge case above).

### Round 0: diagnosis and two directions

Phone walk and desk walk (Opus 5.5), model audit and three storyboarded directions (Fable 5.2). All four proposed the same core (one line, the ticket holds its front, one place to add, DEAL the only stamp). Two directions were mocked from the prototype's own parts at 375 and 1440 by 900:

| Direction | The rest of tonight | Other big ones |
| --- | --- | --- |
| A, "And then" | on the ticket, ending "Then you're done" | words at the open end |
| B, "The line" | a "Then …" sentence under a one-sentence ticket | lines with Start stamps, as offers |

Chris picked A. B kept the big-one lines beside the new sentence and still read as two lists. Dropped earlier, on paper: "In pieces" (tonight as torn lengths under the ticket: rows, which `settled.md` rules out, and dragging on a phone) and "The standing offer" (every open name on the ticket under "Also open:": a backlog on the hero object).
