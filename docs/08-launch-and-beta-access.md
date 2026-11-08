# Launch and Beta Access

Exact steps to put Pomodeal on Cloudflare Pages with WorkOS sign-in, and how invites work once it's live.

**Live pieces so far**

| Piece | Dev | Production |
| --- | --- | --- |
| Convex | `tremendous-lark-56` | `affable-hound-751` (functions deployed) |
| WorkOS AuthKit | Auto-provisioned by `npx convex dev` (convex.json → `authKit.dev`) | Created once in the Convex dashboard (step B) |
| Web | `npm run dev` on http://localhost:5173 | Cloudflare Pages → pomodeal.com |

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

## C. Cloudflare Pages (5 min)

1. https://dash.cloudflare.com → **Workers & Pages → Create → Pages → Connect to Git** → authorize GitHub → pick **Jericoz-JC/pomodeal**.
2. **Set up builds and deployments:**
   - Project name: `pomodeal` (gives `pomodeal.pages.dev`)
   - Production branch: `main`
   - Framework preset: **None**
   - Build command: `npm run build:ci`
   - Build output directory: `apps/web/dist`
   - Root directory: leave empty
3. **Environment variables → Production:**

   | Name | Value | Type |
   | --- | --- | --- |
   | `CONVEX_DEPLOY_KEY` | `prod:…` from step A | **Encrypt** |
   | `NODE_VERSION` | `22` | Plain text |
   | `VITE_WORKOS_CLIENT_ID` | production `client_01…` from step B | Plain text |
   | `VITE_WORKOS_REDIRECT_URI` | `https://pomodeal.com/callback` (use the pages.dev URL until the domain is attached) | Plain text |

   Leave **Preview** empty: preview builds then ship the app without a backend or sign-in.
4. **Save and Deploy.** The first build runs `convex deploy` (functions to `affable-hound-751`) and then builds the PWA against it.

## D. Domain (5 min plus DNS time)

1. Cloudflare → **Domain Registration → Register Domains** → `pomodeal.com`. (If you bought it on Vercel: add the site to Cloudflare, then change the nameservers in Vercel's domain settings to the two Cloudflare shows.)
2. Pages project → **Custom domains → Set up a domain** → `pomodeal.com`, then again for `www.pomodeal.com`.
3. Update `VITE_WORKOS_REDIRECT_URI` to `https://pomodeal.com/callback` if you'd used the pages.dev URL, and redeploy.

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
