# Changelog

## Unreleased

- Fix: "Today's deals" showed yesterday's deals ([#26](https://github.com/Jericoz-JC/pomodeal/issues/26)). The tape was the last 24 hours, so at 11am it still held yesterday's noon deals. A day now runs 4am to 4am (ADR 0009): the tape and its totals hold only today's, and a late night stays one night, on the tape, on tonight's plan and on your big ones.
- Home is the standing ticket (spec 015): the next big one is written into the deal ticket ("30 min of History paper.") and DEAL starts it at its length; the others are written lines under it with one Start stamp each, and a name swaps onto the ticket. The name on the ticket opens its jobs (no more "…"), Take a break first is on the ticket, and Quick deal swaps the ordinary deal on. After finishing a task, home is full instead of a folded row over a blank band.
- The desk (spec 014): at 820 px and up the screen is three objects, the ticket, the tape and, while tonight is written or printed, the roll along the front edge: tonight drawn to scale over a clock. It is outlined while you write, paper once printed, a green foot grows as the running sitting is paid, and Done lands on it. Drag a length along the roll to change the order. On home, the names you already use lie on the roll; one press starts tonight. Ticket and tape start on one line, every decision sheet hangs from it, and the done sheet stops above the roll so its stamp lands there.
- Tonight in a line (spec 012): write several assignments as one sentence with commas ("history paper 1h, orgo set 4, bio ch 7"), stamp Print, and each deal takes the next sitting. Names you already use are offered under the sentence, a list pasted from your notes becomes its items, and the night is drawn to scale under the sentence on a phone. Tonight is stored per local day (the `nights` table), so a reload or another device keeps it, and a sitting started on one device is taken on all of them; nights are deleted 2 days later.
- Dark mode with the lamp off (spec 013): one polarity, light ink on dimmed paper, one dulled green; no pale slabs on a black desk.
- The sign-in page no longer plays a staged stamp before anyone touches it; it opens on the ticket at rest.
- Smaller: the ring ends in a clean cut; a chosen length is its green ink without a check glyph; the tape no longer says "Big one" or the serial, and says "Time's up" under the done sheet; the done stub's Done stamp no longer stretches across its minutes; "Keep the timer on top" hides while a sheet is open.
- One paper, one voice (spec 011): a visual overhaul of every screen, same flows. Torn edges are soft round half-holes instead of sharp triangles, everywhere. One heading face at two widths instead of eleven, so the done ticket and the next round now match, and no number shows a slashed zero. Three kinds of action on every sheet: a stamp commits, a paper button ("Done for now") declines, a link is the quiet way out. The room is one roster, ledger tags are readable, desktop decisions rise from the bottom of the stage, and dark mode has lighter paper and a calmer green.
- Clearer words across the app: "Needs more than one sitting?", "First sitting on History paper", "Take them from my next break. If I stop after this, I don't owe them.", "Keep going for 10 more minutes", "Just give me the 5 minutes", "Get a notification when a block ends" and more (the full list is in spec 011).
- Screenshot scripts close every browser process they start, however they end.
- One ticket, one sitting (spec 010, ADR 0007). A deal is now exactly what you stamped: your break, then one study block, then a done sheet that says "That was the deal." From there you can stamp another round (quick lengths step up 5 → 8 → 12 → 15 → 20, long ones repeat), say Done for now, or take 10 more minutes. Before, a deal quietly ran 2 or 3 blocks, the next break started on its own after 30 seconds, and the last block restarted instead of ending.
- Borrowed minutes come off your next round's break, and are cleared if you're done for now.
- The tape gets a green Done stub for a deal that ran its full time, dated when it finished even if you tap later.
- On a big one, the done question ("Is History paper finished?") no longer starts with "Not yet" picked.
- Screen readers: announcements made while a sheet is open are now spoken (the live region was inside the part of the page that goes inert), and every sheet opens on its heading.
- Fix: deals now reach the ledger. Before, the server saved only asks, the bonus and cleared minutes, so a deal made on your phone was gone from the tape a few hours later (ADR 0006). The tape now keeps the deal you made, where you stopped (on a big one: which one and how many minutes you'd done) and a block you ended early, on every device and after a reload. Rows from before the fix stay as they were.
- Desktop: the tape beside the clock fits the window and scrolls on its own, so a long night no longer pushes its head off the top or its last line below the fold.

## v0.3.0 (2026-11-09)

Everything since v0.2.0: the closed beta going live, big ones, and the desk-and-feel design round (spec 009).

### The desk and the feel (spec 009)

- One action language: everything that commits you is a stamp. It lifts, slams down with the ink, and the ticket takes the knock; the action happens once it lands. The DEAL you press flies to the head of the running ticket and stays there, large and inked.
- Asking for more time: your ask is quoted small and the clock answers, said by a small copy of the wheel that shows the 5 minutes on offer. Each term is one plain sentence ("Take them from my next break. It goes from 5 minutes to 2.") that you take by stamping it. No "5 → 2" figures.
- The split planner is one ticket torn into pieces: drag a tear line to make a piece longer or shorter (a slider for the keyboard). No more plus and minus steppers.
- Desktop: the running ticket fills the stage with a wheel you can read from across a desk; tonight's deals print on a receipt tape beside it. Keyboard shortcuts: D deals, 1 and 2 take a term, M asks for more, S stops. In Chrome and Edge the wheel can float in an always-on-top window.
- No navigation bar on any screen size. The room opens from the line of friends' faces.
- The wheel is redrawn as smooth SVG strokes (break = hatched, focus = solid green).
- Motion, judged in real-speed clips: the tape feeds out each new deal and inks its stamp; at a block change the old title leaves and the new one rises in; the heads-up re-stamps the number. Reduced motion keeps the meaning without the travel.
- Theme: Device, Light or Dark from the account menu, kept on that device.
- The landing page is rebuilt from the app's own ticket, wheel, stamp and ask.
- Invites: a used ticket says who joined; the invite code survives sign-in in a new tab and a dropped connection; a failed "Make an invite ticket" says so.
- Chrome extension spike E0 (in `spikes/extension`, not shipped).
- `shoot.mjs` and `shoot-motion.mjs` capture desktop widths; `shoot-motion.mjs` has tape and landing moments.

### Earlier in this release

- README: what's live, what's still being checked, what isn't built (no blocking yet), and the research behind big ones.

- Big ones (spec 008, merged Nov 9): name a 2 to 4 hour task and start with a 15 min first payment and a named first move. Leave a "Next time, start with" bookmark at the end of a block and find it on the card next time.
- Day-2 and comeback cards bring a big one back kindly, with a smaller first move offered; nothing ever reads as overdue.
- Split and spread: cut a big one into pieces, and optionally spread them over the days before the due day; a re-spread is offered only when a signed plan slipped.
- Taps at block ends: Web Push at the heads-up and block end (custom service worker, scheduled with a version check so stale pushes never fire), plus an iPhone install sheet and a Keep screen on option.
- Optional piece suggestions with Claude Haiku 5.5: off unless switched on at the server, one opt-in tap each, only title, type and size are sent, 10 a day per member.
- A weekly one-tap check-in ("Did this week go better than usual?") and a beta metrics query for Chris.
- Privacy inventory (spec 006) covers every new table and device key.
- Closed beta live at https://pomodeal.app: Cloudflare Worker + Convex production + WorkOS AuthKit with one-tap GitHub / Google / Apple sign-in.
- Invite-only beta: invite codes and links, 11 invites per member, waitlist, admin commands.
- Landing page with a playable deal ticket (four design-council rounds), install hint, noindex for the closed beta.
- App screens after design-council rounds 5–10 (average 7.67 → 8.22).
- Phase 1: members' screens run on the real backend (start, ask, next, bonus, end, today's ledger), synced across devices.
- Build: `npm run build` deploys Convex first when `CONVEX_DEPLOY_KEY` is set, so every push to `main` ships site and backend together.
- Longer study blocks: 30, 45 and 60 min next to 5–20 (spec 007). Long blocks hold their length, get a quarter-length break, a 5 min heads-up and a quiet halfway line; no block grows past 75 min. Quick deals of 20 now ramp to 25, not 28.
- Motion pass: the stamp lands with a press and one rebound (with a buzz on Android), and the stub falls away as the ticket shrinks into the session's header. A new block, or minutes you just bought, wind onto the dial. Heads-up and time-up re-ink the number with a soft buzz; ask for time and the terms come off a pad; new ledger stubs push the pile down. The landing page shows a wordless sample deal on first load. Reduced motion gets short fades or nothing.
- Fix: "Take my break" no longer misses a press (pausing the countdown used to shift the sheet under the pointer).
- `prototypes/shoot-motion.mjs` records each motion moment as frame strips and side-by-side clips (light, dark, reduced) for design review.

- Renamed to **Pomodeal** (docs, package names, PWA manifest, device-id key). Tagline: "A study timer that makes deals with you."
- Stack and hosting plan (`docs/07-stack-and-hosting.md`): Cloudflare Pages + Convex + WorkOS AuthKit, plus invite list, rate limits and a kill switch to stay in free tiers; Cloudflare `_headers` for the service worker.

## v0.2.0 (2026-11-07)

- Monorepo with npm workspaces: `apps/web`, `packages/core`, `convex/`.
- `packages/core`: negotiation rules (freebie, borrow, trade, override, bonus, ramp-up, earned breaks) and timer math as pure functions, with 15 tests covering spec 001.
- Convex backend: sessions and ledger tables; start / ask / next / end mutations; current-session and today's-ledger queries.
- Installable PWA shell (Vite + vite-plugin-pwa) serving the design prototype, with icons and an offline service worker.
- Vercel config that deploys Convex and builds the web app on every push to `main`.
- Chrome extension roadmap (`docs/06-chrome-extension-roadmap.md`).

## v0.1.0 (2026-11-07)

- Concept v2, platform and deployment plan, roadmap with gates, build loop with the design-review council.
- Spec 001 negotiation rules; Phase 0 research kit.
- Clickable Quick Deal prototype after design round 4, plus the screenshot script.
