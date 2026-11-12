# Launch and Beta Access

Exact steps to put Pomodeal on Cloudflare Pages with WorkOS sign-in, and how invites work once it's live.

**Live pieces so far**

| Piece | Dev | Production |
| --- | --- | --- |
| Convex | `tremendous-lark-56` | `affable-hound-751` (functions deployed) |
| WorkOS AuthKit | Auto-provisioned by `npx convex dev` (convex.json → `authKit.dev`) | Staging environment created in the Convex dashboard (no card needed); switch to a production environment before public launch |
| Web | `npm run dev` on http://localhost:5173 | Cloudflare Worker → pomodeal.chrisgems5.workers.dev, then pomodeal.app |

---

## A. Convex production deploy key (2 min)

1. https://dashboard.convex.dev/t/chris-jobi/pomodeal → switch to **Production** (`affable-hound-751`).
2. **Settings → URL & Deploy Key → Generate Production Deploy Key.** Copy it (`prod:…`). You'll paste it in step C.

## B. WorkOS for production (5 min)

1. Still on the Production deployment: **Settings → Integrations → WorkOS AuthKit → Create environment.** Copy the **Client ID** (`client_01…`) and **API key** (`sk_live_…`).
2. Tell Convex prod which WorkOS environment to trust (either one works):
   - Dashboard: Production → Settings → Environment Variables → add `WORKOS_CLIENT_ID` = the client id.
   - Or CLI: `npx convex env set --prod WORKOS_CLIENT_ID client_01…`
3. In the **WorkOS dashboard** for that production environment:
   - **Redirects:** add `https://pomodeal.app/callback` and `https://pomodeal.pages.dev/callback` (use your real `*.pages.dev` name from step C). Set the **sign-out redirect** to `https://pomodeal.app`.
   - **Authentication → Sessions → CORS / allowed origins:** add `https://pomodeal.app` and `https://pomodeal.pages.dev`.
   - **Authentication methods:** turn on **Magic Auth** (email code). **Google** and **GitHub** each need your own OAuth app in production (WorkOS walks you through both); staging works without them. Leave **Apple** off: it needs an Apple developer account and a Mac.
   - **JWT template** (Authentication → Sessions): `{"email": {{user.email}}, "email_verified": {{user.email_verified}}}`. Add the same template to the staging environment too, now: it is how accounts carry over (below).

### Moving members from WorkOS staging to production (spec 016)

A member's sign-in identity changes with the WorkOS environment, so accounts are matched by a hash of the verified email instead.

1. With the JWT template on the staging environment, wait until **Ready for the WorkOS move** on the Sign-ups screen equals the member count (everyone has opened the app once).
2. Set up the production environment as above, then point `WORKOS_CLIENT_ID` (Convex prod) and `VITE_WORKOS_CLIENT_ID` (Cloudflare) at its client id and push.
3. Everyone is signed out once. Their next sign-in, with Google, GitHub or an email code on the same address, moves their account across: same data, same invites.

## C. Cloudflare (Worker with static assets)

Cloudflare now creates Git-connected sites as **Workers**. `wrangler.jsonc` in the repo tells the deploy where the built site is and serves `index.html` for app routes like `/callback` and `/invite`.

1. https://dash.cloudflare.com → **Workers & Pages → Create** → import **Jericoz-JC/pomodeal** from GitHub. Project name `pomodeal`.
2. **Settings → Build:**
   - Build command: `npm run build` (same as `build:ci`)
   - Deploy command: `npx wrangler deploy`
3. **Settings → Build → Variables and secrets** (build-time, not the Runtime box):

   | Name | Value | Type |
   | --- | --- | --- |
   | `CONVEX_DEPLOY_KEY` | production deploy key | **Secret** |
   | `NODE_VERSION` | `22` | Text |
   | `VITE_WORKOS_CLIENT_ID` | `client_01M6WA8X7W5DGJVTK9GY015Q4Y` (production WorkOS) | Text |

   Runtime variables aren't needed: the site is static files.
4. Every push to `main` builds and deploys. Live at https://pomodeal.chrisgems5.workers.dev until the domain is attached.

The app works out its own sign-in callback from the URL it's opened on, so there's no redirect variable. Every address it's served from must be listed in WorkOS **Redirects** (`<origin>/callback`) and **CORS** (`<origin>`).

## D. Domain (5 min plus DNS time)

1. Cloudflare → **Domain Registration → Register Domains** → `pomodeal.app`. (If you bought it on Vercel: add the site to Cloudflare, then change the nameservers in Vercel's domain settings to the two Cloudflare shows.)
2. Worker → **Settings → Domains & Routes → Add → Custom domain** → `pomodeal.app`, then again for `www.pomodeal.app`.

## E. First sign-in (you become the first member)

1. Make a founder invite on production:
   ```bash
   npx convex run --prod beta:seedInvite '{"maxUses":1,"note":"Chris"}'
   ```
   It prints a code like `"K7MPX2QA"`.
2. Open `https://pomodeal.app/?invite=K7MPX2QA` → **Accept invite** → sign up with WorkOS → the ticket gets stamped and you're in.
3. Make yourself an admin (unlimited invites):
   ```bash
   npx convex run --prod beta:makeAdmin '{"displayName":"Chris Jobi"}'
   ```
   Use the name the account menu shows.

---

## How beta access works (spec 016)

```
someone signs in (GitHub, Google or email) ──► beta.enter, once per app load
        │
        ├─ already a member ─────────────────► the app (their email hash is filled in if missing)
        ├─ same verified email, other WorkOS env ► their old account moves to this sign-in
        ├─ sign-ups open ────────────────────► joins; the brake checks the limits
        └─ sign-ups closed ──────────────────► "Pomodeal is full for now" (on the list, no data access)

friend opens pomodeal.app/?invite=CODE ──► sign in ──► beta.claim(CODE) ──► joins, open or closed
```

- **Sign-ups start invite-only** until an admin opens them: account button → **Sign-ups** → **Open sign-ups**.
- **The brake:** when 40 people have joined in 24 hours, or there are 150 members, sign-ups switch to invite-only by themselves and every admin's devices get a push ("Sign-ups paused: 40 new members in 24 hours."). Invites count toward both numbers but are never refused. Reopening starts a fresh 24-hour count. Both limits are editable on the screen.
- **What the screen shows:** new members in the last 24 hours, members against the cap, members who studied this week (what costs function calls), people waiting, members ready for the WorkOS move, and a link to the Convex usage page. The free Convex plan stops at 1M function calls a month; Professional ($25 a month) includes 25M.
- **Waiting people get in by themselves** when sign-ups reopen, the next time they have the app open.
- **Members invite friends** from the account button → **Invite friends** → **Make an invite ticket** → **Copy link**. Each ticket works once. Everyone gets **11** (a full room of 12 with you); admins are unlimited.
- **Founder or batch invites** come from the CLI: `npx convex run --prod beta:seedInvite '{"maxUses":10,"note":"BIO 180 group","expiresInDays":14}'`.
- **Everything is enforced on the server.** Every Convex function derives the user from the WorkOS token (`ctx.auth`), never from what the browser sends. Only admins can read the numbers or change sign-ups.
- **Errors people can see:** "That invite code doesn't exist", "That invite has already been used", "That invite has expired". Each one tells them to ask their friend for a new link.

## Handy admin commands

```bash
npx convex run --prod beta:seedInvite '{"maxUses":1}'                 # one founder invite
npx convex run --prod beta:makeAdmin '{"displayName":"Name"}'          # unlimited invites
npx convex data --prod users                                          # who's in
npx convex data --prod invites                                        # which codes are used
npx convex data --prod waitlist                                       # who is waiting (sign-ups are on the Sign-ups screen)
```

## Known limits for the beta

- The WorkOS refresh token is stored in the browser's localStorage (`devMode: true`). Before a public launch, set up a WorkOS custom auth domain (e.g. `auth.pomodeal.app`) so it can use a secure cookie instead.
- The study screens are still the prototype. Sessions and the ledger are stored per member on the server, but the screens don't call those functions yet; that's the Phase 1 port.
