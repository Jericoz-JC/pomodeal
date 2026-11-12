# 0006: Every deal reaches the ledger

Date: 2026-11-10 · Status: accepted

## Context

In production, `sessions` had rows but `ledger` was empty. The server filed a ledger row only for an ask (freebie, borrow, trade, override), the bonus, and `forgiven` minutes. Starting a deal (`sessions.start`, `tasks.create`, `tasks.startFromCard`, all through `startSession`) filed nothing. "Stopped for now", "Ended Reels early" and "Opened Instagram without a deal" were stubs the screen made in the browser and never sent. The tape's "now / Running" line came from the live session, so it disappeared when the session ended. On a reload the tape was rebuilt from the server's rows, so a student who made a deal on their phone found nothing there a few hours later.

Spec 001 already says every outcome becomes a ledger entry, and already names `end_early` and `skip`.

## Decision

Chris's call: log deals. The server files:

- `deal` when a session starts: the task (or the big one's title) and the focus length chosen. A deal that replaces a running session files the stop first.
- `end_early` when a session stops ("Stop for now", or a new deal replacing it): the focus minutes done in the running block (`focusMinutesDone`, the same minutes credited to a big one). On a big one, the label is its title, so the tape says which big one and how much was done.
- `skip` when a block is ended before its time ("Start reading early"): the block and the whole minutes it ran. `sessions.next` takes `early: true` for this; ordinary block ends leave it off. Nothing is filed if the block's time is already up by the server's clock.
- `forgiven` stays as it was and sits beside `end_early` when a stop clears borrowed minutes.

The entry builders (`dealEntry`, `endEarlyEntry`, `skipEntry`) are pure functions in `packages/core/src/negotiation.ts`, next to `applyTerm` and `endSession`. Each row is written once: `end` and `next` only act on a running session, and `next` only from the block it names, so two devices can't file the same stop or skip twice.

Ledger rows get an optional `taskId` when their session is on a big one. Deleting the big one clears it, the same way `sessions.taskId` is cleared.

Signed in, the screen no longer makes ledger stubs of its own: the tape shows only the server's rows, so nothing appears and then vanishes. The demo (no backend) files the same kinds locally with the same wording.

## Consequences

- The tape's deal count counts `deal` rows and asks. `end_early`, `skip` and `forgiven` are not deals: grey ink, not counted.
- "Opened Instagram without a deal" is only reachable in the demo (the intercept screen), so it stays a demo stub and is not filed.
- A deal made on another device, or before a reload, now shows on every device's tape.
- Rows from before this change stay as they are; there is nothing to backfill.
- `sessions.today` reads the 24 hours before a `now` the client sends. The client now subscribes again every hour and when the app comes back to the front, so a phone left open overnight doesn't keep yesterday's rows on the tape. Superseded by [ADR 0009](0009-study-day.md): the window was still 24 hours wide, so yesterday's rows stayed on the tape; it now reads from the start of the study day (4am local).
- "Studied" on the tape is still counted on the device and starts from 0 after a reload. Completed blocks aren't filed, so the server can't total it yet.
