# Phase 0 Interview Plan

Owner: Chris · Written Nov 7, 2026 · Feeds Gate 0 in [03-roadmap.md](../03-roadmap.md)

## What we need to learn

Phase 0 ends with a go / no-go on building Phase 1. These interviews decide it. Each research question below maps to a decision we can't make from the desk.

| # | Question | Hypothesis | Decision it drives |
| --- | --- | --- | --- |
| Q1 | Do students bargain with time on their own, without us suggesting it? | Most describe a "10 more minutes" loop unprompted | Whether the negotiation is the product at all |
| Q2 | Where does a study night actually break down: starting, staying, or stopping a break? | Starting is the hardest moment, and ending a break is second | Quick Deal as the front door vs a block builder |
| Q3 | Which device does the distraction happen on? | Phone first (Reels, TikTok), laptop second | How early the Chrome extension matters vs the iOS Shortcuts intercept |
| Q4 | What have they tried, and why did they stop? | Timers and blockers get abandoned within 2 weeks, usually after a "failure" | What must be different so this isn't abandoned the same way |
| Q5 | Do they already study "with" friends (calls, Discord, library)? What makes it work or fail? | Many already body-double informally; chat pulls them off task | Thin social slice in the first beta, and how strict "chat waits for breaks" is |
| Q6 | How do the deal terms feel at 11 PM: fair, annoying, or ignorable? | The first free +5 feels good; borrow vs trade is one tap too many | Open questions in spec 001 (auto vs chosen repayment, freebie count) |
| Q7 | Would they let a Shortcut open the app when they open Instagram? | Half say yes for one app, few for more | Whether Tier 2 "Intercept" ships in the beta |
| Q8 | What would they share with friends, and what never? | Presence yes, ledger details no | Room privacy defaults (spec 004) |

## Method

One 45-minute session per person, in person or on a video call. Each session has two parts:

1. **Interview (25 min):** past behavior only. "Tell me about the last time…", never "would you…".
2. **Prototype walkthrough (15 min):** they hold the phone and do 5 short tasks while thinking out loud.
3. **Commitment test (5 min):** offer the prototype link to use for real that night. Follow up the next day. What people *do* that night counts for more than what they say in the session.

Full script: [02-discussion-guide.md](02-discussion-guide.md).

## Who

- **6 to 8 people**, from **2 to 3 existing friend groups** (the beta is friend groups, so we need to see the group dynamic), with at least 2 people who aren't Chris's close friends. Close friends are kind, and kind data is bad data.
- College students, 18+, in a demanding program, who study on their own at least 3 nights a week with a phone nearby.
- Mix: at least 2 who have tried and dropped a focus app, and at least 2 who never tried one.
- **Never screen on diagnosis, and never ask about one.** If someone brings it up, don't write it down. See [03-screener-and-consent.md](03-screener-and-consent.md).

## Roles

- **Interviewer** asks and follows up. Stays neutral and never pitches.
- **Note-taker** (a teammate, or Chris on a solo call with consented audio) fills the [session notes](04-session-notes.md) live: quotes word-for-word, behavior, and timestamps.
- Never interview someone alone **and** take notes from memory afterwards. Same-day notes only.

## Prototype setup

- Link: https://claude.ai/artifact/3Dnvyo7DxWEtbj8MABQVFs (it's private, so share it from the page's **Share** menu first, or run it on your own phone in person).
- Direct screens for the tasks: `#intercept`, `#offer-free`, `#offer-terms`, `#offer-intention`, `#ledger`, `#room`.
- Set speed to **30×** for the walkthrough; set it to **1×** for the "use it tonight" link.
- Tell them up front: "This is a rough prototype. It can't break, and you can't hurt our feelings."

## Timeline

| Dates (2026) | Step |
| --- | --- |
| Sat Nov 7 – Mon Nov 9 | Finalize guide, do 1 pilot session with a teammate, fix the guide |
| Mon Nov 9 – Tue Nov 10 | Send screener to 2–3 group chats, book slots |
| Wed Nov 11 – Wed Nov 18 | 6–8 sessions (max 2 per day so notes stay fresh) |
| Next day after each session | Commitment follow-up message |
| Thu Nov 19 – Fri Nov 20 | Synthesis (below) |
| Sat Nov 21 | Gate 0 decision, written as `docs/decisions/0002-gate-0.md` |

## Gate 0: pass if all are true

1. **Bargaining is real:** at least 5 of 8 (or 4 of 6) describe a "few more minutes" loop **before** we show the prototype.
2. **The deal lands:** at least half complete the Quick Deal task without help and react positively in their own words (not just "it's cool").
3. **Commitment:** at least 3 people actually use the prototype on a real night and can tell us what happened.
4. **No red line:** nobody reads it as shaming, babyish or medical. If 2 or more people do, fix the tone before building.

If 1 or 3 fail, iterate on the concept and re-test with 3–4 new people before Phase 1. If only 2 fails, it's a design problem: fix it in the loop and keep going.

## Synthesis

1. Within 24 hours of each session, finish the notes sheet, including the scored rubric.
2. After all sessions, put every quote and observation on a sticky (FigJam, or `docs/research/synthesis.md`) and affinity-map them into themes.
3. For each research question Q1–Q8, write: what we heard, how many people, the strongest quote, and the decision it implies.
4. Write 1–3 job statements in the form "When [situation], I want to [motivation], so I can [outcome]", plus what they hire today (TikTok timer, Forest, a friend on FaceTime…).
5. Update spec 001's open questions, the roadmap, and concept v2 with what changed. Log the go / no-go as decision 0002.

## Ethics and privacy

- Written or recorded verbal consent before starting; recording is optional and audio only.
- No diagnoses, medications or health details collected, even if offered.
- Notes use first names or initials only; delete audio after the synthesis.
- Anyone can skip any question or stop at any time, and there's no reward tied to saying nice things.
- Small thank-you (coffee or a $10 gift card) for everyone, given before the session ends, regardless of what they say.
