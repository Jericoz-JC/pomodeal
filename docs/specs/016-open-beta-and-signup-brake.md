# 016: Open beta with a sign-up brake

Status: built on branch `beta/open-signups`, not merged. Renumbered from 010 (main already had a spec 010).

## Why

Friends trying Pomodeal shouldn't need an invite code to get in. It is still a beta: `noindex` stays, and Chris needs a way to close the door if hundreds of people suddenly turn up, either to stay inside the free Convex plan or while he decides to pay for more.

Two more things ride along:

- **Apple sign-in goes.** Production WorkOS needs an Apple developer account, and Chris has no Mac. GitHub, Google and email stay.
- **Accounts have to survive the move to WorkOS production.** A member row is keyed by `tokenIdentifier`, which is the token's issuer plus its subject. Both change when WorkOS moves from the staging environment to production: the issuer contains the client id, and production is a separate user store where everyone gets a new user id. Without a fix, every member (Chris included) looks brand new on their first production sign-in and their sessions, ledger and invites are stranded.

## Limits that set the numbers

- **Convex free plan** (pricing page, Nov 2026): 1M function calls a month, 0.5 GB database storage, 1 GB database I/O, 20 GB-hours of action compute. These are hard caps: after them, writes may fail. Professional is $25 per developer a month with 25M calls.
- **WorkOS AuthKit:** free up to 1M monthly active users. Staging is free. It is not the bottleneck.
- Cost follows people running timers, not sign-ups. A Convex function can't read the deployment's own usage, so the admin screen shows activity counts and links to the Convex usage page. Rough estimate to check against real usage: a couple of hundred calls per active member per day, so about 150 daily active members fit the free plan.

## Behavior

### Sign-up modes

A single `settings` row (key `"beta"`) holds:

| Field | Meaning | Default |
| --- | --- | --- |
| `signups` | `"open"` or `"inviteOnly"` | `"inviteOnly"` when the row doesn't exist yet (fail closed; Chris opens it from the admin screen) |
| `memberCap` | Most members before sign-ups close | 150 |
| `dayLimit` | Most new members in a 24-hour window before sign-ups close | 40 |
| `windowStart` | Start of the current counting window; set when sign-ups are reopened | unset |
| `paused` | `{ at, reason: "dayLimit" \| "memberCap" \| "manual", count }` while closed by the brake or by hand | unset |

- **Open:** anyone signed in who isn't a member becomes one on their next app load, with the display name from their WorkOS profile (first + last name, else the part of the email before `@`). `inviteId` and `invitedBy` are null.
- **Invite-only:** today's behavior. Without an invite, a signed-in person sees the waitlist. They now get a waitlist row so Chris can see how many are waiting.
- **Invites work in both modes.** `?invite=CODE` still goes through `claim`, credits the inviter, and respects the 11-ticket allowance. Invites are not stopped by the brake: each member's allowance already bounds them.
- **The waitlist lets itself in.** When sign-ups reopen, a waitlisted person joins the next time they open the app (subject to the brake again). Their waitlist row is deleted when they join.

### The brake

Checked inside the join, in the same transaction, so two people joining at once can't both slip past it:

1. Count members with `joinedAt` after `max(now - 24h, windowStart)`, and count all members.
2. If sign-ups are open and this join makes either count reach its limit, the person still joins, and sign-ups flip to `inviteOnly` with `paused` set (reason and the count that tripped it). The next person lands on the waitlist.
3. The brake schedules a Web Push to every admin's subscribed devices: "Sign-ups paused: 40 new members in 24 hours" (or "150 members, the cap").
4. Reopening from the admin screen clears `paused` and sets `windowStart = now`, so the same burst doesn't trip it again straight away. Raising a limit doesn't reopen by itself.

Members who joined by invite count toward both numbers (they cost the same), but an invite never gets refused because of them.

### Admin screen

An entry in the account menu, shown only to admins, opening a panel in the same place as "Invite friends". It shows:

- **New in the last 24 hours**, against `dayLimit`. This is the spike number.
- **Members**, against `memberCap`.
- **Active in the last 7 days**: members who started at least one session. This is the cost number. Next to it, a link to the Convex usage page for the production deployment.
- **Waiting**: waitlist rows.
- **Ready for production sign-in**: members with an `emailHash`, out of all members (see "Carrying accounts" below).
- **Sign-ups:** an Open / Invite only switch. While `paused` is set, a notice above it says when and why ("Paused Nov 12, 3:40 pm: 40 new members in 24 hours") with Reopen as the action.
- The two limits, editable.

UI work loads the frontend-design skill first and follows the current visual direction (prototype r2): one green accent, Archivo for numbers, Atkinson Hyperlegible for text, no all-caps eyebrows or `·` separators. Checked at 375 px and desktop, light and dark, with `prototypes/shoot.mjs`.

### Waitlist copy

- Sign-ups closed: "Pomodeal is full for now. You're on the list, and you'll get in the next time you open it after it reopens. Got an invite link from a friend? That works any time."
- Copy follows the voice rules: no shame, no labels, no streaks.

### Carrying accounts into WorkOS production

1. A WorkOS **JWT template** in both the staging and production environments adds `email` and `email_verified` claims to the access token. Convex reads them as `identity.email` and `identity.emailVerified`. The first build step confirms both arrive on the dev deployment, and that `crypto.subtle` hashing works in a Convex mutation, before anything depends on them.
2. Each member row gets `emailHash`: SHA-256 (hex) of the trimmed, lower-cased email. The address itself is never stored.
3. On each app load the client calls one mutation, `beta.enter`. For an existing member it fills in a missing `emailHash`. For a signed-in non-member whose verified email hashes to an existing member's `emailHash`, it moves that member onto the new `tokenIdentifier`: same row, same data, same invites.
4. A hash match only counts when `emailVerified` is true. No email claim (template not set) means no matching and no hash; everything else still works.

WorkOS links sign-ins with the same verified email to one user within an environment, so a person who used Google on staging and an email code on production still matches.

### Sign-in providers

- The default list becomes `GitHubOAuth,GoogleOAuth`; email stays reachable through "other way", which opens the AuthKit chooser.
- `AppleOAuth` comes out of the `Provider` type, the icon and label tables, and the landing page's iPhone-first ordering. The primary button is Google, the second GitHub.
- Chris turns Apple off in the WorkOS staging dashboard. `VITE_AUTH_PROVIDERS` can still override the list.

## Data changes

| Table | Change | Index |
| --- | --- | --- |
| `settings` (new) | One row per key; only `"beta"` for now, with the fields above | `by_key` |
| `waitlist` (new) | `tokenIdentifier`, `firstSeenAt` | `by_tokenIdentifier` |
| `users` | `emailHash` (optional string) | `by_emailHash`, `by_joinedAt` |
| `sessions` | none | `by_createdAt` (for "active in the last 7 days") |

Counting members, waitlist rows and last-7-days sessions reads every matching row. At beta size (hundreds) that is fine. Past a few thousand members, switch these counts to the `@convex-dev/aggregate` component.

Spec 006 gets `users.emailHash` and the `waitlist` table in the same commit that adds them. `settings` holds no personal data.

## Functions

| Function | Kind | Who | Does |
| --- | --- | --- | --- |
| `beta.me` | query | anyone | Unchanged statuses, plus `signups` so the waitlist screen can say whether it is closed |
| `beta.enter` | mutation | signed in | Backfills `emailHash`; relinks by verified email; joins when open (with the brake); otherwise upserts a waitlist row. Returns the resulting status |
| `beta.claim` | mutation | signed in | As today, plus `emailHash`, and deletes any waitlist row |
| `admin.overview` | query | admins | The numbers and settings for the admin screen |
| `admin.setSignups` | mutation | admins | Open (clears `paused`, sets `windowStart`) or invite-only (`paused.reason = "manual"`) |
| `admin.setLimits` | mutation | admins | `memberCap` and `dayLimit`, whole numbers of at least 1 |
| `push.notifyAdmins` | internal mutation | brake | One Web Push per admin device, same send path as block-boundary pushes |

`requireAdmin` sits next to `requireMember` in `convex/lib/members.ts`. Identity always comes from the token, never from arguments.

Client (`apps/web/src/main.ts`): after auth attaches, call `beta.enter` once (or `claim` when an invite is pending), then render from `beta.me` as today.

## Tests (written first, in `convex/test`)

- Open: a signed-in non-member joins with a null invite; a second `enter` is a no-op.
- Invite-only: no join; a waitlist row is written once; `claim` still works and removes the waitlist row.
- Brake: the join that reaches `dayLimit` succeeds and flips to invite-only with `paused.reason = "dayLimit"`; the next one is waitlisted. Same for `memberCap`. Reopening resets the window. An admin push is scheduled.
- Relink: a member on an old `tokenIdentifier` is moved to the new one by a verified email match. Refused when `emailVerified` is false or absent. A member's `emailHash` is backfilled.
- Authorization: a non-admin calling `admin.*` is refused; a signed-out caller can't `enter`.
- Missing settings row means invite-only.

## Switching WorkOS to production (checklist for later)

1. Ship this spec and set the JWT template on the **staging** environment.
2. Wait until every current member has opened the app at least once, so each has an `emailHash`. "Ready for production sign-in" on the admin screen reads all of them.
3. In the WorkOS production environment: Google and GitHub OAuth clients of your own, email code (Magic Auth) on, Apple off, the same JWT template, redirects and CORS for `pomodeal.app`, and a custom auth domain if ready.
4. Set `WORKOS_CLIENT_ID` on the Convex production deployment and `VITE_WORKOS_CLIENT_ID` in Cloudflare to the production client id; push to deploy.
5. Everyone is signed out once. On their next sign-in, `beta.enter` moves their account across.

## Docs that change with it

- `docs/08-launch-and-beta-access.md`: how access works now, the admin screen, the production switch.
- `docs/03-roadmap.md` "Where we are": open beta with a brake; Apple removed.
- `docs/decisions/0009-open-beta-with-brake.md`: why open plus a brake instead of invite-only.
- `docs/specs/006-privacy-inventory.md`, `CHANGELOG.md`.

## Not in this change

- Email alerts (push and the admin banner only).
- Reading Convex usage from inside the app (there is no API for it; the screen links to the dashboard).
- Delete-my-data, the age gate and the privacy policy (still required before a public launch).

## Design rounds

Screens shown with sample numbers in the browser pane at 375 px, light and dark (the panel needs an admin sign-in, so `shoot.mjs` can't reach it).

| Change | Designer | Primary user | Taste |
| --- | --- | --- | --- |
| Sign-ups panel and waitlist, round 1 | 7/10 | 7/10 | 7/10 |
| Round 2: limits are picked words on the ticket (no number fields, no Save), bare usage link, "closed for now" | 7.5/10 | 8/10 | 7/10 |
| Round 3: four choices on one row, the cap only offers raises, one warning, waitlist on a ticket with a grey LISTED stamp | 8/10 | 8/10 | 8/10 |

After round 3 (three rounds is the limit), only copy all agreed on went in: "Closed for now", "Once it reopens, open Pomodeal and you're in.", "Raise the cap before reopening, …", "Paused itself at 150 members, 3:07 PM."

Left for Chris (one reviewer each, or a settled-rule question):
- Draw Reopen un-inked until a cap above today's members is picked (designer).
- Put the waiting count on the paused ticket (primary user).
- Sit the waitlist ticket at the optical third instead of under the logo; left-align the Reopen stamp (taste).
- Is a grey stamp that only acknowledges (LISTED, PAUSED) settled? Green is wet ink where a stamp lands (designer).
