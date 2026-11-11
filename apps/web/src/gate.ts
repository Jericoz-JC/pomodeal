// Beta gate: sign-in, waitlist, invite acceptance, and the invite-friends panel.
// Rendered as an overlay above the app so it never touches the design prototype's markup.
// Uses the prototype's design tokens (--paper, --card, --ink, --deal…) so it looks like the same product.

export type GateState =
  | { kind: "loading" }
  | { kind: "signedOut"; invite: string | null }
  | { kind: "claiming"; invite: string }
  | { kind: "claimError"; message: string }
  | { kind: "waitlist"; email: string | null; signups: "open" | "inviteOnly" }
  | { kind: "member" };

export interface InviteTicket { code: string; uses: number; maxUses: number; usedBy?: string | null; usedAt?: number | null }

/** Spec 010: what the admin Sign-ups panel shows (api.admin.overview). */
export interface AdminOverview {
  signups: "open" | "inviteOnly"; memberCap: number; dayLimit: number;
  paused: { at: number; reason: "dayLimit" | "memberCap" | "manual"; count: number } | null;
  members: number; newInDay: number; activeInWeek: number; waiting: number; readyForProduction: number; usageUrl: string;
}

import { LANDING_CSS, bindLanding, landingHTML, type Provider } from "./landing";
export type { Provider };

export interface GateActions {
  providers: Provider[];
  signInWith(provider: Provider): void;
  install(): void;
  appEnv(): { standalone: boolean; ios: boolean; install: "ios" | "prompt" | null };
  signIn(): void;
  signUp(): void;
  signOut(): void;
  createInvite(): Promise<void>;
  closeInvites(): void;
  /** Admins: start or stop watching api.admin.overview while the Sign-ups panel is open. */
  watchSignups(on: boolean): void;
  setSignups(mode: "open" | "inviteOnly"): Promise<void>;
  setLimits(limits: { memberCap: number; dayLimit: number }): Promise<void>;
}

const CSS = `
/* The gate's own screens (claim, invites, waiting) all sit in .wrap, so these rules stay there: the landing page and
   the app keep their own styles. Their main button is the app's stamp, like every other action. */
#pd-gate { position: fixed; inset: 0; z-index: 60; background: var(--paper); color: var(--ink); overflow-y: auto;
  padding: calc(24px + env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) calc(24px + env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px)); }
#pd-gate[hidden] { display: none; }
#pd-gate .wrap { max-width: 440px; margin: 0 auto; min-height: 100%; display: flex; flex-direction: column; gap: 22px; }
#pd-gate .wrap .mark { display: flex; align-items: center; gap: 10px; font-family: var(--font-head); font-stretch: var(--wd-display); font-weight: 800; font-size: 26px; }
#pd-gate .wrap .mark img { width: 34px; height: 34px; border-radius: 9px; }
#pd-gate .wrap h1 { font-family: var(--font-head); font-stretch: var(--wd-display); font-weight: 800; font-size: 40px; line-height: 1; margin: 0; text-wrap: balance; }
#pd-gate .wrap p { margin: 0; font-size: 17px; line-height: 1.45; }
#pd-gate .wrap .soft { color: var(--soft); }
#pd-gate .wrap .ticket { position: relative; background: var(--card); border-radius: 6px; box-shadow: 0 1px 0 var(--rule), 0 18px 34px -26px rgba(27,33,29,.6); }
#pd-gate .wrap .ticket .body { padding: 22px 20px 18px; display: flex; flex-direction: column; gap: 6px; }
#pd-gate .wrap .ticket .stub { position: relative; border-top: 2px dashed var(--rule); padding: 16px 20px 18px; display: flex; flex-direction: column; gap: 10px; }
#pd-gate .wrap .ticket .stub::before, #pd-gate .wrap .ticket .stub::after { content: ""; position: absolute; top: -11px; width: 20px; height: 20px; border-radius: 50%; background: var(--paper); }
#pd-gate .wrap .ticket .stub::before { left: -10px; } #pd-gate .wrap .ticket .stub::after { right: -10px; }
#pd-gate .wrap .big { font-family: var(--font-head); font-stretch: var(--wd-display); font-weight: 750; font-size: 30px; line-height: 1.1; }
#pd-gate .wrap .code { font-family: var(--font-head); font-stretch: var(--wd-act); font-weight: 750; font-size: 28px; letter-spacing: .08em; }
#pd-gate .wrap .stamp { position: absolute; right: 16px; top: 14px; font-family: var(--font-head); font-stretch: var(--wd-display); font-weight: 900; font-size: 22px; color: var(--deal);
  border: 3px solid var(--deal); border-radius: 8px; padding: 0 8px; transform: rotate(-9deg); opacity: .9; }
#pd-gate .wrap .secondary { width: 100%; min-height: 54px; border-radius: 12px; padding: 14px 18px; font: inherit; font-weight: 700; font-size: 17px; cursor: pointer; }
#pd-gate .wrap .secondary { border: 1.5px solid var(--edge); background: transparent; color: var(--ink); }
#pd-gate .wrap .textbtn { background: none; border: none; color: var(--soft); text-decoration: underline; text-underline-offset: 3px; padding: 10px 16px; min-height: 44px; align-self: center; font: inherit; font-size: 15px; cursor: pointer; }
#pd-gate .wrap .foot { margin-top: auto; display: flex; flex-direction: column; align-items: center; gap: 4px; }
#pd-gate .wrap .list { display: flex; flex-direction: column; gap: 10px; }
#pd-gate .wrap .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
#pd-gate .wrap .copy { border: 1.5px solid var(--edge); background: transparent; border-radius: 999px; padding: 8px 16px; min-height: 44px; font: inherit; font-weight: 700; cursor: pointer; color: var(--ink); }
#pd-gate :focus-visible { outline: 3px solid var(--deal); outline-offset: 2px; border-radius: 8px; }
#pd-gate .wrap .lede { font-size: 18px; color: var(--soft); max-width: 34ch; }
#pd-gate .wrap .sample { position: relative; background: var(--card); border-radius: 6px; padding: 18px 18px 16px; box-shadow: 0 1px 0 var(--rule), 0 18px 34px -26px rgba(27,33,29,.6); }
#pd-gate .wrap .sample .serial { font-family: var(--font-head); font-stretch: var(--wd-display); font-weight: 700; font-size: 14px; color: var(--soft); }
#pd-gate .wrap .sample .deal { font-family: var(--font-head); font-stretch: var(--wd-display); font-weight: 750; font-size: 26px; line-height: 1.12; margin-top: 6px; padding-right: 86px; }
#pd-gate .wrap .sample .stamp { top: 18px; }
#pd-gate .wrap .steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; border-top: 1px solid var(--rule); }
#pd-gate .wrap .steps li { display: grid; grid-template-columns: 36px 1fr; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--rule); }
#pd-gate .wrap .steps li p { margin: 0; }
#pd-gate .wrap .steps .n { font-family: var(--font-head); font-stretch: var(--wd-display); font-weight: 800; font-size: 26px; line-height: 1; color: var(--deal); }
#pd-gate .wrap .steps b { display: block; font-size: 17px; margin-bottom: 2px; }
#pd-gate .wrap .steps span { color: var(--soft); font-size: 15.5px; line-height: 1.4; }
#pd-gate .wrap .signin { display: flex; flex-direction: column; gap: 10px; }
#pd-gate .wrap .signin h2 { font-family: var(--font-head); font-stretch: var(--wd-display); font-weight: 800; font-size: 24px; margin: 0; }
#pd-gate .wrap .prov { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; min-height: 54px; border-radius: 12px; border: 1.5px solid var(--edge);
  background: var(--card); color: var(--ink); font: inherit; font-weight: 700; font-size: 17px; cursor: pointer; }
#pd-gate .wrap .prov svg { width: 22px; height: 22px; flex: none; }
#pd-gate .wrap .prov.dark { background: var(--ink); color: var(--paper); border-color: var(--ink); }
#pd-gate .wrap .prov:disabled { opacity: .6; }
#pd-gate .wrap .fine { font-size: 14px; color: var(--soft); text-align: center; }
@media (min-width: 900px) {
  #pd-gate .wrap.landing { max-width: 980px; display: grid; grid-template-columns: 1.2fr 1fr; grid-template-areas: "mark mark" "intro signin" "steps signin"; column-gap: 64px; row-gap: 28px; align-items: start; padding-top: 4vh; }
  #pd-gate .wrap.landing > .mark { grid-area: mark; }
  #pd-gate .wrap.landing > .col:first-of-type { grid-area: intro; }
  #pd-gate .wrap.landing > .signin { grid-area: signin; }
  #pd-gate .wrap.landing > .steps-col { grid-area: steps; }
  #pd-gate .wrap.landing .signin { position: sticky; top: 24px; background: var(--card); border-radius: 14px; padding: 24px; box-shadow: 0 1px 0 var(--rule); }
  #pd-gate .wrap.landing h1 { font-size: 56px; }
}
#pd-gate .wrap .col { display: flex; flex-direction: column; gap: 22px; }
/* Spec 010: the admin Sign-ups panel. The status is a stamped ticket; the numbers total up like the deal tape. */
#pd-gate .wrap .stamp.off { color: var(--soft); border-color: var(--soft); }
#pd-gate .wrap .ticket .body .big { padding-right: 112px; }
#pd-gate .wrap .su-tally { margin: 0; display: flex; flex-direction: column; }
#pd-gate .wrap .su-tally > div { display: flex; align-items: baseline; gap: 10px; padding: 9px 0; }
#pd-gate .wrap .su-tally dt { flex: 1; display: flex; align-items: baseline; gap: 10px; font-size: 16.5px; }
#pd-gate .wrap .su-tally dt::after { content: ""; flex: 1; min-width: 16px; border-bottom: 2px dotted var(--rule); }
#pd-gate .wrap .su-tally dd { margin: 0; font-family: var(--font-head); font-stretch: 80%; font-weight: 750; font-size: 26px; line-height: 1; font-variant-numeric: tabular-nums; }
#pd-gate .wrap .su-tally dd small { font-size: 16px; font-weight: 600; color: var(--soft); }
#pd-gate .wrap .su-note { font-size: 15px; line-height: 1.45; color: var(--soft); }
#pd-gate .wrap .su-note a { color: inherit; text-underline-offset: 3px; }
#pd-gate .wrap .limits { display: flex; flex-direction: column; gap: 12px; border-top: 1px solid var(--rule); padding-top: 18px; }
#pd-gate .wrap .limits p { line-height: 2.1; }
#pd-gate .wrap .limits input { width: 4.2ch; box-sizing: content-box; padding: 0 4px; border: none; border-bottom: 2px solid var(--edge); background: transparent; color: var(--ink);
  font-family: var(--font-head); font-stretch: 80%; font-weight: 750; font-size: 24px; text-align: center; -moz-appearance: textfield; }
#pd-gate .wrap .limits input::-webkit-inner-spin-button, #pd-gate .wrap .limits input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
#pd-gate .wrap .limits .err { color: var(--ink); font-weight: 700; }
#pd-gate .wrap .limits .err:empty { display: none; }
#pd-account { position: fixed; z-index: 15; top: calc(8px + env(safe-area-inset-top, 0px)); right: max(10px, env(safe-area-inset-right, 0px));
  width: 40px; height: 40px; border-radius: 50%; border: 1.5px solid var(--edge); background: var(--card); color: var(--ink);
  font-family: var(--font-head); font-weight: 800; font-size: 17px; cursor: pointer; }
#pd-menu { position: fixed; z-index: 16; top: calc(56px + env(safe-area-inset-top, 0px)); right: max(10px, env(safe-area-inset-right, 0px)); background: var(--card);
  border: 1px solid var(--rule); border-radius: 12px; padding: 6px; display: flex; flex-direction: column; min-width: 190px; box-shadow: 0 18px 34px -20px rgba(27,33,29,.5); }
#pd-menu[hidden] { display: none; }
#pd-menu button { text-align: left; background: none; border: none; padding: 12px 14px; min-height: 44px; border-radius: 8px; font: inherit; font-size: 16px; color: var(--ink); cursor: pointer; }
#pd-menu button:hover { background: var(--paper); }
#pd-menu .pd-m-theme { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 6px 6px 6px 14px; border-block: 1px solid var(--rule); margin: 4px 0; font-size: 16px; color: var(--ink); }
#pd-menu .themesw button { min-height: 36px; padding: 6px 10px; font-size: 14px; color: var(--soft); }
#pd-menu .themesw button[aria-checked="true"] { background: var(--ink); color: var(--paper); }
#pd-menu .themesw button:hover { background: var(--paper); color: var(--ink); }
#pd-menu .themesw button[aria-checked="true"]:hover { background: var(--ink); color: var(--paper); }
`;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
const MARK = `<div class="mark"><img src="/icon-192.png" alt="">Pomodeal</div>`;
const ICON: Record<Provider, string> = {
  GitHubOAuth: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z"/></svg>`,
  GoogleOAuth: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.81Z"/><path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.88-3.01c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24Z"/><path fill="#FBBC05" d="M5.29 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.28a12 12 0 0 0 0 10.78l4.01-3.1Z"/><path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.98 11.98 0 0 0 1.28 6.61l4.01 3.1C6.23 6.88 8.88 4.77 12 4.77Z"/></svg>`,
  MicrosoftOAuth: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#F25022" d="M1 1h10.5v10.5H1z"/><path fill="#7FBA00" d="M12.5 1H23v10.5H12.5z"/><path fill="#00A4EF" d="M1 12.5h10.5V23H1z"/><path fill="#FFB900" d="M12.5 12.5H23V23H12.5z"/></svg>`,
};
const LABEL: Record<Provider, string> = { GitHubOAuth: "GitHub", GoogleOAuth: "Google", MicrosoftOAuth: "Microsoft" };

export function mountGate(actions: GateActions) {
  const style = document.createElement("style");
  style.textContent = CSS + LANDING_CSS;
  document.head.append(style);
  const gate = document.createElement("div");
  gate.id = "pd-gate";
  gate.setAttribute("role", "dialog");
  gate.setAttribute("aria-modal", "true");
  gate.setAttribute("aria-label", "Pomodeal beta");
  document.body.append(gate);

  const app = () => document.querySelectorAll<HTMLElement>(".app, nav.tabs");
  let invitesOpen = false;
  let signupsOpen = false; // spec 010: the admin Sign-ups panel
  let isAdmin = false;
  let overview: AdminOverview | null = null;
  let tickets: InviteTicket[] = [];
  let invitesLeft: number | null = 0;
  let state: GateState = { kind: "loading" };

  function setAppInert(on: boolean) {
    app().forEach((el) => (on ? el.setAttribute("inert", "") : el.removeAttribute("inert")));
  }

  function signupsView(): string {
    const back = `<div class="foot"><button class="textbtn" id="pd-close">Back to Pomodeal</button></div>`;
    if (!overview) return `<div class="wrap">${MARK}<h1>Sign-ups</h1><p class="soft" role="status">Loading…</p>${back}</div>`;
    const o = overview, open = o.signups === "open";
    const when = (at: number) => new Date(at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    const status = open ? `Closes itself at ${o.dayLimit} new members in 24 hours or ${o.memberCap} members.`
      : o.paused?.reason === "dayLimit" ? `Paused ${when(o.paused.at)}: ${o.paused.count} new members in 24 hours.`
      : o.paused?.reason === "memberCap" ? `Paused ${when(o.paused.at)}: ${o.paused.count} members, the cap.`
      : o.paused ? `Closed by you ${when(o.paused.at)}. Invite links still work.`
      : "Invite links still work. Everyone else waits on the list.";
    const stamp = open ? `<span class="stamp" aria-hidden="true">OPEN</span>`
      : `<span class="stamp off" aria-hidden="true">${o.paused && o.paused.reason !== "manual" ? "PAUSED" : "INVITES"}</span>`;
    const atCap = !open && o.members >= o.memberCap;
    const row = (label: string, n: number, of?: number) =>
      `<div><dt>${label}</dt><dd>${n}${of !== undefined ? ` <small>of ${of}</small>` : ""}</dd></div>`;
    return `<div class="wrap">${MARK}
      <h1>Sign-ups</h1>
      <section class="ticket" aria-label="Sign-ups are ${open ? "open" : "invite only"}">
        <div class="body"><span class="big">${open ? "Anyone who signs in gets in" : "Invite links only"}</span><p class="soft">${status}</p></div>
        <div class="stub">${atCap ? `<p>You're at the cap. Raise it first, or the next person closes it again.</p>` : ""}
          <button class="${open ? "secondary" : "primary"}" id="pd-su-mode">${open ? "Close sign-ups" : "Open sign-ups"}</button></div>
        ${stamp}</section>
      <dl class="su-tally">
        ${row("New in the last 24 hours", o.newInDay, o.dayLimit)}
        ${row("Members", o.members, o.memberCap)}
        ${row("Studied this week", o.activeInWeek)}
        ${row("Waiting to get in", o.waiting)}
        ${row("Ready for the WorkOS move", o.readyForProduction, o.members)}
      </dl>
      <p class="su-note">Cost follows the people studying, not sign-ups. Function calls are on the <a href="${esc(o.usageUrl)}" target="_blank" rel="noopener">Convex usage page</a>.</p>
      <form class="limits" id="pd-limits" novalidate>
        <p>Close sign-ups after <input name="dayLimit" type="number" inputmode="numeric" min="1" step="1" value="${o.dayLimit}" aria-label="New members in 24 hours"> new members in 24 hours, or at <input name="memberCap" type="number" inputmode="numeric" min="1" step="1" value="${o.memberCap}" aria-label="Member cap"> members.</p>
        <p class="err" role="alert"></p>
        <button class="secondary" type="submit">Save limits</button>
      </form>
      ${back}</div>`;
  }

  function view(): string {
    if (signupsOpen && state.kind === "member") return signupsView();
    if (invitesOpen && state.kind === "member") {
      const link = (c: string) => `${location.origin}/?invite=${c}`;
      return `<div class="wrap">${MARK}
        <h1>Invite friends</h1>
        <p class="soft">${invitesLeft === null ? "You can invite as many people as you like." : `You have ${invitesLeft} ${invitesLeft === 1 ? "invite" : "invites"} left. Each ticket works for one person.`}</p>
        <button class="primary" id="pd-new" ${invitesLeft === 0 ? "disabled" : ""}>Make an invite ticket</button>
        <div class="list">${tickets.map((t) => `<section class="ticket" aria-label="Invite ${t.code}">
          <div class="body"><span class="soft">Invite code</span><span class="code">${t.code}</span></div>
          <div class="stub"><div class="row"><span class="soft">${t.uses >= t.maxUses ? (t.usedBy ? `${esc(t.usedBy)} joined${t.usedAt ? ` ${new Date(t.usedAt).toLocaleDateString([], { month: "short", day: "numeric" })}` : ""}` : "Used") : "Not used yet"}</span>
            ${t.uses >= t.maxUses ? "" : `<button class="copy" data-copy="${esc(link(t.code))}">Copy link</button>`}</div></div>
          ${t.uses >= t.maxUses ? `<span class="stamp" aria-hidden="true">USED</span>` : ""}</section>`).join("")}</div>
        <div class="foot"><button class="textbtn" id="pd-close">Back to Pomodeal</button></div></div>`;
    }
    switch (state.kind) {
      case "loading":
        return `<div class="wrap">${MARK}<p class="soft" role="status">Loading…</p></div>`;
      case "signedOut": {
        const env = actions.appEnv();
        return landingHTML({ invite: state.invite, providers: actions.providers, standalone: env.standalone, ios: env.ios, install: env.install });
      }
      case "claiming":
        return `<div class="wrap">${MARK}<section class="ticket"><div class="body"><span class="soft">Invite code</span><span class="code">${esc(state.invite)}</span></div>
          <div class="stub"><p role="status">Stamping your ticket…</p></div><span class="stamp" aria-hidden="true">DEAL</span></section></div>`;
      case "claimError":
        return `<div class="wrap">${MARK}<h1>That invite didn't work</h1><p>${esc(state.message)}</p>
          <div class="foot"><button class="textbtn" id="pd-signout">Sign out</button></div></div>`;
      case "waitlist":
        // Open sign-ups: an enter call is on its way, so this is only a moment.
        if (state.signups === "open") return `<div class="wrap">${MARK}<p class="soft" role="status">Loading…</p></div>`;
        return `<div class="wrap">${MARK}<h1>Pomodeal is full for now</h1>
          <p>You're on the list, and you'll get in the next time you open it after it reopens.</p>
          <p class="soft">Got an invite link from a friend? That works any time.</p>
          <div class="foot">${state.email ? `<p class="fine">Signed in as ${esc(state.email)}</p>` : ""}<button class="textbtn" id="pd-signout">Sign out</button></div></div>`;
      default:
        return "";
    }
  }

  function render() {
    const show = invitesOpen || signupsOpen || state.kind !== "member";
    gate.hidden = !show;
    setAppInert(show);
    document.body.style.overflow = show ? "hidden" : "";
    if (!show) { gate.innerHTML = ""; return; }
    gate.innerHTML = view();
    const landing = state.kind === "signedOut" && !invitesOpen;
    gate.classList.toggle("ld-on", landing);
    if (landing) { gate.removeAttribute("role"); gate.removeAttribute("aria-modal"); gate.removeAttribute("aria-label"); }
    else { gate.setAttribute("role", "dialog"); gate.setAttribute("aria-modal", "true"); gate.setAttribute("aria-label", "Pomodeal beta"); }
    if (state.kind === "signedOut" && !invitesOpen) bindLanding(gate, { signInWith: actions.signInWith, signIn: actions.signIn, install: actions.install });
    gate.querySelector<HTMLElement>("#pd-signin")?.addEventListener("click", actions.signIn);
    gate.querySelector<HTMLElement>("#pd-email")?.addEventListener("click", actions.signIn);
    gate.querySelectorAll<HTMLButtonElement>("[data-prov]").forEach((b) => b.addEventListener("click", () => { b.disabled = true; actions.signInWith(b.dataset.prov as Provider); }));
    gate.querySelector<HTMLElement>("#pd-signup")?.addEventListener("click", actions.signUp);
    gate.querySelector<HTMLElement>("#pd-signout")?.addEventListener("click", actions.signOut);
    gate.querySelector<HTMLElement>("#pd-close")?.addEventListener("click", () => {
      if (signupsOpen) actions.watchSignups(false);
      invitesOpen = false; signupsOpen = false; actions.closeInvites(); render();
    });
    gate.querySelector<HTMLButtonElement>("#pd-su-mode")?.addEventListener("click", async (e) => {
      const b = e.currentTarget as HTMLButtonElement; b.disabled = true;
      try { await actions.setSignups(overview?.signups === "open" ? "inviteOnly" : "open"); }
      catch { b.disabled = false; b.textContent = "That didn't work. Try again"; }
    });
    gate.querySelector<HTMLFormElement>("#pd-limits")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.currentTarget as HTMLFormElement, err = f.querySelector<HTMLElement>(".err")!, b = f.querySelector<HTMLButtonElement>("button")!;
      const num = (n: string) => Number((f.elements.namedItem(n) as HTMLInputElement).value);
      b.disabled = true; err.textContent = "";
      try { await actions.setLimits({ memberCap: num("memberCap"), dayLimit: num("dayLimit") }); b.textContent = "Saved"; }
      catch (x) {
        const data = (x as { data?: { message?: unknown } }).data;
        err.textContent = typeof data?.message === "string" ? data.message : "Couldn't save. Check your connection and try again.";
      }
      b.disabled = false;
    });
    gate.querySelector<HTMLButtonElement>("#pd-new")?.addEventListener("click", async (e) => {
      const b = e.currentTarget as HTMLButtonElement; b.disabled = true;
      try { await actions.createInvite(); } catch { b.disabled = false; b.textContent = "That didn't work. Try again"; }
    });
    gate.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(b.dataset.copy!); b.textContent = "Copied"; } catch { b.textContent = b.dataset.copy!; }
    }));
    gate.querySelector<HTMLElement>("h1, [role=status]")?.setAttribute("tabindex", "-1");
  }

  // Account button + menu, shown only to members.
  const acct = document.createElement("button");
  acct.id = "pd-account"; acct.hidden = true; acct.setAttribute("aria-haspopup", "menu"); acct.setAttribute("aria-label", "Account");
  const menu = document.createElement("div");
  menu.id = "pd-menu"; menu.hidden = true; menu.setAttribute("role", "menu");
  menu.innerHTML = `<button role="menuitem" id="pd-m-invite">Invite friends</button><button role="menuitem" id="pd-m-signups" hidden>Sign-ups</button><div class="pd-m-theme"><span id="pd-m-th">Theme</span><span class="themesw" aria-labelledby="pd-m-th"></span></div><button role="menuitem" id="pd-m-out">Sign out</button>`;
  // the theme switch is the prototype's own (window.pomodealTheme), so the menu and the page agree
  const sw = menu.querySelector<HTMLElement>(".themesw")!;
  (window as unknown as { pomodealTheme?: { paint(b: HTMLElement): void } }).pomodealTheme?.paint(sw);
  document.body.append(acct, menu);
  acct.addEventListener("click", () => { menu.hidden = !menu.hidden; acct.setAttribute("aria-expanded", String(!menu.hidden)); });
  menu.querySelector("#pd-m-invite")!.addEventListener("click", () => { menu.hidden = true; openInvites(); });
  menu.querySelector("#pd-m-signups")!.addEventListener("click", () => { menu.hidden = true; openSignups(); });
  menu.querySelector("#pd-m-out")!.addEventListener("click", () => { menu.hidden = true; actions.signOut(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") menu.hidden = true; });

  function openInvites() { invitesOpen = true; history.replaceState(null, "", "/invite"); render(); }
  function openSignups() {
    if (!isAdmin) return;
    if (!signupsOpen) actions.watchSignups(true);
    signupsOpen = true; history.replaceState(null, "", "/signups"); render();
  }

  return {
    setState(s: GateState, member?: { displayName: string; invitesLeft: number | null; admin: boolean }) {
      state = s;
      if (member) {
        invitesLeft = member.invitesLeft; isAdmin = member.admin;
        acct.textContent = member.displayName.slice(0, 1).toUpperCase();
        menu.querySelector<HTMLElement>("#pd-m-signups")!.hidden = !isAdmin;
      }
      acct.hidden = s.kind !== "member";
      if (s.kind === "member" && location.pathname === "/invite") invitesOpen = true;
      if (s.kind === "member" && location.pathname === "/signups") { openSignups(); return; }
      render();
    },
    setTickets(t: InviteTicket[]) { tickets = t; if (invitesOpen) render(); },
    /** Re-renders the Sign-ups panel, unless the admin is typing in a limit. */
    setOverview(o: AdminOverview) {
      overview = o;
      if (signupsOpen && !gate.querySelector("#pd-limits")?.contains(document.activeElement)) render();
    },
  };
}
