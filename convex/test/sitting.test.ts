// Spec 010: one ticket, one sitting. The server builds one focus block per deal, never restarts the last one,
// files `done` (dated when the block ended) for a deal that ran its full time, and takes borrowed minutes off the
// next deal's break.
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { makeMember, type TestConvex } from "./helpers.test-util";
import { newT } from "./setup.test-util";

const DAY = "2026-11-08";
const MIN = 60_000;
const deal = (focusMin = 30, activity: string | null = "Reels", breakMin = 10) => ({ activity, breakMin, task: "Reading", focusMin });

async function elapse(t: TestConvex, sessionId: Id<"sessions">, minutes: number) {
  await t.run(async (ctx) => {
    const s = (await ctx.db.get(sessionId))!;
    await ctx.db.patch(sessionId, { state: { ...s.state, startedAt: s.state.startedAt - minutes * MIN } });
  });
}
const getSession = (t: TestConvex, id: Id<"sessions">) => t.run((ctx) => ctx.db.get(id));
const rows = (t: TestConvex) => t.run((ctx) => ctx.db.query("ledger").take(100));

test("a deal is the break you chose, then one focus block", async () => {
  const t = newT();
  const { as } = await makeMember(t, "Ada");
  const { sessionId } = await as.mutation(api.sessions.start, { deal: deal(30) });
  expect((await getSession(t, sessionId))!.state.blocks.map((b) => `${b.type} ${b.min}`)).toEqual(["break 10", "focus 30"]);
});

test("next on the last block changes nothing: the clock never restarts it", async () => {
  const t = newT();
  const { as } = await makeMember(t, "Ada");
  const { sessionId } = await as.mutation(api.sessions.start, { deal: deal(30) });
  await elapse(t, sessionId, 10);
  await as.mutation(api.sessions.next, { sessionId, fromIdx: 0, dayKey: DAY });
  await elapse(t, sessionId, 30);
  const before = (await getSession(t, sessionId))!;
  await as.mutation(api.sessions.next, { sessionId, fromIdx: 1, dayKey: DAY });
  const after = (await getSession(t, sessionId))!;
  expect(after.state).toEqual(before.state);
  expect(after.status).toBe("running");
});

test("Done for now after the time is up files done, dated when the block ended", async () => {
  const t = newT();
  const { as } = await makeMember(t, "Ada");
  const { sessionId } = await as.mutation(api.sessions.start, { deal: deal(30, null) });
  await elapse(t, sessionId, 30 + 8 * 60); // the phone sat there overnight
  const endedAt = (await getSession(t, sessionId))!.state.startedAt + 30 * MIN;
  await as.mutation(api.sessions.end, { sessionId, dayKey: DAY });
  const done = (await rows(t)).filter((r) => r.kind === "done");
  expect(done).toHaveLength(1);
  expect(done[0]).toMatchObject({ at: endedAt, blockLabel: "Reading", minutes: 30, sessionId });
  expect((await rows(t)).some((r) => r.kind === "end_early")).toBe(false);
});

test("another round replaces the finished sitting: done, then the new deal, with borrowed minutes off its break", async () => {
  const t = newT();
  const { as } = await makeMember(t, "Ada");
  const first = await as.mutation(api.sessions.start, { deal: deal(8) });
  await t.run(async (ctx) => {
    const s = (await ctx.db.get(first.sessionId))!;
    await ctx.db.patch(first.sessionId, { state: { ...s.state, debt: 5, idx: 1, durMs: 8 * MIN, startedAt: Date.now() - 9 * MIN } });
  });
  const second = await as.mutation(api.sessions.start, { deal: deal(12, "Reels", 5), dayKey: DAY });
  const s2 = (await getSession(t, second.sessionId))!;
  expect(s2.state.blocks[0]).toMatchObject({ type: "break", label: "Reels", min: 2 });
  expect((await rows(t)).map((r) => [r.kind, r.minutes])).toEqual([["deal", 8], ["done", 8], ["forgiven", 2], ["deal", 12]]);
});

test("the 10 more minutes works on the last block, once", async () => {
  const t = newT();
  const { as } = await makeMember(t, "Ada");
  const { sessionId } = await as.mutation(api.sessions.start, { deal: deal(30, null) });
  await elapse(t, sessionId, 30);
  await as.mutation(api.sessions.bonus, { sessionId });
  await as.mutation(api.sessions.bonus, { sessionId });
  const s = (await getSession(t, sessionId))!;
  expect(s.state.blocks[0].min).toBe(40);
  expect((await rows(t)).filter((r) => r.kind === "bonus")).toHaveLength(1);
});
