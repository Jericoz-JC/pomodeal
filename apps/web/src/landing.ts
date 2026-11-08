// The first screen people see (signed out). One playable deal in front of a dial that shows the
// deal itself (a striped break, then a focus block), the clock persona in the middle, and sign-in
// that's always one thumb away on phones. Installed as a PWA, it drops the explainer.
//
// Design plan
//   Subject: the bargain students already make with themselves. The headline quotes it; a stamp answers it.
//   One bold object: the dial + ticket. Everything else is quiet: paper, ink, one approval green.
//   Motion: a 4.5 s scripted take on first load (pick, deal, stamp, the clock talks), then it's yours.

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
#pd-gate .ld { position: relative; min-height: 100%; overflow-x: clip; }
#pd-gate .ld::before { content: ""; position: fixed; inset: 0; pointer-events: none; opacity: .05; z-index: 0; background-image: var(--noise); background-size: 120px 60px; }
#pd-gate .ld > :not(.ld-dock) { position: relative; z-index: 1; }
#pd-gate .ld-in { max-width: 1080px; margin: 0 auto; padding: calc(14px + env(safe-area-inset-top, 0px)) max(18px, env(safe-area-inset-right, 0px)) 0 max(18px, env(safe-area-inset-left, 0px)); }
#pd-gate .ld-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
#pd-gate .ld-top .mark { display: flex; align-items: center; gap: 10px; font-family: var(--font-head); font-stretch: 78%; font-weight: 800; font-size: 23px; }
#pd-gate .ld-top .mark img { width: 30px; height: 30px; border-radius: 8px; }
#pd-gate .ld-pill { font-size: 14px; color: var(--soft); }
#pd-gate .ld-pill.inv { color: var(--ink); border: 1.5px dashed var(--deal); border-radius: 999px; padding: 4px 10px; font-weight: 700; }
#pd-gate .ld-pill.inv b { font-family: var(--font-head); font-stretch: 85%; letter-spacing: .06em; }

#pd-gate .ld-hero { display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; padding: 18px 0 8px; }
#pd-gate .ld-copy { display: flex; flex-direction: column; gap: 10px; }
#pd-gate .ld h1 { font-family: var(--font-head); font-stretch: 72%; font-weight: 800; font-size: clamp(40px, 11vw, 78px); line-height: .94; letter-spacing: -.01em; margin: 0; color: var(--ink); }
#pd-gate .ld h1 span { display: block; white-space: nowrap; }
#pd-gate .ld-copy { position: relative; }
#pd-gate .num { font-family: var(--font-head); font-stretch: 85%; font-weight: 700; font-variant-numeric: tabular-nums; }
#pd-gate .ld-sub { font-size: 17px; line-height: 1.45; color: var(--soft); max-width: 34ch; margin: 0; }

#pd-gate .ld-stage { position: relative; display: grid; grid-template-columns: minmax(0, 1fr); justify-items: center; min-width: 0; }
#pd-gate .ld-dial { width: min(50vw, 196px); aspect-ratio: 1; }
#pd-gate .ld-dial svg { width: 100%; height: 100%; display: block; overflow: visible; }
#pd-gate .ld-dial .tick { stroke: var(--soft); stroke-width: 1.4; opacity: .7; }
#pd-gate .ld-dial .tick.maj { stroke: var(--ink); stroke-width: 2.4; opacity: 1; }
#pd-gate .ld-dial .track { stroke: var(--track); }
#pd-gate .ld-dial .brk { transition: stroke-dashoffset 1s linear; }
#pd-gate .ld-dial .cd { font-family: var(--font-head); font-stretch: 72%; font-weight: 800; font-size: 50px; fill: var(--ink); font-variant-numeric: tabular-nums; }
#pd-gate .ld-dial .cdl { font-family: var(--font-head); font-stretch: 85%; font-weight: 700; font-size: 19px; fill: var(--soft); }
#pd-gate .ld-dial .foc { stroke: var(--ink); opacity: .82; transition: stroke .45s ease, opacity .45s ease; }
#pd-gate .ld-dial.ld-dealt .foc { stroke: var(--deal); opacity: 1; }
#pd-gate .ld-dial .face { fill: var(--ink); }
#pd-gate .ld-dial .hands { stroke: var(--paper); }
#pd-gate .ld-dial .hand-m { transform-origin: 120px 120px; animation: ld-spin 30s linear infinite; }
#pd-gate .ld-dial .hand-h { transform-origin: 120px 120px; animation: ld-spin 360s linear infinite; }
@keyframes ld-drain { from { stroke-dashoffset: 0; } to { stroke-dashoffset: var(--brk); } }
@keyframes ld-spin { to { transform: rotate(360deg); } }

#pd-gate .ld-twrap { position: relative; width: 100%; max-width: 420px; min-width: 0; margin-top: -24px; margin-bottom: 40px; }
#pd-gate .ld-peek { position: absolute; left: 0; right: 0; bottom: -36px; height: 70px; background: var(--stub); border-radius: 6px; transform: rotate(-2deg); transform-origin: 30% 0;
  box-shadow: 0 0 0 1px var(--rule); display: flex; align-items: flex-end; justify-content: space-between; padding: 0 18px 8px; font-family: var(--font-head); font-stretch: 80%; font-weight: 700; font-size: 13px; color: var(--soft); }
#pd-gate .ld-peek b { font-family: var(--font-head); font-stretch: 70%; font-weight: 900; font-size: 18px; color: var(--deal); border: 2.5px double var(--deal); border-radius: 6px; padding: 0 7px; transform: rotate(-7deg); }
#pd-gate .ld-ticket { position: relative; width: 100%; min-width: 0; scroll-margin-bottom: calc(130px + env(safe-area-inset-bottom, 0px)); background: var(--card); border-radius: 6px;
  box-shadow: 0 0 0 1px var(--rule), 0 24px 44px -28px var(--lift); }
#pd-gate .ld-body { padding: 14px 18px 12px; display: flex; flex-direction: column; gap: 10px; }
#pd-gate .ld-meta { display: flex; justify-content: space-between; align-items: center; gap: 10px; font-family: var(--font-head); font-stretch: 80%; font-weight: 700; font-size: 14px; color: var(--soft); min-height: 38px; }
#pd-gate .ld-slot { position: relative; width: 92px; height: 38px; border: 1.5px dashed var(--wait-edge); border-radius: 8px; transform: rotate(-6deg); flex: none; display: grid; place-items: center;
  font-family: var(--font-head); font-stretch: 70%; font-weight: 900; font-size: 24px; color: transparent; }
#pd-gate .ld-stamped .ld-slot { border-color: transparent; color: transparent; }
#pd-gate .ld-stamp { position: absolute; right: 18px; top: 14px; width: 92px; height: 38px; display: grid; place-items: center; font-family: var(--font-head); font-stretch: 70%; font-weight: 900; font-size: 26px; color: var(--deal);
  border: 3px double var(--deal); border-radius: 8px; transform: rotate(-6deg); opacity: 0; pointer-events: none; }
#pd-gate .ld-stamped .ld-stamp { opacity: .95; animation: ld-stamp .32s cubic-bezier(.2,1.6,.4,1); }
#pd-gate .ld-ticket.ld-thud { animation: ld-thud .3s ease-out; }
@keyframes ld-stamp { from { transform: rotate(-6deg) scale(1.9); opacity: 0; } }
@keyframes ld-thud { 40% { transform: translateY(2px); } }
#pd-gate .ld-sentence { font-family: var(--font-head); font-stretch: 80%; font-weight: 750; font-size: 28px; line-height: 1.08; margin: 0; color: var(--ink); }
#pd-gate .ld-sentence em { font-style: normal; text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 5px; text-decoration-color: var(--deal); }
#pd-gate .ld-acts { display: flex; gap: 6px; flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; margin-inline: -18px; padding: 5px 18px; margin-block: -5px; -webkit-mask-image: linear-gradient(90deg, #000 calc(100% - 28px), transparent); mask-image: linear-gradient(90deg, #000 calc(100% - 28px), transparent); }
#pd-gate .ld-acts[hidden] { display: none; }
#pd-gate .ld-acts::-webkit-scrollbar { display: none; }
#pd-gate .ld-acts button { flex: none; border: 1.5px solid var(--edge); background: transparent; color: var(--ink); border-radius: 999px; padding: 8px 12px; min-height: 44px; font: inherit; font-weight: 700; font-size: 14.5px; cursor: pointer; }
#pd-gate .ld-acts button[aria-checked="true"] { background: var(--ink); color: var(--paper); border-color: var(--ink); }
#pd-gate .ld-acts button[aria-disabled="true"]:not([aria-checked="true"]) { color: var(--soft); border-style: dashed; }
#pd-gate .ld-terms { display: flex; flex-direction: column; gap: 6px; }
#pd-gate .ld-terms[hidden] { display: none; }
#pd-gate .ld-terms button { display: grid; grid-template-columns: 64px 1fr; text-align: left; background: var(--card); border: 1.5px solid var(--edge); border-radius: 6px; padding: 0; min-height: 52px; font: inherit; color: var(--ink); cursor: pointer; }
#pd-gate .ld-terms .fig { display: grid; place-items: center; border-right: 2px dotted var(--rule); font-family: var(--font-head); font-stretch: 75%; font-weight: 800; font-size: 20px; }
#pd-gate .ld-terms .txt { padding: 8px 12px; } #pd-gate .ld-terms .txt b { display: block; font-family: var(--font-head); font-stretch: 82%; font-weight: 800; font-size: 17px; } #pd-gate .ld-terms .txt span { color: var(--soft); font-size: 14px; }
#pd-gate .ld-perf { position: relative; border-top: 2px dashed var(--rule); padding: 10px 18px 14px; display: flex; flex-direction: column; gap: 8px; }
#pd-gate .ld-perf::before, #pd-gate .ld-perf::after { content: ""; position: absolute; top: -11px; width: 20px; height: 20px; border-radius: 50%; background: var(--paper); box-shadow: inset 0 0 0 1px var(--rule); }
#pd-gate .ld-perf::before { left: -10px; clip-path: inset(0 0 0 50%); } #pd-gate .ld-perf::after { right: -10px; clip-path: inset(0 50% 0 0); }
#pd-gate .ld-say { display: flex; gap: 10px; align-items: center; min-height: 40px; }
#pd-gate .ld-say svg { width: 30px; height: 30px; flex: none; }
#pd-gate .ld-say p { margin: 0; font-size: 16px; line-height: 1.35; color: var(--ink); }
#pd-gate .ld-say p.pop { animation: ld-pop .16s ease-out; }
@keyframes ld-pop { from { transform: scale(.96); } }
#pd-gate .ld-deal { width: 100%; min-height: 52px; border: none; border-radius: 12px; background: var(--deal); color: var(--on-deal); font-family: var(--font-head); font-stretch: 85%; font-weight: 800; font-size: 21px; cursor: pointer; }
#pd-gate .ld-deal[hidden] { display: none; }
#pd-gate .ld-deal.ld-ghost { background: transparent; color: var(--ink); border: 1.5px solid var(--edge); }
#pd-gate .ld-deal.ld-press { transform: scale(.97); }
#pd-gate .ld-deal.ld-nudge { animation: ld-nudge 1.2s ease-in-out 2; }
@keyframes ld-nudge { 50% { box-shadow: 0 0 0 6px color-mix(in srgb, var(--deal) 28%, transparent); } }

#pd-gate .ld-signin { display: flex; flex-direction: column; gap: 10px; scroll-margin-top: 20px; padding-top: 6px; }
#pd-gate .ld-signin h2 { font-family: var(--font-head); font-stretch: 80%; font-weight: 800; font-size: 28px; margin: 0; }
#pd-gate .ld-note { color: var(--soft); margin: 0 0 4px; font-size: 16px; line-height: 1.45; }
#pd-gate .ld-invite { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; padding: 12px 16px; border: 1.5px dashed var(--deal); border-radius: 10px; }
#pd-gate .ld-invite span { color: var(--soft); font-size: 15px; }
#pd-gate .ld-invite b { font-family: var(--font-head); font-stretch: 85%; font-weight: 800; font-size: 22px; letter-spacing: .08em; }
#pd-gate .ld-prov { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; min-height: 54px; border-radius: 12px; border: 1.5px solid var(--edge);
  background: var(--card); color: var(--ink); font: inherit; font-weight: 700; font-size: 17px; cursor: pointer; }
#pd-gate .ld-prov svg { width: 22px; height: 22px; flex: none; }
#pd-gate .ld-prov.solid { background: var(--ink); color: var(--paper); border-color: var(--ink); }
#pd-gate .ld-prov:disabled { opacity: .6; }
#pd-gate .ld-more { margin: 2px 0 0; text-align: center; color: var(--soft); font-size: 15px; }
#pd-gate .ld-more button { background: none; border: none; color: var(--ink); text-decoration: underline; text-underline-offset: 3px; font: inherit; font-weight: 700; padding: 10px 0; min-height: 44px; cursor: pointer; }
#pd-gate .ld-install { display: flex; gap: 10px; align-items: center; justify-content: center; flex-wrap: wrap; font-size: 14.5px; color: var(--soft); margin: 2px 0 0; text-align: center; }
#pd-gate .ld-install button { border: 1.5px solid var(--edge); background: transparent; color: var(--ink); border-radius: 999px; padding: 6px 14px; min-height: 44px; font: inherit; font-weight: 700; cursor: pointer; }

#pd-gate .ld-how { padding: 44px 0 20px; display: grid; gap: 34px; }
#pd-gate .ld-how h2 { font-family: var(--font-head); font-stretch: 78%; font-weight: 800; font-size: clamp(30px, 7vw, 44px); line-height: 1; margin: 0; max-width: 18ch; }
#pd-gate .ld-row { display: grid; gap: 14px; }
#pd-gate .ld-row h3 { font-family: var(--font-head); font-stretch: 82%; font-weight: 800; font-size: 22px; margin: 0; }
#pd-gate .ld-row p { margin: 0; color: var(--soft); font-size: 16.5px; line-height: 1.5; max-width: 40ch; }
#pd-gate .ld-art { display: flex; flex-direction: column; gap: 8px; }
#pd-gate .ld-term { display: grid; grid-template-columns: 70px 1fr; background: var(--card); border: 1.5px solid var(--edge); border-radius: 6px; }
#pd-gate .ld-term .fig { display: grid; place-items: center; border-right: 2px dotted var(--rule); font-family: var(--font-head); font-stretch: 75%; font-weight: 800; font-size: 22px; }
#pd-gate .ld-term .txt { padding: 10px 14px; } #pd-gate .ld-term .txt b { display: block; font-family: var(--font-head); font-stretch: 82%; font-weight: 800; font-size: 18px; } #pd-gate .ld-term .txt span { color: var(--soft); font-size: 14.5px; }
#pd-gate .ld-term.on { border-color: var(--deal); box-shadow: inset 0 0 0 1px var(--deal); }
#pd-gate .ld-stub { display: grid; grid-template-columns: 70px 1fr auto; align-items: center; background: var(--card); -webkit-mask: var(--zig); mask: var(--zig); }
#pd-gate .ld-stub .t { text-align: center; border-right: 2px dashed var(--rule); padding: 10px 6px; font-family: var(--font-head); font-stretch: 80%; font-weight: 750; font-size: 18px; }
#pd-gate .ld-stub .w { padding: 10px 14px; } #pd-gate .ld-stub .w b { display: block; font-family: var(--font-head); font-stretch: 80%; font-weight: 750; font-size: 17px; } #pd-gate .ld-stub .w span { color: var(--soft); font-size: 14px; }
#pd-gate .ld-stub .m { margin-right: 18px; font-family: var(--font-head); font-stretch: 70%; font-weight: 900; font-size: 13px; color: var(--deal); border: 1.5px solid var(--deal); border-radius: 4px; padding: 0 5px; transform: rotate(-6deg); }
#pd-gate .ld-people { display: flex; flex-direction: column; background: var(--card); border-radius: 8px; padding: 4px 14px; }
#pd-gate .ld-people div { display: grid; grid-template-columns: 34px 1fr auto; gap: 12px; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--rule); font-size: 15.5px; }
#pd-gate .ld-people div:last-child { border-bottom: none; }
#pd-gate .ld-people i { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; font-style: normal; font-weight: 700; font-size: 14px; border: 3px solid var(--rule); }
#pd-gate .ld-people i.f { border-color: var(--deal); } #pd-gate .ld-people i.b { border-style: dashed; border-color: var(--edge); }
#pd-gate .ld-people em { font-style: normal; color: var(--soft); font-size: 14px; }
#pd-gate .ld-foot { padding: 28px 0 calc(130px + env(safe-area-inset-bottom, 0px)); border-top: 1px solid var(--rule); margin-top: 20px; color: var(--soft); font-size: 14.5px; }

/* phones: sign-in lives in a dock that stays under the thumb */
#pd-gate .ld-dock { position: fixed; z-index: 5; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; gap: 0;
  padding: 10px max(16px, env(safe-area-inset-right, 0px)) calc(4px + env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px));
  background: color-mix(in srgb, var(--paper) 90%, transparent); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-top: 1px solid var(--rule); }
#pd-gate .ld-dock .ld-more { margin: 0; }
#pd-gate .ld-dock { transition: transform .25s ease; }
#pd-gate .ld-dock.away { transform: translateY(115%); }
#pd-gate .ld.app .ld-how { display: none; }

@media (max-width: 899px) {
  #pd-gate .ld-hero { gap: 14px; }
  #pd-gate .ld-dial { width: min(46vw, 176px); }
}
@media (max-width: 899px) and (max-height: 760px) {
  #pd-gate .ld-sub { display: none; }
  #pd-gate .ld-dial { width: min(38vw, 140px); }
}
@media (min-width: 900px) {
  #pd-gate .ld-in { padding-top: 22px; }
  #pd-gate .ld-hero { grid-template-columns: 1.15fr 1fr; grid-template-areas: "copy stage" "signin stage"; column-gap: 56px; row-gap: 28px; align-items: start; padding-top: 6vh; }
  #pd-gate .ld-copy { grid-area: copy; } #pd-gate .ld-stage { grid-area: stage; } #pd-gate .ld-signin { grid-area: signin; max-width: 400px; }
  #pd-gate .ld h1 { font-size: clamp(56px, 5.6vw, 78px); } #pd-gate .ld h1 .hang { margin-left: -.36em; }
  #pd-gate .ld-dial { width: 300px; } #pd-gate .ld-twrap { margin-top: -36px; }
  #pd-gate .ld-how { grid-template-columns: repeat(2, 1fr); column-gap: 56px; padding-top: 80px; }
  #pd-gate .ld-how h2 { grid-column: 1 / -1; }
  #pd-gate .ld-dock { display: none; }
  #pd-gate .ld-foot { padding-bottom: 40px; }
}
@media (prefers-reduced-motion: reduce) {
  #pd-gate .ld-dial .brk, #pd-gate .ld-deal.ld-nudge, #pd-gate .ld-stamped .ld-stamp, #pd-gate .ld-ticket.ld-thud, #pd-gate .ld-say p.pop { animation: none; }
}
`;

const ICON: Record<Provider, string> = {
  GitHubOAuth: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z"/></svg>`,
  GoogleOAuth: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.81Z"/><path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.88-3.01c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24Z"/><path fill="#FBBC05" d="M5.29 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.28a12 12 0 0 0 0 10.78l4.01-3.1Z"/><path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.98 11.98 0 0 0 1.28 6.61l4.01 3.1C6.23 6.88 8.88 4.77 12 4.77Z"/></svg>`,
  AppleOAuth: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.37 12.73c-.02-2.3 1.88-3.4 1.96-3.46a4.23 4.23 0 0 0-3.33-1.8c-1.42-.14-2.77.84-3.49.84-.72 0-1.83-.82-3.01-.8a4.47 4.47 0 0 0-3.78 2.29c-1.61 2.8-.41 6.94 1.16 9.21.77 1.11 1.68 2.36 2.88 2.31 1.16-.05 1.6-.75 3-.75s1.8.75 3.02.72c1.25-.02 2.04-1.13 2.8-2.24a9.9 9.9 0 0 0 1.27-2.6 4.05 4.05 0 0 1-2.48-3.72ZM14.07 5.98c.64-.78 1.07-1.85.95-2.93-.92.04-2.04.61-2.7 1.38-.59.68-1.11 1.78-.97 2.83 1.03.08 2.07-.52 2.72-1.28Z"/></svg>`,
  MicrosoftOAuth: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#F25022" d="M1 1h10.5v10.5H1z"/><path fill="#7FBA00" d="M12.5 1H23v10.5H12.5z"/><path fill="#00A4EF" d="M1 12.5h10.5V23H1z"/><path fill="#FFB900" d="M12.5 12.5H23V23H12.5z"/></svg>`,
};
const LABEL: Record<Provider, string> = { GitHubOAuth: "GitHub", GoogleOAuth: "Google", AppleOAuth: "Apple", MicrosoftOAuth: "Microsoft" };

/** The clock persona: hands at 10:10, one green dot. */
const CLOCK = `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19" fill="var(--ink)"/><g stroke="var(--card)" stroke-width="1.6" stroke-linecap="round" opacity=".5"><path d="M20 4.5v2.5M35.5 20h-2.5M20 35.5V33M4.5 20H7"/></g><line x1="20" y1="20" x2="14.5" y2="14" stroke="var(--card)" stroke-width="3" stroke-linecap="round"/><line x1="20" y1="20" x2="28" y2="11" stroke="var(--card)" stroke-width="2.4" stroke-linecap="round"/><circle cx="20" cy="20" r="2.4" fill="var(--deal)"/></svg>`;

/** The dial shows the deal itself: a striped break from 12 o'clock, a gap, then the focus block,
 *  with a live countdown in the middle. It is an instrument, not a character; the persona lives in the ticket. */
const R = 90, CIRC = 2 * Math.PI * R, PER_MIN = CIRC / 60, GAP = 3;
function dial(): string {
  let ticks = "";
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * 2 * Math.PI, maj = i % 5 === 0;
    const r1 = 117, r2 = maj ? 104 : 110;
    ticks += `<line class="tick${maj ? " maj" : ""}" x1="${(120 + r1 * Math.sin(a)).toFixed(1)}" y1="${(120 - r1 * Math.cos(a)).toFixed(1)}" x2="${(120 + r2 * Math.sin(a)).toFixed(1)}" y2="${(120 - r2 * Math.cos(a)).toFixed(1)}"/>`;
  }
  return `<svg viewBox="0 0 240 240" aria-hidden="true">
    <defs><pattern id="ld-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="var(--break-base)"/><rect width="3" height="8" fill="var(--break-stripe)"/></pattern></defs>
    ${ticks}
    <circle class="track" cx="120" cy="120" r="${R}" fill="none" stroke-width="16"/>
    <circle class="brk" id="ld-brk" cx="120" cy="120" r="${R}" fill="none" stroke="url(#ld-hatch)" stroke-width="16" transform="rotate(-90 120 120)"/>
    <circle class="foc" id="ld-foc" cx="120" cy="120" r="${R}" fill="none" stroke-width="16"/>
    <text class="cd" id="ld-cd" x="120" y="126" text-anchor="middle">10:00</text>
    <text class="cdl" id="ld-cdl" x="120" y="152" text-anchor="middle">of Reels</text>
  </svg>`;
}

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
          : "Say what you’re scrolling. Pomodeal turns it into a planned break, then a short focus block. Want more time? It tells you what it costs."}</p>
      </div>

      <div class="ld-stage">
        <div class="ld-dial" id="ld-dial">${dial()}</div>
        <div class="ld-twrap">
        <div class="ld-peek" aria-hidden="true"><span>No. 0000, last night</span><b>DEAL</b></div>
        <section class="ld-ticket" id="ld-ticket" aria-label="Try a deal">
          <div class="ld-body">
            <div class="ld-meta"><span>No. 0001, ${esc(clock12(new Date()))}</span><span class="ld-slot" aria-hidden="true"></span></div>
            <p class="ld-sentence" id="ld-sentence">10 min of <em>Reels</em>, then 8 min of reading.</p>
            <div class="ld-acts" role="radiogroup" aria-label="What you’re on right now">${ACTS.map((a, i) => `<button role="radio" aria-checked="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-act="${a}">${a}</button>`).join("")}</div>
          </div>
          <div class="ld-perf">
            <div class="ld-say">${CLOCK}<p id="ld-say" aria-live="polite">Pick what you’re on, then tap Deal.</p></div>
            <div class="ld-terms" id="ld-terms" role="group" aria-labelledby="ld-say" hidden>
              <button data-term="borrow"><span class="fig">−5</span><span class="txt"><b>Borrow from next break</b><span>Next break 7 → 2 min</span></span></button>
              <button data-term="trade"><span class="fig">+5</span><span class="txt"><b>Add to next focus</b><span>Reading 8 → 13 min</span></span></button>
            </div>
            <button class="ld-deal" id="ld-deal">Deal</button>
          </div>
          <span class="ld-stamp" aria-hidden="true">DEAL</span>
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
      <div class="ld-row"><h3>Start from where you are</h3><p>No empty timer to stare at. Tell it what you’re doing and the break you’re already on becomes the first block, with a short focus block after it.</p></div>
      <div class="ld-row"><h3>Ask for more, honestly</h3><p>Five more minutes always works. The first one’s free. After that you see what it costs before you take it.</p>
        <div class="ld-art" aria-hidden="true">
          <div class="ld-term on"><span class="fig">−5</span><span class="txt"><b>Borrow from next break</b><span>Next break 7 → 2 min</span></span></div>
          <div class="ld-term"><span class="fig">+5</span><span class="txt"><b>Add to next focus</b><span>Reading 8 → 13 min</span></span></div>
        </div></div>
      <div class="ld-row"><h3>See your patterns, not a streak</h3><p>Every deal lands in a ledger. You’ll see when you bargain most, and nothing resets to zero.</p>
        <div class="ld-art" aria-hidden="true">
          <div class="ld-stub"><span class="t">10:37</span><span class="w"><b>+5 min of TikTok</b><span>Traded for 5 more min of focus</span></span><span class="m">+FOCUS</span></div>
          <div class="ld-stub"><span class="t">9:12</span><span class="w"><b>+5 min of Reels</b><span>On the house</span></span><span class="m">FREE</span></div>
        </div></div>
      <div class="ld-row"><h3>Study with your people</h3><p>Small private rooms for friends. See who’s focusing, and messages wait until everyone’s on a break.</p>
        <div class="ld-people" aria-hidden="true">
          <div><i class="f">M</i><span>Maya</span><em>Focusing, 14 min left</em></div>
          <div><i class="b">J</i><span>Jordan</span><em>On a break</em></div>
          <div><i>P</i><span>Priya</span><em>Between blocks</em></div>
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
  const sentence = $<HTMLElement>("#ld-sentence")!, say = $<HTMLElement>("#ld-say")!, ticket = $<HTMLElement>("#ld-ticket")!, dialEl = $<HTMLElement>("#ld-dial")!;
  const dealBtn = $<HTMLButtonElement>("#ld-deal")!, terms = $<HTMLElement>("#ld-terms")!, acts = $<HTMLElement>(".ld-acts")!;
  const brk = $<SVGCircleElement>("#ld-brk")!, foc = $<SVGCircleElement>("#ld-foc")!, cd = $<SVGTextElement>("#ld-cd")!, cdl = $<SVGTextElement>("#ld-cdl")!;
  const chips = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-act]"));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let act = "Reels", dealt = false, asks = 0, breakMin = 10, focusMin = 8, left = 600, timer = 0;
  const n = (x: string | number) => `<span class="num">${x}</span>`;
  const later = (min: number) => n(clock12(new Date(Date.now() + min * 60000)));
  const speak = (html: string) => { say.innerHTML = html; say.classList.remove("pop"); void say.offsetWidth; say.classList.add("pop"); };
  const reveal = () => ticket.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });

  // Ring geometry follows the deal: break arc = time left in the break, focus arc right after it.
  function ring() {
    const brkLen = Math.max(0, (left / 60) * PER_MIN), focLen = focusMin * PER_MIN - GAP;
    brk.setAttribute("stroke-dasharray", `${brkLen.toFixed(1)} ${CIRC.toFixed(1)}`);
    foc.setAttribute("stroke-dasharray", `${focLen.toFixed(1)} ${CIRC.toFixed(1)}`);
    const startDeg = -90 + (breakMin / 60) * 360 + (GAP / CIRC) * 360;
    foc.setAttribute("transform", `rotate(${startDeg.toFixed(2)} 120 120)`);
    cd.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
    cdl.textContent = `of ${act}`;
  }
  function paint() { sentence.innerHTML = `${breakMin} min of <em>${act}</em>, then ${focusMin} min of reading.`; ring(); }
  function stamp(on = true) { ticket.classList.remove("ld-stamped", "ld-thud"); if (!on) return; void ticket.offsetWidth; ticket.classList.add("ld-stamped", "ld-thud"); }

  function pick(b: HTMLButtonElement) {
    if (dealt) return;
    act = b.dataset.act!;
    chips.forEach((x) => { const on = x === b; x.setAttribute("aria-checked", String(on)); x.tabIndex = on ? 0 : -1; });
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
  function deal() {
    dealt = true; stamp(); dialEl.classList.add("ld-dealt"); run(); syncDock();
    chips.forEach((x) => x.setAttribute("aria-disabled", "true"));
    dealBtn.textContent = "Ask for 5 more"; dealBtn.classList.add("ld-ghost"); dealBtn.classList.remove("ld-nudge");
    speak(`Deal. ${act} until ${later(breakMin)}, then reading.`);
  }
  function ask() {
    asks++;
    if (asks === 1) { breakMin += 5; left += 300; paint(); speak(`Sure. First one’s on the house. ${act} until ${later(left / 60)}.`); return; }
    // the second ask is a real negotiation: the stamp comes off until a term is picked
    stamp(false); acts.hidden = true; terms.hidden = false; dealBtn.hidden = true;
    speak("This one costs something. Where do the 5 minutes come from?");
    terms.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true }); reveal();
  }
  terms.querySelectorAll<HTMLButtonElement>("[data-term]").forEach((b) => b.addEventListener("click", () => {
    breakMin += 5; left += 300; if (b.dataset.term === "trade") focusMin += 5;
    paint(); stamp(); terms.hidden = true;
    speak(b.dataset.term === "trade" ? `Deal. Reading goes to ${n(focusMin)} min. It’s in your ledger.` : "Deal. Your next break gets shorter. It’s in your ledger.");
    dealBtn.hidden = false; dealBtn.textContent = "Keep this deal"; dealBtn.classList.remove("ld-ghost"); dealBtn.dataset.final = "1"; dealBtn.focus({ preventScroll: true }); reveal();
  }));
  dealBtn.addEventListener("click", () => {
    if (dealBtn.dataset.final) {
      const target = Array.from(root.querySelectorAll<HTMLButtonElement>(".ld-prov.solid")).find((x) => x.offsetParent);
      target?.focus(); target?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      return;
    }
    if (!dealt) deal(); else ask();
  });

  root.querySelectorAll<HTMLButtonElement>("[data-prov]").forEach((b) => b.addEventListener("click", () => { b.disabled = true; a.signInWith(b.dataset.prov as Provider); }));
  root.querySelectorAll<HTMLButtonElement>("[data-email]").forEach((b) => b.addEventListener("click", a.signIn));
  $<HTMLButtonElement>("#ld-install")?.addEventListener("click", a.install);
  paint();

  // ?demo=dealt / asked / terms sets the demo state for screenshots and reviews.
  const demo = new URLSearchParams(location.search).get("demo");
  if (demo) { deal(); if (demo === "asked" || demo === "terms") ask(); if (demo === "terms") ask(); return; }

  // A short scripted take on first load: it picks what you're on and points at Deal, but the stamp is yours.
  if (reduce) return;
  const timers: number[] = [];
  const cancel = () => { timers.forEach(clearTimeout); root.removeEventListener("pointerdown", cancel, true); root.removeEventListener("keydown", cancel, true); };
  root.addEventListener("pointerdown", cancel, true); root.addEventListener("keydown", cancel, true);
  const at = (ms: number, f: () => void) => timers.push(window.setTimeout(f, ms));
  at(900, () => pick(chips[1]));
  at(1700, () => speak("TikTok, right? Your move. Tap Deal."));
  at(1900, () => dealBtn.classList.add("ld-nudge"));
  at(4500, cancel);
}
