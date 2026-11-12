# Spec 006: Privacy inventory

Status: living document. Owner: Chris.

This lists every piece of behavior or personal data Pomodeal stores, why, who can see it, how long it is kept, and what deletes it. Any new stored field is added here in the same commit that adds it. Everything spec 008 adds is built and listed below.

Pomodeal never records diagnoses and stores no health information. Titles, first moves and bookmarks are coursework text: only the student can read them, rooms never see them, and AI requests send only what the AI disclosure below says.

Who can see, in every table: the signed-in student sees their own rows through the app. Chris, as the operator, can see all rows in the Convex dashboard. No other student can read another student's rows. There is no in-app "delete my data" yet (required before any public launch), so until then deletion on request is done by Chris.

## Tables that exist today

### users

| Field | What it holds | Why | Who can see | Retention | Deleted by |
| --- | --- | --- | --- | --- | --- |
| tokenIdentifier | The WorkOS sign-in identity string | Match a sign-in to a member | The student (own row), Chris | While the account exists | Chris on request |
| displayName | The name the student chose | Show in the app and invites | The student, Chris, and the member whose invite they used (first name only, with the day they joined, on that used ticket) | While the account exists | Chris on request |
| role | member or admin | Gate admin-only functions | The student, Chris | While the account exists | Chris on request |
| inviteId | The invite used to join | Trace invite use | Chris | While the account exists | Chris on request |
| invitedBy | The member who invited them | Enforce invite allowance | Chris | While the account exists | Chris on request |
| inviteAllowance | How many invites they may still make | Limit invite growth | The student, Chris | While the account exists | Chris on request |
| joinedAt | When they joined | Ordering and support | Chris | While the account exists | Chris on request |
| lastRepay | borrow or trade, the last repayment pick (spec 008) | Pre-select it on the next ask (ADR 0005) | The student, Chris | While the account exists | Chris on request |
| emailHash | SHA-256 of the verified sign-in email (spec 016), never the address itself. Unsalted, so it is pseudonymous, not anonymous: anyone holding the table could confirm a guessed address | Match the account when WorkOS moves from staging to production, where the sign-in identity changes | Chris | While the account exists | Chris on request |

### waitlist

Spec 016. Someone who signs in while sign-ups are closed and has no invite.

| Field | What it holds | Why | Who can see | Retention | Deleted by |
| --- | --- | --- | --- | --- | --- |
| tokenIdentifier | The WorkOS sign-in identity string | Count who is waiting and let them in when sign-ups reopen | Chris (as a count on the admin screen) | Until they join | Joining deletes it; Chris on request |
| firstSeenAt | When they first arrived | Ordering and support | Chris | Until they join | Joining deletes it; Chris on request |

### settings

Spec 016. One row holding the sign-up mode, the brake's limits and when it last paused. No personal data.

### invites

| Field | What it holds | Why | Who can see | Retention | Deleted by |
| --- | --- | --- | --- | --- | --- |
| code | The invite code | Let a friend join | Whoever holds the code, Chris | Until used up or expired, then kept as a record | Chris on request |
| createdBy | The member who made it, or null for founder invites | Enforce allowance | Chris | Same as the invite | Chris on request |
| maxUses, uses | How many times it can and has been used | Limit use | Chris | Same as the invite | Chris on request |
| note | Optional label written by the creator | Remember who it was for | The creator, Chris | Same as the invite | Chris on request |
| expiresAt | Optional expiry time | Close old invites | Chris | Same as the invite | Chris on request |
| createdAt | When it was made | Ordering | Chris | Same as the invite | Chris on request |

### sessions

| Field | What it holds | Why | Who can see | Retention | Deleted by |
| --- | --- | --- | --- | --- | --- |
| userId | Owner | Scope to the student | The student, Chris | Kept as history | Chris on request |
| state.blocks | Block types, labels, minutes, and optionally `added`, the minutes a trade added to a focus block (labels can be what the student typed) | Run the session | The student, Chris | Kept as history | Chris on request |
| state.idx, startedAt, durMs | Current block, start time, length | Compute time from stored start | The student, Chris | Kept as history | Chris on request |
| state.askCount, debt, bonusOffered | Negotiation state | Apply the rules | The student, Chris | Kept as history | Chris on request |
| state.version | Counter bumped on every change; scheduled pushes check it (spec 008; stored from Task 7, optional on older sessions) | Stop stale pushes firing | Chris | Kept as history | Chris on request |
| state.scheduledIds | Ids of scheduled push functions (spec 008; stored from Task 13, optional on older sessions) | Cancel old schedules | Chris | Cleared when the session ends | Chris on request |
| status | running or ended | Find the active session | The student, Chris | Kept as history | Chris on request |
| createdAt | When it began | Ordering | The student, Chris | Kept as history | Chris on request |
| taskId | The big one this session belongs to (spec 008) | Task-scoped history | The student, Chris | Kept as history | Unlinked when the big one is deleted |
| notedIdx | Index of the last focus block whose block-end notes (bookmark, done) were handled (spec 008) | Make block-end notes idempotent | Chris | Kept as history | Chris on request |

### ledger

| Field | What it holds | Why | Who can see | Retention | Deleted by |
| --- | --- | --- | --- | --- | --- |
| userId, sessionId | Owner and session | Scope to the student | The student, Chris | Kept as history | Chris on request |
| at | When the entry happened | Ordering and the 24 hour view | The student, Chris | Kept as history | Chris on request |
| kind | What happened: `deal` (a session started), `done` (it ran its full time, spec 010), `freebie`, `borrow`, `trade`, `override` (asks), `bonus`, `end_early` (stopped), `skip` (a block ended early), `forgiven` (borrowed minutes cleared) | Show history | The student, Chris | Kept as history | Chris on request |
| blockLabel | The block's label (the task or break activity the student typed); on a big one's `deal`, `done` and `end_early`, the big one's title (coursework text) | Show history | The student, Chris | Kept as history | Chris on request |
| minutes | Minutes in the entry: the focus length for `deal`, focus minutes done for `done` and `end_early`, minutes the block ran for `skip` | Show history | The student, Chris | Kept as history | Chris on request |
| intention | Optional line the student typed | Show history | The student, Chris | Kept as history | Chris on request |
| taskId | The big one the session worked on, if any (ADR 0006) | Say an entry was on a big one | The student, Chris | Until the big one is deleted | Deleting the big one clears it |

### tasks (a "big one")

| Field | What it holds | Why | Who can see | Retention | Deleted by |
| --- | --- | --- | --- | --- | --- |
| userId | Owner | Scope to the student | The student, Chris | Until deleted | Deleting the big one |
| title | The big one's name, 1 to 80 characters (coursework text) | Name it on cards | The student, Chris; AI only if the student opts in (see disclosure) | Until deleted | Deleting the big one |
| taskType | writing, problems, exam or project | Placeholders and defaults | The student, Chris; sent to AI on opt-in | Until deleted | Deleting the big one |
| gutMin | Gut size in minutes: 60, 120, 180 or 240; cleared by "Start fresh" | Open terms and progress | The student, Chris; sent to AI on opt-in | Until deleted | Deleting the big one |
| workedMin | Minutes worked on it | Progress | The student, Chris | Until deleted | Deleting the big one |
| openTermsMin | Minutes still needed, or null with no gut size | Progress | The student, Chris | Until deleted | Deleting the big one |
| firstMove | The first-move line, up to 140 characters (coursework text) | Start the next block | The student, Chris | Until deleted | Deleting the big one |
| bookmark | The "Next time, start with" note, up to 140 characters (coursework text) | Resume next time | The student, Chris; never sent to AI | Until deleted | Deleting the big one |
| pieces | Up to 12 pieces: title, minutes, plannedDay, stampedAt | Split and spread | The student, Chris | Until deleted | Deleting the big one |
| dueDay | Local date key of the due day | Spread | The student, Chris; never sent to AI | Until deleted | Deleting the big one |
| spreadSignedAt | When the student signed a spread | Comeback rule | The student, Chris | Until deleted | Deleting the big one |
| aiSuggested | Whether saved pieces came from a suggestion | Describe AI use | The student, Chris | Until deleted | Deleting the big one |
| status | open, done or set_aside | Which cards show | The student, Chris | Until deleted | Deleting the big one |
| lastWorkedAt | When a block last ran on it | Ordering and comeback | The student, Chris | Until deleted | Deleting the big one |
| lastFocusMin | Focus length chosen for the last deal started on it | Card button length | The student, Chris | Until deleted | Deleting the big one |
| workedDays | Local date keys with a block on it, newest 30 | Comeback rule | The student, Chris | Until deleted | Deleting the big one |
| createdAt | When it was made | Ordering | The student, Chris | Until deleted | Deleting the big one |

Deleting a big one deletes the row and unlinks its sessions, ledger entries and nights (their `taskId` is cleared); the sessions and ledger entries stay as ordinary history, including a ledger entry's `blockLabel`, which may hold the big one's title, and a night keeps the item by its title until the night is deleted.

### nights

Tonight's plan (spec 012, "Tonight in a line"): one row per member per local day, replaced each time the student prints tonight. It vanishes on its own: the daily cleanup deletes a night once its day is more than 2 days old.

| Field | What it holds | Why | Who can see | Retention | Deleted by |
| --- | --- | --- | --- | --- | --- |
| userId | Owner | Scope to the student | The student, Chris | At most about 3 days | The daily cleanup, once its day is more than 2 days old; a new print the same day replaces the row |
| dayKey | Local date key of the night, from the client (indexed for the cleanup) | One night per day | The student, Chris | Same | Same |
| items[].title | Up to 6 item names, 1 to 80 characters each (coursework text, like a big one's title) | Print the night and name each sitting | The student, Chris; never sent to AI or a push | Same | Same |
| items[].taskId | The big one an item names, optional | Start its sittings on that big one | The student, Chris | Same | Deleting the big one clears it; the cleanup |
| items[].sittings, items[].minutes | The item's size: 1 to 3 sittings of 15, 20, 30 or 45 minutes | Lay out the night | The student, Chris | Same | Same |
| taken | How many sittings have been started | Know which sitting is next on every device | The student, Chris | Same | Same |
| printedAt | When it was last printed | Ordering and support | Chris | Same | Same |

### events

Events hold no titles, bookmarks or any typed text. Kinds: big_one_named, first_payment_started (with ms from naming), comeback_shown, comeback_started, bookmark_written, split_saved, spread_signed, ai_requested, ai_accepted, install_done, push_enabled, push_sent, push_failed, night_printed (with how many items, never what they are).

| Field | What it holds | Why | Who can see | Retention | Deleted by |
| --- | --- | --- | --- | --- | --- |
| userId | Who did it | Count per person in the beta numbers | Chris | Deleted at the end of the beta | End-of-beta cleanup |
| kind | One of the kinds above | Measure the success numbers | Chris | Deleted at the end of the beta | End-of-beta cleanup |
| taskId | Which big one, optional (an id only; it stays after the big one is deleted) | Join to timings | Chris | Deleted at the end of the beta | End-of-beta cleanup |
| ms | A duration, optional | Time to first payment | Chris | Deleted at the end of the beta | End-of-beta cleanup |
| count | A count, optional: on night_printed, how many items tonight has | See whether nights get used | Chris | Deleted at the end of the beta | End-of-beta cleanup |
| at | When it happened | Bound queries to the beta window | Chris | Deleted at the end of the beta | End-of-beta cleanup |

### pushSubscriptions

One row per device that turned on taps at block ends (spec 008). An endpoint is stored once; if another signed-in member subscribes the same browser, the row moves to them.

| Field | What it holds | Why | Who can see | Retention | Deleted by |
| --- | --- | --- | --- | --- | --- |
| userId | Owner | Scope to the student | Chris | While the subscription is valid | Unsubscribing, or removal after the push service says it is gone (404 or 410) |
| endpoint | The browser push service address for one device | Deliver block-boundary taps | Chris | While the subscription is valid | Unsubscribing, or removal after the push service says it is gone (404 or 410) |
| p256dh, auth | Keys the browser gave for encrypting pushes | Encrypt the payload | Chris | While the subscription is valid | Same as endpoint |
| createdAt | When it was added | Ordering | Chris | While the subscription is valid | Same as endpoint |
| lastSuccessAt | Last successful send, optional | Spot dead subscriptions | Chris | While the subscription is valid | Same as endpoint |

Each send is logged in `events` as `push_sent` or `push_failed` (kind and time only, never the payload or endpoint). A failed send is never retried.

### pieceSuggestions

Transient. Holds AI output only until the student acts on it (spec 008, Task 17). One row per request; a newer request on the same big one replaces it.

| Field | What it holds | Why | Who can see | Retention | Deleted by |
| --- | --- | --- | --- | --- | --- |
| userId, taskId | Owner and big one | Match the suggestion to the sheet | The student, Chris | Until saved or dismissed, at most 24 hours | Saving the split, Undo or Close in the sheet, a newer request, deleting the big one, or the daily cleanup after 24 hours |
| status | pending, ready or failed | Drive the sheet | The student, Chris | Same | Same |
| pieces | Up to 12 suggested titles (up to 80 characters) and minutes (5 to 240), cleaned by core before they are stored | Fill the slots | The student, Chris | Same | Same |
| createdAt | When it was requested (indexed for the cleanup) | The 24 hour cleanup | Chris | Same | Same |

Only pieces the student saves are kept, in `tasks.pieces`; `tasks.aiSuggested` records that they started as a suggestion.

### aiUsage

| Field | What it holds | Why | Who can see | Retention | Deleted by |
| --- | --- | --- | --- | --- | --- |
| userId | Owner | Per-user limit (10 a day) | Chris | About 2 days after the day it counts | The daily cleanup |
| dayKey | Local date key (index by_dayKey for the 300 a day global cap) | Daily counting | Chris | Same | Same |
| count | Requests that day | Enforce limits | Chris | Same | Same |

### Stored on the device (browser storage, never sent)

These live in the browser's `localStorage` on one device. Pomodeal never uploads them; clearing the site's data deletes them.

| Key | What it holds | Why | Who can see | Retention | Deleted by |
| --- | --- | --- | --- | --- | --- |
| pomodeal.deal | The last Quick Deal (break activity and length, task, focus length) | Open on the deal you made last time | Anyone using that browser | Until replaced or cleared | Clearing site data |
| pomodeal.theme | "light" or "dark" when the student forced a theme from the account menu; absent means follow the device | Remember the choice per device | Anyone using that browser | Until changed or cleared | Clearing site data, or picking Device |
| pomodeal.wakelock | No longer written (spec 011): the screen now stays on during every focus block, with no switch. A value left from before is ignored | Remember the choice per device | Anyone using that browser | Until changed or cleared | Clearing site data |
| pomodeal.comebackShown | Today's date and the ids of big ones whose comeback card was shown today (spec 008) | Log `comeback_shown` once per card per day | Anyone using that browser | Replaced each day | Clearing site data |
| pomodeal.pushAsked | "1" once the "Turn on taps at block ends" button has been offered (spec 008) | Offer the push permission step once per device | Anyone using that browser | Until cleared | Clearing site data |
| pomodeal.installSheet | "1" once the iPhone install sheet has been shown (spec 008) | Show the install sheet once per device | Anyone using that browser | Until cleared | Clearing site data |
| pomodeal.installDone | "1" once the app has opened from the Home Screen (spec 008) | Log `install_done` once per device | Anyone using that browser | Until cleared | Clearing site data |
| pomodeal.checkinSkipped | The week key (a Sunday's date) of the weekly question that was skipped with the x (spec 008) | Keep the question hidden until next week | Anyone using that browser | Until replaced or cleared | Clearing site data |
| pomodeal.invite (session storage, not local) | An invite code from the link, kept across the sign-in redirect | Join with the invite after signing in | Anyone using that tab | Until the tab closes | Closing the tab |
| pomodeal.aiConsent | "yes" or "no", the answer to the AI disclosure (spec 008); "no" hides "Suggest pieces" on this device | Ask the disclosure once per device | Anyone using that browser | Until cleared | Clearing site data |

### checkIns

One answer a week per member to "Did this week go better than usual?" (spec 008, Task 18). Answering again in the same week replaces the answer. Chris reads the counts through an internal metrics query; there is no follow-up question in the app.

| Field | What it holds | Why | Who can see | Retention | Deleted by |
| --- | --- | --- | --- | --- | --- |
| userId | Owner | Scope to the student | The student, Chris | Kept through the beta | Chris on request |
| weekKey | The week the answer is for | One answer a week | The student, Chris | Kept through the beta | Chris on request |
| answer | better, same or worse | Tell if the product helps | The student, Chris | Kept through the beta | Chris on request |
| at | When they answered | Ordering | The student, Chris | Kept through the beta | Chris on request |

## AI disclosure

This is the line shown before the first suggestion, copied from spec 008:

"This sends the title, type and size of this big one to Anthropic to suggest pieces. Nothing else. They keep it up to 30 days."

It is asked once per device and shown again from Settings (Settings does not exist yet: until it does, a device that answered "I'll split it myself" gets the question back only by clearing site data). The feature is off unless `AI_SUGGEST_ENABLED` is `"true"` and `ANTHROPIC_API_KEY` is set, and each request is an opt-in tap. Requests go to Claude Haiku 5.5; Convex logs record only the error class and status of a failed call, never the title or the model's output.

## Sent to third parties

| Who | What is sent | When | Notes |
| --- | --- | --- | --- |
| WorkOS | Sign-in details the student enters at sign-in | Signing in | Handles identity; Pomodeal stores only the resulting token identifier and the display name. |
| The browser's push service (for example Apple, Google or Mozilla) | The device endpoint, and an encrypted payload holding the push text: the block's label and, at a break's end, the next block's label (for example "2 min to wrap up BIO 180 ch. 7."). Labels can be text the student typed (the deal's task or break activity). | At the heads-up (2 min, or 5 min on blocks of 45+) and block end of a running session, only on devices where the student turned push on | No daily reminders, nothing when no session runs. The payload is encrypted with the subscription keys, so the push service sees only the endpoint, timing and size. It is dropped if not delivered within 5 minutes. |
| Anthropic | The title (the stored one, with emails and phone numbers stripped), the type, and the gut size. Nothing else | Only when the student taps "Suggest pieces" after the disclosure | Anthropic keeps request content up to 30 days. Never the bookmark, the due day or days left, never other big ones. |
