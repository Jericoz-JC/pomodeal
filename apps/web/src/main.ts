// App shell. The screens are still the design prototype (synced from prototypes/quick-deal by
// scripts/sync-prototype.mjs); this module adds sign-in (WorkOS AuthKit), the Convex connection,
// and the invite-only beta gate on top. Phase 1 moves the screens to components backed by convex/sessions.ts.
import { ConvexClient } from "convex/browser";
import { ConvexError } from "convex/values";
import { createClient } from "@workos-inc/authkit-js";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { mountGate, type GateState, type Provider } from "./gate";

// Which one-tap buttons to show; each must be enabled in WorkOS → Authentication → Providers.
const providers = ((import.meta.env.VITE_AUTH_PROVIDERS as string | undefined) || "GitHubOAuth,GoogleOAuth,AppleOAuth")
  .split(",").map((p) => p.trim()).filter(Boolean) as Provider[];

const convexUrl = (import.meta.env.VITE_CONVEX_URL as string | undefined) || undefined;
const workosClientId = (import.meta.env.VITE_WORKOS_CLIENT_ID as string | undefined) || undefined;
const redirectUri = (import.meta.env.VITE_WORKOS_REDIRECT_URI as string | undefined) || `${location.origin}/callback`;
const INVITE_KEY = "pomodeal.invite";

// Install support: Chrome/Android offer a prompt we can trigger; iOS Safari needs Share → Add to Home Screen.
let installPrompt: { prompt(): Promise<void> } | null = null;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installPrompt = e as unknown as { prompt(): Promise<void> }; });
const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);

/** An invite code from ?invite=CODE, remembered across the sign-in redirect. */
function pendingInvite(): string | null {
  const fromUrl = new URLSearchParams(location.search).get("invite");
  try {
    if (fromUrl) sessionStorage.setItem(INVITE_KEY, fromUrl.trim().toUpperCase());
    return sessionStorage.getItem(INVITE_KEY);
  } catch {
    return fromUrl ? fromUrl.trim().toUpperCase() : null;
  }
}
function clearInvite() { try { sessionStorage.removeItem(INVITE_KEY); } catch { /* storage blocked */ } }

async function start() {
  if (!convexUrl) { console.info("[pomodeal] no backend configured; prototype only"); return; }
  const convex = new ConvexClient(convexUrl);
  if (!workosClientId) { console.info("[pomodeal] no WorkOS client id; running without sign-in"); return; }

  let invite = pendingInvite();
  const authkit = await createClient(workosClientId, {
    redirectUri,
    // Refresh token in localStorage. Production cookies need a WorkOS custom auth domain; revisit before public launch.
    devMode: true,
    onRedirectCallback: () => {
      history.replaceState(null, "", invite ? `/?invite=${encodeURIComponent(invite)}` : "/");
    },
  });

  const gate = mountGate({
    providers,
    appEnv: () => ({ standalone, ios: isIOS, install: standalone ? null : installPrompt ? "prompt" : isIOS ? "ios" : null }),
    install: () => { void installPrompt?.prompt(); },
    // One-tap social sign-in: same PKCE flow as signIn(), but skips the AuthKit chooser by naming the provider.
    signInWith: async (provider) => {
      const url = new URL(await authkit.getSignInUrl());
      url.searchParams.set("provider", provider);
      location.assign(url.toString());
    },
    signIn: () => void authkit.signIn(),
    signUp: () => void authkit.signUp(),
    signOut: () => { clearInvite(); authkit.signOut({ returnTo: location.origin }); },
    createInvite: async () => { await convex.mutation(api.beta.createInvite, {}); },
    closeInvites: () => history.replaceState(null, "", "/"),
  });

  const user = authkit.getUser();
  if (!user) { gate.setState({ kind: "signedOut", invite }); return; }

  convex.setAuth(async ({ forceRefreshToken }) => {
    try { return await authkit.getAccessToken({ forceRefresh: forceRefreshToken }); } catch { return null; }
  });

  let claiming = false;
  convex.onUpdate(api.beta.me, {}, async (me) => {
    if (me.status === "member") {
      clearInvite(); invite = null;
      gate.setState({ kind: "member" } satisfies GateState, { displayName: me.displayName, invitesLeft: me.invitesLeft });
      goLive(convex);
      return;
    }
    if (me.status === "signedOut") { gate.setState({ kind: "loading" }); return; } // token still attaching
    if (invite && !claiming) {
      claiming = true;
      gate.setState({ kind: "claiming", invite });
      try {
        const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email.split("@")[0];
        await convex.mutation(api.beta.claim, { code: invite, displayName: name });
      } catch (e) {
        clearInvite(); invite = null;
        const data = e instanceof ConvexError ? (e.data as { message?: unknown }) : null;
        gate.setState({ kind: "claimError", message: data && typeof data.message === "string" ? data.message : "Something went wrong. Try the link again." });
      }
      return;
    }
    if (!claiming) gate.setState({ kind: "waitlist", email: user.email });
  });

  convex.onUpdate(api.beta.myInvites, {}, (t) => gate.setTickets(t));
  (window as unknown as { pomodeal: unknown }).pomodeal = { convex, api, authkit };
}

/** The screens (the design prototype's engine) talk to Convex once someone is a member. */
interface LiveApp {
  attach(be: Backend): void;
  session(doc: unknown): void;
  ledger(entries: unknown[]): void;
}
interface Backend {
  start(deal: { act: string | null; breakMin: number; task: string; focusMin: number }): void;
  ask(pick: number | "override", intention?: string): void;
  next(fromIdx: number): void;
  bonus(): void;
  end(): void;
}
let live = false;
function goLive(convex: ConvexClient) {
  const app = (window as unknown as { pomodealApp?: LiveApp }).pomodealApp;
  if (live || !app) return;
  live = true;
  let sessionId: Id<"sessions"> | null = null;
  const report = (what: string) => (e: unknown) => console.error(`[pomodeal] ${what} failed`, e);
  const be: Backend = {
    start: (d) => void convex.mutation(api.sessions.start, { deal: { activity: d.act ?? null, breakMin: d.breakMin, task: d.task, focusMin: d.focusMin } }).catch(report("start")),
    ask: (pick, intention) => { if (sessionId) void convex.mutation(api.sessions.ask, { sessionId, pick, ...(intention ? { intention } : {}) }).catch(report("ask")); },
    next: (fromIdx) => { if (sessionId) void convex.mutation(api.sessions.next, { sessionId, fromIdx }).catch(report("next")); },
    bonus: () => { if (sessionId) void convex.mutation(api.sessions.bonus, { sessionId }).catch(report("bonus")); },
    end: () => { if (sessionId) void convex.mutation(api.sessions.end, { sessionId }).catch(report("end")); },
  };
  app.attach(be);
  convex.onUpdate(api.sessions.current, {}, (doc) => { sessionId = doc ? doc._id : null; app.session(doc); });
  convex.onUpdate(api.sessions.today, { now: Date.now() }, (entries) => app.ledger(entries));
}

start().catch((e) => console.error("[pomodeal] startup failed", e));
