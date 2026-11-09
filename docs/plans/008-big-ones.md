# Big Ones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a student start a 2–4 hour, multi-day task with a 15 min first payment and a named first move, come back to it through a bookmark card, and plan it only if they want to, without anything ever reading as overdue.

**Architecture:** All rules (open terms, comeback, spread, progress, push timing, AI limits) are pure functions in `packages/core/src/bigOne.ts` and `packages/core/src/days.ts`, tested with vitest. Convex stores big ones in a new `tasks` table, links sessions to them with `sessions.taskId`, and schedules block-boundary pushes with a version check. The screens stay in the prototype engine (`prototypes/quick-deal/index.html`); `apps/web/src/main.ts` turns Convex documents into ready-to-render view models with core, so the prototype mirrors only copy tables, never rules.

**Tech Stack:** TypeScript, vitest, Convex (+ `convex-test` for function tests), Vite + vite-plugin-pwa (switching to `injectManifest` for a custom service worker), `web-push` in a Node action, `@anthropic-ai/sdk` with Claude Haiku 5.5.

**Spec:** [docs/specs/008-big-ones.md](../specs/008-big-ones.md). Read it first; this plan implements it and does not repeat its copy tables.

## Global Constraints

- Branch `feature/big-ones`, based on `main` (study lengths and the motion pass are already merged). New screens reuse the existing motion (stamp, block change, heads-up) and add no new animation. Never push to or merge into `main` without Chris saying so: every push to `main` deploys production.
- Commits: plain messages, **no AI co-author trailers or "Generated with" footers** (Chris's rule; the repo is public).
- Time is computed from stored `startedAt` + duration, never ticking intervals. Convex queries never call `Date.now()`; pass `now` or a day key from the client.
- Day keys are local calendar dates `"YYYY-MM-DD"` computed on the client with local `Date` getters. Core only does arithmetic on keys.
- UI words exactly as the spec's "Words" table: big one, first move, bookmark, pieces, open terms. Never in UI: contract, overdue, late, missed, behind, streak, failed, any count of days away.
- No `·` separators, all-caps eyebrow labels or monospace data labels in UI (CLAUDE.md). Visual direction r2: one "approved" green accent on grey-green paper, Archivo condensed for numbers/headings, Atkinson Hyperlegible for text.
- Every flow works in a plain browser tab without installing (spec "Still a PWA in any browser"). Install is never required; push permission is offered wherever `PushManager` exists.
- Every UI change is checked at 375 px, light and dark, with `node prototypes/shoot.mjs <out-dir>`; load `frontend-design:frontend-design` before UI tasks and `design:accessibility-review` before the design pass.
- Read `convex/_generated/ai/guidelines.md` and load the `convex` skill before Convex tasks; load `claude-api` before Task 17.
- Any new stored field is listed in `docs/specs/006-privacy-inventory.md` in the same commit.
- Limits from the spec: title 1–80 chars; first move and bookmark ≤ 140; ≤ 12 pieces; piece minutes 5–240; gut sizes 60/120/180/240; first payment 15 (alt 30); cards shown 3; AI 10/user/day and 300/day total; suggestion rows deleted after 24 h; `events` hold no typed text.

## Review Focus

1. **Two devices end the same block.** Both call the block-end mutation; the big one must be credited once and the bookmark not overwritten by an empty skip. Test in Task 6.
2. **A session for a big one is replaced, ended early, or the big one is deleted mid-session.** Partial focus minutes are credited on `end` and on replacement by `start`; deleting the big one unlinks its sessions and the running session keeps going. Tests in Tasks 6 and 7.
3. **Day keys across DST and month ends.** `daysBetween("2026-03-07","2026-03-09")` is 2 and `addDays("2026-01-31",1)` is `"2026-02-01"`; key math never goes through local `Date`. Test in Task 3.
4. **Whitespace and edge input.** A bookmark of `"   "` counts as skipped; titles are trimmed before length checks; emoji count as characters, not bytes beyond the limit check. Tests in Task 2.
5. **Dead push subscriptions.** A 404/410 from the push service deletes that subscription and logs `push_failed` once; it never retries or loops. Test in Task 13.

---

## Week 1: foundations

### Task 1: Privacy inventory (spec 006)

**Files:**
- Create: `docs/specs/006-privacy-inventory.md`

**Interfaces:**
- Produces: the inventory every later task appends to.

- [ ] **Step 1:** Write one table per Convex table (`users`, `invites`, `sessions`, `ledger`, and the new `tasks`, `pushSubscriptions`, `checkIns`, `pieceSuggestions`, `aiUsage`, `events`) with columns: field, what it holds, why, who can see it, retention, deleted by. Include `users.lastRepay`, `sessions.taskId`, `sessionState.version`/`scheduledIds`, every `tasks` field from the spec's data model, and the AI disclosure line verbatim. Mark new fields "planned (spec 008)" until their task lands.
- [ ] **Step 2:** Add a "Sent to third parties" section: WorkOS (sign-in), the browser's push service (endpoint only, payload is block label and time), Anthropic (title stripped of emails/phones, type, gut size, days left; up to 30 days; only on opt-in).
- [ ] **Step 3:** Link it from `docs/03-roadmap.md` "Next, in order" item 3 and commit: `Spec 006: privacy inventory for current tables and big ones`.

### Task 2: Core types, copy tables, validation

**Files:**
- Create: `packages/core/src/bigOne.ts`
- Modify: `packages/core/src/index.ts` (export `./bigOne`, `./days`)
- Test: `packages/core/test/bigOne.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type TaskType = "writing" | "problems" | "exam" | "project";
  export const GUT_SIZES = [60, 120, 180, 240] as const;
  export const FIRST_PAYMENT_MIN = 15, FIRST_PAYMENT_ALT_MIN = 30, MAX_PIECES = 12,
    TITLE_MAX = 80, LINE_MAX = 140, CARDS_SHOWN = 3, WORKED_DAYS_KEPT = 30;
  export interface Piece { title: string; minutes: number; plannedDay?: string; stampedAt?: number }
  export interface BigOne {
    title: string; taskType?: TaskType; gutMin?: number; workedMin: number; openTermsMin: number | null;
    firstMove: string; bookmark?: string; pieces?: Piece[]; dueDay?: string; spreadSignedAt?: number;
    status: "open" | "done" | "set_aside"; lastFocusMin?: number; workedDays: string[];
  }
  export function firstMoveFor(type: TaskType | undefined, comeback: boolean): string;
  export function splitSlots(type: TaskType | undefined): string[];
  export function doneQuestion(type: TaskType | undefined): string;      // piece-level question
  export function bookmarkPlaceholder(type: TaskType | undefined): string;
  export function cleanLine(s: string | undefined): string | undefined;  // trims; "" → undefined
  export function bigOneProblem(input: { title: string; firstMove?: string; bookmark?: string; pieces?: Piece[]; gutMin?: number }): string | null;
  ```

- [ ] **Step 1: Write the failing tests** (`bigOne.test.ts`, describe "types and validation"):
  - `firstMoveFor("writing", false)` is `"Open the doc and write one ugly sentence"`; `firstMoveFor("writing", true)` is `"Read your last paragraph and fix one sentence"`; one assertion per type for both values, copied from the spec's type table; `firstMoveFor(undefined, false)` is `""`.
  - `splitSlots("exam")` equals `["Topic 1", "Topic 2", "Topic 3"]`; `splitSlots(undefined)` equals `[""]`.
  - `cleanLine("   ")` is `undefined`; `cleanLine("  claim  ")` is `"claim"`.
  - `bigOneProblem` returns non-null for: title `""`, title `"   "`, an 81-char title, 13 pieces, a piece of 4 min, a piece of 241 min, `gutMin: 90`, a 141-char bookmark; returns `null` for an 80-char title after trimming `"  " + 80 chars + "  "` and for a title of 20 emoji (length counted with `[...s].length`).
- [ ] **Step 2:** Run `npm test -w packages/core -- bigOne` and expect FAIL (module not found).
- [ ] **Step 3:** Implement in `bigOne.ts`. Copy strings exactly from the spec's "Four types, one engine" table (first moves, comeback moves, slots, done questions, bookmark placeholders). For "Problems & code" the default first move is `"Do problem 1 until you're stuck"`.
- [ ] **Step 4:** Run `npm test -w packages/core` and expect PASS (all suites).
- [ ] **Step 5:** Commit: `Core: big one types, copy tables and validation`.

### Task 3: Day keys, open terms, progress, comeback, spread

**Files:**
- Create: `packages/core/src/days.ts`
- Modify: `packages/core/src/bigOne.ts`
- Test: `packages/core/test/bigOne.test.ts`, `packages/core/test/days.test.ts`

**Interfaces:**
- Consumes: Task 2 types.
- Produces:
  ```ts
  // days.ts — pure key arithmetic via Date.UTC, never local time
  export function addDays(key: string, n: number): string;
  export function daysBetween(fromKey: string, toKey: string): number;
  // bigOne.ts
  export function openTerms(gutMin: number | undefined, workedMin: number): number | null;
  export function firstPaymentMinutes(task: Pick<BigOne, "lastFocusMin">, comeback: boolean): number;
  export type ProgressLabel = { kind: "stamped" | "toGo"; n: number } | { kind: "in" | "left"; minutes: number };
  export function progressLabel(task: Pick<BigOne, "taskType" | "pieces" | "gutMin" | "workedMin">): ProgressLabel | null;
  export function isComeback(task: Pick<BigOne, "status" | "openTermsMin" | "pieces" | "spreadSignedAt" | "workedDays">, todayKey: string): boolean;
  export interface SpreadDay { day: string; pieceIndex?: number; minutes: number }
  export function proposeSpread(task: Pick<BigOne, "taskType" | "pieces" | "openTermsMin">, todayKey: string, dueKey: string): SpreadDay[];
  export interface BigOneCard { title: string; startWith: string; progress: ProgressLabel | null; minutes: number; comeback: boolean; offerRespread: boolean }
  export function cardFor(task: BigOne, todayKey: string): BigOneCard;
  export function addWorkedDay(days: string[], key: string): string[]; // dedupes, newest first, keeps WORKED_DAYS_KEPT
  ```

- [ ] **Step 1: Write the failing tests** (spec test cases 1–8, plus Review Focus 3):
  - `days.test.ts`: `addDays("2026-01-31", 1)` → `"2026-02-01"`; `addDays("2026-12-31", 1)` → `"2027-01-01"`; `daysBetween("2026-03-07", "2026-03-09")` → `2`; `daysBetween("2026-11-01", "2026-11-03")` → `2`; `daysBetween("2026-11-09", "2026-11-08")` → `-1`.
  - `openTerms(120, 45)` → 75; `openTerms(120, 150)` → 0; `openTerms(undefined, 45)` → `null`.
  - `firstPaymentMinutes({}, false)` → 15; `firstPaymentMinutes({ lastFocusMin: 30 }, true)` → 15; `firstPaymentMinutes({ lastFocusMin: 30 }, false)` → 30.
  - `progressLabel`: 4 pieces, 1 stamped → `{ kind: "stamped", n: 1 }`; 3 stamped → `{ kind: "toGo", n: 1 }`; no pieces, gut 120, worked 45 → `{ kind: "in", minutes: 45 }`; worked 90 → `{ kind: "left", minutes: 30 }`; no pieces, no gut, worked 45 → `{ kind: "in", minutes: 45 }`; exam with no pieces → `null`.
  - `isComeback` with `workedDays: ["2026-11-08"]`, open terms 60: false on `"2026-11-09"`, true on `"2026-11-10"`; with open terms 0: false on `"2026-11-10"`; with a signed spread and a piece `plannedDay: "2026-11-09"` unstamped, `workedDays: ["2026-11-08"]`: true on `"2026-11-10"`; status `"done"`: always false; `workedDays: []`: false.
  - Midnight (spec test 4): `addWorkedDay([], "2026-11-08")` then today `"2026-11-09"` → `daysBetween` is 1 and `isComeback` false.
  - `proposeSpread`: exam, 3 topic pieces, today `"2026-11-08"`, due `"2026-11-11"` → at least 2 distinct `day`s; exam, due `"2026-11-08"` → all on `"2026-11-08"`; writing, 4 pieces, due `"2026-11-11"` → days `08, 09, 10, 11` one piece each; no day is before today or after due; no pieces, open terms 120, due in 2 days → three `SpreadDay`s of 40 min (minutes rounded to whole minutes, remainder on the first day).
  - `cardFor`: `startWith` is the bookmark when set, else the first move; on a comeback `startWith` is `firstMoveFor(type, true)` and `minutes` is 15; `offerRespread` is true only when comeback and `spreadSignedAt` is set.
  - `addWorkedDay` dedupes `"2026-11-08"` twice and caps at 30 entries.
- [ ] **Step 2:** Run `npm test -w packages/core -- bigOne days` and expect FAIL.
- [ ] **Step 3:** Implement. Spread algorithm: let `days = daysBetween(today, due) + 1` (min 1). With pieces, place unstamped pieces round-robin over `days` evenly (`pieceIndex` order kept); for exam with `days >= 2` and ≥ 2 pieces, ensure at least 2 distinct days by spreading across `min(days, pieces)` days. Without pieces, split `openTermsMin` over `days`. Comeback rule: last worked = `workedDays[0]`; true if `status === "open"` and (`spreadSignedAt` and some unstamped piece has `plannedDay` < today and not in `workedDays`) or (`daysBetween(last, today) >= 2` and `openTermsMin !== 0`).
- [ ] **Step 4:** Run `npm test -w packages/core` and expect PASS.
- [ ] **Step 5:** Commit: `Core: day keys, open terms, progress, comeback and spread`.

### Task 4: Core for sessions: credited minutes, push times, AI limits, check-in week

**Files:**
- Modify: `packages/core/src/timer.ts`, `packages/core/src/bigOne.ts`
- Test: `packages/core/test/bigOne.test.ts`, `packages/core/test/lengths.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // timer.ts
  export function focusMinutesDone(s: SessionState, now: number): number; // whole minutes of the current block if focus, else 0; capped at block length
  export type PushKind = "headsUp" | "blockEnd";
  export function pushTimes(s: SessionState, now: number): { kind: PushKind; at: number }[]; // current block only, future times only
  // bigOne.ts
  export const AI_USER_DAILY = 10, AI_GLOBAL_DAILY = 300, AI_MAX_PIECES = 12;
  export function aiAllowed(userToday: number, globalToday: number): boolean;
  export function scrubForAI(text: string): string; // removes emails and phone numbers
  export function weekKey(todayKey: string): string; // the Sunday on or before todayKey
  export function shouldAskCheckIn(todayKey: string, lastAnsweredWeekKey: string | undefined): boolean;
  ```

- [ ] **Step 1: Write the failing tests:**
  - `focusMinutesDone` on a 15 min focus block started 7.5 min ago → 7; started 20 min ago → 15; on a break → 0.
  - `pushTimes` on a 15 min block started at `T0`, `now = T0` → `[{ headsUp, T0 + 13 min }, { blockEnd, T0 + 15 min }]`; on a 60 min block → heads-up at 55 min (spec 007's 5 min); with `now = T0 + 14 min` → only `blockEnd`.
  - `aiAllowed(9, 0)` true; `aiAllowed(10, 0)` false; `aiAllowed(0, 300)` false (spec test 12).
  - `scrubForAI("Paper for jo@uw.edu call 206-555-0101")` contains neither `"jo@uw.edu"` nor `"206-555-0101"` and still contains `"Paper"`.
  - `weekKey("2026-11-08")` (a Sunday) → `"2026-11-08"`; `weekKey("2026-11-11")` → `"2026-11-08"`; `shouldAskCheckIn("2026-11-11", "2026-11-08")` false; `shouldAskCheckIn("2026-11-15", "2026-11-08")` true; `shouldAskCheckIn("2026-11-11", undefined)` true.
- [ ] **Step 2:** Run `npm test -w packages/core` and expect FAIL.
- [ ] **Step 3:** Implement. `pushTimes` uses `headsUpMs(s.durMs)` from spec 007. Weekday from the key via `Date.UTC`.
- [ ] **Step 4:** Run `npm test -w packages/core` and expect PASS.
- [ ] **Step 5:** Commit: `Core: credited minutes, push times, AI limits, check-in week`.

### Task 5: Convex test harness

**Files:**
- Modify: `package.json` (devDependencies `convex-test`, `@edge-runtime/vm`, `vitest`; script `"test:convex": "vitest run --config convex/vitest.config.ts"`)
- Create: `convex/vitest.config.ts` (environment `edge-runtime`, include `convex/**/*.test.ts`)
- Create: `convex/test/helpers.ts`

**Interfaces:**
- Produces: `makeMember(t: TestConvex, name: string): Promise<{ as: TestConvexForIdentity; userId: Id<"users"> }>` that inserts a `users` row and returns `t.withIdentity({ tokenIdentifier })` matching `convex/lib/members.ts`.

- [ ] **Step 1:** Load the `convex-test` skill; install the dev dependencies.
- [ ] **Step 2:** Write `convex/test/sessions.test.ts` with one test: a member calls `api.sessions.start` with a 15 min deal and `api.sessions.current` returns a running session with 3 focus blocks.
- [ ] **Step 3:** Run `npm run test:convex` and expect PASS (this proves the harness against existing code).
- [ ] **Step 4:** Commit: `Convex: add convex-test harness`.

### Task 6: Tasks table and big-one functions

**Files:**
- Modify: `convex/schema.ts` (add `tasks` per spec; `users.lastRepay`; `sessions.taskId` + index `by_taskId`; `sessionState.version: v.optional(v.number())`, `scheduledIds: v.optional(v.array(v.id("_scheduled_functions")))`; `events` table)
- Create: `convex/tasks.ts`, `convex/lib/events.ts`
- Modify: `convex/sessions.ts`
- Test: `convex/test/tasks.test.ts`

**Interfaces:**
- Consumes: Tasks 2–4 core functions.
- Produces (all require a member and check `task.userId === user._id`):
  ```ts
  // convex/tasks.ts
  open: query({ args: {}, returns BigOne & { _id } [] })          // status "open", newest lastWorkedAt first, .take(50)
  all: query({ args: {} })                                         // open + set_aside, .take(100)
  history: query({ args: { taskId } })                             // sessions by_taskId .take(50)
  create: mutation({ args: { title, taskType?, gutMin?, firstMove, deal: QuickDealArgs, dayKey }, returns: { taskId, sessionId, serverNow } })
  startFromCard: mutation({ args: { taskId, deal: QuickDealArgs, dayKey }, returns: { sessionId, serverNow } })
  blockNotes: mutation({ args: { sessionId, fromIdx, bookmark?, done: boolean, dayKey } })  // idempotent per (sessionId, fromIdx)
  saveSplit: mutation({ args: { taskId, pieces: Piece[] } })
  signSpread: mutation({ args: { taskId, dueDay, plan: SpreadDay[] } })
  startFresh / setAside / reopen / remove: mutation({ args: { taskId } })
  // convex/lib/events.ts
  logEvent(ctx, userId, kind: EventKind, extra?: { taskId?: Id<"tasks">; ms?: number }): Promise<void>
  // convex/events.ts — for events only the client can see
  logClient: mutation({ args: { kind: "comeback_shown" | "comeback_started" | "install_done" | "push_enabled"; taskId? } })
  // convex/sessions.ts: start gains optional taskId and dayKey, returns { sessionId, serverNow }; next/end gain dayKey
  creditTask(ctx, session: Doc<"sessions">, minutes: number, dayKey: string): Promise<void> // adds workedMin, recomputes openTermsMin, addWorkedDay, lastWorkedAt, lastFocusMin
  ```

- [ ] **Step 1: Write the failing tests** (`tasks.test.ts`):
  - `create` with title "Paper", writing, gut 120 returns a running session whose focus blocks are 15, 19, 23 (the normal ramp, spec test 10) and that has `taskId`; the task has `openTermsMin: 120`, `workedMin: 0`; an `events` row `big_one_named` and one `first_payment_started` exist with no text fields.
  - Ending a 15 min focus block via `next` with `dayKey: "2026-11-08"` sets `workedMin: 15`, `openTermsMin: 105`, `workedDays: ["2026-11-08"]`.
  - Review Focus 1: calling `blockNotes` twice for the same `(sessionId, fromIdx)` with `bookmark: "claim"` then `bookmark: undefined` leaves `bookmark: "claim"` and `workedMin` unchanged by the second call.
  - Review Focus 2: `end` 6 min into a focus block credits 6; `start` of an unrelated Quick Deal while a big-one session runs credits the partial minutes to the big one; `remove` on a task with a running session deletes the task, sets that session's `taskId` to undefined, and `sessions.current` still returns it running.
  - A second member calling `blockNotes`, `saveSplit` or `remove` on the first member's task throws.
  - `saveSplit` with 13 pieces throws `BAD_BIG_ONE`.
  - ADR 0005: an `ask` that picks a borrow term sets `users.lastRepay: "borrow"`; a trade sets `"trade"`; an override leaves it unchanged. `sessions.current` returns `lastRepay` alongside the session so the sheet can pre-select it.
  - `split_saved` and `spread_signed` events are logged by `saveSplit` and `signSpread`; `bookmark_written` by `blockNotes` when a non-empty bookmark is stored; `logClient` rejects any other kind.
- [ ] **Step 2:** Run `npm run test:convex` and expect FAIL.
- [ ] **Step 3:** Implement. `create` validates with `bigOneProblem` and `dealProblem`, inserts the task, then reuses the same session-start path as `sessions.start` (extract `startSession(ctx, user, deal, now, taskId?)` in `convex/sessions.ts`). Idempotency for `blockNotes`: store `notedIdx: v.optional(v.number())` on the session and skip when `notedIdx >= fromIdx`. Credit focus minutes in `next` (full block via `focusMinutesDone` at its end), `end`, and the replacement branch of `start`; only when the session has a `taskId` that still exists. `bookmark` uses `cleanLine`; `undefined` keeps the old one. `done: true` stamps the first unstamped piece or, with no pieces, sets `status: "done"`. Add `notedIdx` to the privacy inventory.
- [ ] **Step 4:** Run `npm run test:convex && npm test && npm run typecheck` and expect PASS.
- [ ] **Step 5:** Commit: `Convex: tasks table, big-one functions, credited minutes`.

### Task 7: Server clock offset and session version

**Files:**
- Modify: `convex/sessions.ts`, `apps/web/src/main.ts`
- Test: `convex/test/sessions.test.ts`

**Interfaces:**
- Produces: every session-changing mutation (`start`, `ask`, `next`, `bonus`, `end`, `create`, `startFromCard`) sets `state.version = (state.version ?? 0) + 1`. `start`/`create`/`startFromCard` return `serverNow: number`. `main.ts` keeps `clockOffset = serverNow - Date.now()` and passes it to the prototype via `app.clock(offset)`.

- [ ] **Step 1:** Test: `start` then `ask` leaves `state.version === 2`; `start` returns a `serverNow` within 5 s of the test's `Date.now()`.
- [ ] **Step 2:** Run `npm run test:convex`, expect FAIL; implement; run, expect PASS.
- [ ] **Step 3:** In the prototype's live mode, `vnow` becomes `Date.now() + clockOffset`. Verify in the browser that a session started on a laptop shows the same minutes left on a phone (both signed in) within 1 s.
- [ ] **Step 4:** Commit: `Sessions: version counter and server clock offset`.

## Week 2: the starting flow

Load `frontend-design:frontend-design` before Task 8. Each UI task adds hash states to `fromHash()` and to `STATES` in `prototypes/shoot.mjs` so every new screen can be screenshot in demo mode.

### Task 8: Bridge: cards and big-one actions

**Files:**
- Modify: `apps/web/src/main.ts`
- Create: `apps/web/src/days.ts` (`localDayKey(ms: number): string` using local `getFullYear/getMonth/getDate`)

**Interfaces:**
- Consumes: `api.tasks.*` (Task 6), `cardFor`, `isComeback`, `CARDS_SHOWN` (Task 3).
- Produces (prototype contract, extend `LiveApp` and `Backend`):
  ```ts
  interface LiveApp { …existing; bigOnes(cards: (BigOneCard & { id: string })[], more: number): void; clock(offsetMs: number): void }
  interface Backend { …existing;
    startBigOne(d: { title: string; taskType?: TaskType; gutMin?: number; firstMove: string; deal: DealArgs }): void;
    startFromCard(taskId: string, deal: DealArgs): void;
    blockNotes(fromIdx: number, bookmark: string | undefined, done: boolean): void;
    taskMenu(taskId: string, action: "startFresh" | "setAside" | "reopen" | "remove"): void;
    logEvent(kind: "comeback_shown" | "comeback_started" | "install_done" | "push_enabled", taskId?: string): void; }
  ```
  `next`, `end` and the new calls pass `dayKey: localDayKey(Date.now())`.

- [ ] **Step 1:** Subscribe to `api.tasks.open`; on each update and at local midnight, compute cards with `cardFor(task, localDayKey(Date.now()))`, sort comeback first then `lastWorkedAt` desc, send the first `CARDS_SHOWN` and the remainder count.
- [ ] **Step 2:** Run `npm run typecheck`, expect PASS. With `npx convex dev` and `npm run dev`, create a task from the browser console via `window.pomodeal.convex` and confirm `bigOnes` fires with one card.
- [ ] **Step 3:** Commit: `Web: big-one cards and actions in the Convex bridge`.

### Task 9: Chip, type and gut chips, first-payment ticket

**Files:**
- Modify: `prototypes/quick-deal/index.html`, `prototypes/shoot.mjs`

**Interfaces:**
- Consumes: `BE.startBigOne`. Mirrors only `FIRST_MOVES` and `TYPE_LABELS` copy tables from core, with a comment pointing to `packages/core/src/bigOne.ts`.

- [ ] **Step 1:** Add the "Bigger than one block?" chip under the task field on the Quick Deal ticket (spec Day 1 steps 1–3). Big-one mode shows the type row and gut row (separate buttons, `aria-pressed`, both deselectable), the ticket line "First payment on {title}: 15 min.", the editable first-move line ("When I sit down, I'll first: …", max 140), and a 15/30 toggle. Stamping calls `BE.startBigOne` in live mode and runs the normal local session in demo mode.
- [ ] **Step 2:** Add hash states `bigone-chip`, `bigone-ticket`, `bigone-ticket-typed` (writing, 2h) to `fromHash()` and `STATES`.
- [ ] **Step 3:** Run `ONLY=bigone-chip,bigone-ticket,bigone-ticket-typed node prototypes/shoot.mjs prototypes/quick-deal/shots/008` and check the PNGs at 375 px light and dark: nothing clipped, chip never pre-selected, no planning control visible.
- [ ] **Step 4:** Commit: `Prototype: big-one chip and first-payment ticket`.

### Task 10: Block-end prompts: bookmark and done

**Files:**
- Modify: `prototypes/quick-deal/index.html`, `prototypes/shoot.mjs`

**Interfaces:**
- Consumes: `BE.blockNotes(fromIdx, bookmark, done)`; the session's `taskId` and the task's `taskType`/current piece title come with the card data.

- [ ] **Step 1:** When a focus block of a session with `taskId` ends, the existing boundary sheet gains exactly two controls above its buttons: the bookmark field ("Next time, start with…", placeholder from the type) and the done question with "Yes, stamp it" / "Not yet" (default "Not yet"). No other new control on this sheet. Starting the next block or closing the sheet sends `blockNotes` once.
- [ ] **Step 2:** Hash states `bigone-boundary`, `bigone-boundary-piece`; screenshot them.
- [ ] **Step 3:** Commit: `Prototype: bookmark and done at block end`.

### Task 11: Cards, progress line, menu, wake lock

**Files:**
- Modify: `prototypes/quick-deal/index.html`, `prototypes/shoot.mjs`

**Interfaces:**
- Consumes: `app.bigOnes(cards, more)`, `BE.startFromCard`, `BE.taskMenu`.

- [ ] **Step 1:** Render up to 3 cards above the Quick Deal field (title, "Start with: …", progress text from `ProgressLabel`: "1 stamped", "1 to go", "45 min in", "about 30 min left"; one button "{minutes} min"), and "All big ones" when `more > 0`. The ⋯ menu lists Split into pieces, Spread over the days left (both disabled until Week 3 tasks land), Start fresh on this one, Set aside, Delete (Delete asks "Delete Paper? This can't be undone." with "Delete" / "Keep it").
- [ ] **Step 2:** Comeback cards use "{title}'s still here." / "Smaller first move today?" and show nothing about time away. Showing one calls `BE.logEvent("comeback_shown", taskId)` once per day; starting from it logs `comeback_started`. "All big ones" opens a list of open and set-aside big ones (from `api.tasks.all`) with Start and, for set-aside ones, "Bring it back" (`reopen`).
- [ ] **Step 2b:** ADR 0005 in the boundary sheet: from the second ask, the term matching `lastRepay` is pre-selected so "Deal" accepts it in one tap.
- [ ] **Step 3:** Running focus screen: "Keep screen on" toggle, off by default, stored in `localStorage` key `pomodeal.wakelock` inside try/catch, hidden when `!("wakeLock" in navigator)`; request on focus start, release on break and end, re-request on `visibilitychange` to visible.
- [ ] **Step 4:** Hash states `cards`, `cards-comeback`, `cards-more`, `running-wakelock`; screenshot all.
- [ ] **Step 5:** Commit: `Prototype: big-one cards, comeback card, wake lock`.

### Task 12: Design pass for week 2 screens

- [ ] **Step 1:** Load `design:accessibility-review`. Run the build loop's design hill climb (docs/04-build-loop.md step 5) on the Task 9–11 states: three read-only reviewer subagents (product designer, stressed student at 11 PM, accessibility), scored against two reference apps, target every category ≥ 8. Log rounds in a "Design rounds" table at the end of spec 008.
- [ ] **Step 2:** Fix what they find; re-shoot; stop at the target or after 3 rounds and show Chris.
- [ ] **Step 3:** Verify in the built-in browser: a tester types a title and reaches a running block in under a minute with no planning screen (spec week 2 done-when), in a plain browser tab, not installed.
- [ ] **Step 4:** Commit: `Design: week 2 big-one screens, round log`.

## Week 3: re-entry and reach

### Task 13: Push backend

**Files:**
- Modify: `convex/schema.ts` (`pushSubscriptions`), `convex/sessions.ts`, `convex/tasks.ts`
- Create: `convex/push.ts` (mutations `subscribe`, `unsubscribe`; internal mutations `fire`, `recordResult`), `convex/pushNode.ts` (`"use node"`; internal action `send`), `convex/lib/pushSchedule.ts`
- Test: `convex/test/push.test.ts`
- Env: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` in Convex (dev first; prod only when Chris approves), `VITE_VAPID_PUBLIC_KEY` for the web build.

**Interfaces:**
- Consumes: `pushTimes` (Task 4), `state.version` (Task 7).
- Produces:
  ```ts
  reschedule(ctx: MutationCtx, sessionId: Id<"sessions">, state: SessionState, now: number): Promise<Id<"_scheduled_functions">[]>
  // cancels state.scheduledIds, schedules internal.push.fire at each pushTimes() entry with { sessionId, version, kind }
  fire: internalMutation({ sessionId, version, kind })  // no-op unless session running and state.version === version; schedules internal.pushNode.send per subscription
  send: internalAction({ subscriptionId, payload })      // web-push; 404/410 → recordResult({ gone: true })
  recordResult: internalMutation({ subscriptionId, ok, gone })  // gone deletes the row; logs push_sent / push_failed
  ```
- Payload (declarative Web Push, also read by the service worker): `{ web_push: 8030, notification: { title: "Pomodeal", body, navigate: "/" } }` with `body` from spec "Push" copy.

- [ ] **Step 1: Write the failing tests:** a `fire` with an old `version` schedules no `send` (spec test 11); after `start` then `ask` there is exactly one pending heads-up and one block-end `fire` for that session (cancelled ids gone); `recordResult({ gone: true })` deletes the subscription and logs one `push_failed` (Review Focus 5); `subscribe` twice with the same endpoint keeps one row.
- [ ] **Step 2:** Run `npm run test:convex`, expect FAIL; implement; expect PASS.
- [ ] **Step 3:** Call `reschedule` from every session-changing mutation after it writes state; `end` cancels without scheduling.
- [ ] **Step 4:** Commit: `Push: scheduled block-boundary pushes with version check`.

### Task 14: Service worker, permission button, install sheet

**Files:**
- Modify: `apps/web/vite.config.ts` (VitePWA `strategies: "injectManifest"`, `srcDir: "src"`, `filename: "sw.ts"`)
- Create: `apps/web/src/sw.ts` (precache via `workbox-precaching`, `push` handler showing the payload's `notification`, `notificationclick` focusing or opening `/`)
- Create: `apps/web/src/push.ts` (`pushSupported(): boolean`, `enablePush(convex): Promise<"granted" | "denied">`)
- Modify: `apps/web/src/main.ts`, `prototypes/quick-deal/index.html`, `prototypes/shoot.mjs`

**Interfaces:**
- Produces: `Backend.enablePush(): Promise<"granted" | "denied">`, `LiveApp.env({ pushSupported, installed, iosSafari })`.

- [ ] **Step 1:** In the prototype: on the first session start where `pushSupported` and permission is `"default"`, show the button "Turn on taps at block ends"; the browser prompt fires only from that tap. On iPhone Safari not installed (no `PushManager`), after the first finished block show the install sheet once (spec copy, three-step picture, "Not now"). Never block any flow. Log `push_enabled` when permission is granted and `install_done` the first time the app opens in standalone mode.
- [ ] **Step 2:** Hash states `push-ask`, `install-ios`; screenshot.
- [ ] **Step 3:** Verify in the built-in browser on desktop (plain tab): enable push, start a 5 min block, receive the heads-up and block-end notifications; check `npx convex logs` shows one `send` per boundary.
- [ ] **Step 4:** Commit: `Web: service worker push, permission button, iPhone install sheet`.

### Task 15: Split, spread, comeback re-spread

**Files:**
- Modify: `prototypes/quick-deal/index.html`, `prototypes/shoot.mjs`, `apps/web/src/main.ts`

**Interfaces:**
- Consumes: `api.tasks.saveSplit`, `api.tasks.signSpread`, `splitSlots`, `proposeSpread` (the bridge computes the proposal and passes it to the sheet: `LiveApp.spreadProposal(taskId, SpreadDay[])`).

- [ ] **Step 1:** Split sheet from the card menu: slot rows from the type, editable titles and minutes (5–240, step 5), add/remove rows (max 12), the line "Your pieces add up to {h}h {m}. Your gut said {g}h." shown only when a gut size exists. Save calls `saveSplit`.
- [ ] **Step 2:** Spread sheet: "Due when?" date input if no `dueDay`; the proposal grouped by day; move a piece to another day with a per-row day picker (no drag needed); exam shows "Two shorter days usually stick better than one long night. Change it if you need to." only when the proposal spans 2+ days; "Sign it" calls `signSpread`. With no pieces and no gut size, the menu item opens Split.
- [ ] **Step 3:** Comeback card with `offerRespread` shows the link "Re-spread what's left?" that opens the spread sheet pre-filled from `proposeSpread` over remaining days.
- [ ] **Step 4:** Hash states `split`, `split-exam`, `spread`, `spread-exam`, `cards-respread`; screenshot; then a design round per Task 12 on these states.
- [ ] **Step 5:** Commit: `Prototype: split, spread and re-spread`.

### Task 16: Real-device check (week 3 gate)

- [ ] **Step 1:** Deploy the branch to a preview (`wrangler preview` per docs/05) with the dev Convex deployment. Chris confirms testers' iPhone models and iOS versions first.
- [ ] **Step 2:** On an iPhone (iOS 18.4+, installed) and an Android phone (Chrome tab and installed): run a 15 min first payment; check heads-up and block-end pushes arrive once; check "Keep screen on"; on the iPhone in a Safari tab check every flow works and only push is missing.
- [ ] **Step 3:** One day of dogfooding; then confirm zero duplicate `send` runs per boundary in `npx convex logs`. Record results in `docs/dogfood-log.md`.

## Week 4: check-in, optional AI, release

### Task 17: Optional "Suggest pieces"

**Files:**
- Modify: `convex/schema.ts` (`pieceSuggestions`, `aiUsage`)
- Create: `convex/ai.ts` (mutation `requestSuggestion`, query `suggestion`, mutation `dismissSuggestion`, internal mutation `writeSuggestion`), `convex/aiNode.ts` (`"use node"`, internal action `suggestPieces`), `convex/crons.ts` (daily `internal.ai.sweepSuggestions`)
- Modify: `prototypes/quick-deal/index.html`, `apps/web/src/main.ts`
- Test: `convex/test/ai.test.ts`
- Env: `ANTHROPIC_API_KEY`, `AI_SUGGEST_ENABLED` (`"true"` to enable).

**Interfaces:**
- Consumes: `aiAllowed`, `scrubForAI`, `AI_MAX_PIECES`, `bigOneProblem` (Tasks 2, 4).
- Produces: `requestSuggestion({ taskId, title, daysLeft? }) → Id<"pieceSuggestions"> | { refused: "limit" | "off" }`. The action calls model `claude-haiku-5-5` with a strict JSON schema `{ pieces: [{ title: string, minutes: integer }] }`, low effort, then truncates to 12 pieces and clamps minutes to 5–240 in core before `writeSuggestion`.

- [ ] **Step 1:** Load the `claude-api` skill and confirm the current SDK call for structured output and effort before writing the action.
- [ ] **Step 2: Write the failing tests** (mock the action with `t.withFakeTimers` / by not running scheduled functions): the 11th request for one user on one `dayKey` returns `{ refused: "limit" }` and schedules nothing (spec test 12); with `AI_SUGGEST_ENABLED` unset returns `{ refused: "off" }`; `writeSuggestion` with 15 pieces stores 12; `sweepSuggestions` deletes rows older than 24 h; `saveSplit` after a suggestion deletes the suggestion row and sets `aiSuggested: true`.
- [ ] **Step 3:** Run `npm run test:convex`, expect FAIL; implement; expect PASS.
- [ ] **Step 4:** UI: "Suggest pieces" in the split sheet only; first use per device shows the spec's disclosure with "Suggest pieces" / "I'll split it myself" (remembered in `localStorage` key `pomodeal.aiConsent`); the client sends `scrubForAI(title)`; failure copy "Couldn't get suggestions right now. Your slots are still here." Hash states `split-ai-consent`, `split-ai-filled`.
- [ ] **Step 5:** With a real key on dev, request one suggestion for "Lab report due Thursday" and check the pieces are editable and only saved pieces persist.
- [ ] **Step 6:** Commit: `AI: optional piece suggestions with limits and disclosure`.

### Task 18: Weekly check-in and metrics query

**Files:**
- Modify: `convex/schema.ts` (`checkIns`)
- Create: `convex/checkIns.ts` (query `lastWeekKey`, mutation `answer({ weekKey, answer })`), `convex/metrics.ts` (internal query `beta({ fromAt, toAt })`)
- Modify: `prototypes/quick-deal/index.html`, `apps/web/src/main.ts`, `prototypes/shoot.mjs`
- Test: `convex/test/metrics.test.ts`

**Interfaces:**
- Produces: `beta()` returns `{ firstPaymentWithin2MinPct, secondDayPct, comebackStartedPct, checkIns: { better, same, worse }, installRate, pushEnabledRate, bookmarkRate, aiAcceptRate }`, reading `events` with `by_kind_and_at` and `.take(5000)` per kind.

- [ ] **Step 1: Write the failing tests:** answering twice in one week keeps one row; seeded events (3 big ones, 2 with `first_payment_started.ms < 120000`) give `firstPaymentWithin2MinPct` 67 (rounded).
- [ ] **Step 2:** Run, expect FAIL; implement; expect PASS.
- [ ] **Step 3:** Check-in card above Quick Deal when `shouldAskCheckIn(localDayKey(now), lastWeekKey)`; "Better" / "About the same" / "Worse" and an × to skip (skip hides it until next week via `localStorage` `pomodeal.checkinSkipped` = weekKey). Hash state `checkin`; screenshot.
- [ ] **Step 4:** Commit: `Check-in card and beta metrics query`.

### Task 19: Hardening and release

**Files:**
- Modify: `docs/specs/006-privacy-inventory.md` (remove "planned" marks), `CHANGELOG.md`, `package.json` versions, `docs/03-roadmap.md` ("Where we are"), `README.md` status table, `docs/specs/008-big-ones.md` (status → built)

- [ ] **Step 1:** Run `npm test && npm run test:convex && npm run typecheck && npm run build:web` and expect all PASS.
- [ ] **Step 2:** Full screenshot run `node prototypes/shoot.mjs prototypes/quick-deal/shots/008-final`; check every state at 375 px light and dark.
- [ ] **Step 3:** Run `/code-review` and `/security-review` on the branch (user data, AI, push); fix confirmed findings.
- [ ] **Step 4:** Confirm the app works with `AI_SUGGEST_ENABLED` unset.
- [ ] **Step 5:** Update changelog and versions per `docs/05-deploy-and-versioning.md`; commit `Release prep: big ones`. Then stop and ask Chris before opening a PR, setting production env vars, merging to `main`, or tagging.

**Cut order if time runs out** (spec): Task 17, then the wake lock part of Task 11, then the heads-up entry in `pushTimes` (keep block end), then Task 15 Step 3.
