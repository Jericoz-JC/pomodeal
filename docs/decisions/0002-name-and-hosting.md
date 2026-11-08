# 0002: Name Pomodeal; host on Cloudflare Pages

Date: 2026-11-07 · Status: name accepted; hosting proposed (waiting on Chris)

## Context

The working name was Negotiation Clock. Chris found pomodeal.com available and a clear USPTO search. For hosting, the PWA is static files plus Convex, so any static host works; the free tiers differ on commercial use and collaborators.

## Decision

- Product name: **Pomodeal**, tagline "A study timer that makes deals with you." "Negotiation" stays as the name of the mechanic.
- Sign-in with **WorkOS AuthKit** through Convex's official integration (free up to 1M monthly active users), with our own invite list and rate limits in Convex controlling access and usage.
- Host the web app on **Cloudflare Pages** with Convex as the backend. Keep `vercel.json` so the repo still deploys on Vercel if we switch back.

## Consequences

- Dev friends can push and get preview deploys without a paid seat.
- Charging money later doesn't force a hosting upgrade.
- Root-domain DNS has to be on Cloudflare (buy there, or point the nameservers there).
- Rename touched docs, package names, the PWA manifest and the device-id key. The prototype's `<title>` gets renamed once the design loop finishes editing it.
