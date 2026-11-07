# Negotiation Clock — Product Thesis

Oct 30, 2026 · @Chris Jobi

## The thesis

Negotiation Clock (working name) is a study timer that negotiates with you instead of fighting you, plus a small, private study space where friends hold each other to it.

It is built for students in intense academic programs whose brains bargain with time: "10 more minutes of reels, then I'll start." Many of them are undiagnosed, unmedicated, or would never call themselves ADHD, so the product never says ADHD. The positioning is about *how you work*, not a label: for people who need a deal with themselves to get started.

The bet: distraction is going to happen anyway, so schedule it, enforce the deal in both directions, and make it social.

## Problem and gap

Standard Pomodoro assumes you can start and stay on task once a timer runs. For this group, starting is the whole problem, real focus can take 20–40 minutes to arrive, and a fixed 25-minute block cuts it off. The usual cycle is excitement, failure, shame, then abandoning the tool.

| Category | Example | What it does | What it misses |
| --- | --- | --- | --- |
| Visual planner | [Tiimo](https://lifestack.ai/blog/tiimo-pricing) (\~$80/yr) | Visual day plan | Not a session tool; labeled ADHD |
| Task timer | [Llama Life](https://www.softwares.com/software/llamalife) | Timer on every task | Solo, intentionally light |
| Body doubling | [Focusmate](https://neurolaunch.com/focusmate-review/) ($8–12/mo) | Video with a stranger | Strangers, scheduled, no friends |
| Guilt / blocking | Forest, Freedom | Punish or block distraction | Treats breaks as failure |
| Chrome timers | [Lofidoro](https://chrome.google.com/webstore/detail/detail/pjgoihdbljhplcmojnnfokmacpoonnee/support), [Daydream](https://firefox.marketplace.browsertotal.com/en-CA/firefox/addon/daydream-v2/) | Timer + YouTube | Commodity; no negotiation |

**The gap:** no tool plans the distraction, tracks the bargaining honestly, or lets a friend group study together in a private space. Focusmate's [\~$1M/yr](https://www.goodreads.com/author_blog_posts/25605332-1m-per-year-via-virtual-body-doubling?tab=book) shows people pay for the social piece.

## Core features

1. **Modular block builder.** Stack blocks like a playlist: 20 min Read → 20 min Reels → 15 min Text friends. Any length, drag to reorder, save as presets.
2. **Breaks are planned activities.** "Scroll reels" is a block you chose, not a failure. The extension enforces the *end* of a break by closing or dimming the tab when time is up.
3. **Negotiation ledger.** "+5 min" always works, but every extension is logged with time and activity, so patterns show ("you bargain hardest after 10 PM").
4. **Ramp-up sessions.** Start with a tiny commitment (say 8 min) and grow it. When you are in flow, the app offers to extend instead of cutting you off.
5. **Intention vs. reality.** Each block records what you planned and what happened: auto-filled by the extension on desktop, one tap on phone.
6. **YouTube scenes.** Attach your own video or stream to each block type; it auto-plays and pauses on block changes.
7. **Visual time.** A draining disk or bar instead of digits, plus a soft 2-minute heads-up before every switch.
8. **Weekly recap.** Best focus windows, most-negotiated activities, sessions completed. No punishing streaks.

## Multiplayer: study rooms

The long-term vision is a Discord built for studying: invite-only rooms for friend groups, where talking is deliberately limited so it supports focus instead of replacing it.

- **Live presence.** See who is in a focus block, on a break, or negotiating, with their timer visible.
- **Shared sessions.** Start the same block stack together; breaks line up so you socialize at the same time.
- **Check-ins.** A one-tap "starting / stuck / done" status at block boundaries, visible to the room.
- **Voice memos.** Short clips (around 30 seconds) to say what you are working on or nudge a friend.
- **Chat that respects the timer.** Text and voice unlock during breaks; during focus blocks messages queue silently and arrive at the break.
- **Gentle accountability.** Friends can see your ledger summary if you opt in, never the raw details.

Guardrails: small rooms (about 2–12 people), no public servers, no feeds, no follower counts.

## How it works

A web app and a Chrome extension share one Convex backend, so a session started on a laptop updates instantly on a phone, in the extension, and for friends in the same room.

&#91;embedded content: architecture · 2 clients, Convex, R2\]

| Layer | Choice | Why |
| --- | --- | --- |
| Web app | React + Vite + Tailwind, PWA | Installable on phone and laptop; one codebase |
| Extension | WXT (Manifest V3) | Reuses web components; tab events and blocking |
| Backend | Convex | Real-time sync for presence and shared sessions; durable scheduled jobs for block switches |
| Auth | Better Auth on Convex | Web sign-in; the extension borrows the session token |
| Media | Cloudflare R2 | Voice memos and chat media; Convex keeps the metadata |
| Video | YouTube IFrame Player API | Store video IDs only, never the video |

Timers compute from stored start times rather than ticking intervals, because browsers throttle background tabs. Voice memos upload straight to R2 through short-lived signed URLs that Convex issues.

## Privacy and closed beta

The beta is invite-only, starting with our own university friend groups, because the app holds sensitive behavioral data and private voice and chat.

- **Collect the minimum.** The extension records only the domain and the time on it during a session, never page content or full URLs.
- **Private by default.** Ledgers and recaps are visible only to you; sharing with a room is opt-in, per room.
- **Short retention.** Voice memos and chat expire on a set schedule; users can delete their data at any time.
- **No health claims.** Marketing and copy never mention ADHD or diagnosis. It is a study tool, not a treatment.
- **Legal before wider launch.** A privacy policy, terms of service, and Chrome Web Store data disclosures, and an age gate (18+ or college students only) for the beta.

## MVP scope and roadmap

1. **Phase 1, solo MVP.** Block builder, visual timer, negotiation ledger, YouTube scenes, sign-in, and session history. Web app only.
2. **Phase 2, extension.** Tab tracking for intention vs. reality, enforced break endings, and blocking during focus blocks.
3. **Phase 3, study rooms.** Presence, shared sessions, check-ins, then voice memos and break-only chat.
4. **Phase 4, insights.** Weekly recaps, ramp-up suggestions learned from each user's history.

Open questions for the team:

- [ ] Final product name
- [ ] Better Auth or Convex Auth, and how the extension shares the session
- [ ] Convex file storage or R2 for voice memos: where is the cost crossover?
- [ ] How long do chat and voice memos live before they expire?
- [ ] How do we measure whether it works: sessions completed, ledger trends, or a short weekly check-in?
- [ ] Who are the first 10–20 beta testers, and when do we interview them?
