import { expect, test } from "vitest";
import { api } from "../_generated/api";
import { makeMember } from "./helpers.test-util";
import { newT } from "./setup.test-util";

test("a member starts a 15 min deal and sees a running session with one 15 min focus block (spec 010)", async () => {
  const t = newT();
  const { as } = await makeMember(t, "Ada");
  await as.mutation(api.sessions.start, {
    deal: { activity: null, breakMin: 5, task: "read chapter 3", focusMin: 15 },
  });
  const s = await as.query(api.sessions.current, {});
  expect(s?.status).toBe("running");
  const focus = s!.state.blocks.filter((b) => b.type === "focus");
  expect(focus.map((b) => b.min)).toEqual([15]);
});

const deal = { activity: null, breakMin: 5, task: "read chapter 3", focusMin: 15 };

test("start returns the server's clock, within 5 s of now", async () => {
  const t = newT();
  const { as } = await makeMember(t, "Ada");
  const { serverNow } = await as.mutation(api.sessions.start, { deal });
  expect(Math.abs(serverNow - Date.now())).toBeLessThan(5000);
});

test("every session change bumps the version: start 1, ask 2, next 3", async () => {
  const t = newT();
  const { as } = await makeMember(t, "Ada");
  // a break first, so there is a next block to move to
  const { sessionId } = await as.mutation(api.sessions.start, { deal: { ...deal, activity: "Reels" } });
  expect((await as.query(api.sessions.current, {}))!.state.version).toBe(1);
  await as.mutation(api.sessions.ask, { sessionId, pick: "override" });
  expect((await as.query(api.sessions.current, {}))!.state.version).toBe(2);
  await as.mutation(api.sessions.next, { sessionId, fromIdx: 0 });
  expect((await as.query(api.sessions.current, {}))!.state.version).toBe(3);
  // a repeated next from the same block changes nothing
  await as.mutation(api.sessions.next, { sessionId, fromIdx: 0 });
  expect((await as.query(api.sessions.current, {}))!.state.version).toBe(3);
});

test("bonus and end bump the version too", async () => {
  const t = newT();
  const { as } = await makeMember(t, "Ada");
  const { sessionId } = await as.mutation(api.sessions.start, { deal });
  await as.mutation(api.sessions.bonus, { sessionId });
  expect((await as.query(api.sessions.current, {}))!.state.version).toBe(2);
  await as.mutation(api.sessions.end, { sessionId });
  const doc = await t.run((ctx) => ctx.db.get(sessionId));
  expect(doc!.status).toBe("ended");
  expect(doc!.state.version).toBe(3);
});

test("starting a new session bumps the one it ends", async () => {
  const t = newT();
  const { as } = await makeMember(t, "Ada");
  const first = await as.mutation(api.sessions.start, { deal });
  await as.mutation(api.sessions.start, { deal });
  const old = await t.run((ctx) => ctx.db.get(first.sessionId));
  expect(old!.state.version).toBe(2);
});

test("serverNow returns the server clock to a member and refuses a stranger", async () => {
  const t = newT();
  const { as } = await makeMember(t, "Ada");
  const now = await as.mutation(api.sessions.serverNow, {});
  expect(Math.abs(now - Date.now())).toBeLessThan(5000);
  await expect(t.mutation(api.sessions.serverNow, {})).rejects.toThrow();
});
