// Every deal reaches the ledger (ADR 0006): starting one, stopping, ending a block early. Before this, the server
// wrote rows only for asks, the bonus and forgiven minutes, so a reload lost everything else on the tape.
import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { makeMember, type TestConvex } from "./helpers.test-util";
import { newT } from "./setup.test-util";

const DAY = "2026-11-08";
const MIN = 60_000;
const deal = (task = "Reading", focusMin = 15, activity: string | null = null) => ({ activity, breakMin: 10, task, focusMin });

/** Moves the running block's start back, as if `minutes` had passed. */
async function elapse(t: TestConvex, sessionId: Id<"sessions">, minutes: number) {
  await t.run(async (ctx) => {
    const s = (await ctx.db.get(sessionId))!;
    await ctx.db.patch(sessionId, { state: { ...s.state, startedAt: s.state.startedAt - minutes * MIN } });
  });
}
const rows = (t: TestConvex) => t.run((ctx) => ctx.db.query("ledger").take(100));
const kinds = async (t: TestConvex) => (await rows(t)).map((r) => r.kind);

describe("starting a deal", () => {
  test("a Quick Deal files one deal row with the task and the focus length", async () => {
    const t = newT();
    const { as, userId } = await makeMember(t, "Ada");
    const { sessionId } = await as.mutation(api.sessions.start, { deal: deal("Reading", 15, "Reels") });
    const all = await rows(t);
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ userId, sessionId, kind: "deal", blockLabel: "Reading", minutes: 15 });
    expect(all[0].taskId).toBeUndefined();
    const today = await as.query(api.sessions.today, { now: Date.now() });
    expect(today.map((r) => r.kind)).toEqual(["deal"]);
  });

  test("a new big one and its card both file a deal named by the big one, linked to it", async () => {
    const t = newT();
    const { as } = await makeMember(t, "Ada");
    const { taskId } = await as.mutation(api.tasks.create, { title: "History paper", firstMove: "Write one ugly sentence", deal: deal("History paper", 30), dayKey: DAY });
    await as.mutation(api.tasks.startFromCard, { taskId, deal: deal("History paper", 60), dayKey: DAY });
    const deals = (await rows(t)).filter((r) => r.kind === "deal");
    expect(deals.map((r) => [r.blockLabel, r.minutes, r.taskId])).toEqual([["History paper", 30, taskId], ["History paper", 60, taskId]]);
  });

  test("a deal that replaces a running one stops it first: end_early with its minutes, forgiven, then the new deal", async () => {
    const t = newT();
    const { as } = await makeMember(t, "Ada");
    const first = await as.mutation(api.sessions.start, { deal: deal("Reading", 15) });
    // borrowed minutes still owed when the session ends
    await t.run(async (ctx) => {
      const s = (await ctx.db.get(first.sessionId))!;
      await ctx.db.patch(first.sessionId, { state: { ...s.state, debt: 5 } });
    });
    await elapse(t, first.sessionId, 7);
    const second = await as.mutation(api.sessions.start, { deal: deal("Problems", 20) });
    const all = await rows(t);
    expect(all.map((r) => [r.kind, r.sessionId, r.blockLabel, r.minutes])).toEqual([
      ["deal", first.sessionId, "Reading", 15],
      ["end_early", first.sessionId, "Reading", 7],
      ["forgiven", first.sessionId, "Reading", 5],
      ["deal", second.sessionId, "Problems", 20],
    ]);
  });
});

describe("stopping", () => {
  test("end files end_early with the focus minutes done, once even when two devices both stop", async () => {
    const t = newT();
    const { as } = await makeMember(t, "Ada");
    const { sessionId } = await as.mutation(api.sessions.start, { deal: deal("Reading", 30) });
    await elapse(t, sessionId, 22);
    await as.mutation(api.sessions.end, { sessionId, dayKey: DAY });
    await expect(as.mutation(api.sessions.end, { sessionId, dayKey: DAY })).rejects.toThrow();
    const ends = (await rows(t)).filter((r) => r.kind === "end_early");
    expect(ends).toHaveLength(1);
    expect(ends[0]).toMatchObject({ sessionId, blockLabel: "Reading", minutes: 22 });
  });

  test("stopping partway through a big one says which big one and how much was done", async () => {
    const t = newT();
    const { as } = await makeMember(t, "Ada");
    const { taskId, sessionId } = await as.mutation(api.tasks.create, { title: "History paper", gutMin: 180, firstMove: "Outline", deal: deal("History paper", 60), dayKey: DAY });
    await elapse(t, sessionId, 41);
    await as.mutation(api.sessions.end, { sessionId, dayKey: DAY });
    const stop = (await rows(t)).find((r) => r.kind === "end_early");
    expect(stop).toMatchObject({ blockLabel: "History paper", minutes: 41, taskId });
    expect((await t.run((ctx) => ctx.db.get(taskId)))?.workedMin).toBe(41);
  });
});

describe("ending a block early", () => {
  test("next with early files one skip, even when two devices send it", async () => {
    const t = newT();
    const { as } = await makeMember(t, "Ada");
    const { sessionId } = await as.mutation(api.sessions.start, { deal: deal("Reading", 15, "Reels") });
    await elapse(t, sessionId, 4);
    await as.mutation(api.sessions.next, { sessionId, fromIdx: 0, dayKey: DAY, early: true });
    await as.mutation(api.sessions.next, { sessionId, fromIdx: 0, dayKey: DAY, early: true });
    const skips = (await rows(t)).filter((r) => r.kind === "skip");
    expect(skips).toHaveLength(1);
    expect(skips[0]).toMatchObject({ sessionId, blockLabel: "Reels", minutes: 4 });
  });

  test("a block that ends on time files nothing, nor does an early move that arrives after time is up", async () => {
    const t = newT();
    const { as } = await makeMember(t, "Ada");
    const { sessionId } = await as.mutation(api.sessions.start, { deal: deal("Reading", 15, "Reels") });
    await elapse(t, sessionId, 10);
    await as.mutation(api.sessions.next, { sessionId, fromIdx: 0, dayKey: DAY });
    await elapse(t, sessionId, 16);
    await as.mutation(api.sessions.next, { sessionId, fromIdx: 1, dayKey: DAY, early: true });
    expect(await kinds(t)).toEqual(["deal"]);
  });
});

describe("ownership", () => {
  test("another member can't stop or skip someone's session, files nothing, and sees none of their rows", async () => {
    const t = newT();
    const { as } = await makeMember(t, "Ada");
    const { as: bo } = await makeMember(t, "Bo");
    const { sessionId } = await as.mutation(api.sessions.start, { deal: deal() });
    await elapse(t, sessionId, 5);
    await expect(bo.mutation(api.sessions.end, { sessionId, dayKey: DAY })).rejects.toThrow();
    await expect(bo.mutation(api.sessions.next, { sessionId, fromIdx: 0, dayKey: DAY, early: true })).rejects.toThrow();
    expect(await kinds(t)).toEqual(["deal"]);
    expect(await bo.query(api.sessions.today, { now: Date.now() })).toEqual([]);
    expect((await as.query(api.sessions.current, {}))?.status).toBe("running");
  });

  test("deleting a big one unlinks its ledger rows, which stay as history", async () => {
    const t = newT();
    const { as } = await makeMember(t, "Ada");
    const { taskId, sessionId } = await as.mutation(api.tasks.create, { title: "History paper", firstMove: "Outline", deal: deal("History paper", 30), dayKey: DAY });
    await elapse(t, sessionId, 12);
    await as.mutation(api.sessions.end, { sessionId, dayKey: DAY });
    await as.mutation(api.tasks.remove, { taskId });
    const all = await rows(t);
    expect(all.map((r) => r.kind)).toEqual(["deal", "end_early"]);
    expect(all.every((r) => r.taskId === undefined)).toBe(true);
  });
});
