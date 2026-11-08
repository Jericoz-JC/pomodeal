# Deploy and Versioning

## What's live in v0.2

- **Web (Cloudflare Pages, or Vercel; see `07-stack-and-hosting.md`):** the installable PWA. Screens are the design prototype (synced from `prototypes/quick-deal/` at build), plus the service worker, manifest and icons.
- **Backend (Convex):** `convex/schema.ts` (sessions, ledger) and `convex/sessions.ts` (start, ask, next, end, current, today), all built on the tested rules in `packages/core`. The web shell connects and subscribes on load; Phase 1 wires the screens to these functions.

## One-time setup (Chris, about 10 minutes)

Each of these opens a browser to sign in.

1. **GitHub:** `gh auth login` → GitHub.com → HTTPS → login with a web browser. Then from the repo: `gh repo create pomodeal --private --source . --push` and `git push origin --tags`.
2. **Convex:** `npx convex dev` → log in → create project "pomodeal". This writes `.env.local` with `VITE_CONVEX_URL` and `CONVEX_DEPLOYMENT`, generates `convex/_generated/`, and pushes the functions to a dev deployment. Leave it running while developing.
3. **Convex production key:** Convex dashboard → project → Settings → URL & deploy key → generate a **production deploy key**.
4. **Cloudflare Pages (recommended):** dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git → pick the `pomodeal` repo. Build settings:
   - Framework preset: None
   - Build command: `npx convex deploy --cmd "npm run build" --cmd-url-env-var-name VITE_CONVEX_URL`
   - Build output directory: `apps/web/dist`
   - Environment variables (Production): `CONVEX_DEPLOY_KEY` = the key from step 3, and `NODE_VERSION` = `22`
   - For preview branches, either leave `CONVEX_DEPLOY_KEY` unset there (previews then build without a backend) or add a Convex **preview** deploy key.
5. **Domain:** buy `pomodeal.com` on Cloudflare Registrar (or on Vercel, then switch its nameservers to Cloudflare's). In the Pages project → Custom domains → add `pomodeal.com` and `www.pomodeal.com`.

**Vercel instead:** vercel.com → Add New Project → import the repo (vercel.json sets the build) → add `CONVEX_DEPLOY_KEY` (Production). Note the Hobby limits in `07-stack-and-hosting.md`.

From then on, every push to `main` runs `convex deploy` (functions + schema to prod) and then builds the PWA with the prod `VITE_CONVEX_URL`. Pull requests and branches get preview URLs.

## Day to day

```bash
npx convex dev          # terminal 1: backend, hot-reloads functions
npm run dev             # terminal 2: web app at http://localhost:5173
npm test                # core negotiation rules
npm run shoot -- prototypes/quick-deal/shots/rN   # design screenshots
```

## Versioning

- **Semantic versions with git tags:** `v0.MINOR.PATCH` until the public beta. Minor = a phase milestone or a design round that ships; patch = fixes.
- **Branches:** `main` is always deployable (Vercel prod). Work happens on short branches (`design/r6`, `feat/quick-deal-react`, `ext/side-panel`) merged by PR so each gets a preview URL.
- **Changelog:** `CHANGELOG.md`, one entry per tag, written for humans.
- **Release steps:** update `CHANGELOG.md` → bump `version` in the root `package.json` → commit → `git tag -a vX.Y.Z -m "..."` → `git push && git push --tags`.

| Tag | What |
| --- | --- |
| v0.1.0 | Phase 0 docs, build loop, prototype after design round 4 |
| v0.2.0 | Monorepo, tested negotiation core, Convex backend, PWA shell on Vercel |
