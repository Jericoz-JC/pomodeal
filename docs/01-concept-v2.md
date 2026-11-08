# Pomodeal: Concept v2

*Formerly the working name "Negotiation Clock". Renamed Nov 7, 2026.*

Iteration on [00-thesis-original.md](00-thesis-original.md) · Nov 7, 2026

The thesis is strong on *why* and thin on the one thing that makes the product different: **what actually happens when you negotiate.** Right now "+5 min always works" plus a log is a snooze button with a history. v2 makes the negotiation a real two-sided deal and builds everything else around it.

---

## 1. What stays

- The positioning: about *how you work*, never a label. No ADHD in copy.
- Breaks as planned activities, not failures.
- Ledger, ramp-up, visual time, 2-minute heads-up, no-shame recaps.
- Small private rooms, no feeds, no follower counts.
- Server-computed time (start timestamps, not ticking intervals).

## 2. What changes

### 2.1 The negotiation gets a counter-party

The clock is the other side of the table. It never says no, but every deal has terms, and the terms are visible.

| Situation | You ask | The clock offers | Logged as |
| --- | --- | --- | --- |
| Break ending, first ask | +5 reels | "Sure, on the house." | Freebie |
| Break ending, second ask | +5 more | "OK, it comes out of your next break" **or** "OK, next focus block becomes 25" | Borrowed (with repayment) |
| Break ending, third+ ask | +5 more | Counteroffer plus one line: "What's the first thing you'll do when you start?" | Borrowed + intention |
| Any time | "I need this" | Always accepted, no terms | Override (no judgement, still logged) |
| Focus going well | (no ask) | "You're rolling. +10 focus and your break grows by 3?" | Bonus |

Rules of thumb:

- **Never block, always price.** The override exists so the app is never the enemy.
- **Deals go both ways.** The clock also offers *you* deals when you're in flow. That's what "enforce the deal in both directions" means in practice.
- **The ledger is a balance sheet,** not a rap sheet: time borrowed, time repaid, bonuses earned. A weekly *net* is honest without being a streak.

> Open design question: should repayment be automatic (next break shrinks) or chosen (pick break or focus)? Auto is fewer taps; chosen feels more like a deal. Prototype both in Phase 0.

### 2.2 Start from where you are

The thesis describes the user *already scrolling*. So the main entry point shouldn't be an empty block builder. It should meet them mid-distraction:

1. Open the app (or tap the widget/notification). "What are you doing right now?" → **Reels**
2. "Got it. 10 more minutes of reels, then 8 minutes of reading. Deal?" → **Deal**
3. The first block is the distraction you were already in. Starting is now one tap and zero guilt.

The block builder and presets still exist for planners, but the **Quick Deal** is the front door. This is the most important screen in the product and should be prototyped first.

### 2.3 The phone is where distraction lives, and the web can't enforce it there

Reels and TikTok are phone apps. A Chrome extension can't touch them, and a PWA can't block other apps on iOS or Android (only a native app with Apple's Screen Time / FamilyControls APIs can). So:

- **Desktop enforcement** = the extension (dim or close the tab when a break ends).
- **Phone enforcement** = push notification at the 2-min heads-up and at block end, plus **friends**. Presence ("Chris's break ended 4 min ago") is the only enforcement that works on a phone without a native app.

This changes the roadmap: the social layer isn't a Phase 3 nice-to-have, it's the phone's enforcement mechanism. A thin slice of it (presence only) should ship with the first beta. See [03-roadmap.md](03-roadmap.md).

### 2.3b Context-aware: what the phone will and won't tell us

The original idea was a context-aware Pomodoro that knows *when* someone picked up their phone and *which apps* they used, then shapes study blocks around that. Here's what's actually possible (researched Nov 2026):

| Source | What you get | What you can't do |
| --- | --- | --- |
| **A website / PWA alone** | Nothing about other apps | No Screen Time access at all |
| **Native iOS app + Screen Time API** (FamilyControls, DeviceActivity, ManagedSettings; needs Apple's Family Controls entitlement) | User picks apps → you get **opaque tokens**. You can **shield (block) those apps** on a schedule, get callbacks when usage crosses a threshold ("20 min on picked apps"), and **render** usage charts inside your app | The usage report runs in a sandbox that **cannot send data out**: no network, no writes to your app. Your code never sees app names or raw usage, so you can't upload it to Convex or show it to friends |
| **iOS Shortcuts automations** ("When Instagram is opened / closed" → *Get Contents of URL*) | Works **with the PWA**. Per-app, opt-in, user-installed. Can POST `app + opened/closed + time` to a Convex HTTP endpoint, or **open Pomodeal first** whenever Instagram opens | Setup is manual per app; must turn off "Ask Before Running"; iOS may show a banner; only covers apps the user picks; no history before setup |
| **Android** (UsageStatsManager) | Full per-app usage history to a native app with permission | Not reachable from the web either |

**The interesting one is Shortcuts.** It turns the Quick Deal into an *interception*: you open Instagram, and Pomodeal opens first asking "Reels for 10, then 8 min of reading. Deal?" The app [one sec](https://one-sec.app) uses this exact pattern for a breathing pause, so it works and users accept it. Add one sec to the competitor table: it intercepts but doesn't negotiate or go social.

**Three tiers of context, shipped in order:**

1. **Tier 1, PWA (Phase 1):** self-report through Quick Deal ("what are you doing right now?") plus patterns from your own ledger (time of day, which activity you negotiate most).
2. **Tier 2, PWA + Shortcuts (Phase 1.5 beta, opt-in):** an "Intercept" setup guide for 1–3 apps. App opens become Quick Deals; open/close pings give real "intention vs reality" on the phone. Stores app name + timestamp only, add it to the privacy inventory.
3. **Tier 3, native iOS (Phase 5, if beta asks):** Screen Time shields give real break-end enforcement on the phone; the usage report is shown privately in the app, never uploaded.

### 2.3c Earned breaks (optional mode)

From the Third Time method: break length can scale with focus actually done (e.g. 1 min of break per 3 min of focus), banked in the ledger. This fits the negotiation framing well: you're spending what you earned, and borrowing beyond it shows up as debt. Ship as a preset mode, not the default.

### 2.4 Simplify the stack for the beta

- **Drop R2 until voice memos exist.** Convex file storage is fine for beta scale (a 30 s Opus memo is ~100–150 KB). Revisit the cost crossover when there's real usage.
- **YouTube scenes move to "delight", not core.** They're desktop-friendly but awkward on iOS (autoplay rules). Ship after the core loop is proven.

## 3. The core loop, in one picture

```
 distracted ──► Quick Deal ──► block runs (draining disk)
     ▲                              │
     │                     2-min heads-up (push)
     │                              ▼
  recap ◄── ledger entry ◄── negotiate at boundary ──► next block
              │                 (freebie / borrow / override / bonus)
              ▼
      room presence (friends see state, opt-in ledger summary)
```

Every feature should make one arrow in this loop faster, more honest, or more social. If it doesn't, it waits.

## 4. Success: what "it works" means

| Metric | Definition | Why |
| --- | --- | --- |
| **North star: sessions started / active user / week** | A Quick Deal or preset started | Starting is the problem we claim to solve |
| Deal-keeping rate | % of break ends where the next block starts within 2 min (overrides count as kept) | Is the negotiation actually holding? |
| Focus minutes / week | Sum of completed focus blocks | Outcome users care about |
| W1 / W4 retention | Still starting sessions after 1 and 4 weeks | Timer apps die by week 2; this is the real test |
| Weekly one-question check-in | "Did this week go better than usual?" 1–5 | Cheap qualitative signal |

## 5. Name: Pomodeal

Decided Nov 7, 2026. "Pomo" puts it in the study-timer category people already search for; "deal" names the mechanic. USPTO search for POMODEAL came back clear; pomodeal.app is available.

- Always pair the name with a line that says what it is, so "deal" doesn't read as a coupon site: **"A study timer that makes deals with you."**
- Never write "the Pomodoro Technique" in marketing copy (Francesco Cirillo claims it as a trademark). "Pomodeal" alone is fine.
- "Negotiation" stays as the word for how it works (the negotiation rules, the negotiation sheet).

## 6. Biggest risks

1. **Novelty decay.** Every timer app is exciting for 10 days. Mitigation: social presence, no-shame recaps, Quick Deal friction near zero.
2. **Cold start for rooms.** Rooms are useless alone. Mitigation: beta only with existing friend groups; solo mode must stand on its own.
3. **The override becomes the default.** If everyone just taps "I need this", the negotiation is theater. Watch the override rate in dogfooding; adjust terms, not by blocking.
4. **iOS PWA limits.** Push only works when installed to the home screen; background JS is suspended. Mitigation: all timing server-side (Convex scheduler → Web Push), install prompt in onboarding.
5. **Scope.** This is three products (timer, enforcer, social space). The phase gates in the roadmap exist to stop building the next one before the last one is used.
