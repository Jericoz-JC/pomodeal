// Beta gate: sign-in, waitlist, invite acceptance, and the invite-friends panel.
// Rendered as an overlay above the app so it never touches the design prototype's markup.
// Uses the prototype's design tokens (--paper, --card, --ink, --deal…) so it looks like the same product.

export type GateState =
  | { kind: "loading" }
  | { kind: "signedOut"; invite: string | null }
  | { kind: "claiming"; invite: string }
  | { kind: "claimError"; message: string }
  | { kind: "waitlist"; email: string | null }
  | { kind: "member" };

export interface InviteTicket { code: string; uses: number; maxUses: number }

export interface GateActions {
  signIn(): void;
  signUp(): void;
  signOut(): void;
  createInvite(): Promise<void>;
  closeInvites(): void;
}

const CSS = `
#pd-gate { position: fixed; inset: 0; z-index: 60; background: var(--paper); color: var(--ink); overflow-y: auto;
  padding: calc(24px + env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) calc(24px + env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px)); }
#pd-gate[hidden] { display: none; }
#pd-gate .wrap { max-width: 440px; margin: 0 auto; min-height: 100%; display: flex; flex-direction: column; gap: 22px; }
#pd-gate .mark { display: flex; align-items: center; gap: 10px; font-family: var(--font-head); font-stretch: 78%; font-weight: 800; font-size: 26px; }
#pd-gate .mark img { width: 34px; height: 34px; border-radius: 9px; }
#pd-gate h1 { font-family: var(--font-head); font-stretch: 78%; font-weight: 800; font-size: 40px; line-height: 1; margin: 0; text-wrap: balance; }
#pd-gate p { margin: 0; font-size: 17px; line-height: 1.45; }
#pd-gate .soft { color: var(--soft); }
#pd-gate .ticket { position: relative; background: var(--card); border-radius: 6px; box-shadow: 0 1px 0 var(--rule), 0 18px 34px -26px rgba(27,33,29,.6); }
#pd-gate .ticket .body { padding: 22px 20px 18px; display: flex; flex-direction: column; gap: 6px; }
#pd-gate .ticket .stub { position: relative; border-top: 2px dashed var(--rule); padding: 16px 20px 18px; display: flex; flex-direction: column; gap: 10px; }
#pd-gate .ticket .stub::before, #pd-gate .ticket .stub::after { content: ""; position: absolute; top: -11px; width: 20px; height: 20px; border-radius: 50%; background: var(--paper); }
#pd-gate .ticket .stub::before { left: -10px; } #pd-gate .ticket .stub::after { right: -10px; }
#pd-gate .big { font-family: var(--font-head); font-stretch: 78%; font-weight: 750; font-size: 30px; line-height: 1.1; }
#pd-gate .code { font-family: var(--font-head); font-stretch: 85%; font-weight: 750; font-size: 28px; letter-spacing: .08em; }
#pd-gate .stamp { position: absolute; right: 16px; top: 14px; font-family: var(--font-head); font-stretch: 70%; font-weight: 900; font-size: 22px; color: var(--deal);
  border: 3px solid var(--deal); border-radius: 8px; padding: 0 8px; transform: rotate(-9deg); opacity: .9; }
#pd-gate .primary, #pd-gate .secondary { width: 100%; min-height: 54px; border-radius: 12px; padding: 14px 18px; font: inherit; font-weight: 700; font-size: 17px; cursor: pointer; }
#pd-gate .primary { border: none; background: var(--deal); color: var(--on-deal); }
#pd-gate .secondary { border: 1.5px solid var(--edge); background: transparent; color: var(--ink); }
#pd-gate .primary:disabled { opacity: .5; cursor: not-allowed; }
#pd-gate .textbtn { background: none; border: none; color: var(--soft); text-decoration: underline; text-underline-offset: 3px; padding: 10px 16px; min-height: 44px; align-self: center; font: inherit; font-size: 15px; cursor: pointer; }
#pd-gate .foot { margin-top: auto; display: flex; flex-direction: column; align-items: center; gap: 4px; }
#pd-gate .list { display: flex; flex-direction: column; gap: 10px; }
#pd-gate .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
#pd-gate .copy { border: 1.5px solid var(--edge); background: transparent; border-radius: 999px; padding: 8px 16px; min-height: 44px; font: inherit; font-weight: 700; cursor: pointer; color: var(--ink); }
#pd-gate :focus-visible { outline: 3px solid var(--deal); outline-offset: 2px; border-radius: 8px; }
#pd-account { position: fixed; z-index: 15; top: calc(8px + env(safe-area-inset-top, 0px)); right: max(10px, env(safe-area-inset-right, 0px));
  width: 40px; height: 40px; border-radius: 50%; border: 1.5px solid var(--edge); background: var(--card); color: var(--ink);
  font-family: var(--font-head); font-weight: 800; font-size: 17px; cursor: pointer; }
#pd-menu { position: fixed; z-index: 16; top: calc(56px + env(safe-area-inset-top, 0px)); right: max(10px, env(safe-area-inset-right, 0px)); background: var(--card);
  border: 1px solid var(--rule); border-radius: 12px; padding: 6px; display: flex; flex-direction: column; min-width: 190px; box-shadow: 0 18px 34px -20px rgba(27,33,29,.5); }
#pd-menu[hidden] { display: none; }
#pd-menu button { text-align: left; background: none; border: none; padding: 12px 14px; min-height: 44px; border-radius: 8px; font: inherit; font-size: 16px; color: var(--ink); cursor: pointer; }
#pd-menu button:hover { background: var(--paper); }
`;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
const MARK = `<div class="mark"><img src="/icon-192.png" alt="">Pomodeal</div>`;

export function mountGate(actions: GateActions) {
  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.append(style);
  const gate = document.createElement("div");
  gate.id = "pd-gate";
  gate.setAttribute("role", "dialog");
  gate.setAttribute("aria-modal", "true");
  gate.setAttribute("aria-label", "Pomodeal beta");
  document.body.append(gate);

  const app = () => document.querySelectorAll<HTMLElement>(".app, nav.tabs");
  let invitesOpen = false;
  let tickets: InviteTicket[] = [];
  let invitesLeft: number | null = 0;
  let state: GateState = { kind: "loading" };

  function setAppInert(on: boolean) {
    app().forEach((el) => (on ? el.setAttribute("inert", "") : el.removeAttribute("inert")));
  }

  function view(): string {
    if (invitesOpen && state.kind === "member") {
      const link = (c: string) => `${location.origin}/?invite=${c}`;
      return `<div class="wrap">${MARK}
        <h1>Invite friends</h1>
        <p class="soft">${invitesLeft === null ? "You can invite as many people as you like." : `You have ${invitesLeft} ${invitesLeft === 1 ? "invite" : "invites"} left. Each ticket works for one person.`}</p>
        <button class="primary" id="pd-new" ${invitesLeft === 0 ? "disabled" : ""}>Make an invite ticket</button>
        <div class="list">${tickets.map((t) => `<section class="ticket" aria-label="Invite ${t.code}">
          <div class="body"><span class="soft">Invite code</span><span class="code">${t.code}</span></div>
          <div class="stub"><div class="row"><span class="soft">${t.uses >= t.maxUses ? "Used" : "Not used yet"}</span>
            ${t.uses >= t.maxUses ? "" : `<button class="copy" data-copy="${esc(link(t.code))}">Copy link</button>`}</div></div>
          ${t.uses >= t.maxUses ? `<span class="stamp" aria-hidden="true">USED</span>` : ""}</section>`).join("")}</div>
        <div class="foot"><button class="textbtn" id="pd-close">Back to Pomodeal</button></div></div>`;
    }
    switch (state.kind) {
      case "loading":
        return `<div class="wrap">${MARK}<p class="soft" role="status">Loading…</p></div>`;
      case "signedOut":
        return state.invite
          ? `<div class="wrap">${MARK}<h1>You're invited</h1>
            <section class="ticket"><div class="body"><span class="soft">Invite code</span><span class="code">${esc(state.invite)}</span></div>
              <div class="stub"><p>Pomodeal is a study timer that makes deals with you, plus small private rooms for your friends.</p>
              <button class="primary" id="pd-signup">Accept invite</button></div></section>
            <div class="foot"><button class="textbtn" id="pd-signin">I already have an account</button></div></div>`
          : `<div class="wrap">${MARK}<h1>A study timer that makes deals with you.</h1>
            <p class="soft">Pomodeal is in a small private beta. Sign in if you're in, or ask a friend who is for an invite link.</p>
            <button class="primary" id="pd-signin">Sign in</button></div>`;
      case "claiming":
        return `<div class="wrap">${MARK}<section class="ticket"><div class="body"><span class="soft">Invite code</span><span class="code">${esc(state.invite)}</span></div>
          <div class="stub"><p role="status">Stamping your ticket…</p></div><span class="stamp" aria-hidden="true">DEAL</span></section></div>`;
      case "claimError":
        return `<div class="wrap">${MARK}<h1>That invite didn't work</h1><p>${esc(state.message)}</p>
          <div class="foot"><button class="textbtn" id="pd-signout">Sign out</button></div></div>`;
      case "waitlist":
        return `<div class="wrap">${MARK}<h1>You're on the list</h1>
          <p>You're signed in${state.email ? ` as ${esc(state.email)}` : ""}, but Pomodeal is invite-only right now.</p>
          <p class="soft">Ask a friend who's in the beta to send you their invite link, then open it on this device.</p>
          <div class="foot"><button class="textbtn" id="pd-signout">Sign out</button></div></div>`;
      default:
        return "";
    }
  }

  function render() {
    const show = invitesOpen || state.kind !== "member";
    gate.hidden = !show;
    setAppInert(show);
    document.body.style.overflow = show ? "hidden" : "";
    if (!show) { gate.innerHTML = ""; return; }
    gate.innerHTML = view();
    gate.querySelector<HTMLElement>("#pd-signin")?.addEventListener("click", actions.signIn);
    gate.querySelector<HTMLElement>("#pd-signup")?.addEventListener("click", actions.signUp);
    gate.querySelector<HTMLElement>("#pd-signout")?.addEventListener("click", actions.signOut);
    gate.querySelector<HTMLElement>("#pd-close")?.addEventListener("click", () => { invitesOpen = false; actions.closeInvites(); render(); });
    gate.querySelector<HTMLButtonElement>("#pd-new")?.addEventListener("click", async (e) => {
      const b = e.currentTarget as HTMLButtonElement; b.disabled = true; await actions.createInvite();
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
  menu.innerHTML = `<button role="menuitem" id="pd-m-invite">Invite friends</button><button role="menuitem" id="pd-m-out">Sign out</button>`;
  document.body.append(acct, menu);
  acct.addEventListener("click", () => { menu.hidden = !menu.hidden; acct.setAttribute("aria-expanded", String(!menu.hidden)); });
  menu.querySelector("#pd-m-invite")!.addEventListener("click", () => { menu.hidden = true; openInvites(); });
  menu.querySelector("#pd-m-out")!.addEventListener("click", () => { menu.hidden = true; actions.signOut(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") menu.hidden = true; });

  function openInvites() { invitesOpen = true; history.replaceState(null, "", "/invite"); render(); }

  return {
    setState(s: GateState, member?: { displayName: string; invitesLeft: number | null }) {
      state = s;
      if (member) { invitesLeft = member.invitesLeft; acct.textContent = member.displayName.slice(0, 1).toUpperCase(); }
      acct.hidden = s.kind !== "member";
      if (s.kind === "member" && location.pathname === "/invite") invitesOpen = true;
      render();
    },
    setTickets(t: InviteTicket[]) { tickets = t; if (invitesOpen) render(); },
  };
}
