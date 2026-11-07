# 0001: PWA first, Chrome extension second

Date: 2026-11-07 · Status: proposed

## Context

Distraction for the target users mostly happens on the phone (reels, TikTok). A Chrome extension can't reach the phone; a PWA can't block other apps. The Chrome timer category is already crowded.

## Decision

Ship the web app as an installable PWA first (Phase 1). Add a Chrome extension in Phase 2 as a desktop enforcer and side-panel timer. Both share one Convex backend and the pure logic in `packages/core`. Consider native mobile only if beta users say phone enforcement is their top need.

## Consequences

- Phone enforcement in the beta relies on push notifications and room presence, so a thin social slice ships with the first beta.
- All timing must be server-scheduled because iOS suspends PWAs in the background.
- Onboarding must teach "Add to Home Screen" or iOS push won't work.
