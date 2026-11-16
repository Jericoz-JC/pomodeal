# 0011: One stub per sitting, one way to pick a length, account pages as a sheet

Date: 2026-11-16. Status: built on a branch for Chris, who asked for all three; not yet merged.

## Context

Chris reported three things from a day of real use (Nov 16):

- **The tape repeated itself.** The ledger keeps one row when a deal starts (`deal`) and another when it ends (`done`, or `end_early` for Stop for now), which is right for the server (ADR 0006). The tape drew every row as its own stub, so a 45 min sitting showed twice, "10:57am, 45 min of focus" and "11:42am, 45 min of focus", and the running deal showed as "now" and again as its start. "Studied" was counted only in the page's memory as blocks ended, so it read 0 min after a reload although the sittings were saved.
- **Two ways to pick a length.** With "Needs more than one sitting?" ticked, the break opened the usual choices, but the first sitting's length was a word that switched between 15 and 30 (spec 008's first payment). Every other length in the app is picked from the same eight.
- **Account pages had one way out.** Invite friends and Sign-ups were full pages that covered the app, left only by "Back to Pomodeal".

## Decision

- **A sitting is one stub, from its start to its end.** The tape pairs a `deal` row with the row that closed it, by session: "10:57am / to 11:42am". The running deal is the one live stub: "2:12pm / to now", with "now" in the paid-time green, and "Time's up" in its place once the time is up. A sitting stopped early says so in its line ("Stopped after 41 min"; "Stopped before the focus" when no focus was done) and has no tag. Asks (Free, Borrowed, Traded, Bonus) and a block ended early stay rows of their own. Nothing changes on the server.
- **The span is the whole sitting**, break included, because that is what "start to end" means. "9:05pm to 9:24pm, 8 min of focus" is correct: the break is inside it.
- **Live, "Studied" is the server's**: the minutes of every sitting closed today. The demo keeps its own count.
- **A big one's first sitting picks its length like any deal**: the same eight choices. It starts at 15 when the deal's own length is shorter, as before.
- **Invite friends and Sign-ups are a sheet over the app**, from the bottom on a phone and in the middle on a desk, like the app's own sheets (`--sheet`, `--scrim`, 20 px corners). A press on the dimmed app, Escape, or the quiet "Close" puts it away. The sheet is never taller than the screen; a long list of tickets scrolls inside it. The account menu closes on a press anywhere else.

## Consequences

- A deal whose closing row is missing (older than the 4am cut, or not filed) shows its start alone.
- Changing a big one's first length from 15 to 30 is two presses where the switch took one.
- The tape's "Stopped" tag is gone from sittings; it remains nowhere else, since Stop for now always closes a sitting.
- The sample day's last sitting ends at 10:40pm (the demo clock reads 10:41pm), so its times and "Studied 71 min" add up.
- On a desk the invite tickets keep their stub underneath; the deal ticket's desk layout had leaked into them (code wrapping, USED over the date).

## Design rounds

Council for this change, as Chris asked: product designer and art director on Claude Fable 5.2, the primary user on Claude Opus 5.5, each with `settled.md`, fresh each round.

| Round | Designer | Primary user | Taste |
| --- | --- | --- | --- |
| 1, first build | 7.5/10 | 8/10 | 7/10 |
| 2 | 8/10 | 8/10 | 8/10 |
| 3 | 8/10 | 8.5/10 | 8/10 |

- **Round 1, built:** "Close" for "Back to Pomodeal" and no logo row on the sheet (all three); 15 as the big one's first length (two); a stopped sitting no longer three lines in the time column (two); "to now" in green (one, cheap). The green task name two reviewers called a stuck state was the pointer hovering the word in the shot.
- **Round 2, built:** one left edge for the tags and the "to" line, the end time as the start in miniature (the art directors of both rounds); "Stopped after 41 min" on one line (two); "Time's up" in place of "to now" (one, read from the code); the sheet holding a long list of tickets (one, reproduced).
- **Round 3, built:** the list scrolls inside the sheet so the heading and Close stay (two); the two stopped lines in one voice (two); "to now" built like "to 9:24pm" (one, cheap). These last three were checked by screenshot and measurement, not by a fourth round.
- **Not built, with the reason:** narrowing the desk sheet to clear the tape by more than 8 px (true only at 1440 wide); squarer sheet corners (20 px is the app's own sheets); a span that covers the focus only (the ledger has no row for when focus begins, and Chris asked for start to end); "20 min of focus, stopped" for "Stopped after 20 min" (reviewers were trading wordings by round 3).

## For Chris

Raised by reviewers, outside this change:

- In light mode the dim behind any sheet is weak (`--scrim` is .28), so a sheet separates poorly from the ticket behind it. Raised in all three rounds.
- "Longer blocks come with longer breaks." under the long lengths (spec 007): three reviewers would cut it.
- "Each ticket works for one person." on Invite friends: two would cut it.
- Invite tickets print newest first; unused first would put "Copy link" at the top.
- A phone sheet that closes when dragged down (the app's own sheets don't either).
- The caption under the desk tape ("…invite friends from the account button at the top.") explains the UI.
- The running stub says "45 min of focus" (the plan) in the words a finished one uses for its result.
