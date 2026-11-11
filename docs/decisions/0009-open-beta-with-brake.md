# 0009: An open beta with a sign-up brake

Date: 2026-11-11. Status: accepted.

## Context

The closed beta needed an invite code for every friend, which slowed down exactly the people Chris wanted trying it. It is still a beta (`noindex`, no privacy policy yet), and the free Convex plan has hard caps (1M function calls a month, 0.5 GB of storage) after which writes may fail. A sudden wave of sign-ups could break the app for everyone.

Two more facts shaped it. Production WorkOS needs an Apple developer account for Apple sign-in, and Chris has no Mac. And moving WorkOS from its staging environment to production changes every member's sign-in identity, so accounts need something stable to be matched on.

## Decision

- **Sign-ups are open, with a brake.** Anyone who signs in joins, until 40 people have joined in 24 hours or there are 150 members. Then sign-ups switch to invite-only by themselves and admins get a push. Invite links work either way. Both limits are editable on an admin Sign-ups screen, which also reopens sign-ups.
- **The brake watches new members per day; the screen also shows members active in the last 7 days.** Sign-ups show a wave; active members are what cost function calls. A Convex function can't read its own usage, so the screen links to the Convex usage page.
- **No Apple sign-in.** GitHub, Google and email (Magic Auth).
- **Accounts are matched across WorkOS environments by a hash of the verified email**, stored now, used on the first production sign-in. The address itself is never stored.

Details: [spec 016](../specs/016-open-beta-and-signup-brake.md).

## Consequences

- With no settings row, sign-ups are invite-only. After this deploys, Chris opens them from the screen.
- The WorkOS JWT template must add `email` and `email_verified` in every environment, and every member must open the app once before the switch to production. The screen's "Ready for the WorkOS move" count shows when that is done.
- Counts read every row. Past a few thousand members they move to `@convex-dev/aggregate`.
- If a wave closes sign-ups, the choices are to stay invite-only or to move to Convex Professional ($25 a month, 25M calls) and raise the limits.
