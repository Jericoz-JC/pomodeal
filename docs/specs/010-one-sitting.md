# Spec 010: One ticket, one sitting

Status: building. Owner: Chris. Decision record: [ADR 0007](../decisions/0007-one-sitting.md).

## The problem

Chris, testing: with "Bigger than one sitting?" left unticked, "10 min of Reels, then 30 min of reading" should be Reels 10, read 30, done. Instead:

- `buildSession` quietly built 2 or 3 focus blocks with breaks between (spec 007 "Rounds"). Quick deals never said so; long ones said "and two more 30 min blocks if you want them".
- At the end of the first focus block the bonus sheet counted down "Take my break. Starts on its own in 30 seconds" and moved into a break nobody asked for.
- When the last block ended, the screen called `next`, core `advance` held on the last block, and the clock restarted it. There was no "done" anywhere.

## Council round 0 (the direction)

Three independent reviewers, no shared context, against Forest, Focusmate, Session, Opal, Tiimo and iOS Clock. Directions: A one ticket, one sitting; B keep 2–3 blocks but say so and ask at every block end; C a rounds token on the ticket.

| Reviewer | Pick | Why, in short |
| --- | --- | --- |
| Product designer | A | "The ticket is the contract." B is Session with auto-loop off; C front-loads a planning choice where bargaining brains overpromise. |
| Student, 11 PM | A | "If the deal turns out bigger than what I stamped, I'll never trust the stamp again." Wants the next ticket smaller, one tap, with "Done for now" beside it at the same size. |
| Accessibility | A | Predictable (3.2), removes the only time limit (2.2.1), fewest decisions. Found that the live region sits inside the inert app, so sheet-time announcements are silent. |

## The rule

**A deal is exactly its ticket**: the break you chose (if any), then one focus block, then done. `buildSession` builds one round. "Bigger than one sitting?" stays the way to make a multi-day big one; each of its sittings is one ticket too.

Nothing starts on its own. The only thing the clock does by itself is reach zero.

## The end of a deal

When the focus block reaches zero, the done sheet rises (a dialog, focus on its heading, never on a button):

- Heading: **"That was the deal."** (council r1: one statement, not "done" three times).
- The torn ticket: its stub stamped **Done** in green at full ink (not the grey "Used" of a break), holding only the minutes; the ticket says what was done, "8 min of reading BIO 180 ch. 7" (a big one keeps its title as typed), and describes the dialog.
- On a big one, the two notes as before (bookmark, and "Is History paper finished?" / "Finished Intro?"), with **nothing pre-picked**: the old pre-selected "Not yet" contradicted the heading.
- **Another round?** as a ticket you stamp in one tap: "5 min of Reels, then 12 min of BIO 180 ch. 7." Its name says what it starts ("Deal another round: …").
- **Done for now**, a full-size button.
- A small link, **10 more minutes of reading** (the bonus; once per sitting, never past the 75 min ceiling).

Escape means Done for now. The single-key shortcuts (D for the next round, S for Done for now) work only on a desk, where their keycaps are printed. Taking the next round is an ordinary new deal: its own Deal and Done on the tape.

### The next round's ticket

- Quick lengths step up one notch: 5 → 8 → 12 → 15 → 20, and 20 stays 20. Long ones (30, 45, 60) repeat. This is spec 001's ramp ("start small, grow"), now shown on a ticket you choose instead of hidden in the session.
- Its break is the break between rounds: 5 min after a quick deal, a quarter of a long block (8, 11, 15). It's the activity you chose; with none, "a 5 min break".
- The focus length is read from the session: the largest length on offer that fits the block (minutes added by trades or the bonus don't count).
- **Borrowed minutes come off this break** (floor 2 min): "Take them from a later break tonight" now means the next round's break, and the ticket says "5 borrowed minutes come off this break." What the break can't take, and everything when you're done for now, is cleared as before (`forgiven`).

## Smaller fixes in the same change

- The break-end sheet heading is "Time's up on Reels." The word "done" now belongs to the end of a deal.
- Under the dial on the focus block: "Then you're done." (was "Last block tonight.").
- The long-deal line "…and two more 30 min blocks if you want them" is gone: it described rounds that no longer exist.
- The block-end push for the last block: "BIO 180 ch. 7 is done. That was the deal."
- The screen-reader live region moves out of the part of the page that goes inert under a sheet. The done sheet announces nothing through it: focus on its heading says it.
- The bookmark hint is italic and soft, so it can't be read as a saved bookmark.
- The tape says a deal's length plainly ("15 min of focus"), not "Starts with…", which read as more to come.
- The countdown sheet ("Want to keep going?", "Starts on its own in 30 seconds", "More time to decide") is removed, with its timer, its pause logic and the reduced-motion difference in timing.
- `sessions.next` on the last block changes nothing (it used to restart it).

## Ledger

- New kind **`done`**: the deal ran its full time. Filed when the finished session is stopped (Done for now, or the next round replacing it), dated when the block ended, so a tap the next morning files it on the right night. Green "Done" stamp; not counted as another deal.
- `end_early` stays for a stop before the time is up.
- `forgiven` is only what the next break couldn't take.

## Out of scope

- Study first, break second, and whether the break should come first by default: Chris will research the flow after this ships.
- A rounds picker on the ticket (direction C), and grouping a night's stubs on the tape.
- "Skip the break, start reading" on the start screen (the student read it as "the only break"): part of the flow research.

## Design rounds

| Round | Who | Result | Changes |
| --- | --- | --- | --- |
| 0 | Designer, student, accessibility | All three picked A | This spec |
| 1 | Designer, student, accessibility, on the built screens (375 px light and dark, 1440 desktop; vs the old countdown sheet, Forest, Focusmate, Session, iOS Clock) | All better than the old sheet. Done sheet scores (hierarchy, type, contrast, consistency, one action, tone, delight): designer 7 6 8 7 7 9 7; student 7 7 8 6 8 9 6; accessibility 7 8 6 8 7 9 7 | Heading "That was the deal." and the ticket names what was done (all three: "done" said three times, the stub clipped "Reading BIO 18"); stub at full ink with just its minutes (contrast); tape "15 min of focus" (student: "Starts with" read as more to come); single-key shortcuts only on a desk (2.1.4: a stray key could start a round); the stamp keeps focus while it lands; no live announcement for the done sheet (aria-modal can drop or double it); bookmark hint italic and soft |

Open after r1, for Chris: the student called a borrowed-down 2 min break "a tease" and asked to repay by skipping the break instead (a negotiation rule change, spec 001); the designer finds the dashed done chips look empty (spec 008's ink chips); skipping the "finished?" question counts as not finished without saying so.
