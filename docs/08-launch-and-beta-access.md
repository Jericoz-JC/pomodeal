# Launch and Beta Access

Exact steps to put Pomodeal on Cloudflare Pages with WorkOS sign-in, and how invites work once it's live.

**Live pieces so far**

| Piece | Dev | Production |
| --- | --- | --- |
| Convex | `tremendous-lark-56` | `affable-hound-751` (functions deployed) |
| WorkOS AuthKit | Auto-provisioned by `npx convex dev` (convex.json → `authKit.dev`) | Staging environment created in the Convex dashboard (no card needed); switch to a production environment before public launch |
| Web | `npm run dev` on http://localhost:5173 | Cloudflare Worker → pomodeal.chrisgems5.workers.dev, then pomodeal.com |

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
   - **Redirects:** add `https://pomodeal.com/callback` and `https://pomodeal.pages.dev/callback` (use your real `*.pages.dev` name from step C). Set the **sign-out redirect** to `https://pomodeal.com`.
   - **Authentication → Sessions → CORS / allowed origins:** add `https://pomodeal.com` and `https://pomodeal.pages.dev`.
   - **Authentication methods:** turn on **Magic Auth** (email code). For **Google**, production needs your own Google OAuth client (WorkOS walks you through it); dev works without one.

## C. Cloudflare (Worker with static assets)

Cloudflare now creates Git-connected sites as **Workers**. `wrangler.jsonc` in the repo tells the deploy where the built site is and serves `index.html` for app routes like `/callback` and `/invite`.

1. https://dash.cloudflare.com → **Workers & Pages → Create** → import **Jericoz-JC/pomodeal** from GitHub. Project name `pomodeal`.
2. **Settings → Build:**
   - Build command: `npm run build:ci`
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

1. Cloudflare → **Domain Registration → Register Domains** → `pomodeal.com`. (If you bought it on Vercel: add the site to Cloudflare, then change the nameservers in Vercel's domain settings to the two Cloudflare shows.)
2. Worker → **Settings → Domains & Routes → Add → Custom domain** → `pomodeal.com`, then again for `www.pomodeal.com`.

## E. First sign-in (you become the first member)

1. Make a founder invite on production:
   ```bash
   npx convex run --prod beta:seedInvite '{"maxUses":1,"note":"Chris"}'
   ```
   It prints a code like `"K7MPX2QA"`.
2. Open `https://pomodeal.com/?invite=K7MPX2QA` → **Accept invite** → sign up with WorkOS → the ticket gets stamped and you're in.
3. Make yourself an admin (unlimited invites):
   ```bash
   npx convex run --prod beta:makeAdmin '{"displayName":"Chris Jobi"}'
   ```
   Use the name the account menu shows.

---

## How beta access works

```
friend gets link ──► pomodeal.com/?invite=CODE ──► "You're invited" ticket
        │                                              │ Accept invite
        │                                              ▼
        │                                   WorkOS sign-up (email code or Google)
        │                                              │ back to /callback
        │                                              ▼
        │                              beta.claim(CODE): checks it exists, isn't used,
        │                              isn't expired → creates their member row
        │                                              ▼
        └──── no code? signs in anyway ──► "You're on the list" (no data access)
```

- **Members invite friends** from the account button (top right) → **Invite friends** → **Make an invite ticket** → **Copy link**. Each ticket works once. Everyone gets **11** (a full room of 12 with you); admins are unlimited.
- **Founder or batch invites** come from the CLI: `npx convex run --prod beta:seedInvite '{"maxUses":10,"note":"BIO 180 group","expiresInDays":14}'`.
- **Everything is enforced on the server.** Every Convex function derives the user from the WorkOS token (`ctx.auth`), never from what the browser sends. A signed-in person without a claimed invite can't read or write any study data.
- **Errors people can see:** "That invite code doesn't exist", "That invite has already been used", "That invite has expired". Each one tells them to ask their friend for a new link.

## Handy admin commands

```bash
npx convex run --prod beta:seedInvite '{"maxUses":1}'                 # one founder invite
npx convex run --prod beta:makeAdmin '{"displayName":"Name"}'          # unlimited invites
npx convex data --prod users                                          # who's in
npx convex data --prod invites                                        # which codes are used
```

## Known limits for the beta

- The WorkOS refresh token is stored in the browser's localStorage (`devMode: true`). Before a public launch, set up a WorkOS custom auth domain (e.g. `auth.pomodeal.com`) so it can use a secure cookie instead.
- The study screens are still the prototype. Sessions and the ledger are stored per member on the server, but the screens don't call those functions yet; that's the Phase 1 port.
