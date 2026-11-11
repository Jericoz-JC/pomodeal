# Open Beta with a Sign-up Brake: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let signed-in friends join without an invite code, close sign-ups automatically when a 24-hour limit or member cap is reached, give admins a screen to watch and control it, remove Apple sign-in, and store what's needed to carry accounts into WorkOS production.

**Architecture:** A `settings` row holds the sign-up mode and limits. One mutation, `beta.enter`, runs on every app load: it backfills the member's email hash, relinks a member arriving from another WorkOS environment, joins when sign-ups are open (tripping the brake inside the same transaction), or records a waitlist row. `convex/admin.ts` serves the admin screen; `gate.ts` renders it from the account menu.

**Tech Stack:** Convex (convex-test + vitest), WorkOS AuthKit JWT template, TypeScript web client (`apps/web/src`), Web Push via the existing `pushNode.send`.

**Spec:** [docs/specs/010-open-beta-and-signup-brake.md](../specs/010-open-beta-and-signup-brake.md)

## Global Constraints

- Read `convex/_generated/ai/guidelines.md` before writing Convex code.
- Identity always comes from `ctx.auth`, never from arguments.
- Defaults: `signups` = `"inviteOnly"` when no row exists; `memberCap` = 150; `dayLimit` = 40; members get `DEFAULT_ALLOWANCE` (11) invites.
- `emailHash` = SHA-256 hex of `email.trim().toLowerCase()`. The plain address is never stored.
- A hash match relinks only when `identity.emailVerified === true`.
- Copy: no shame, no labels, no streaks. Waitlist text when closed is the spec's exact line.
- UI: load the frontend-design skill first; prototype r2 direction (one green accent, Archivo numbers, Atkinson Hyperlegible text); no all-caps eyebrows, no `·` separators, no monospace data labels. Check at 375 px and desktop, light and dark, with `node prototypes/shoot.mjs <out-dir>`; kill the whole Edge process tree afterwards.
- Every new stored field updates `docs/specs/006-privacy-inventory.md` in the same commit.
- Commits: no AI co-author trailers or "Generated with" footers. Work stays on `beta/open-signups`; ask before merging.
- Test command: `npm run test:convex`. Typecheck: `npm run typecheck`.

## Review Focus

1. **Email written differently in each environment** (`" Chris@UW.edu "` vs `"chris@uw.edu"`): should still match. Test in Task 1.
2. **A match inside the same WorkOS environment** (same issuer, different subject): must not take over the row. A relink only crosses environments. Test in Task 3.
3. **Two tabs opening at once** (two `enter` calls for one new account): exactly one member row. Test in Task 3.
4. **Admin reopens while already at the cap:** the next join closes it again at once; the screen says to raise the cap first. Test in Task 4; copy in Task 6.
5. **Limits of 0, negative or fractional:** refused, settings unchanged. Test in Task 5.

---

### Task 1: Email hash, and proof the claims arrive

**Files:**
- Create: `convex/lib/email.ts`
- Create: `convex/test/email.test.ts`
- Temporary (deleted in Step 6): `convex/debugIdentity.ts`

**Interfaces:**
- Produces: `hashEmail(email: string): Promise<string>` (64-char lowercase hex). `emailHashOf(identity: UserIdentity): Promise<string | null>` (`UserIdentity` from `convex/server`): the hash when `identity.email` is set, else null (verification is checked by callers).

- [ ] **Step 1: Write the failing tests**

```ts
test("hashEmail is SHA-256 hex of the trimmed, lower-cased address", async () => {
  expect(await hashEmail("a@b.co")).toBe("80305c9bb1bb2480e03894350e0a8a366dcbdeb302e69e0817aa0743abd77054");
  expect(await hashEmail(" A@B.co ")).toBe(await hashEmail("a@b.co"));
});
test("emailHashOf is null without an email claim", async () => {
  expect(await emailHashOf({ tokenIdentifier: "x|y", subject: "y", issuer: "x" })).toBeNull();
});
```

- [ ] **Step 2: Run** `npm run test:convex -- email` and confirm it FAILS (module not found).
- [ ] **Step 3: Implement** both functions in `convex/lib/email.ts` with `crypto.subtle.digest("SHA-256", new TextEncoder().encode(...))`.
- [ ] **Step 4: Run** `npm run test:convex -- email` and confirm it PASSES.
- [ ] **Step 5: Prove it on the dev deployment.** Ask Chris to add a JWT template to the WorkOS environment used by dev (WorkOS dashboard → Authentication → Sessions → JWT template) with `{"email": {{user.email}}, "email_verified": {{user.email_verified}}}`. Add `convex/debugIdentity.ts` with a public query returning `{ email: identity?.email ?? null, emailVerified: identity?.emailVerified ?? null, hash: identity ? await emailHashOf(identity) : null }`. Run `npm run dev` + `npx convex dev`, sign in, and in the browser console run `await pomodeal.convex.query(pomodeal.api.debugIdentity.whoami, {})`. Expected: the address, `true`, and a 64-char hash. If `emailVerified` comes back null, stop and report: the claim name or Convex's mapping differs from the spec, and Task 3's verified check needs a decision from Chris.
- [ ] **Step 6: Delete** `convex/debugIdentity.ts` and commit:

```bash
git add convex/lib/email.ts convex/test/email.test.ts
git commit -m "Email hash for carrying accounts across WorkOS environments"
```

---

### Task 2: Schema and sign-up settings

**Files:**
- Modify: `convex/schema.ts` (users, sessions; new `settings`, `waitlist`)
- Create: `convex/lib/signups.ts`
- Create: `convex/test/signups.test.ts`
- Modify: `docs/specs/006-privacy-inventory.md` (`users.emailHash`, `waitlist` table)

**Interfaces:**
- Schema: `users` gains `emailHash: v.optional(v.string())`, indexes `by_emailHash`, `by_joinedAt`, `by_role`. `sessions` gains index `by_createdAt`. New `settings` table `{ key: v.literal("beta"), signups: "open" | "inviteOnly", memberCap: number, dayLimit: number, windowStart: optional number, paused: optional { at: number, reason: "dayLimit" | "memberCap" | "manual", count: number } }` with index `by_key`. New `waitlist` table `{ tokenIdentifier: string, firstSeenAt: number }` with index `by_tokenIdentifier`.
- Produces in `convex/lib/signups.ts`:
  - `type BetaSettings` (the row's fields without system fields).
  - `DEFAULT_SETTINGS: BetaSettings` = `{ key: "beta", signups: "inviteOnly", memberCap: 150, dayLimit: 40 }`.
  - `getBetaSettings(ctx: QueryCtx | MutationCtx): Promise<BetaSettings & { _id?: Id<"settings"> }>`: the row, or the defaults.
  - `putBetaSettings(ctx: MutationCtx, patch: Partial<BetaSettings>): Promise<void>`: inserts the defaults plus the patch if no row exists, else patches. To clear `paused` or `windowStart`, pass `undefined`.
  - `brakeReason(counts: { recent: number; total: number }, s: Pick<BetaSettings, "dayLimit" | "memberCap">): "dayLimit" | "memberCap" | null`: `"dayLimit"` when `recent >= dayLimit`, else `"memberCap"` when `total >= memberCap`, else null. Counts include the member just added.
  - `memberCounts(ctx, s: BetaSettings, now: number): Promise<{ recent: number; total: number }>`: `recent` = users with `joinedAt > max(now - 86_400_000, s.windowStart ?? 0)` via `by_joinedAt`; `total` = all users.

- [ ] **Step 1: Write the failing tests** in `convex/test/signups.test.ts`:
  - `brakeReason({recent: 40, total: 10}, {dayLimit: 40, memberCap: 150})` → `"dayLimit"`; `({recent: 39, total: 150}, …)` → `"memberCap"`; `({recent: 39, total: 149}, …)` → `null`.
  - With no row, `getBetaSettings` (via `t.run`) returns `signups: "inviteOnly", memberCap: 150, dayLimit: 40`.
  - `putBetaSettings(ctx, { signups: "open" })` twice leaves exactly one `settings` row.
  - `memberCounts` with users joined 25 h ago, 1 h ago and now, and `windowStart` 30 min ago → `{ recent: 1, total: 3 }`; without `windowStart` → `{ recent: 2, total: 3 }`.
- [ ] **Step 2: Run** `npm run test:convex -- signups`: FAIL.
- [ ] **Step 3: Implement** the schema changes and `convex/lib/signups.ts`.
- [ ] **Step 4: Run** `npm run test:convex` (all files, since the schema changed): PASS. `npm run typecheck`: clean.
- [ ] **Step 5: Update spec 006** with rows for `users.emailHash` (hash of the sign-in email; matches the account across WorkOS environments; Chris only; while the account exists) and the `waitlist` table (`tokenIdentifier`, `firstSeenAt`; count people waiting and let them in on reopening; Chris only; deleted when they join).
- [ ] **Step 6: Commit**

```bash
git add convex/schema.ts convex/lib/signups.ts convex/test/signups.test.ts docs/specs/006-privacy-inventory.md
git commit -m "Sign-up settings, waitlist table, email hash field"
```

---

### Task 3: `beta.enter`: backfill, relink, join, waitlist

**Files:**
- Modify: `convex/beta.ts` (`enter`, `me`, `claim`)
- Test: `convex/test/beta.test.ts` (new `describe("enter")`)

**Interfaces:**
- Consumes: Task 1 `emailHashOf`; Task 2 `getBetaSettings`, `putBetaSettings`, `memberCounts`, `brakeReason`.
- Produces:
  - `beta.enter` mutation, args `{ displayName: v.string() }`, returns `{ status: "member" | "waitlist"; relinked: boolean }`. Throws `SIGNED_OUT` when there's no identity. Order: (1) a member by `tokenIdentifier` gets `emailHash` filled in if missing → member. (2) If `identity.emailVerified === true` and a member has the same `emailHash` **and that member's `tokenIdentifier` issuer (the text before the first `|`) differs from `identity.issuer`**, patch its `tokenIdentifier` to the caller's, delete any waitlist row → member, `relinked: true`. (3) If sign-ups are open: insert the member (`role: "member"`, `inviteId: null`, `invitedBy: null`, `inviteAllowance: DEFAULT_ALLOWANCE`, `joinedAt: now`, `emailHash`, name trimmed to 40 chars, `"New member"` if empty), delete the waitlist row, then run the brake (Task 4 adds it; leave a single call site `await afterJoin(ctx, now)` stubbed to a no-op here) → member. (4) Else upsert the waitlist row (keep the original `firstSeenAt`) → waitlist.
  - `beta.me` for a signed-in non-member returns `{ status: "waitlist", signups: "open" | "inviteOnly" }`.
  - `beta.claim` also stores `emailHash` and deletes the caller's waitlist row.

- [ ] **Step 1: Write the failing tests** (use `t.withIdentity({ tokenIdentifier, issuer, subject, email, emailVerified })`; set the settings row with `t.run(ctx => putBetaSettings(ctx, {...}))`):
  - `open: a new account joins with no invite`: `enter` → `{status: "member", relinked: false}`; the users row has `inviteId: null`, `inviteAllowance: 11`, a 64-char `emailHash`.
  - `open: calling enter twice makes one member` (Review Focus 3): two `enter` calls → one users row.
  - `invite-only: a new account is waitlisted once`: two `enter` calls → `status: "waitlist"`, one waitlist row with the first `firstSeenAt`; `me` → `{ status: "waitlist", signups: "inviteOnly" }`.
  - `no settings row means invite-only`.
  - `claim works while invite-only and clears the waitlist row`.
  - `an existing member gets an emailHash backfilled`.
  - `a verified email from another environment relinks the member`: member with `tokenIdentifier: "https://api.workos.com/user_management/client_STAGING|user_A"` and that email's hash; caller `issuer: "https://api.workos.com/user_management/client_PROD"`, `tokenIdentifier: ".../client_PROD|user_B"`, same email in different case, `emailVerified: true` → `relinked: true`; the same row id now has the PROD `tokenIdentifier`; still one users row.
  - `an unverified email never relinks`: same setup with `emailVerified: false` and sign-ups invite-only → `waitlist`, the row keeps its STAGING identity.
  - `a match in the same environment never relinks` (Review Focus 2): same issuer, different subject, verified → not relinked.
  - `a signed-out caller can't enter`: rejects with `SIGNED_OUT`.
- [ ] **Step 2: Run** `npm run test:convex -- beta`: the new tests FAIL.
- [ ] **Step 3: Implement** `enter`, the `me` change and the `claim` change in `convex/beta.ts`.
- [ ] **Step 4: Run** `npm run test:convex`: PASS. `npm run typecheck`: clean.
- [ ] **Step 5: Commit**

```bash
git add convex/beta.ts convex/test/beta.test.ts
git commit -m "beta.enter: open sign-ups, waitlist rows, and relinking by verified email"
```

---

### Task 4: The brake and the admin push

**Files:**
- Modify: `convex/beta.ts` (`afterJoin`), `convex/push.ts` (`notifyAdmins`)
- Test: `convex/test/beta.test.ts` (`describe("brake")`), using fake timers as `push.test.ts` does

**Interfaces:**
- Consumes: Task 2 `memberCounts`, `brakeReason`, `putBetaSettings`.
- Produces:
  - `afterJoin(ctx: MutationCtx, now: number): Promise<void>` in `convex/beta.ts`: if sign-ups are open and `brakeReason` is non-null, set `signups: "inviteOnly"`, `paused: { at: now, reason, count }` (`count` = `recent` for dayLimit, `total` for memberCap), and `ctx.scheduler.runAfter(0, internal.push.notifyAdmins, { title, body })`. Also called at the end of `claim`, so invites count toward the brake but are never refused.
  - `push.notifyAdmins` internal mutation, args `{ title: v.string(), body: v.string() }`, returns null: for each user from `by_role` = `"admin"`, take their newest `MAX_SUBSCRIPTIONS` subscriptions and schedule `internal.pushNode.send` with `{ web_push: 8030, notification: { title, body, navigate: "/" } }`.
  - Copy: title `"Sign-ups paused"`; body `"40 new members in 24 hours."` / `"150 members, the cap."` with the real numbers.

- [ ] **Step 1: Write the failing tests:**
  - `the join that reaches the day limit succeeds, then sign-ups close`: settings open with `dayLimit: 2`; two accounts `enter` → both members; settings are `inviteOnly` with `paused.reason "dayLimit"`, `count 2`; a third → `waitlist`.
  - `the member cap closes sign-ups the same way` (`memberCap: 3`, two existing members, one join).
  - `a claim never gets refused by the brake but still counts`: open, `dayLimit: 1`, an invite claimed → member, and sign-ups now closed.
  - `reopening starts a fresh window`: after a dayLimit trip, `putBetaSettings({ signups: "open", paused: undefined, windowStart: now })` → the next `enter` joins.
  - `reopening at the cap closes again after one join` (Review Focus 4): `memberCap` equal to the current count, open → the next `enter` joins and closes it again with reason `memberCap`.
  - `a trip schedules the admin alert`: after a dayLimit trip, `_scheduled_functions` holds one `push:notifyAdmins` job with body `"2 new members in 24 hours."`.
  - `notifyAdmins sends to admin devices only`: one admin with 2 subscriptions and a member with 1; run `t.mutation(internal.push.notifyAdmins, { title: "Sign-ups paused", body: "x" })` → exactly 2 `pushNode:send` jobs, both for the admin's subscriptions. Never run the send action itself.
- [ ] **Step 2: Run** `npm run test:convex -- beta push`: FAIL.
- [ ] **Step 3: Implement** `afterJoin` and `notifyAdmins`.
- [ ] **Step 4: Run** `npm run test:convex`: PASS.
- [ ] **Step 5: Commit**

```bash
git add convex/beta.ts convex/push.ts convex/test/beta.test.ts
git commit -m "Sign-up brake: close at the day limit or member cap and push admins"
```

---

### Task 5: Admin functions

**Files:**
- Create: `convex/admin.ts`, `convex/test/admin.test.ts`
- Modify: `convex/lib/members.ts` (`requireAdmin`)

**Interfaces:**
- Consumes: Task 2 settings helpers and `memberCounts`.
- Produces:
  - `requireAdmin(ctx): Promise<Doc<"users">>`: `requireMember`, then throws `ConvexError({ code: "NOT_ADMIN", message: "Only admins can do that." })` unless `role === "admin"`.
  - `admin.overview` query returns `{ signups, memberCap, dayLimit, paused: { at, reason, count } | null, members, newInDay, activeInWeek, waiting, readyForProduction, usageUrl }`. `activeInWeek` = distinct `userId` over sessions with `createdAt >= now - 7 days` (`by_createdAt`); `readyForProduction` = members with `emailHash`; `usageUrl` = `"https://dashboard.convex.dev/t/chris-jobi/pomodeal/affable-hound-751/usage"` (confirm the path in the dashboard during Task 6 and fix if it differs).
  - `admin.setSignups` mutation, args `{ mode: "open" | "inviteOnly" }`: open → clear `paused`, `windowStart = now`; inviteOnly → `paused: { at: now, reason: "manual", count: newInDay }`.
  - `admin.setLimits` mutation, args `{ memberCap: v.number(), dayLimit: v.number() }`: each must be an integer ≥ 1, else `ConvexError({ code: "BAD_LIMIT", message: "Limits are whole numbers of at least 1." })`. Never changes `signups`.

- [ ] **Step 1: Write the failing tests:**
  - `a member who isn't an admin is refused` for all three functions (`NOT_ADMIN`).
  - `overview counts what the screen shows`: 3 members (one 2 days old, one with `emailHash`), 1 waitlist row, sessions by 2 members in the last week and 1 older → `members 3, newInDay 2, activeInWeek 2, waiting 1, readyForProduction 1`.
  - `setSignups open clears the pause and starts a window`; `setSignups inviteOnly records a manual pause`.
  - `setLimits rejects 0, -5 and 2.5 and leaves settings unchanged` (Review Focus 5); accepts `{ memberCap: 300, dayLimit: 60 }` without changing `signups`.
- [ ] **Step 2: Run** `npm run test:convex -- admin`: FAIL.
- [ ] **Step 3: Implement** `requireAdmin` and `convex/admin.ts`.
- [ ] **Step 4: Run** `npm run test:convex`: PASS. `npm run typecheck`: clean.
- [ ] **Step 5: Commit**

```bash
git add convex/admin.ts convex/lib/members.ts convex/test/admin.test.ts
git commit -m "Admin overview and sign-up controls"
```

---

### Task 6: Web client: enter on load, waitlist copy, Apple removed, admin panel

**Files:**
- Modify: `apps/web/src/main.ts`, `apps/web/src/gate.ts`, `apps/web/src/landing.ts`

**Interfaces:**
- Consumes: `api.beta.enter`, `api.beta.me` (with `signups` on waitlist), `api.admin.overview`, `api.admin.setSignups`, `api.admin.setLimits`.
- Produces: `GateActions` gains `setSignups(mode)` and `setLimits({ memberCap, dayLimit })`; `gate.setAdmin(overview | null)` renders the panel; `GateState` waitlist gains `signups`.

- [ ] **Step 1: Load the frontend-design skill** (and design:design-critique for the review in Step 6).
- [ ] **Step 2: Wire `enter`** in `main.ts`: after `convex.setAuth`, if no invite is pending, call `beta.enter({ displayName })` once (same name rule as `claim`); on a connection error, leave the gate on loading and let a reload retry. Keep the invite path as it is. Subscribe to `api.admin.overview` only when `me.role === "admin"`.
- [ ] **Step 3: Remove Apple.** Default `VITE_AUTH_PROVIDERS` → `"GitHubOAuth,GoogleOAuth"`; drop `AppleOAuth` from `Provider`, the icon and label tables in `gate.ts` and `landing.ts`; the landing primary is Google and the second GitHub, with no iOS special case.
- [ ] **Step 4: Waitlist copy.** When `signups` is `"inviteOnly"`: "Pomodeal is full for now. You're on the list, and you'll get in the next time you open it after it reopens. Got an invite link from a friend? That works any time." When open (an `enter` still on its way), show loading.
- [ ] **Step 5: Admin panel.** Account menu item "Sign-ups" (admins only) opens a panel in the invite panel's place: the numbers from `overview` (new in 24 h against the limit, members against the cap, active this week with a link to Convex usage, waiting, ready for production sign-in), the Open / Invite only switch, the paused notice with Reopen ("Paused Nov 12, 3:40 pm: 40 new members in 24 hours"), and the two limits with a Save stamp. When reopening at or past the cap, say "You're at the cap. Raise it first, or the next person closes it again." Follow the Global Constraints visual rules.
- [ ] **Step 6: Verify.** `npm run typecheck` clean; `npm run build:web` succeeds. Run `npm run dev` + `npx convex dev`, sign in as an admin, and check: the menu item, the panel numbers, switching modes, saving limits, the 0-limit error. Screenshot the signed-out landing, waitlist, and admin panel with `node prototypes/shoot.mjs` at phone and `WIDTH=1440 HEIGHT=900`, light and dark; kill the Edge tree afterwards. Run a design critique on the admin panel and fix what it finds.
- [ ] **Step 7: Commit**

```bash
git add apps/web/src/main.ts apps/web/src/gate.ts apps/web/src/landing.ts
git commit -m "Open sign-ups in the app, an admin Sign-ups panel, and no Apple sign-in"
```

---

### Task 7: Docs and decision

**Files:**
- Create: `docs/decisions/0006-open-beta-with-brake.md`
- Modify: `docs/08-launch-and-beta-access.md`, `docs/03-roadmap.md`, `CHANGELOG.md`, `docs/specs/010-open-beta-and-signup-brake.md` (status line)

- [ ] **Step 1: ADR 0006** (context, decision, consequences): open sign-ups plus an automatic brake instead of invite-only; Apple dropped; accounts carried by email hash.
- [ ] **Step 2: Launch doc:** replace the "How beta access works" diagram and text with the open/invite-only flow and the brake; add the admin screen; add the spec's "Switching WorkOS to production" checklist; drop Apple. Keep `beta:makeAdmin` and `beta:seedInvite` in the admin commands; sign-up controls live on the screen, not the CLI.
- [ ] **Step 3: Roadmap "Where we are":** sign-in is GitHub / Google / email; open beta with a brake and an admin screen; the WorkOS move needs every member signed in once first.
- [ ] **Step 4: CHANGELOG** under Unreleased; spec 010 status → "built on `beta/open-signups`, not merged".
- [ ] **Step 5: Final check:** `npm test`, `npm run test:convex`, `npm run typecheck` all pass.
- [ ] **Step 6: Commit**

```bash
git add docs CHANGELOG.md
git commit -m "Docs: open beta with a brake, ADR 0006, WorkOS production checklist"
```

Then ask Chris before merging or opening a PR. Before merging, Chris adds the same JWT template to the WorkOS staging environment the live site uses (the one whose client id is `WORKOS_CLIENT_ID` on `affable-hound-751`); otherwise live members never get an `emailHash` and the switch to production can't carry them. Sign-ups start invite-only after the deploy until he opens them from the screen.
