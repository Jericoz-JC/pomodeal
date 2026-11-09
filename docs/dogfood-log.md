# Dogfood log

## Device checks for Chris (big ones)

Nothing here has run on a real device yet. Env var names only; set values yourself.

- [ ] Dev Convex deployment: set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT`; set `VITE_VAPID_PUBLIC_KEY` in `.env.local`.
- [ ] Optional AI: set `ANTHROPIC_API_KEY` and `AI_SUGGEST_ENABLED=true` on dev, then ask for one suggestion on "Lab report due Thursday".
- [ ] iPhone (iOS 18.4+), installed to the Home Screen: the heads-up push and the block-end push each arrive once; Keep screen on works.
- [ ] Android Chrome, in a tab and installed: push works.
- [ ] iPhone Safari tab: every flow works without push.
- [ ] Two devices signed in: minutes left match within 1 second.
- [ ] After a day of dogfooding: zero duplicate push sends per boundary in `npx convex logs`.

## Voice pass

New copy the implementers flagged for Chris to read against `docs/specs/003-voice-and-copy.md`:

- "That was the last block."
- Menu descriptions on the big-one cards
- "Last pick"
- iOS 26: Share now sits behind "⋯" in the install sheet
- "Not this one"
- "Take a break first"
