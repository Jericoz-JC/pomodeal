// Spec 008 "Push": scheduled block-boundary pushes with a version check, and push subscriptions.
// No real network calls: the Node send action is only ever scheduled here, never run.
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { isGoneStatus } from "../lib/pushSchedule";
import { makeMember, type TestConvex } from "./helpers.test-util";
import { newT } from "./setup.test-util";

// Fake timers: scheduled functions run only when a test moves the clock, so no send ever runs in the background.
beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

const deal = { activity: null, breakMin: 5, task: "read chapter 3", focusMin: 15 };
const sub = (n = 1) => ({ endpoint: `https://push.example.com/send/${n}`, p256dh: "BPkey", auth: "authkey" });

/** Scheduled jobs by function name ("push:fire", "pushNode:send") and state. */
async function jobs(t: TestConvex, name: string, kind = "pending") {
  const all = await t.run((ctx) => ctx.db.system.query("_scheduled_functions").collect());
  return all.filter((j) => j.name.replace(/\.js$/, "").endsWith(name) && j.state.kind === kind);
}

test("after start then ask there is exactly one pending heads-up and one block-end fire", async () => {
  const t = newT();
  const { as } = await makeMember(t, "Ada");
  const { sessionId } = await as.mutation(api.sessions.start, { deal });
  const first = await t.run((ctx) => ctx.db.get(sessionId));
  expect(first!.state.scheduledIds).toHaveLength(2);

  await as.mutation(api.sessions.ask, { sessionId, pick: "override" });
  const fires = await jobs(t, "push:fire");
  expect(fires.map((j) => j.args[0].kind).sort()).toEqual(["blockEnd", "headsUp"]);
  expect(fires.every((j) => j.args[0].sessionId === sessionId && j.args[0].version === 2)).toBe(true);

  // the first start's ids were cancelled and are gone from the session
  const s = await t.run((ctx) => ctx.db.get(sessionId));
  expect(s!.state.scheduledIds!.sort()).toEqual(fires.map((j) => j._id).sort());
  for (const id of first!.state.scheduledIds!) expect(s!.state.scheduledIds).not.toContain(id);
  expect(await jobs(t, "push:fire", "canceled")).toHaveLength(2);
});

test("the fires land at the heads-up and the block end", async () => {
  const t = newT();
  const { as } = await makeMember(t, "Ada");
  const { sessionId } = await as.mutation(api.sessions.start, { deal });
  const s = await t.run((ctx) => ctx.db.get(sessionId));
  const end = s!.state.startedAt + s!.state.durMs;
  const at = Object.fromEntries((await jobs(t, "push:fire")).map((j) => [j.args[0].kind, j.scheduledTime]));
  expect(at.headsUp).toBeCloseTo(end - 2 * 60_000, -3);
  expect(at.blockEnd).toBeCloseTo(end, -3);
});

test("end cancels the pushes and schedules none", async () => {
  const t = newT();
  const { as } = await makeMember(t, "Ada");
  const { sessionId } = await as.mutation(api.sessions.start, { deal });
  await as.mutation(api.sessions.end, { sessionId });
  expect(await jobs(t, "push:fire")).toHaveLength(0);
  const s = await t.run((ctx) => ctx.db.get(sessionId));
  expect(s!.state.scheduledIds).toEqual([]);
});

test("starting a new deal cancels the ended session's pushes", async () => {
  const t = newT();
  const { as } = await makeMember(t, "Ada");
  const a = await as.mutation(api.sessions.start, { deal });
  const b = await as.mutation(api.sessions.start, { deal });
  const fires = await jobs(t, "push:fire");
  expect(fires).toHaveLength(2);
  expect(fires.every((j) => j.args[0].sessionId === b.sessionId)).toBe(true);
  expect((await t.run((ctx) => ctx.db.get(a.sessionId)))!.state.scheduledIds).toEqual([]);
});

test("a big one started from a card schedules its pushes too", async () => {
  const t = newT();
  const { as } = await makeMember(t, "Ada");
  await as.mutation(api.tasks.create, { title: "Paper", firstMove: "Open the doc", deal, dayKey: "2026-11-08" });
  expect(await jobs(t, "push:fire")).toHaveLength(2);
});

test("next reschedules for the new block", async () => {
  const t = newT();
  const { as } = await makeMember(t, "Ada");
  const { sessionId } = await as.mutation(api.sessions.start, { deal });
  await as.mutation(api.sessions.next, { sessionId, fromIdx: 0 });
  const fires = await jobs(t, "push:fire");
  expect(fires).toHaveLength(2);
  expect(fires.every((j) => j.args[0].version === 2)).toBe(true);
});

test("next on the last block leaves no pending fire", async () => {
  const t = newT();
  const { as } = await makeMember(t, "Ada");
  const { sessionId } = await as.mutation(api.sessions.start, { deal });
  const s0 = await t.run((ctx) => ctx.db.get(sessionId));
  const last = s0!.state.blocks.length - 1;
  for (let i = 0; i < last; i++) await as.mutation(api.sessions.next, { sessionId, fromIdx: i });
  expect(await jobs(t, "push:fire")).toHaveLength(2); // the last block's own heads-up and end
  await as.mutation(api.sessions.next, { sessionId, fromIdx: last });
  expect(await jobs(t, "push:fire")).toHaveLength(0);
  const s = await t.run((ctx) => ctx.db.get(sessionId));
  expect(s!.state.scheduledIds).toEqual([]);
});

test("a fire with an old version schedules no send (spec test 11)", async () => {
  const t = newT();
  const { as } = await makeMember(t, "Ada");
  await as.mutation(api.push.subscribe, sub());
  const { sessionId } = await as.mutation(api.sessions.start, { deal });
  await as.mutation(api.sessions.ask, { sessionId, pick: "override" }); // version 2
  await t.mutation(internal.push.fire, { sessionId, version: 1, kind: "blockEnd" });
  expect(await jobs(t, "pushNode:send")).toHaveLength(0);
});

test("a fire for an ended session schedules no send", async () => {
  const t = newT();
  const { as } = await makeMember(t, "Ada");
  await as.mutation(api.push.subscribe, sub());
  const { sessionId } = await as.mutation(api.sessions.start, { deal });
  await as.mutation(api.sessions.end, { sessionId });
  const s = await t.run((ctx) => ctx.db.get(sessionId));
  await t.mutation(internal.push.fire, { sessionId, version: s!.state.version!, kind: "blockEnd" });
  expect(await jobs(t, "pushNode:send")).toHaveLength(0);
});

test("a current fire schedules one send per subscription, with the block's words", async () => {
  const t = newT();
  const { as } = await makeMember(t, "Ada");
  await as.mutation(api.push.subscribe, sub(1));
  await as.mutation(api.push.subscribe, sub(2));
  const { sessionId } = await as.mutation(api.sessions.start, { deal });
  await t.mutation(internal.push.fire, { sessionId, version: 1, kind: "headsUp" });
  const sends = await jobs(t, "pushNode:send");
  expect(sends).toHaveLength(2);
  expect(sends[0].args[0].payload).toEqual({
    web_push: 8030,
    notification: { title: "Pomodeal", body: "2 min to wrap up read chapter 3.", navigate: "/" },
  });
});

test("at the heads-up the scheduled fire runs and schedules a send", async () => {
  const t = newT();
  const { as } = await makeMember(t, "Ada");
  await as.mutation(api.push.subscribe, sub());
  await as.mutation(api.sessions.start, { deal });
  vi.advanceTimersByTime(13 * 60_000 + 1000); // a 15 min block's 2 min heads-up
  await t.finishInProgressScheduledFunctions();
  expect(await jobs(t, "push:fire", "success")).toHaveLength(1);
  const sends = await jobs(t, "pushNode:send");
  expect(sends).toHaveLength(1);
  expect(sends[0].args[0].payload.notification.body).toBe("2 min to wrap up read chapter 3.");
});

test("subscribe twice with the same endpoint keeps one row", async () => {
  const t = newT();
  const { as } = await makeMember(t, "Ada");
  await as.mutation(api.push.subscribe, sub());
  await as.mutation(api.push.subscribe, { ...sub(), auth: "newauth" });
  const rows = await t.run((ctx) => ctx.db.query("pushSubscriptions").collect());
  expect(rows).toHaveLength(1);
  expect(rows[0].auth).toBe("newauth");
});

test("an endpoint owned by someone else moves to the caller", async () => {
  const t = newT();
  const ada = await makeMember(t, "Ada");
  const bo = await makeMember(t, "Bo");
  await ada.as.mutation(api.push.subscribe, sub());
  await bo.as.mutation(api.push.subscribe, sub());
  const rows = await t.run((ctx) => ctx.db.query("pushSubscriptions").collect());
  expect(rows).toHaveLength(1);
  expect(rows[0].userId).toBe(bo.userId);
});

test("subscribe needs a member and an https endpoint", async () => {
  const t = newT();
  await expect(t.mutation(api.push.subscribe, sub())).rejects.toThrow();
  const { as } = await makeMember(t, "Ada");
  await expect(as.mutation(api.push.subscribe, { ...sub(), endpoint: "http://push.example.com/x" })).rejects.toThrow();
});

test("unsubscribe deletes only the caller's own row", async () => {
  const t = newT();
  const ada = await makeMember(t, "Ada");
  const bo = await makeMember(t, "Bo");
  await ada.as.mutation(api.push.subscribe, sub());
  await bo.as.mutation(api.push.unsubscribe, { endpoint: sub().endpoint });
  expect(await t.run((ctx) => ctx.db.query("pushSubscriptions").collect())).toHaveLength(1);
  await ada.as.mutation(api.push.unsubscribe, { endpoint: sub().endpoint });
  expect(await t.run((ctx) => ctx.db.query("pushSubscriptions").collect())).toHaveLength(0);
});

async function oneSub(t: TestConvex): Promise<{ subscriptionId: Id<"pushSubscriptions">; userId: Id<"users"> }> {
  const { as, userId } = await makeMember(t, "Ada");
  await as.mutation(api.push.subscribe, sub());
  const row = await t.run((ctx) => ctx.db.query("pushSubscriptions").first());
  return { subscriptionId: row!._id, userId };
}

const kinds = (t: TestConvex) => t.run(async (ctx) => (await ctx.db.query("events").collect()).map((e) => e.kind));

test("recordResult gone deletes the subscription and logs one push_failed", async () => {
  const t = newT();
  const { subscriptionId } = await oneSub(t);
  await t.mutation(internal.push.recordResult, { subscriptionId, ok: false, gone: true });
  expect(await t.run((ctx) => ctx.db.get(subscriptionId))).toBeNull();
  expect(await kinds(t)).toEqual(["push_failed"]);
});

test("recordResult failure keeps the subscription and logs one push_failed", async () => {
  const t = newT();
  const { subscriptionId } = await oneSub(t);
  await t.mutation(internal.push.recordResult, { subscriptionId, ok: false, gone: false });
  expect(await t.run((ctx) => ctx.db.get(subscriptionId))).not.toBeNull();
  expect(await kinds(t)).toEqual(["push_failed"]);
});

test("recordResult ok logs push_sent and stamps the last success", async () => {
  const t = newT();
  const { subscriptionId } = await oneSub(t);
  await t.mutation(internal.push.recordResult, { subscriptionId, ok: true, gone: false });
  expect((await t.run((ctx) => ctx.db.get(subscriptionId)))!.lastSuccessAt).toBeTypeOf("number");
  expect(await kinds(t)).toEqual(["push_sent"]);
});

test("404 and 410 from the push service mean the subscription is gone", () => {
  expect(isGoneStatus(404)).toBe(true);
  expect(isGoneStatus(410)).toBe(true);
  expect(isGoneStatus(500)).toBe(false);
  expect(isGoneStatus(undefined)).toBe(false);
});
