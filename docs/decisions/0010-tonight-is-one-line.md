# 0010: Tonight is one line, and the ticket holds its first item

Date: 2026-11-13. Status: accepted by Chris, Nov 13 ("lgtm do A").

## Context

Adding and removing tasks had grown three separate containers: the quick deal, big ones (spec 008, home lines in spec 015) and tonight (spec 012). Each had its own way in, its own word for taking a thing out, its own lengths and its own meaning of Stop, and they took turns on one ticket by a fixed order in the code. Walking every path on a phone and a desk found a night that could not be cancelled, a printed night that could silently vanish or lose its finished sittings, the same big one reading two ways, three labels for "one plain deal", a roll that drew a night nobody planned, and five words for removing something. The full list is in [spec 017](../specs/017-and-then.md).

Two flows were mocked from the prototype's own parts. A wrote the rest of tonight on the ticket; B kept a one-sentence ticket with the rest in a sentence under it and the big-one lines as offers. Chris picked A.

## Decision

- **Tonight is one line. The ticket always holds its first item.** The ticket's paragraph is the deal, "After that, …" for the rest, and "Then you're done.", whose last words are where more is added. There is no second ticket, no draft and no printing.
- **Print goes.** Writing the line commits to nothing, so it is not a stamp. DEAL is the only stamp on home.
- **Stop for now keeps your place.** A sitting counts when its deal runs its full time, not when it is dealt.
- **One ladder out:** Not tonight (off the line), Set aside (kept, out of sight), Delete (gone). "Just this one" clears the rest of the line.
- **The big-one lines and Start stamps leave home.** The names you already use are words at the open end and under the ticket's name.
- **The desk roll** shows only while tonight holds more than the ticket, and never shows a total or a finishing time for names nobody chose.

## Consequences

- Plan tonight, Change tonight, the "Tonight," ticket, Print, Just one deal, Quick deal and Make a quick deal instead are removed.
- Starting a big one that isn't on the ticket takes three presses (its name, a pick, DEAL) where a Start stamp took one.
- The ticket grows with the night: about 700 px tall on a phone with three items, so the room row falls below the fold.
- Every change to the line is saved as it is made (`nights.print`), and a line can be emptied (`nights.clear`). Two devices editing at once collide more often; the server's line wins.
- `sessions` stores which sitting a deal took (`fromNight`, `nightDay`) so an early stop can give it back. The privacy inventory lists both.
- A slip of the thumb is live at once. Undo is one press at the open end, where the name is waiting.
- `settled.md` changes in three places: the deal (the paragraph and its open end), the desk (when the roll shows) and the words for removing.
