// App shell. The screens are still the design prototype (synced from prototypes/quick-deal by
// scripts/sync-prototype.mjs); this module adds sign-in (WorkOS AuthKit), the Convex connection,
// and the invite-only beta gate on top. Phase 1 moves the screens to components backed by convex/sessions.ts.
import { ConvexClient } from "convex/browser";
import { ConvexError } from "convex/values";
import { createClient } from "@workos-inc/authkit-js";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { cardsFor, type BigOneCardRow, type TaskType } from "../../../packages/core/src";
import { localDayKey, msToLocalMidnight } from "./days";
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
  clock(offsetMs: number): void;
  /** All open big ones, comeback first then newest worked; the screen shows the first CARDS_SHOWN. Optional until the cards screen exists. */
  bigOnes?(cards: BigOneCardRow[]): void;
}
interface DealArgs { act: string | null; breakMin: number; task: string; focusMin: number }
interface Backend {
  start(deal: DealArgs): void;
  ask(pick: number | "override", intention?: string): void;
  next(fromIdx: number): void;
  bonus(): void;
  end(): void;
  /** namedAt: client time plus clock offset when the student first tapped "Bigger than one block?" */
  startBigOne(d: { title: string; taskType?: TaskType; gutMin?: number; firstMove: string; deal: DealArgs; namedAt?: number }): void;
  startFromCard(taskId: string, deal: DealArgs): void;
  blockNotes(fromIdx: number, bookmark: string | undefined, done: boolean): void;
  taskMenu(taskId: string, action: "startFresh" | "setAside" | "reopen" | "remove"): void;
  logEvent(kind: "comeback_shown" | "comeback_started" | "install_done" | "push_enabled", taskId?: string): void;
}
let live = false;
function goLive(convex: ConvexClient) {
  const app = (window as unknown as { pomodealApp?: LiveApp }).pomodealApp;
  if (live || !app) return;
  live = true;
  let sessionId: Id<"sessions"> | null = null;
  // The screens render time as Date.now() + offset, so a phone and a laptop agree with the server's clock.
  // The reply left the server about half a round trip before it arrived.
  const syncClock = (sentAt: number, serverNow: number) => app.clock(serverNow - (sentAt + (Date.now() - sentAt) / 2));
  const report = (what: string) => (e: unknown) => console.error(`[pomodeal] ${what} failed`, e);
  const dayKey = () => localDayKey(Date.now());
  const toDeal = (d: DealArgs) => ({ activity: d.act ?? null, breakMin: d.breakMin, task: d.task, focusMin: d.focusMin });
  const be: Backend = {
    start: (d) => {
      const sentAt = Date.now();
      void convex.mutation(api.sessions.start, { deal: toDeal(d) })
        .then((r) => syncClock(sentAt, r.serverNow))
        .catch(report("start"));
    },
    ask: (pick, intention) => { if (sessionId) void convex.mutation(api.sessions.ask, { sessionId, pick, ...(intention ? { intention } : {}) }).catch(report("ask")); },
    next: (fromIdx) => { if (sessionId) void convex.mutation(api.sessions.next, { sessionId, fromIdx, dayKey: dayKey() }).catch(report("next")); },
    bonus: () => { if (sessionId) void convex.mutation(api.sessions.bonus, { sessionId }).catch(report("bonus")); },
    end: () => { if (sessionId) void convex.mutation(api.sessions.end, { sessionId, dayKey: dayKey() }).catch(report("end")); },
    startBigOne: (d) => {
      const sentAt = Date.now();
      void convex.mutation(api.tasks.create, {
        title: d.title, ...(d.taskType ? { taskType: d.taskType } : {}), ...(d.gutMin !== undefined ? { gutMin: d.gutMin } : {}),
        firstMove: d.firstMove, deal: toDeal(d.deal), dayKey: dayKey(), ...(d.namedAt !== undefined ? { namedAt: d.namedAt } : {}),
      }).then((r) => syncClock(sentAt, r.serverNow)).catch(report("startBigOne"));
    },
    startFromCard: (taskId, deal) => {
      const sentAt = Date.now();
      void convex.mutation(api.tasks.startFromCard, { taskId: taskId as Id<"tasks">, deal: toDeal(deal), dayKey: dayKey() })
        .then((r) => syncClock(sentAt, r.serverNow))
        .catch(report("startFromCard"));
    },
    blockNotes: (fromIdx, bookmark, done) => {
      if (sessionId) void convex.mutation(api.tasks.blockNotes, { sessionId, fromIdx, ...(bookmark ? { bookmark } : {}), done, dayKey: dayKey() }).catch(report("blockNotes"));
    },
    taskMenu: (taskId, action) => { void convex.mutation(api.tasks[action], { taskId: taskId as Id<"tasks"> }).catch(report(action)); },
    logEvent: (kind, taskId) => { void convex.mutation(api.events.logClient, { kind, ...(taskId ? { taskId: taskId as Id<"tasks"> } : {}) }).catch(report("logEvent")); },
  };
  app.attach(be);
  const sentAt = Date.now();
  convex.mutation(api.sessions.serverNow, {}).then((now) => syncClock(sentAt, now)).catch(report("serverNow"));
  convex.onUpdate(api.sessions.current, {}, (doc) => { sessionId = doc ? doc._id : null; app.session(doc); });
  convex.onUpdate(api.sessions.today, { now: Date.now() }, (entries) => app.ledger(entries));

  // Big-one cards: recomputed when the tasks change and at local midnight (comeback depends on today's key).
  let openTasks: Doc<"tasks">[] | null = null;
  const pushCards = () => {
    if (!openTasks) return;
    app.bigOnes?.(cardsFor(openTasks.map(({ _id, ...t }) => ({ ...t, id: _id as string })), dayKey()));
  };
  convex.onUpdate(api.tasks.open, {}, (tasks) => { openTasks = tasks; pushCards(); });
  const armMidnight = () => setTimeout(() => { pushCards(); armMidnight(); }, msToLocalMidnight(Date.now()));
  armMidnight();
}

start().catch((e) => console.error("[pomodeal] startup failed", e));
