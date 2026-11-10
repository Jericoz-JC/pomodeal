import type { OverlayActionMsg, ShowOverlayMsg } from "@/lib/protocol";

// Injected on demand by the worker with scripting.executeScript, never declared in the manifest.
// matches stays empty on purpose: WXT copies a runtime script's matches into host_permissions,
// and host access must stay an optional permission.
export default defineContentScript({
  registration: "runtime",
  matches: [],
  noScriptStartedPostMessage: true,
  main() {
    // executeScript runs this again at every break end; the isolated world keeps the flag.
    const w = window as unknown as { __pomodealOverlay?: boolean };
    if (w.__pomodealOverlay) return;
    w.__pomodealOverlay = true;

    browser.runtime.onMessage.addListener((raw: unknown, sender) => {
      if (sender.id !== browser.runtime.id) return;
      const msg = raw as ShowOverlayMsg;
      if (msg?.type === "overlay/show/v1" && typeof msg.block?.id === "string") show(msg.block);
    });
  },
});

const CSS = `
.scrim {
  all: initial;
  position: fixed; inset: 0;
  display: grid; place-items: center;
  padding: 16px;
  background: rgba(22, 32, 27, .62);
  backdrop-filter: blur(3px) grayscale(.6);
  font: 400 16px/1.45 "Atkinson Hyperlegible", "Segoe UI", system-ui, sans-serif;
  color: #1B211D;
  --paper: #EDEFE9; --ink: #1B211D; --soft: #566058; --rule: #C9D0C8; --deal: #1E6A46; --on-deal: #fff;
}
@media (prefers-color-scheme: dark) {
  .scrim { --paper: #1D2521; --ink: #E6ECE7; --soft: #A3B0A7; --rule: #33413A; --deal: #6CCB97; --on-deal: #0F1A14; background: rgba(8, 12, 10, .72); }
}
.card {
  position: relative; box-sizing: border-box;
  width: min(420px, 100%);
  padding: 28px 24px 22px;
  background: var(--paper); color: var(--ink);
  border-radius: 6px 6px 18px 18px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, .35);
  animation: in .22s ease-out both;
}
h2 {
  margin: 0 40px 6px 0;
  font: 800 1.75rem/1.1 "Archivo", "Arial Narrow", "Segoe UI", sans-serif; font-stretch: 82%;
  letter-spacing: -.01em;
}
p { margin: 0 0 22px; color: var(--soft); }
.actions { display: grid; gap: 10px; }
button {
  all: unset; box-sizing: border-box; cursor: pointer;
  min-height: 48px; padding: 12px 16px; border-radius: 10px;
  text-align: center; font: 700 1rem/1.2 inherit; font-family: inherit;
  border: 1.5px solid var(--rule); color: var(--ink);
}
button.primary { background: var(--deal); border-color: var(--deal); color: var(--on-deal); }
button:focus-visible { outline: 3px solid var(--deal); outline-offset: 2px; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.close {
  position: absolute; top: 10px; right: 10px;
  min-height: 40px; min-width: 40px; padding: 0; border: 0;
  font-size: 1.5rem; line-height: 40px; color: var(--soft);
}
@keyframes in { from { opacity: 0; transform: translateY(6px); } }
@media (prefers-reduced-motion: reduce) { .card { animation: none; } }
`;

let current: { host: HTMLElement; restoreFocus: Element | null; onKey: (e: KeyboardEvent) => void } | null = null;

function show(block: ShowOverlayMsg["block"]) {
  remove();
  const host = document.createElement("pomodeal-overlay");
  // Inline !important beats any page stylesheet rule that targets the host element.
  host.setAttribute("style", "all: initial !important; position: fixed !important; inset: 0 !important; z-index: 2147483647 !important; display: block !important;");
  const root = host.attachShadow({ mode: "closed" });
  const style = document.createElement("style");
  style.textContent = CSS;

  const scrim = el("div", "scrim");
  const card = el("div", "card");
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-modal", "true");
  card.setAttribute("aria-labelledby", "pd-title");
  card.setAttribute("aria-describedby", "pd-body");

  const title = el("h2");
  title.id = "pd-title";
  title.textContent = `${block.label} time is up.`; // textContent only: labels are user text
  const body = el("p");
  body.id = "pd-body";
  body.textContent = `${block.next} is next.`;

  const start = button(`Start ${block.next.toLowerCase()}`, "primary", () => act(block.id, "start-next"));
  const more = button("Ask for 5 more", "", () => act(block.id, "ask-more"));
  const need = button("I need this", "", () => act(block.id, "need-this"));
  const close = button("×", "close", () => act(block.id, "close"));
  close.setAttribute("aria-label", "Close");

  const row = el("div", "row");
  row.append(more, need);
  const actions = el("div", "actions");
  actions.append(start, row);
  card.append(close, title, body, actions);
  scrim.append(card);
  root.append(style, scrim);

  // Esc always works. Capture phase so the page can't swallow it first.
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      act(block.id, "close");
    }
  };
  window.addEventListener("keydown", onKey, true);

  current = { host, restoreFocus: document.activeElement, onKey };
  document.documentElement.append(host);
  start.focus();
}

function act(blockId: string, action: OverlayActionMsg["action"]) {
  const msg: OverlayActionMsg = { type: "overlay/action/v1", requestId: crypto.randomUUID().slice(0, 8), blockId, action };
  void browser.runtime.sendMessage(msg).catch(() => {});
  remove();
}

function remove() {
  if (!current) return;
  window.removeEventListener("keydown", current.onKey, true);
  current.host.remove();
  const prev = current.restoreFocus;
  current = null;
  if (prev instanceof HTMLElement) prev.focus();
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = "") {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
}

function button(label: string, cls: string, onClick: () => void) {
  const b = el("button", cls);
  b.type = "button";
  b.textContent = label;
  b.addEventListener("click", onClick);
  return b;
}
