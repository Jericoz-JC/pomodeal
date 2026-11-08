# Stack and Hosting

Nov 7, 2026. Free-tier figures come from third-party summaries of each vendor's pricing; confirm on the vendor's own pricing page before relying on an exact number.

## Recommendation in one line

**Cloudflare Pages for the web app, Convex for the backend, the domain on Cloudflare DNS** (buy it on Cloudflare Registrar, or buy it on Vercel and point its nameservers at Cloudflare). Everything stays free through the beta. The repo builds on Vercel too, so this is a reversible choice.

## Why not Vercel, when everything else is already there

Vercel is great and the build already works there (`vercel.json`). Three things on the free **Hobby** plan bite this project specifically:

1. **Non-commercial only.** Hobby is limited to personal, non-commercial use. The moment Pomodeal charges anything, it needs Pro at $20 per member per month.
2. **One developer.** Hobby can't add collaborators, and deployments are blocked when the commit author isn't the account owner. Your dev friends' commits wouldn't deploy.
3. **The AI co-author trailer.** Vercel's forum has reports of Hobby blocking deploys for commits with a Claude Code `Co-Authored-By` line, which every commit in this repo has.

Cloudflare Pages has none of those limits on its free plan: commercial use is fine, static assets don't count against a quota, and there's no commit-author rule. R2 storage (for voice memos later) lives in the same account.

Keep your existing sites on Vercel. Only Pomodeal moves.

## Free tiers that matter

| Service | Role | Free tier (verify on the vendor's site) | When we'd outgrow it |
| --- | --- | --- | --- |
| **Cloudflare Pages** | Hosts the PWA (static files) | Static requests not metered; about 500 builds a month; Functions share the Workers free quota of 100k requests a day | Practically never for a static PWA |
| **Convex** (Free plan) | Database, realtime sync, scheduled block ends, file storage | About 1M function calls a month, 0.5 GB database, 1 GB database bandwidth, up to 6 developers | Around a few hundred daily users with rooms on; Starter is pay-as-you-go after that |
| **Cloudflare Registrar** | pomodeal.com | Sells at wholesale cost with no markup (about $10–11 a year for .com) | |
| **GitHub** | Code, PRs, Actions | Unlimited private repos and collaborators | |
| **Better Auth + `@convex-dev/better-auth`** | Sign-in (magic link and Google) | Open source; no per-user fees | |
| **Resend** | Magic-link emails | Free tier covers a beta | When sign-ups pass a few thousand a month |
| **Web Push (VAPID)** | Block-end notifications | Free, browser-native | |
| **Chrome Web Store** | Extension listing | $5 one-time developer fee | |

**Rough usage estimate for a 20-person beta:** about 3 sessions per person per day × ~50 Convex calls = 3k calls a day, plus room presence heartbeats (about 5k a day) = roughly 250k calls a month. That's a quarter of the free allowance.

## The stack (what changes from the thesis)

| Layer | Choice | Change from thesis |
| --- | --- | --- |
| Web app | Vite + React + TypeScript, `vite-plugin-pwa` | **No Tailwind.** The design lives in our own CSS tokens (paper, ink, one green, the hatch); Tailwind would pull it back toward the template look |
| Shared logic | `packages/core`, pure TS, vitest | New. Rules and timer math, already tested |
| Backend | Convex | Same |
| Auth | Better Auth via the Convex-maintained component | Decided: it's the actively maintained option; the extension gets its token through the handshake in the extension roadmap |
| Files | Convex file storage | **R2 dropped** until voice memos exist and usage says otherwise |
| Push | Web Push from a Convex Node action, triggered by the scheduled block-end job | Spelled out |
| Extension | WXT, Manifest V3 | Same; see `06-chrome-extension-roadmap.md` |
| Hosting | Cloudflare Pages | **Changed from Vercel** (reasons above) |
| Errors | Sentry free tier, added in Phase 1 | New |
| Product analytics | Our own events table in Convex, no third-party tracker | New; keeps the privacy promise simple |

## Planned features and what they cost

| Phase | Feature | Free-tier impact |
| --- | --- | --- |
| 1 | Quick Deal, dial, negotiation sheets, ledger, presets | A few Convex calls per action |
| 1 | Install to home screen, Web Push at heads-up and block end | One scheduled function per block |
| 1 | Sign-in (magic link, Google), sync phone ↔ laptop | Auth tables in Convex |
| 1.5 | Rooms with live presence and check-ins | The biggest usage driver: presence heartbeats. Use the Convex presence component with a 30–60 s interval |
| 1.5 | Intercept via iOS Shortcuts | One HTTP action per app open |
| 2 | Chrome extension (side panel, Dim, domain logging) | Same Convex functions; one write per block |
| 3 | Shared sessions, break-only chat, voice memos | Memos: about 120 KB each in Convex file storage |
| 4 | Weekly recap, ramp-up suggestions | One scheduled job per user per week |

## Domain plan

- `pomodeal.com` serves the app (the PWA works best on the root domain, with no extra hop to `app.`).
- `www.pomodeal.com` redirects to the root.
- Later: `pomodeal.com/privacy` and `/terms` as static pages, needed for the Chrome Web Store listing.

If you'd rather buy on Vercel since your other domains are there: buy it, then in Vercel's domain settings change its nameservers to the two Cloudflare gives you when you add the site to Cloudflare. Cloudflare needs to run DNS for the root domain to point at Pages.
