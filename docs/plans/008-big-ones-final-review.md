# Final whole-branch review: feature/big-ones (df3f440..9fd3dae)

Reviewer: final whole-branch seat (R72). Read-only. Reviewed in passes: (1) Convex schema and every new or changed function, (2) core rules and tests, (3) `apps/web` bridge, service worker and build output, (4) the prototype's cross-task seams (Backend/LiveApp calls, notes sheet, tick loop, push/install offers), (5) docs, privacy inventory, ledger triage. The prototype diff (+1518 lines) was read at its seams, not line by line; per-task reviews covered its internals.

Checks run once each, all green:
- `npm test`: 5 files, 94 tests passed
- `npm run test:convex`: 5 files, 75 tests passed
- `npm run typecheck`: clean (core, web, sw, convex)
- `npm run build:web`: built; `dist/sw.js` is a classic script (no `import`/`export`), registered at the same `/sw.js` scope `/` as before, contains the precache manifest, `push` and `notificationclick` handlers. Working tree still clean afterwards.

Also checked: no `Co-Authored-By`/"Generated with" lines in any branch commit; no secrets committed (`.env.production` holds only the public Convex URL and WorkOS client id; VAPID/Anthropic keys appear only as env var names).

## Strengths

- **Production-safe schema.** Every addition to existing tables is optional (`sessionState.version`/`scheduledIds`, `users.lastRepay`, `sessions.taskId`/`notedIdx`; convex/schema.ts:19-21, 60, 81-82), and every reader tolerates the absence (`s.state.version ?? 0` in sessions.ts:46 and push.ts:73; `doc.lastRepay ?? null`). New tables and indexes are pure additions. `convex deploy` against current prod data will validate.
- **Old cached clients keep working.** `sessions.start` now returns `{ sessionId, serverNow }`, but the pre-branch client ignored the return value; `dayKey` is optional on `start/next/end` (R12) and covered by a test (tasks.test.ts:146).
- **Single writer for session state holds across tasks.** Every post-start write goes through `saveState` (sessions.ts:37-55), which bumps `version`, carries `scheduledIds`, and either reschedules or cancels; `startSession` is the only insert and is used by `sessions.start`, `tasks.create` and `tasks.startFromCard`. `blockNotes`, `remove` and `creditTask` patch only `notedIdx`/`taskId`/the task, never `state`. The last-block `next` no longer schedules (sessions.ts:193-194, test push.test.ts:95).
- **Authorization is uniform.** Every new public function resolves identity from the token (`requireMember`/`currentMember`, lib/members.ts) and checks ownership (`ownTask`, `ownSession`, row `userId` checks in ai.ts:91,103 and push.ts unsubscribe). `fire`, `subscription`, `recordResult`, `send`, `suggestPieces`, `writeSuggestion`, `sweepSuggestions` and `metrics.beta` are all internal. No identity comes from args.
- **AI privacy promise is enforced server-side.** The model input is built from the stored, scrubbed title plus type and gut size only (ai.ts:49-72); the validator rejects a client title or daysLeft (test ai.test.ts:126); SDK retries are off (aiNode.ts:67) so the counted limit is a real cost ceiling; logs never hold title or output.
- **Feature switches fail closed.** Without `VITE_VAPID_PUBLIC_KEY` nothing offers push or the install sheet (main.ts `sendEnv`, R52); without VAPID env a send logs `push_failed` and stops; AI needs both `AI_SUGGEST_ENABLED=true` and a key (lib/suggestions.ts:8-10). On merge, prod gets none of these, so push and AI are inert, and the daily cron only sweeps empty tables.
- **Service worker switch is a faithful replacement.** sw.ts reproduces generateSW's behaviour (skipWaiting, clientsClaim, precache, cleanupOutdatedCaches, index.html navigation fallback), keeps the filename and scope, and adds a same-origin-only `notificationclick` path (core `samePath` plus a second check in sw.ts:32).
- **Privacy inventory (spec 006) is accurate and complete** for every new table, field and device key I could find (cross-checked against schema.ts and a grep of every `pomodeal.*` storage key), including the push-service and Anthropic rows in "Sent to third parties".
- **Tests are behavioural, not mock-heavy.** convex-test drives real mutations; the spec's numbered tests 1-12 all exist (e.g. midnight local keys days.test.ts:101; ramp with taskId tasks.test.ts:58; stale version push.test.ts:109; limiter ai.test.ts:70,90). Timing is controlled with fake timers or `setSystemTime`; the only real-clock assertions use a 5 s tolerance.

## Issues

### Critical (Must Fix)

None.

### Important (Should Fix)

1. **Weekly check-in is asked on a new member's first open, any day of the week**
   - File: packages/core/src/bigOne.ts:311-313 (`shouldAskCheckIn` returns true when there is no previous answer); apps/web/src/main.ts `pushWeek` (goLive, the `checkIns.lastWeekKey` subscription).
   - What: a tester invited on a Wednesday sees "Did this week go better than usual?" before they have used the app at all. Spec 008 says "first open on or after Sunday", i.e. a Sunday boundary has to pass first.
   - Why it matters: success number 4 ("most weekly check-ins say Better") is the beta's only direct read on how it feels, and day-one answers have no week behind them. Task 19's next step is inviting testers, who are exactly the people affected. (Existing members asked on merge day is fine: they have weeks of use, and today is a Sunday.)
   - Fix: when there is no previous answer, ask only if `weekKey(today) > weekKey(localDayKey(joinedAt))`. `checkIns.lastWeekKey` (or `beta.me`) can return `joinedAt`; the client turns it into a local key. Add the core case to bigOne.test.ts:115.

2. **Push is not ready to switch on (it is inert on merge, so this gates setting VAPID keys, not merging)**
   - (a) The break-end push only ever fires if the student opens the app at the focus end. The server schedules pushes for the current block only (convex/lib/pushSchedule.ts:39-53, core `pushTimes`), and nothing on the server advances a session at a boundary: the break starts when a client calls `sessions.next` (sessions.ts:183-196). A student who reads "Paper block is done. Your break is ready." on the lock screen and walks away never gets the end-of-break tap, yet the iPhone install sheet's headline is "Want a tap when your break ends?" (prototype index.html:1513). This is the Task 13 "note for Chris"; it needs a product call: either the server advances at block end (CLAUDE.md's "Block boundaries are Convex scheduled functions"), or the install copy and the focus-end push stop implying a timed break.
   - (b) No resubscribe path (Task 14 deferred): no `pushsubscriptionchange` handler in sw.ts and no silent re-sync in `goLive`, so a rotated or expired subscription silently stops all taps on that device.
   - (c) `pushNode.send` has no test (Task 13 deferred): the missing-VAPID branch and the 404/410 status mapping run only on a real device.
   - Fix (a) and (b) before setting VAPID keys on prod; add (c) with `vi.mock("web-push")`.

3. **Settings is referenced by spec 008 but does not exist, so three one-way doors stay shut**
   - Files: prototype `offerPush`/`offerInstall` (index.html:943-952), AI consent (index.html:~1747, 1950), privacy inventory 006:167.
   - What: the push offer and the install sheet are consumed once shown (R53), and "I'll split it myself" hides "Suggest pieces" on that device (R68). Spec 008 says each is "shown again from Settings" and Android's install prompt "stays available from Settings".
   - Why: a student who taps "Not now" once can never turn on taps in-app. Known and ruled; listed here because it is the one spec-coverage gap beyond the device checks and keys. It can wait for a Settings task, but should land before push is switched on.

### Minor (Nice to Have)

1. **Wrong ADR number introduced in spec 001.** docs/specs/001-negotiation-rules.md:143 now reads "Chris kept the wind as the one exception (ADR 0005)". The ring-wind decision is ADR 0004 (`docs/decisions/0004-ring-wind-animates-fill.md`); the rebase renumbering (commit e02f7fb) replaced one 0004 too many. One-word fix.
2. **"Not yet live" becomes false the moment this merges.** README.md:30, docs/03-roadmap.md:17-18 and CHANGELOG.md:5 say "Built on branch `feature/big-ones`, not yet live". Roadmap "Next, in order" still lists Web Push (item 1, now built), the motion pass "on a branch" (item 2, already merged) and the privacy inventory (item 3, now done) as outstanding (Task 19 deferred). Update in the release commit along with the version tag (R73).
3. **Every block change schedules two `push.fire` jobs for every member, even with push off.** convex/lib/pushSchedule.ts:48-50 schedules regardless of whether the user has any subscription; `fire` then reads an empty index. Harmless at beta scale; a `pushSubscriptions.by_userId` `.first()` check in `reschedule` would skip the scheduler entirely for most members.
4. **Unthrottled public writes.** `push.subscribe` inserts without a per-user cap (sends are capped at the newest 10, push.ts:74-78); `events.logClient` and `sessions.serverNow` have no rate limit, and a member can inflate their own metrics events. Fine for 8 to 15 friends; worth a limiter before any public launch.
5. **Card order and `tasks.open` disagree on never-worked big ones.** convex/tasks.ts:17 sorts by `lastWorkedAt ?? createdAt`; core `cardsFor` (bigOne.ts:254) uses `lastWorkedAt ?? 0`, so a big one named and stopped before a full minute was credited sorts below every worked one. Intentional per the R19 test (bigOne.test.ts:140), but the two orders should match.
6. **Declarative push `navigate` is a relative path.** core push.ts:40 sends `navigate: "/"`. WebKit's published examples use absolute URLs. If Safari rejects a relative URL the installed app's service worker still shows the push, so the risk is low; add "tap a push on iPhone 18.4+ opens the running session" to the device checklist (docs/dogfood-log.md).
7. **Last-block `next` credits the big one every time it restarts the block.** sessions.ts:190 credits `focusMinutesDone` on every `next`, and on the last block core `advance` restarts it. In the current UI a big-one session leaves its last focus block through "Stop for now" (ends the session), so I could not find a reachable loop. But the server trusts the client not to call `next` repeatedly there, and any later client path that does (a plain-session-style auto-advance, a stale tab) would credit phantom minutes, drive open terms to 0 and suppress the comeback card. Consider ending the session on the last block's `next` when `taskId` is set (this ties to the Task 13 note about the last-block restart loop).

## Deferred-minor and note triage

"Must fix before merge" means it would ship wrong behaviour, wrong data or a false privacy statement to current beta members on merge. "Before switching on X" means it is inert until Chris sets the env for X.

| Ledger line | Status now | Triage |
| --- | --- | --- |
| T1: "only the student" vs "Chris can see all rows" (006) | 006:7 still says "only the student can read them"; 006:9 says Chris can see all rows | Can wait. One-clause edit ("only the student, and Chris as operator") would remove the contradiction |
| T1: checkIns/aiUsage retention not in spec | aiUsage now ~2 days (R67); checkIns "kept through the beta" | Can wait |
| T1: scheduledIds cleared / 410 deletion not in spec | Implemented (`cancelPushes`, `recordResult` gone) | Resolved |
| T1: tokenIdentifier "visible to student" | Unchanged (006:17) | Can wait |
| T1: push label can be typed text | Documented in 006 "Sent to third parties" | Resolved |
| T2: piece minutes integer, titles unvalidated | Validated (bigOne.ts:111-114) | Resolved |
| T2: bigOneProblem and cleanLine separate | Unchanged | Can wait |
| T3: isComeback assumes workedDays[0] newest | `addWorkedDay` prepends the latest-sent key, so a single out-of-order key (stale tab, wrong device clock) is superseded by the next block | Can wait |
| T3: proposeSpread with due < today | Client ignores past due dates; server `spreadProblem` still accepts a past due | Can wait |
| T3: zero-minute spread days | Fixed (bigOne.ts:194-198, test days.test.ts:134) | Resolved |
| T3: pieces fewer than days pack from today | Matches spec | No action |
| T3: days.ts malformed key | Server checks `isDayKey` on every input | Can wait |
| T3: no test for stamped pieces skipped in spread | Unchanged | Can wait |
| T3: progressLabel tests in days.test.ts, stale names | Unchanged | Can wait |
| T4: pushTimes / scrubForAI edge tests | Unchanged | Can wait |
| T4 / T17: EMAIL_RE trailing punctuation and spacing | Over-strips (the privacy-safe direction) | Can wait |
| T5: helpers bundled | Fixed by R11 (multi-dot files) | Resolved |
| T6: blockNotes accepts fromIdx ahead of current block | Unchanged (tasks.ts:141-145); only the owner's client can do it | Can wait. One guard: reject `fromIdx > s.state.idx` |
| T6: ownership tests use toBeDefined() | `codeOf` returns a code or "THREW", so the tests do assert a refusal, but not which one | Can wait |
| T6: tasks.open takes newest 50 by creation | Unchanged | Can wait |
| T6: saveSplit round-trip of stampedAt/plannedDay | Done in Task 15 (main.ts `cleanPiece`) | Resolved |
| T6: sessions.start with taskId doesn't reopen set-aside | The client never sends taskId to `start` | Can wait |
| T6: deal validated twice | Harmless | Can wait |
| T7: clock offset measured once per load | Unchanged | Can wait; re-sync on `visibilitychange` later |
| T8: namedAt accepts NaN/Infinity | Unchanged (tasks.ts:108); affects only metric 1 for that one event | Can wait |
| T8: no cardsFor test dropping non-open | Unchanged | Can wait |
| T8: `.vitest/` in .gitignore (must fix) | Done (.gitignore) | Resolved |
| T9: text typed before the chip cut at 80 | Unchanged | Can wait |
| T9: BIG_TYPES comment | Unchanged | Can wait |
| T9: empty firstMove passed through | Allowed by core; card hides an empty "Start with" | Can wait |
| T10: #go with no next block calls stopNow for any boundary sheet | Unchanged | Can wait |
| T10: pasted newlines kept in bookmark | Unchanged; a newline reaches the card text | Can wait |
| T10: doneChip tabindex via roving() | Unchanged | Can wait |
| T10: bonus sheet acts on current block after remote move (pre-existing) | Unchanged | Can wait |
| T10: takeBonus not guarded by movedOn() | Server `bonus` no-ops on a break, so data is safe; the screen shows 10 phantom minutes until the next doc | Can wait; one-line guard, worth bundling with the check-in fix |
| T10: moved-on sheet "Start X" label | Unchanged | Can wait |
| T11: loadCard discards a half-filled draft | Unchanged | Can wait |
| T11: #sealpre accessible name "Deal" | Unchanged | Can wait |
| T11: disabled menu rows skipped by keyboard/SR | Unchanged | Can wait |
| T11: wake lock held while a sheet is open after a remote move to a break | Unchanged | Can wait |
| T11: first server doc after startCard drops S.firstMove | Falls back to the card's startWith, which is the same text in the normal path | Can wait |
| T11: comeback_shown dedupe per device | Inflates metric 3's denominator for multi-device members | Can wait; note it beside metric 3 |
| T11: slow readAside could reset hasAside | Unchanged | Can wait |
| T12: full ticket flashes before cards fold | Cosmetic | Can wait |
| T12: running screen shortens title at first comma (vs R20) | Unchanged | Can wait (voice/taste pass) |
| T12: `.ticket.big` vs dial `.big` | Unchanged | Can wait |
| T12: dead data-default, stale comments, magic numbers | Unchanged | Can wait |
| T12: quickOpen latch, "Back to a new deal." announcement, redundant selector | Unchanged | Can wait |
| T13: send untested | Unchanged | Before switching on push (Important 2c) |
| T13: failed send unrecorded if subscription deleted mid-flight | Unchanged | Can wait |
| T13: payload validator duplicates core type | Unchanged | Can wait |
| T13 note for Chris: server pushes but doesn't advance sessions | Unchanged | Before switching on push (Important 2a). Product decision |
| T13 note for Chris: client restarts the last block until ended | Unchanged; latent crediting risk for big ones (Minor 7) | Can wait; decide with 2a |
| T14: iosSafari detection misses in-app webviews and iPadOS | Unchanged (main.ts `isIOS`) | Before switching on push (install sheet would tell an Instagram webview user to "Add to Home Screen") |
| T14: no resubscribe once granted | Unchanged | Before switching on push (Important 2b) |
| T14: install offer spent while a sheet hides the panel | Unchanged | Before switching on push |
| T14: unmappable push shows nothing, duplicate path check, icons precached twice | Unchanged | Can wait |
| T15: re-spread can stay on the card after signing | Superseded by R63 (offer only when a planned day slipped) | Resolved |
| T15: sticky Save covers the gut line; Close drops unsaved edits | Unchanged | Can wait |
| T15: exam with < 10 open minutes gets one day | Unchanged | Can wait |
| T15: past due date ignored silently; minutes rounded; snapshot drops a stamp set on another device; Escape announcement | The stamp loss needs two devices at once (split open on A while B stamps) | Can wait; a server-side merge of `stampedAt` by index in `saveSplit` would close it |
| T15: unused `.pperf`, focus to Undo | Unchanged | Can wait |
| T17: `_scheduled_functions` keeps the scrubbed title in job args | Unchanged: the title copy outlives the 24 h suggestion row and a deleted big one, and 006 does not say so | Before switching on AI. Pass only `suggestionId` and read the title in an internal query, or add the line to 006 |
| T17: aiSuggested never resets on a later manual split | Unchanged | Can wait |
| T18: check-in hidden before the server confirms; ai_accepted read in window only; take(CAP) truncates silently; inventory placement | Unchanged | Can wait |
| T19: roadmap items stale; auth refresh token in localStorage not in 006 (pre-existing) | Unchanged | Roadmap: at merge (Minor 2). Refresh token: can wait, but 006 claims to list every device key, so add it before more friends join |

## Recommendations

- Before merging, make sure the dev deployment is at 9fd3dae (`npx convex dev --once` on the branch) so the first prod bundle of the two `"use node"` files (`web-push`, `@anthropic-ai/sdk`) is not untested. A failed `convex deploy` fails the Cloudflare build before the site ships (ci-build.mjs), so the failure mode is safe, just noisy.
- When push is switched on, do 2a, 2b and the iOS detection together and re-run the device checklist; until then, leave `VITE_VAPID_PUBLIC_KEY` out of `.env.production`.
- Fold the one-liners (Minor 1, T10 takeBonus guard, T6 blockNotes future index) into the check-in fix commit.

## Declined to judge

- Visual taste and the r3 design scores below target (consistency 6, designer colour 7): handed to Chris by the build loop.
- Final copy against the voice spec (003 doesn't exist yet): listed in docs/dogfood-log.md "Voice pass".
- Real-device behaviour (iPhone/Android push delivery, wake lock, two-device clock offset): Chris's checklist by R6/R18/R51.
- Live AI suggestion quality and the `output_config` request shape against the real API: no key, deferred to Chris by R7. Typecheck confirms the SDK accepts the shape.
- Metric definitions (R71) and gut-vs-actual not being computed: accepted rulings, spec lists them as context only.
- Prototype internals beyond the cross-task seams: reviewed per task.

## Assessment

**Ready to merge? With fixes**

**Reasoning:** Merging is production-safe: the schema is additive, old cached clients keep working, push and AI stay inert without env, the service worker updates existing installs, and the plain Quick Deal path is unchanged apart from the new optional chip, wake-lock toggle and check-in card. Before merging, or at the latest before inviting new testers, gate the weekly check-in on a week having passed since joining (Important 1) and fix the two doc slips (Minor 1-2). The push items (Important 2) and the AI job-args retention gate switching those features on, not the merge.
