// The first screen people see (signed out). One playable deal, built from the app's own parts so the first look is
// the product: the wheel, the ticket you stamp, the clock that answers when you ask for more, and tonight's tape.
// Sign-in stays one thumb away on phones. Installed as a PWA, it drops the explainer.
//
// Design plan
//   Subject: the bargain students already make with themselves. The headline quotes it; a stamp answers it.
//   One bold object: the ticket with its wheel. Everything else is quiet: paper, ink, one approval green.
//   The parts are the app's, not look-alikes: .dial (the SVG wheel), .term tickets with a stamp stub, the stamp's
//   slam, .tape stubs. They come from the app's stylesheet, which this page shares (apps/web/index.html is the
//   prototype). Only the layout around them is defined here.
//   Motion: one wordless first look (about 2.5 s): the wheel winds on, a sample copy of the ticket is stamped and
//   filed into the pile, and the fresh one is yours. Your own press lands the way it does in the app.

export type Provider = "GitHubOAuth" | "GoogleOAuth" | "AppleOAuth" | "MicrosoftOAuth";

export interface LandingOptions {
  invite: string | null;
  providers: Provider[];
  standalone: boolean;
  ios: boolean;
  install: "ios" | "prompt" | null;
}

export interface LandingActions {
  signInWith(p: Provider): void;
  signIn(): void;
  install(): void;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
const clock12 = (d: Date) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).replace(/\s?([AP])M/i, (_m, a: string) => a.toLowerCase() + "m");

export const LANDING_CSS = `
#pd-gate.ld-on { padding: 0; background: var(--paper); }
#pd-gate .ld { --behind: var(--card); --track: color-mix(in srgb, var(--ink) 24%, var(--card)); position: relative; min-height: 100%; overflow-x: clip; }
#pd-gate .ld::before { content: ""; position: fixed; inset: 0; pointer-events: none; opacity: .05; z-index: 0; background-image: var(--noise); background-size: 120px 60px; }
#pd-gate .ld > :not(.ld-dock) { position: relative; z-index: 1; }
#pd-gate .ld-in { max-width: 1080px; margin: 0 auto; padding: calc(14px + env(safe-area-inset-top, 0px)) max(18px, env(safe-area-inset-right, 0px)) 0 max(18px, env(safe-area-inset-left, 0px)); }
#pd-gate .ld-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
#pd-gate .ld-top .mark { display: flex; align-items: center; gap: 10px; font-family: var(--font-head); font-stretch: var(--wd-display); font-weight: 800; font-size: 23px; }
#pd-gate .ld-top .mark img { width: 30px; height: 30px; border-radius: 8px; }
#pd-gate .ld-pill { font-size: 14px; color: var(--soft); }
#pd-gate .ld-pill.inv { color: var(--ink); border: 1.5px dashed var(--deal); border-radius: 999px; padding: 4px 10px; font-weight: 700; }
#pd-gate .ld-pill.inv b { font-family: var(--font-head); font-stretch: var(--wd-act); letter-spacing: .06em; }
#pd-gate .ld p { margin: 0; }

#pd-gate .ld-hero { display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; padding: 18px 0 8px; }
#pd-gate .ld-copy { position: relative; display: flex; flex-direction: column; gap: 10px; }
#pd-gate .ld h1 { font-family: var(--font-head); font-stretch: var(--wd-display); font-weight: 800; font-size: clamp(40px, 11vw, 78px); line-height: .94; letter-spacing: -.01em; margin: 0; color: var(--ink); }
#pd-gate .ld h1 span { display: block; white-space: nowrap; }
#pd-gate .ld-sub { font-size: 17px; line-height: 1.45; color: var(--soft); max-width: 34ch; }

/* the ticket you can try: the app's start ticket, with the wheel printed on it as its seal */
#pd-gate .ld-stage { position: relative; display: grid; grid-template-columns: minmax(0, 1fr); justify-items: center; min-width: 0; }
#pd-gate .ld-twrap { position: relative; width: 100%; max-width: 420px; min-width: 0; margin-bottom: 40px; }
#pd-gate .ld-peek { position: absolute; left: 0; right: 0; bottom: -34px; height: 70px; background: var(--stub); border-radius: 6px 0 0 6px; transform: rotate(-2deg); transform-origin: 30% 0;
  -webkit-mask: var(--zig); mask: var(--zig); box-shadow: inset 0 0 0 1px var(--rule); display: flex; align-items: flex-end; justify-content: space-between; padding: 0 26px 9px 18px;
  font-family: var(--font-head); font-stretch: var(--wd-display); font-weight: 700; font-size: 13px; color: var(--soft); }
#pd-gate .ld-peek .stamp { --tilt: -7deg; font-size: 1rem; padding: 2px 6px; }
#pd-gate .ld-ticket { position: relative; z-index: 2; width: 100%; min-width: 0; scroll-margin-bottom: calc(130px + env(safe-area-inset-bottom, 0px)); background: var(--card);
  border-radius: 6px 0 0 6px; -webkit-mask: var(--zig); mask: var(--zig); filter: drop-shadow(0 1px 0 var(--rule)) drop-shadow(0 18px 22px var(--lift)); }
#pd-gate .ld-body { padding: 16px 30px 14px 20px; display: flex; flex-direction: column; gap: 12px; }
#pd-gate .ld-meta { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; min-height: 52px; }
#pd-gate .ld-meta .serial { line-height: 1.25; }
/* the DEAL you press stays on the ticket, large and inked, the way it does on the running ticket in the app */
#pd-gate .ld-mark { --tilt: -7deg; font-size: 1.875rem; letter-spacing: .07em; padding: 7px 11px 5px 12px; visibility: hidden; }
#pd-gate .ld-mark::before { border-width: 4.5px; border-radius: 7px; }
#pd-gate .ld-mark::after { content: ""; position: absolute; inset: 0; border-radius: 7px; background: var(--deal); opacity: .14; -webkit-mask: var(--noise) 0 0 / 120px 60px; mask: var(--noise) 0 0 / 120px 60px; }
#pd-gate .ld-stamped .ld-mark { visibility: visible; }
#pd-gate .ld-wheel { display: grid; place-items: center; padding: 4px 0 6px; }
#pd-gate .ld-wheel .dial { width: min(62vw, 236px); }
#pd-gate .ld-wheel .face .unit { font-size: .875rem; }
#pd-gate .ld-sentence { font-family: var(--font-head); font-stretch: var(--wd-act); font-weight: 500; font-size: 1.5rem; line-height: 1.35; color: var(--soft); text-wrap: balance; }
/* bold, not underlined: in the app an underline means you can tap it, and here the chips do the changing */
#pd-gate .ld-sentence b { font-size: 1.2em; font-weight: 700; color: var(--ink); }
/* one sideways row, like the app's pickers */
#pd-gate .ld-acts { display: flex; gap: 8px; flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; margin: -4px -30px -4px -20px; padding: 4px 30px 4px 20px; }
#pd-gate .ld-acts::-webkit-scrollbar { display: none; }
#pd-gate .ld-acts .chip { flex: none; }
#pd-gate .ld-acts[hidden] { display: none; }
#pd-gate .ld-acts .chip { font-size: 15px; padding: 8px 14px; }
#pd-gate .ld-acts .chip[aria-disabled="true"]:not([aria-checked="true"]) { color: var(--soft); box-shadow: inset 0 0 0 1.5px var(--edge-half); }

/* the stub: the clock talks here, and the stamp you press lives here */
#pd-gate .ld-perf { position: relative; padding: 14px 30px 18px 20px; display: flex; flex-direction: column; gap: 12px;
  background: radial-gradient(circle, var(--edge) 1.2px, transparent 1.7px) 0 0 / 8px 6px repeat-x; }
#pd-gate .ld-say { display: flex; gap: 12px; align-items: center; min-height: 44px; }
#pd-gate .ld-say .voice { width: 44px; height: 44px; }
#pd-gate .ld-say .voice .kn circle { stroke: var(--card); }
#pd-gate .ld-say p { font-family: var(--font-head); font-stretch: var(--wd-display); font-weight: 700; font-size: 1.25rem; line-height: 1.2; color: var(--ink); text-wrap: balance; }
#pd-gate .ld-say p.pop { animation: settle .26s ease-out; }
#pd-gate .ld-you { align-self: flex-end; font-size: 16px; color: var(--soft); }
#pd-gate .ld-you[hidden] { display: none; }
#pd-gate .ld .terms[hidden] { display: none; }
#pd-gate .ld .term::before { background: var(--card); }
#pd-gate .ld .term .say { font-size: 1rem; }
/* the stamp face is the control: clean rubber while it waits, slammed and inked when pressed (the app's own keyframes) */
#pd-gate .ld-press { --tilt: -3deg; position: relative; align-self: center; min-width: 170px; min-height: 68px; margin: 2px auto 0; padding: 6px 30px 4px; border: none; border-radius: 10px; background: none;
  color: var(--deal); font-family: var(--font-head); font-stretch: var(--wd-display); font-weight: 800; font-size: 2.5rem; letter-spacing: .07em; text-transform: uppercase; line-height: 1; cursor: pointer;
  transform: rotate(var(--tilt)); transition: transform .14s ease-out, filter .14s ease-out; }
#pd-gate .ld-press::before { content: ""; position: absolute; inset: 0; border: 6px double currentColor; border-radius: 10px; }
#pd-gate .ld-press::after { content: ""; position: absolute; inset: 0; border-radius: 10px; background: currentColor; opacity: 0; -webkit-mask: var(--noise) 0 0 / 120px 60px; mask: var(--noise) 0 0 / 120px 60px; }
#pd-gate .ld-press.words { font-size: 1.5rem; letter-spacing: .02em; text-transform: none; min-height: 56px; padding: 10px 24px 8px; }
#pd-gate .ld-press.words::before { border-width: 4.5px; }
#pd-gate .ld-press[hidden] { display: none; }
@media (hover: hover) { #pd-gate .ld-press:hover:not(.pressed) { transform: translateY(-2px) rotate(calc(var(--tilt) - 2deg)) scale(1.03); filter: drop-shadow(0 5px 4px var(--lift)); } }
#pd-gate .ld-press:active:not(.pressed) { transform: rotate(var(--tilt)) scale(.96); }
#pd-gate .ld-press.pressed { animation: slam .62s linear both; }
#pd-gate .ld-press.pressed::before { -webkit-mask: var(--noise) 0 0 / 120px 60px; mask: var(--noise) 0 0 / 120px 60px; }
#pd-gate .ld-press.pressed::after { opacity: .14; animation: inked .3s .2s ease-out backwards; }
#pd-gate .ld-ticket.ld-hit { animation: hit .3s .2s ease-out; }
#pd-gate .ld-ask { align-self: center; }
#pd-gate .ld-ask[hidden] { display: none; }

#pd-gate .ld-signin { display: flex; flex-direction: column; gap: 10px; scroll-margin-top: 20px; padding-top: 6px; }
#pd-gate .ld-signin h2 { font-family: var(--font-head); font-stretch: var(--wd-display); font-weight: 800; font-size: 28px; margin: 0; }
#pd-gate .ld-note { color: var(--soft); margin: 0 0 4px; font-size: 16px; line-height: 1.45; }
#pd-gate .ld-invite { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; padding: 12px 16px; border: 1.5px dashed var(--deal); border-radius: 10px; }
#pd-gate .ld-invite span { color: var(--soft); font-size: 15px; }
#pd-gate .ld-invite b { font-family: var(--font-head); font-stretch: var(--wd-act); font-weight: 800; font-size: 22px; letter-spacing: .08em; }
#pd-gate .ld-prov { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; min-height: 54px; border-radius: 10px; border: 1.5px solid var(--edge);
  background: var(--card); color: var(--ink); font: inherit; font-weight: 700; font-size: 17px; cursor: pointer; }
#pd-gate .ld-prov svg { width: 22px; height: 22px; flex: none; }
#pd-gate .ld-prov.solid { background: var(--ink); color: var(--paper); border-color: var(--ink); }
#pd-gate .ld-prov:disabled { opacity: .6; }
#pd-gate .ld-more { margin: 2px 0 0; text-align: center; color: var(--soft); font-size: 15px; }
#pd-gate .ld-more button { background: none; border: none; color: var(--ink); text-decoration: underline; text-underline-offset: 3px; font: inherit; font-weight: 700; padding: 10px 0; min-height: 44px; cursor: pointer; }
#pd-gate .ld-install { display: flex; gap: 10px; align-items: center; justify-content: center; flex-wrap: wrap; font-size: 14.5px; color: var(--soft); margin: 2px 0 0; text-align: center; }
#pd-gate .ld-install button { border: 1.5px solid var(--edge); background: transparent; color: var(--ink); border-radius: 999px; padding: 6px 14px; min-height: 44px; font: inherit; font-weight: 700; cursor: pointer; }

/* how a deal works: each point shows the app's own part, not a drawing of it */
#pd-gate .ld-how { padding: 44px 0 20px; display: grid; gap: 38px; }
#pd-gate .ld-how h2 { font-family: var(--font-head); font-stretch: var(--wd-display); font-weight: 800; font-size: clamp(30px, 7vw, 44px); line-height: 1; margin: 0; max-width: 18ch; }
#pd-gate .ld-row { display: grid; gap: 14px; align-content: start; }
#pd-gate .ld-row h3 { font-family: var(--font-head); font-stretch: var(--wd-display); font-weight: 800; font-size: 22px; margin: 0; }
#pd-gate .ld-row > p { color: var(--soft); font-size: 16.5px; line-height: 1.5; max-width: 40ch; }
#pd-gate .ld-art { display: flex; flex-direction: column; gap: 10px; }
#pd-gate .ld-art .term .pad .stamp { animation: none; }
#pd-gate .ld-art .answer .says { font-size: 1.25rem; }
#pd-gate .ld-art .answer .voice { width: 44px; height: 44px; }
#pd-gate .ld-art .you { align-self: flex-end; font-size: 15px; color: var(--soft); }
/* the app's tape, not pinned to the side as it is on the app's desk */
#pd-gate .ld-tapeart { grid-area: auto; position: static; margin: 0; padding-bottom: 0; max-width: 420px; }
#pd-gate .ld-tapeart .tape { max-height: none; overflow: visible; padding: 4px 18px 22px; gap: 0; }
#pd-gate .ld-tapeart .stubcard:first-child { border-top: none; }
#pd-gate .ld-run { max-width: 300px; padding: 16px 28px 0 20px; background: var(--card); border-radius: 6px 0 0 6px; -webkit-mask: var(--zig); mask: var(--zig); display: flex; flex-direction: column; gap: 4px; }
#pd-gate .ld-runk { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--soft); }
#pd-gate .ld-runt { font-family: var(--font-head); font-stretch: var(--wd-display); font-weight: 800; font-size: 1.5rem; line-height: 1.05; }
#pd-gate .ld-runw { display: grid; place-items: center; padding: 10px 0 12px; }
#pd-gate .ld-runw .dial { width: 168px; }
#pd-gate .ld-runw .face .unit { font-size: .8125rem; }
#pd-gate .ld-runn { display: flex; align-items: center; gap: 8px; margin: 0 -28px 0 -20px; padding: 12px 28px 14px 20px; border-top: 2px dotted var(--edge); font-size: 15px; }
#pd-gate .ld-run .swatch { display: inline-block; width: 12px; height: 12px; }
#pd-gate .ld-people { display: flex; flex-direction: column; gap: 8px; max-width: 420px; }
#pd-gate .ld-people > div { display: grid; grid-template-columns: 40px 1fr auto; gap: 12px; align-items: center; padding: 10px 26px 10px 14px; background: var(--card); border-radius: 6px 0 0 6px;
  -webkit-mask: var(--zig); mask: var(--zig); font-size: 15.5px; }
#pd-gate .ld-people i { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; font-style: normal; font-weight: 700; font-size: 14px; box-shadow: inset 0 0 0 3.5px var(--track); }
#pd-gate .ld-people i.f { box-shadow: inset 0 0 0 3.5px var(--deal); }
/* a break is the hatched ring, as on the app's wheel */
#pd-gate .ld-people i.b { position: relative; box-shadow: none; }
#pd-gate .ld-people i.b::before { content: ""; position: absolute; inset: 0; border-radius: 50%; background: repeating-linear-gradient(45deg, var(--break-base) 0 2px, var(--break-stripe) 2px 3px);
  -webkit-mask: radial-gradient(circle, transparent 14px, #000 14.5px); mask: radial-gradient(circle, transparent 14px, #000 14.5px); }
#pd-gate .ld-people em { font-style: normal; color: var(--soft); font-size: 14px; }
#pd-gate .ld-people b { font-family: var(--font-head); font-stretch: var(--wd-display); font-weight: 800; font-size: 1.375rem; }
#pd-gate .ld-foot { padding: 28px 0 calc(130px + env(safe-area-inset-bottom, 0px)); border-top: 1px solid var(--rule); margin-top: 20px; color: var(--soft); font-size: 14.5px; }

/* phones: sign-in lives in a dock that stays under the thumb */
#pd-gate .ld-dock { position: fixed; z-index: 5; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; gap: 0;
  padding: 10px max(16px, env(safe-area-inset-right, 0px)) calc(4px + env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px));
  background: color-mix(in srgb, var(--paper) 90%, transparent); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-top: 1px solid var(--rule); transition: transform .25s ease; }
#pd-gate .ld-dock .ld-more { margin: 0; }
#pd-gate .ld-dock.away { transform: translateY(115%); }
#pd-gate .ld.app .ld-how { display: none; }

/* phones: the whole ticket, DEAL included, fits under the headline on the first screen */
@media (max-width: 899px) {
  #pd-gate .ld-body { gap: 10px; padding-top: 14px; }
  #pd-gate .ld-meta { min-height: 40px; }
  #pd-gate .ld-sentence { font-size: 1.3rem; }
  #pd-gate .ld-wheel .dial { width: min(42vw, 156px); }
  #pd-gate .ld-sub { font-size: 16px; }
}
@media (max-width: 899px) and (max-height: 760px) {
  #pd-gate .ld-sub { display: none; }
  #pd-gate .ld-wheel .dial { width: min(46vw, 170px); }
}
@media (min-width: 900px) {
  #pd-gate .ld-in { padding-top: 22px; }
  #pd-gate .ld-hero { grid-template-columns: 1.1fr 1fr; grid-template-areas: "copy stage" "signin stage"; column-gap: 56px; row-gap: 28px; align-items: start; padding-top: 5vh; }
  #pd-gate .ld-copy { grid-area: copy; } #pd-gate .ld-stage { grid-area: stage; } #pd-gate .ld-signin { grid-area: signin; max-width: 400px; }
  #pd-gate .ld h1 { font-size: clamp(56px, 5.6vw, 78px); } #pd-gate .ld h1 .hang { margin-left: -.36em; }
  #pd-gate .ld-wheel .dial { width: 250px; }
  #pd-gate .ld-how { grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 64px; padding-top: 80px; }
  #pd-gate .ld-how h2 { grid-column: 1 / -1; }
  #pd-gate .ld-dock { display: none; }
  #pd-gate .ld-foot { padding-bottom: 40px; }
}
/* first look: the wheel winds on, a sample copy of the ticket is stamped and filed into the pile, and the fresh one is yours */
#pd-gate .ld-intro .dial { animation: sweep .7s .1s cubic-bezier(.3, .7, .2, 1) backwards; }
#pd-gate .ld-sample { position: absolute; left: 0; right: 0; top: 0; z-index: 3; pointer-events: none; animation: ld-in .38s .12s cubic-bezier(.2, .8, .2, 1) backwards; }
/* the stamped sample drops toward the pile and is gone before the fresh ticket arrives: two tickets never overlap,
   and ink is never un-stamped */
#pd-gate .ld-sample.ld-file { transform-origin: 30% 0; animation: ld-file .4s cubic-bezier(.5, 0, .75, .3) forwards; }
@keyframes ld-in { from { opacity: 0; transform: translateY(18px); } }
@keyframes ld-file { 45% { opacity: 1; } to { opacity: 0; transform: translateY(40%) rotate(-2deg) scale(.96); } }
#pd-gate .ld-ticket.ld-under { opacity: 0; }
#pd-gate .ld-ticket.ld-fresh { animation: ld-fresh .3s ease-out backwards; }
@keyframes ld-fresh { from { opacity: 0; transform: translateY(8px); } }
#pd-gate .ld-peek.ld-bump { animation: ld-bump .32s .28s ease-out; }
@keyframes ld-bump { 40% { transform: rotate(-2deg) translateY(4px); } }

@media (prefers-reduced-motion: reduce) {
  #pd-gate .ld-press, #pd-gate .ld-press.pressed, #pd-gate .ld-ticket.ld-hit, #pd-gate .ld-say p.pop, #pd-gate .ld-intro .dial { animation: none; transform: rotate(var(--tilt, 0deg)); }
  #pd-gate .ld-ticket.ld-hit { transform: none; }
  #pd-gate .ld-press.pressed::after { animation: none; }
}
`;

const ICON: Record<Provider, string> = {
  GitHubOAuth: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z"/></svg>`,
  GoogleOAuth: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.81Z"/><path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.88-3.01c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24Z"/><path fill="#FBBC05" d="M5.29 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.28a12 12 0 0 0 0 10.78l4.01-3.1Z"/><path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.98 11.98 0 0 0 1.28 6.61l4.01 3.1C6.23 6.88 8.88 4.77 12 4.77Z"/></svg>`,
  AppleOAuth: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.37 12.73c-.02-2.3 1.88-3.4 1.96-3.46a4.23 4.23 0 0 0-3.33-1.8c-1.42-.14-2.77.84-3.49.84-.72 0-1.83-.82-3.01-.8a4.47 4.47 0 0 0-3.78 2.29c-1.61 2.8-.41 6.94 1.16 9.21.77 1.11 1.68 2.36 2.88 2.31 1.16-.05 1.6-.75 3-.75s1.8.75 3.02.72c1.25-.02 2.04-1.13 2.8-2.24a9.9 9.9 0 0 0 1.27-2.6 4.05 4.05 0 0 1-2.48-3.72ZM14.07 5.98c.64-.78 1.07-1.85.95-2.93-.92.04-2.04.61-2.7 1.38-.59.68-1.11 1.78-.97 2.83 1.03.08 2.07-.52 2.72-1.28Z"/></svg>`,
  MicrosoftOAuth: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#F25022" d="M1 1h10.5v10.5H1z"/><path fill="#7FBA00" d="M12.5 1H23v10.5H12.5z"/><path fill="#00A4EF" d="M1 12.5h10.5V23H1z"/><path fill="#FFB900" d="M12.5 12.5H23V23H12.5z"/></svg>`,
};
const LABEL: Record<Provider, string> = { GitHubOAuth: "GitHub", GoogleOAuth: "Google", AppleOAuth: "Apple", MicrosoftOAuth: "Microsoft" };

/* ---------- the app's wheel, drawn the same way (see "the wheel" in the prototype) ---------- */
const AR = 81.5, ARC_C = 2 * Math.PI * AR;
const polar = (r: number, deg: number) => { const a = (deg - 90) * Math.PI / 180; return [(r * Math.cos(a)).toFixed(2), (r * Math.sin(a)).toFixed(2)]; };
/** one tick for every minute of the block, longer every 5, and the bold zero at the top */
function scale(min: number): string {
  const n = Math.max(1, Math.round(min)); let h = "";
  for (let m = 1; m < n; m++) { const a = (m / n) * 360, mj = n >= 15 && m % 5 === 0; const [x1, y1] = polar(92, a), [x2, y2] = polar(mj ? 97.5 : 95.5, a); h += `<line class="${mj ? "mj" : "mn"}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`; }
  return `<svg class="scale" viewBox="-100 -100 200 200" aria-hidden="true">${h}<line class="z" x1="0" y1="-91.5" x2="0" y2="-99.5"/></svg>`;
}
const wheel = (min: number) => `<div class="dial" id="ld-dial" style="--p:1" role="img" aria-label="${min} minutes of break">${scale(min)}<span class="track"><svg viewBox="-100 -100 200 200" aria-hidden="true"><circle class="bed" r="${AR}"/></svg></span><span class="fill break"><svg viewBox="-100 -100 200 200" aria-hidden="true"><circle class="arc" id="ld-arc" r="${AR}" transform="rotate(-90)" style="stroke-dasharray:${ARC_C.toFixed(2)} ${ARC_C.toFixed(2)}"/></svg></span><span class="edge"></span><span class="face"><span class="big" id="ld-cd">${min}</span><span class="unit" id="ld-cdl">min of Reels</span></span></div>`;
/** a running focus block, as the app draws it, for the explainer: solid green ring, knob on its leading end */
const runWheel = (min: number, p: number) => `<div class="dial" style="--p:${p}">${scale(min)}<span class="track"><svg viewBox="-100 -100 200 200" aria-hidden="true"><circle class="bed" r="${AR}"/></svg></span><span class="fill focus"><svg viewBox="-100 -100 200 200" aria-hidden="true"><circle class="arc" r="${AR}" transform="rotate(-90)" style="stroke-dasharray:${(p * ARC_C).toFixed(2)} ${ARC_C.toFixed(2)}"/></svg></span><span class="edge"></span><span class="face"><span class="big">${Math.round(min * p)}</span><span class="unit">minutes left</span></span></div>`;
/** the clock that answers: the same small wheel the app's ask sheet speaks with */
const VOICE = `<svg class="voice break" viewBox="-50 -50 100 100" aria-hidden="true"><g class="tk">${Array.from({ length: 12 }, (_, i) => `<line x1="0" y1="-46.5" x2="0" y2="${i % 3 ? -49 : -50.5}" transform="rotate(${i * 30})"/>`).join("")}</g><circle class="bed" r="38"/><circle class="arc" r="38" transform="rotate(-90)" style="stroke-dasharray:${(2 * Math.PI * 38 * .66).toFixed(2)} ${(2 * Math.PI * 38).toFixed(2)}"/><g class="kn" transform="rotate(237.6)"><circle cy="-38" r="7.5"/></g></svg>`;
const term = (tag: "button" | "div", attrs: string, lead: string, rest: string, cls = "") => `<${tag} class="term${cls}"${attrs}><span class="say"><b>${lead}</b> ${rest}</span><span class="pad${tag === "div" && !cls.includes("stamped") ? " empty" : ""}" aria-hidden="true"><span class="stamp">DEAL</span></span></${tag}>`;

const ACTS = ["Reels", "TikTok", "YouTube", "Texting"];

export function landingHTML(o: LandingOptions): string {
  // Students mostly sign in with Apple (iPhone) or Google; the rest stay one tap away.
  const primary: Provider = o.ios && o.providers.includes("AppleOAuth") ? "AppleOAuth" : o.providers.includes("GoogleOAuth") ? "GoogleOAuth" : o.providers[0];
  const second = (["AppleOAuth", "GoogleOAuth"] as Provider[]).find((p) => p !== primary && o.providers.includes(p));
  const extra = o.providers.filter((p) => p !== primary && p !== second);
  const verb = o.invite ? "Accept with" : "Sign in with";
  const btn = (p: Provider, solid: boolean) => `<button class="ld-prov${solid ? " solid" : ""}" data-prov="${p}">${ICON[p]}${verb} ${LABEL[p]}</button>`;
  const list = (ps: Provider[]) => `<p class="ld-more">Or use ${ps.map((p) => `<button data-prov="${p}">${LABEL[p]}</button>`).join(", ")}${ps.length ? " or " : ""}<button data-email>email</button></p>`;
  const install = o.standalone ? ""
    : o.install === "prompt" ? `<p class="ld-install">Keep it on your home screen. <button id="ld-install">Install Pomodeal</button></p>`
    : o.install === "ios" ? `<p class="ld-install">To keep it on your home screen, tap Share, then Add to Home Screen.</p>` : "";
  const code = o.invite ? esc(o.invite) : "";
  return `<div class="ld${o.standalone ? " app" : ""}"><div class="ld-in">
    <header class="ld-top"><div class="mark"><img src="/icon-192.png" alt="">Pomodeal</div>${o.invite ? `<span class="ld-pill inv">Invite <b>${code}</b></span>` : `<span class="ld-pill">Private beta</span>`}</header>

    <section class="ld-hero">
      <div class="ld-copy">
        ${o.invite ? `<h1><span>You’re in.</span><span>Make a deal.</span></h1>` : `<h1><span class="hang">“10 more minutes,</span><span>then I’ll start.”</span></h1>`}
        <p class="ld-sub">${o.invite
          ? "A friend saved you a spot. Say what you’re scrolling, and Pomodeal turns it into a planned break, then a short focus block."
          : "Say what you’re scrolling. Pomodeal turns it into a planned break, then a short focus block. Want more time? Ask. The clock tells you what it costs."}</p>
      </div>

      <div class="ld-stage">
        <div class="ld-twrap">
        <div class="ld-peek" aria-hidden="true"><span>No. 0000, last night</span><span class="stamp">DEAL</span></div>
        <section class="ld-ticket" id="ld-ticket" aria-label="Try a deal">
          <div class="ld-body">
            <div class="ld-meta"><span class="serial">No. 0001, ${esc(clock12(new Date()))}</span><span class="stamp ld-mark" id="ld-mark" aria-hidden="true">DEAL</span></div>
            <p class="ld-sentence" id="ld-sentence"><b>10 min</b> of <b>Reels</b>, then <b>8 min</b> of <b>reading</b>.</p>
            <div class="ld-acts" role="radiogroup" aria-label="What you’re on right now">${ACTS.map((a, i) => `<button class="chip" role="radio" aria-checked="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-act="${a}">${a}</button>`).join("")}</div>
            <div class="ld-wheel" id="ld-wheel">${wheel(10)}</div>
          </div>
          <div class="ld-perf">
            <p class="ld-you" id="ld-you" hidden>“5 more minutes of Reels?”</p>
            <div class="ld-say">${VOICE}<p id="ld-say" aria-live="polite">What are you on right now?</p></div>
            <div class="terms" id="ld-terms" role="group" aria-labelledby="ld-say" hidden>
              ${term("button", ` data-term="borrow"`, "Take them from my next break.", "It goes from 7 minutes to 2.")}
              ${term("button", ` data-term="trade"`, "Add them to my next reading block.", "It goes from 8 minutes to 13.")}
            </div>
            <button class="ld-press" id="ld-deal">Deal</button>
            <button class="textbtn ld-ask" id="ld-ask" hidden>Ask for 5 more minutes</button>
          </div>
        </section>
        </div>
      </div>

      <div class="ld-signin" id="ld-signin">
        <h2>${o.invite ? "Keep your deal" : "Already in?"}</h2>
        ${o.invite ? `<div class="ld-invite"><span>Your invite</span><b>${code}</b></div>`
          : `<p class="ld-note">New here? Open the invite link a friend sent you.</p>`}
        ${btn(primary, true)}
        ${second ? btn(second, false) : ""}
        ${list(extra)}
        ${install}
      </div>
    </section>

    <section class="ld-how" aria-labelledby="ld-how-h">
      <h2 id="ld-how-h">How a deal works</h2>
      <div class="ld-row"><h3>Start from where you are</h3><p>No empty timer to stare at. Tell it what you’re doing and the break you’re already on becomes the first block, with a short focus block after it. You stamp it, and the clock starts.</p>
        <div class="ld-run" aria-hidden="true"><p class="ld-runk"><span class="swatch focus"></span>Focus</p><p class="ld-runt">Reading BIO 180 ch. 7</p>
          <div class="ld-runw">${runWheel(8, .62)}</div><p class="ld-runn"><span class="swatch break"></span>Then Reels for 5 min.</p></div></div>
      <div class="ld-row"><h3>Ask for more, honestly</h3><p>Five more minutes always works. The first one’s free. After that the clock says what it costs, in plain words, and you stamp the one you’ll take.</p>
        <div class="ld-art" aria-hidden="true">
          <p class="you">“5 more minutes of TikTok?”</p>
          <div class="answer">${VOICE}<p class="says">Sure. Where do the 5 minutes come from?</p></div>
          <div class="terms">
            ${term("div", "", "Take them from my next break.", "It goes from 7 minutes to 2.", " stamped")}
            ${term("div", "", "Add them to my next reading block.", "It goes from 8 minutes to 13.")}
          </div>
        </div></div>
      <div class="ld-row"><h3>See your patterns, not a streak</h3><p>Every deal prints on tonight’s tape. You see when you bargain most, and nothing resets to zero.</p>
        <div class="tapeside ld-tapeart" aria-hidden="true"><div class="tape"><ul class="stubs">
          <li class="stubcard"><span class="t"><b>10:37<small>pm</small></b></span><span class="what"><span class="row"><span class="title">+5 min of TikTok</span><span class="stamp" style="--tilt:-4deg">+Focus</span></span><em>Traded for 5 more min of focus</em></span></li>
          <li class="stubcard"><span class="t"><b>10:31<small>pm</small></b></span><span class="what"><span class="row"><span class="title">+5 min of TikTok</span><span class="stamp" style="--tilt:2.5deg">Borrowed</span></span><em>Borrowed from a later break</em></span></li>
          <li class="stubcard"><span class="t"><b>9:12<small>pm</small></b></span><span class="what"><span class="row"><span class="title">+5 min of Reels</span><span class="stamp" style="--tilt:-1.5deg">Free</span></span><em>On the house</em></span></li>
        </ul></div></div></div>
      <div class="ld-row"><h3>Study with your people</h3><p>Small private rooms for friends. See who’s focusing, and messages wait until everyone’s on a break.</p>
        <div class="ld-people" aria-hidden="true">
          <div><i class="f">M</i><span>Maya<br><em>Focusing on Orgo</em></span><b>14</b></div>
          <div><i class="b">J</i><span>Jordan<br><em>On a break</em></span><b>3</b></div>
          <div><i>P</i><span>Priya<br><em>Picking a next block</em></span><em>Deciding</em></div>
        </div></div>
    </section>

    <footer class="ld-foot">No streaks. No shame. Your deals stay private unless you share them with a room.</footer>
  </div>
  <div class="ld-dock away" id="ld-dock" aria-hidden="true">
    ${btn(primary, true)}${list(o.providers.filter((p) => p !== primary))}
  </div>
  </div>`;
}

export function bindLanding(root: HTMLElement, a: LandingActions) {
  const $ = <T extends Element>(s: string) => root.querySelector<T>(s);
  const sentence = $<HTMLElement>("#ld-sentence")!, say = $<HTMLElement>("#ld-say")!, ticket = $<HTMLElement>("#ld-ticket")!, wheelBox = $<HTMLElement>("#ld-wheel")!;
  const dealBtn = $<HTMLButtonElement>("#ld-deal")!, askBtn = $<HTMLButtonElement>("#ld-ask")!, terms = $<HTMLElement>("#ld-terms")!, acts = $<HTMLElement>(".ld-acts")!, you = $<HTMLElement>("#ld-you")!;
  const chips = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-act]"));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let act = "Reels", dealt = false, asks = 0, breakMin = 10, focusMin = 8, left = 600, timer = 0, drawnMin = 10;
  const n = (x: string | number) => `<span class="num">${x}</span>`;
  const later = (min: number) => n(clock12(new Date(Date.now() + min * 60000)));
  const speak = (html: string) => { say.innerHTML = html; say.classList.remove("pop"); void say.offsetWidth; say.classList.add("pop"); };
  const reveal = () => ticket.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });

  // the wheel shows the break: its scale has a tick per minute of it, and the arc is what is left of it
  function ring() {
    if (breakMin !== drawnMin) { drawnMin = breakMin; const sc = wheelBox.querySelector(".scale"); if (sc) sc.outerHTML = scale(breakMin); }
    const d = wheelBox.querySelector<HTMLElement>(".dial")!, p = Math.max(0, Math.min(1, left / (breakMin * 60)));
    d.style.setProperty("--p", p.toFixed(4));
    wheelBox.querySelector<SVGCircleElement>("#ld-arc")!.style.strokeDasharray = `${(p * ARC_C).toFixed(2)} ${ARC_C.toFixed(2)}`;
    const m = Math.ceil(left / 60);
    wheelBox.querySelector("#ld-cd")!.textContent = String(m);
    wheelBox.querySelector("#ld-cdl")!.textContent = dealt ? "minutes left" : `min of ${act}`;
    d.setAttribute("aria-label", dealt ? `${m} minutes of ${act} left` : `${breakMin} minutes of ${act}`);
  }
  function paint() { sentence.innerHTML = `<b>${breakMin} min</b> of <b>${act}</b>, then <b>${focusMin} min</b> of <b>reading</b>.`; ring(); }
  // a short buzz where the stamp hits the paper (Android; ignored elsewhere)
  const buzz = () => window.setTimeout(() => { try { navigator.vibrate?.(14); } catch { /* not allowed */ } }, reduce ? 0 : 200);
  /* pressing a stamp: it lifts, comes down at 200 ms with the ink, the ticket takes the knock (the app's keyframes) */
  function slam(b: HTMLElement) { b.classList.remove("pressed"); void b.offsetWidth; b.classList.add("pressed"); ticket.classList.remove("ld-hit"); void ticket.offsetWidth; ticket.classList.add("ld-hit"); buzz(); }

  function pick(b: HTMLButtonElement) {
    if (dealt) return;
    act = b.dataset.act!;
    chips.forEach((x) => { const on = x === b; x.setAttribute("aria-checked", String(on)); x.tabIndex = on ? 0 : -1; });
    you.textContent = `“5 more minutes of ${act}?”`;
    paint();
  }
  chips.forEach((b, i) => {
    b.addEventListener("click", () => pick(b));
    b.addEventListener("keydown", (e: KeyboardEvent) => {
      const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
      if (!d || dealt) return;
      e.preventDefault(); const next = chips[(i + d + chips.length) % chips.length]; pick(next); next.focus();
    });
  });

  const dock = $<HTMLElement>("#ld-dock"), signin = $<HTMLElement>("#ld-signin");
  let signinVisible = false;
  const syncDock = () => { const show = dealt && !signinVisible; dock?.classList.toggle("away", !show); dock?.setAttribute("aria-hidden", String(!show)); };
  if (signin && "IntersectionObserver" in window) new IntersectionObserver(([e]) => { signinVisible = e.isIntersecting; syncDock(); }, { threshold: 0.2 }).observe(signin);

  function run() { // the break counts down for real once the deal is made
    clearInterval(timer);
    timer = window.setInterval(() => { if (left > 0) { left--; ring(); } }, 1000);
  }
  /* the stamp you pressed is carried to the head of the ticket and stays there, large and inked */
  function keep(from: DOMRect) {
    const mark = $<HTMLElement>("#ld-mark")!; ticket.classList.add("ld-stamped");
    if (reduce || !mark.animate || !from.width) return;
    const r = mark.getBoundingClientRect(), home = getComputedStyle(mark).transform;
    mark.animate([{ transform: `translate(${(from.left + from.width / 2 - r.left - r.width / 2).toFixed(1)}px, ${(from.top + from.height / 2 - r.top - r.height / 2).toFixed(1)}px) scale(${(from.width / r.width).toFixed(3)}) rotate(-3deg)` }, { transform: home === "none" ? "none" : home }],
      { duration: 460, easing: "cubic-bezier(.3, .7, .2, 1)" });
  }
  function deal() {
    dealt = true; slam(dealBtn); syncDock();
    chips.forEach((x) => x.setAttribute("aria-disabled", "true"));
    window.setTimeout(() => {
      const from = dealBtn.getBoundingClientRect(); dealBtn.hidden = true; dealBtn.classList.remove("pressed");
      keep(from); run(); ring(); askBtn.hidden = false;
      speak(`Deal. ${esc(act)} until ${later(breakMin)}, then reading.`);
    }, reduce ? 0 : 560);
  }
  function ask() {
    asks++; you.hidden = false;
    if (asks === 1) { breakMin += 5; left += 300; paint(); speak(`Sure. The first one’s free. ${esc(act)} until ${later(left / 60)}.`); return; }
    // the second ask is a real negotiation: two terms, each a sentence, each stamped to take it
    askBtn.hidden = true; terms.hidden = false;
    speak("Sure. Where do the 5 minutes come from?");
    terms.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true }); reveal();
  }
  askBtn.addEventListener("click", ask);
  terms.querySelectorAll<HTMLButtonElement>("[data-term]").forEach((b) => b.addEventListener("click", () => {
    if (terms.classList.contains("picking")) return;
    b.classList.add("stamped"); terms.classList.add("picking"); ticket.classList.remove("ld-hit"); void ticket.offsetWidth; ticket.classList.add("ld-hit"); buzz();
    window.setTimeout(() => {
      breakMin += 5; left += 300; if (b.dataset.term === "trade") focusMin += 5;
      paint(); terms.hidden = true; you.hidden = true;
      speak(b.dataset.term === "trade" ? `Deal. Reading goes to ${n(focusMin)} min. It’s on your tape.` : "Deal. Your next break gets shorter. It’s on your tape.");
      dealBtn.hidden = false; dealBtn.textContent = "Keep this deal"; dealBtn.classList.add("words"); dealBtn.dataset.final = "1"; dealBtn.focus({ preventScroll: true }); reveal();
    }, reduce ? 0 : 760);
  }));
  dealBtn.addEventListener("click", () => {
    if (dealBtn.dataset.final) {
      const target = Array.from(root.querySelectorAll<HTMLButtonElement>(".ld-prov.solid")).find((x) => x.offsetParent);
      target?.focus(); target?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      return;
    }
    if (!dealt) deal();
  });

  root.querySelectorAll<HTMLButtonElement>("[data-prov]").forEach((b) => b.addEventListener("click", () => { b.disabled = true; a.signInWith(b.dataset.prov as Provider); }));
  root.querySelectorAll<HTMLButtonElement>("[data-email]").forEach((b) => b.addEventListener("click", a.signIn));
  $<HTMLButtonElement>("#ld-install")?.addEventListener("click", a.install);
  paint();

  // ?demo=dealt / asked / terms sets the demo state for screenshots and reviews.
  const demo = new URLSearchParams(location.search).get("demo");
  if (demo) {
    dealt = true; dealBtn.hidden = true; ticket.classList.add("ld-stamped"); askBtn.hidden = false; chips.forEach((x) => x.setAttribute("aria-disabled", "true")); run(); ring();
    speak(`Deal. ${esc(act)} until ${later(breakMin)}, then reading.`);
    if (demo === "asked" || demo === "terms") ask(); if (demo === "terms") ask();
    return;
  }

  // First look, before anyone reads a word: the wheel winds on, and a sample copy of this ticket is stamped and slides
  // under the real one into the pile behind it. The real ticket is untouched; its stamp is yours. Any tap or key ends it.
  if (reduce) return;
  const twrap = $<HTMLElement>(".ld-twrap")!, peek = $<HTMLElement>(".ld-peek");
  const sample = ticket.cloneNode(true) as HTMLElement;
  sample.removeAttribute("id"); sample.removeAttribute("aria-label"); sample.querySelectorAll("[id]").forEach((e) => e.removeAttribute("id"));
  sample.querySelectorAll("[aria-live]").forEach((e) => e.removeAttribute("aria-live"));
  sample.setAttribute("aria-hidden", "true"); sample.inert = true; sample.classList.add("ld-sample");
  const sampleBtn = sample.querySelector<HTMLElement>(".ld-press"), sampleSay = sample.querySelector<HTMLElement>(".ld-say p");
  ticket.classList.add("ld-under"); sample.classList.add("ld-intro"); twrap.append(sample);
  const timers: number[] = [];
  const cancel = () => {
    timers.forEach(clearTimeout); sample.remove(); ticket.classList.remove("ld-under");
    root.removeEventListener("pointerdown", cancel, true); root.removeEventListener("keydown", cancel, true);
  };
  root.addEventListener("pointerdown", cancel, true); root.addEventListener("keydown", cancel, true);
  const at = (ms: number, f: () => void) => timers.push(window.setTimeout(f, ms));
  at(900, () => { sampleBtn?.classList.add("pressed"); sample.classList.add("ld-hit"); });
  at(1150, () => { sample.classList.add("ld-stamped"); if (sampleSay) sampleSay.innerHTML = `Deal. Reels until ${later(breakMin)}, then reading.`; });
  at(1800, () => { sample.classList.add("ld-file"); peek?.classList.add("ld-bump"); });
  at(2170, () => { ticket.classList.remove("ld-under"); ticket.classList.add("ld-fresh"); });
  at(2250, () => sample.remove());
  at(2500, cancel);
}
