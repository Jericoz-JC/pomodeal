import type { AuthRecord, Block, BlockKind, LogEntry, Reply, StartBlockMsg } from "@/lib/protocol";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const rid = () => crypto.randomUUID().slice(0, 8);
const time = (t: number) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" });

let block: Block | undefined;

// Writes go through the worker. Reads come from storage change events, which keep
// working when the worker is asleep or has just restarted.
async function send<T extends object>(msg: object): Promise<Reply<T>> {
  return browser.runtime.sendMessage(msg);
}

$("start").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const submitter = (e as SubmitEvent).submitter as HTMLButtonElement;
  const [kind, seconds] = submitter.value.split(":") as [BlockKind, string];
  const data = new FormData(form);
  const msg: StartBlockMsg = { type: "block/start/v1", requestId: rid(), kind, seconds: Number(seconds), label: String(data.get("label")), next: String(data.get("next")) };
  submitter.disabled = true;
  const res = await send(msg).finally(() => (submitter.disabled = false));
  if (!res.ok) $("status").textContent = `The worker refused that (${res.code}).`;
});

$("end-now").addEventListener("click", async () => {
  const res = await send({ type: "block/end-now/v1", requestId: rid() });
  if (!res.ok && res.code === "no_block") $("status").textContent = "Nothing is running.";
});

// Host access is optional. permissions.request needs this click (a user gesture).
const ALL = { origins: ["<all_urls>"] };
async function renderPerm() {
  const has = await browser.permissions.contains(ALL);
  $("perm-status").textContent = has
    ? "The overlay can show on any normal web page."
    : "Without site access, the break end comes as a notification instead.";
  $("perm").hidden = has;
}
$("perm").addEventListener("click", async () => {
  await browser.permissions.request(ALL).catch(() => false);
  void renderPerm();
});
browser.permissions.onAdded.addListener(() => void renderPerm());
browser.permissions.onRemoved.addListener(() => void renderPerm());

function renderBlock() {
  const ring = $("ring");
  const clock = $("clock");
  const status = $("status");
  if (!block) {
    ring.dataset.kind = "none";
    clock.textContent = "--:--";
    status.textContent = "Nothing running.";
    return;
  }
  ring.dataset.kind = block.kind;
  const total = block.endsAt - block.startedAt;
  const left = Math.max(0, block.endsAt - Date.now()); // always derived from endsAt, never a ticking counter
  ring.style.setProperty("--p", block.status === "running" ? String(left / total) : "0");
  const s = Math.ceil(left / 1000);
  clock.textContent = block.status === "running" ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : "0:00";
  status.textContent =
    block.status === "running"
      ? `${block.kind === "break" ? `${block.label} break` : "Focus"} ends at ${time(block.endsAt)}.`
      : `Ended at ${time(block.endedAt!)} by ${block.endedVia === "alarm" ? "the alarm" : block.endedVia === "reconcile" ? "the worker on wake-up" : "you"}.`;
}

function renderLog(log: LogEntry[] = []) {
  const ol = $("log");
  ol.replaceChildren(
    ...log
      .slice()
      .reverse()
      .map((e) => {
        const li = document.createElement("li");
        const t = document.createElement("time");
        t.textContent = time(e.at);
        const b = document.createElement("b");
        b.textContent = e.what;
        const d = document.createElement("span");
        d.textContent = [e.detail, `worker ${e.boot}`].filter(Boolean).join(", ");
        li.append(t, b, d);
        return li;
      }),
  );
}

function renderLink(auth?: AuthRecord) {
  $("link").textContent = auth
    ? `Connected from ${new URL(auth.origin).host} at ${time(auth.at)}.`
    : "Not connected. Use Connect extension in the web app.";
}

browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.block) {
    block = changes.block.newValue as Block | undefined;
    renderBlock();
  }
  if (area === "local" && changes.log) renderLog(changes.log.newValue as LogEntry[]);
  if (area === "session" && changes.auth) renderLink(changes.auth.newValue as AuthRecord | undefined);
});

const local = (await browser.storage.local.get(["block", "log"])) as { block?: Block; log?: LogEntry[] };
block = local.block;
renderBlock();
renderLog(local.log);
renderLink(((await browser.storage.session.get("auth")) as { auth?: AuthRecord }).auth);
void renderPerm();
setInterval(renderBlock, 250); // render only
