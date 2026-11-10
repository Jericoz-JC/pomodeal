// App shell. The screens are still the design prototype (synced from prototypes/quick-deal by
// scripts/sync-prototype.mjs); this module adds sign-in (WorkOS AuthKit), the Convex connection,
// and the invite-only beta gate on top. Phase 1 moves the screens to components backed by convex/sessions.ts.
import { ConvexClient } from "convex/browser";
import { ConvexError } from "convex/values";
import { createClient } from "@workos-inc/authkit-js";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { cardsFor, proposeSpread, shouldAskCheckIn, splitSlots, weekKey, type BigOneCardRow, type Piece, type SpreadDay, type TaskType } from "../../../packages/core/src";
import { localDayKey, msToLocalMidnight } from "./days";
import { mountGate, type GateState, type Provider } from "./gate";
import { enablePush, pushConfigured, pushSupported, type PushResult } from "./push";

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
/** install_done is logged once per device, the first time the app opens from the Home Screen. */
const INSTALL_DONE_KEY = "pomodeal.installDone";

/** An invite code from ?invite=CODE, remembered across the sign-in redirect. */
function pendingInvite(): string | null {
  const fromUrl = new URLSearchParams(location.search).get("invite");
  try {
    // localStorage, not sessionStorage: sign-in can finish in another tab of the same browser
    if (fromUrl) localStorage.setItem(INVITE_KEY, fromUrl.trim().toUpperCase());
    return localStorage.getItem(INVITE_KEY) ?? sessionStorage.getItem(INVITE_KEY);
  } catch {
    return fromUrl ? fromUrl.trim().toUpperCase() : null;
  }
}
function clearInvite() { try { localStorage.removeItem(INVITE_KEY); sessionStorage.removeItem(INVITE_KEY); } catch { /* storage blocked */ } }

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
        // The server said no (used, expired, not found): the code is spent. Anything else is a connection
        // problem, so the code is kept and a reload tries again.
        const data = e instanceof ConvexError ? (e.data as { message?: unknown }) : null;
        if (data) { clearInvite(); invite = null; } else claiming = false;
        gate.setState({ kind: "claimError", message: data && typeof data.message === "string" ? data.message : "Couldn't reach Pomodeal. Your invite is saved: reload to try again." });
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
  /** All open big ones, comeback first then newest worked; the screen shows the first CARDS_SHOWN. */
  bigOnes(cards: BigOneCardRow[]): void;
  /** The Sunday's day key while the weekly question is due (and not skipped on this device), else null. */
  weekCheckin(weekKey: string | null): void;
  /** What this device can do: Web Push in this tab, opened from the Home Screen, an iPhone Safari tab; and whether the
   *  server offers "Suggest pieces" (api.ai.enabled, so it is sent again whenever that changes). */
  env(e: { pushSupported: boolean; installed: boolean; iosSafari: boolean; aiSuggest: boolean }): void;
}
interface DealArgs { act: string | null; breakMin: number; task: string; focusMin: number }
/** What the split and spread sheets need about one big one, read from the open-tasks subscription (no refetch). */
interface PlanTask { taskType?: TaskType; gutMin?: number; openTermsMin: number | null; pieces: Piece[]; dueDay?: string; spreadSignedAt?: number; slots: string[] }
/** The result of a save or a signature: the server's own words when it refused. */
type PlanResult = { ok: true } | { ok: false; message: string };
/** What the split sheet hears about its suggestion: the row as it changes, "failed" for a refusal over the limit or an
 *  error, "off" when the server has the feature switched off. */
type SuggestUpdate = { status: "pending" | "ready" | "failed" | "off"; pieces?: { title: string; minutes: number }[] };
interface SuggestHandle {
  /** Stop listening; the row stays until a save (which deletes it) or the daily sweep. */
  unsubscribe(): void;
  /** Stop listening and delete the row (Undo, Close, or a failure). */
  dismiss(): void;
}
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
  /** One answer to the weekly question; answering again in the same week replaces it. Never throws. */
  answerCheckIn(weekKey: string, answer: "better" | "same" | "worse"): void;
  /** Open and set-aside big ones for the "All big ones" list, read once when it opens (R24). */
  allBigOnes(): Promise<{ id: string; title: string; status: "open" | "set_aside" }[]>;
  /** From the "Turn on taps at block ends" tap only: the browser prompt, then this device's subscription. Never throws. */
  enablePush(): Promise<PushResult>;
  /** Spec 008 planning on the card. The sheets get the big one from here (pieces with stampedAt/plannedDay, gut, due, type)
   *  and the proposal from core's proposeSpread, computed here with today's local key; there is no LiveApp push for it. */
  planOf(taskId: string): PlanTask | null;
  proposeSpread(task: { taskType?: TaskType; pieces: Piece[]; openTermsMin: number | null }, dueDay: string): SpreadDay[];
  /** Replaces the whole pieces array: callers send every piece back with its stampedAt and plannedDay.
   *  fromSuggestion: the rows started as a suggestion (marks the big one aiSuggested, logs ai_accepted). */
  saveSplit(taskId: string, pieces: Piece[], fromSuggestion?: boolean): Promise<PlanResult>;
  signSpread(taskId: string, dueDay: string, plan: SpreadDay[]): Promise<PlanResult>;
  /** Spec 008 "Suggest pieces", after the disclosure. Only the big one's id goes up: the server sends the model its
   *  stored title (scrubbed), type and gut size, nothing else. A row that disappears, or no answer within
   *  SUGGEST_WAIT_MS, ends the wait as "failed". Never throws. */
  suggestPieces(taskId: string, onUpdate: (u: SuggestUpdate) => void): SuggestHandle;
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
  /** Open big ones from the subscription below: the cards, and what the split and spread sheets read. */
  let openTasks: Doc<"tasks">[] | null = null;
  const refused = (what: string) => (e: unknown): PlanResult => {
    report(what)(e);
    const data = e instanceof ConvexError ? (e.data as { message?: unknown }) : null;
    return { ok: false, message: data && typeof data.message === "string" ? data.message : "That didn't save. Try again." };
  };
  /** Only the stored fields, so nothing the screen added rides along to the validator. */
  const cleanPiece = (p: Piece): Piece => ({
    title: p.title, minutes: p.minutes,
    ...(p.plannedDay !== undefined ? { plannedDay: p.plannedDay } : {}), ...(p.stampedAt !== undefined ? { stampedAt: p.stampedAt } : {}),
  });
  /** How long the split sheet waits for a suggestion before it shows the failure line (the model call times out at 30 s). */
  const SUGGEST_WAIT_MS = 90_000;
  /** The server's switch for "Suggest pieces" (api.ai.enabled), sent to the screens with the device facts. */
  let aiOn = false;
  const sendEnv = () => app.env({ pushSupported: pushConfigured() && pushSupported(), installed: standalone, iosSafari: pushConfigured() && isIOS, aiSuggest: aiOn });
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
    answerCheckIn: (weekKey, answer) => { void convex.mutation(api.checkIns.answer, { weekKey, answer }).catch(report("checkIn")); },
    logEvent: (kind, taskId) => { void convex.mutation(api.events.logClient, { kind, ...(taskId ? { taskId: taskId as Id<"tasks"> } : {}) }).catch(report("logEvent")); },
    allBigOnes: async () => {
      const rows = await convex.query(api.tasks.all, {});
      return rows.flatMap((t) => t.status === "open" || t.status === "set_aside" ? [{ id: t._id as string, title: t.title, status: t.status }] : []);
    },
    enablePush: async () => {
      const r = await enablePush(convex);
      if (r === "granted") be.logEvent("push_enabled");
      return r;
    },
    planOf: (taskId) => {
      const t = openTasks?.find((x) => x._id === taskId);
      if (!t) return null;
      return {
        ...(t.taskType ? { taskType: t.taskType } : {}), ...(t.gutMin !== undefined ? { gutMin: t.gutMin } : {}),
        openTermsMin: t.openTermsMin, pieces: (t.pieces ?? []).map(cleanPiece),
        ...(t.dueDay !== undefined ? { dueDay: t.dueDay } : {}), ...(t.spreadSignedAt !== undefined ? { spreadSignedAt: t.spreadSignedAt } : {}),
        slots: splitSlots(t.taskType),
      };
    },
    proposeSpread: (task, dueDay) => proposeSpread(task, dayKey(), dueDay),
    saveSplit: (taskId, pieces, fromSuggestion) =>
      convex.mutation(api.tasks.saveSplit, { taskId: taskId as Id<"tasks">, pieces: pieces.map(cleanPiece), ...(fromSuggestion ? { fromSuggestion: true } : {}) })
        .then((): PlanResult => ({ ok: true }), refused("saveSplit")),
    signSpread: (taskId, dueDay, plan) =>
      convex.mutation(api.tasks.signSpread, {
        taskId: taskId as Id<"tasks">, dueDay,
        plan: plan.map((d) => ({ day: d.day, minutes: d.minutes, ...(d.pieceIndex !== undefined ? { pieceIndex: d.pieceIndex } : {}) })),
      }).then((): PlanResult => ({ ok: true }), refused("signSpread")),
    suggestPieces: (taskId, onUpdate) => {
      let stop: (() => void) | null = null;
      let id: Id<"pieceSuggestions"> | null = null;
      let dismissed = false;
      let settled = false;
      let timer: ReturnType<typeof setTimeout> | null = null;
      const stopTimer = () => { if (timer) clearTimeout(timer); timer = null; };
      /** The sheet hears one answer: ready, failed or off. "pending" passes through while waiting. */
      const settle = (u: SuggestUpdate) => {
        if (settled) return;
        if (u.status !== "pending") { settled = true; stopTimer(); }
        onUpdate(u);
      };
      const handle: SuggestHandle = {
        unsubscribe: () => { stop?.(); stop = null; stopTimer(); },
        dismiss: () => {
          handle.unsubscribe();
          if (dismissed) return;
          dismissed = true;
          if (id) void convex.mutation(api.ai.dismissSuggestion, { suggestionId: id }).catch(report("dismissSuggestion"));
        },
      };
      // No answer in time (the action stuck, the connection gone): stop waiting and say so; the sheet then dismisses the row.
      timer = setTimeout(() => { timer = null; settle({ status: "failed" }); }, SUGGEST_WAIT_MS);
      convex.mutation(api.ai.requestSuggestion, { taskId: taskId as Id<"tasks">, dayKey: dayKey() }).then((r) => {
        if (typeof r !== "string") {
          if (r.refused === "off") { aiOn = false; sendEnv(); }
          settle({ status: r.refused === "off" ? "off" : "failed" });
          return;
        }
        id = r;
        if (dismissed) { dismissed = false; handle.dismiss(); return; } // the sheet closed while asking
        // a row that disappears while waiting (swept, or saved or dismissed elsewhere) is a failure, not a silent wait
        stop = convex.onUpdate(api.ai.suggestion, { suggestionId: r }, (row) => settle(row ?? { status: "failed" }));
      }).catch((e: unknown) => { report("requestSuggestion")(e); settle({ status: "failed" }); });
      return handle;
    },
  };
  // no VAPID key in this build: no taps to offer, so neither the permission button nor the install sheet shows
  sendEnv();
  app.attach(be);
  // "Suggest pieces" shows only while the server has it on (AI_SUGGEST_ENABLED and a key); off until this says so
  convex.onUpdate(api.ai.enabled, {}, (on) => { aiOn = on; sendEnv(); });
  if (standalone) {
    let first = false;
    try { first = !localStorage.getItem(INSTALL_DONE_KEY); if (first) localStorage.setItem(INSTALL_DONE_KEY, "1"); } catch { /* storage blocked: not logged */ }
    if (first) be.logEvent("install_done");
  }
  const sentAt = Date.now();
  convex.mutation(api.sessions.serverNow, {}).then((now) => syncClock(sentAt, now)).catch(report("serverNow"));
  convex.onUpdate(api.sessions.current, {}, (doc) => { sessionId = doc ? doc._id : null; app.session(doc); });
  convex.onUpdate(api.sessions.today, { now: Date.now() }, (entries) => app.ledger(entries));

  // Big-one cards: recomputed when the tasks change and at local midnight (comeback depends on today's key).
  const pushCards = () => {
    if (!openTasks) return;
    app.bigOnes(cardsFor(openTasks.map(({ _id, ...t }) => ({ ...t, id: _id as string })), dayKey()));
  };
  convex.onUpdate(api.tasks.open, {}, (tasks) => { openTasks = tasks; pushCards(); });
  // Weekly check-in: ask on the first open on or after Sunday, local time (core decides from the last answered week).
  let lastWeek: string | null | undefined;
  let joinedAt: number | null | undefined;
  const pushWeek = () => {
    if (lastWeek === undefined || joinedAt === undefined) return;
    if (joinedAt === null) { app.weekCheckin(null); return; }
    app.weekCheckin(shouldAskCheckIn(dayKey(), lastWeek ?? undefined, localDayKey(joinedAt)) ? weekKey(dayKey()) : null);
  };
  convex.onUpdate(api.checkIns.joinedAt, {}, (j) => { joinedAt = j; pushWeek(); });
  convex.onUpdate(api.checkIns.lastWeekKey, {}, (k) => { lastWeek = k; pushWeek(); });
  const armMidnight = () => setTimeout(() => { pushCards(); pushWeek(); armMidnight(); }, msToLocalMidnight(Date.now()));
  armMidnight();
}

start().catch((e) => console.error("[pomodeal] startup failed", e));
