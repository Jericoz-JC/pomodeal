# 0007: One ticket, one sitting

Date: 2026-11-10 · Status: accepted

## Context

Testing the beta, Chris made "10 min of Reels, then 30 min of reading" with "Bigger than one sitting?" unticked, and expected Reels, reading, done. Spec 007 had made every deal a session of 2 or 3 focus blocks with breaks between. Quick deals never said so, and at the end of a focus block a countdown sheet moved into the next break on its own after 30 seconds. When the last block ended the clock restarted it, so there was no end at all. Details and the council's round: [spec 010](../specs/010-one-sitting.md).

All three council reviewers (product designer, student at 11 PM, accessibility) picked "one ticket, one sitting" over keeping the blocks but asking at each end, and over a rounds choice on the ticket.

## Decision

- A deal is exactly its ticket: the break you chose (if any), then one focus block. `buildSession` builds one round.
- The end of the focus block is the end of the deal: a done sheet with the next round as a fresh ticket to stamp, Done for now, and 10 more minutes. Nothing starts on its own.
- The next round steps quick lengths up one notch (5 → 8 → 12 → 15 → 20) and repeats long ones, with the break between rounds. Chris chose this over repeating the same deal: it keeps spec 001's ramp, shown and chosen instead of hidden.
- Borrowed minutes come off the next deal's break (floor 2); what's left is cleared, as before.
- A deal that ran its full time is filed as `done`, dated when its block ended. A stop before then stays `end_early`.
- `sessions.next` on the last block changes nothing. The bonus is allowed on the last block, once, under the 75 min ceiling, and the server now checks that ceiling too.

## Consequences

- Supersedes spec 007's "Rounds" (2 or 3 focus blocks per session) and the matching line in [ADR 0003](0003-study-lengths.md). Lengths, long-block holds, break scaling, heads-up and halfway are unchanged.
- Sessions built before this ship can still be running with several blocks. They keep working: their breaks still end on the boundary sheet, and any focus block's end opens the done sheet.
- A big one's minutes for its last block are credited when the deal stops (Done for now, or the next round), not at the block's end.
- The countdown sheet, its timer and its pause logic are gone, which removes the app's only time limit (WCAG 2.2.1).
- One new ledger kind, `done`, in the privacy inventory. No new field.
- Still open, for Chris's flow research: study first and the break second, whether the break should come first by default, and "Skip the break, start reading" on the start screen.
