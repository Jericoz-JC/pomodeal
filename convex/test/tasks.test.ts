import { ConvexError } from "convex/values";
import { describe, expect, test, vi } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { makeMember, type TestConvex } from "./helpers.test-util";
import { newT } from "./setup.test-util";

const DAY = "2026-11-08";
const MIN = 60_000;
// activity: null so block 0 is the first focus block, not the planned break
const deal = (task = "Paper", focusMin = 15) => ({ activity: null, breakMin: 5, task, focusMin });

async function codeOf(p: Promise<unknown>): Promise<string | undefined> {
  try {
    await p;
  } catch (e) {
    if (e instanceof ConvexError) return (e.data as { code?: string }).code;
    return "THREW";
  }
  return undefined;
}

/** Moves the running block's start back, as if `minutes` had passed. */
async function elapse(t: TestConvex, sessionId: Id<"sessions">, minutes: number) {
  await t.run(async (ctx) => {
    const s = (await ctx.db.get(sessionId))!;
    await ctx.db.patch(sessionId, { state: { ...s.state, startedAt: s.state.startedAt - minutes * MIN } });
  });
}

const getTask = (t: TestConvex, id: Id<"tasks">) => t.run((ctx) => ctx.db.get(id));
const getSession = (t: TestConvex, id: Id<"sessions">) => t.run((ctx) => ctx.db.get(id));
const allEvents = (t: TestConvex) => t.run((ctx) => ctx.db.query("events").take(100));

async function paper(t: TestConvex, name = "Ada") {
  const m = await makeMember(t, name);
  const r = await m.as.mutation(api.tasks.create, {
    title: "Paper", taskType: "writing", gutMin: 120, firstMove: "Open the doc and write one ugly sentence", deal: deal(), dayKey: DAY,
  });
  return { ...m, ...r };
}

describe("create", () => {
  test("namedAt logs the time to first payment, never negative; absent logs no ms", async () => {
    const t = newT();
    const m = await makeMember(t, "Ned");
    const args = { title: "Paper", firstMove: "", deal: deal(), dayKey: DAY };
    await m.as.mutation(api.tasks.create, { ...args, namedAt: Date.now() - 4000 });
    await m.as.mutation(api.tasks.create, { ...args, namedAt: Date.now() + 60_000 });
    await m.as.mutation(api.tasks.create, args);
    const fp = (await allEvents(t)).filter((e) => e.kind === "first_payment_started");
    const ms = fp.map((e) => e.ms);
    expect(ms.filter((x) => x === undefined)).toHaveLength(1);
    expect(ms.filter((x) => x === 0)).toHaveLength(1);
    expect(ms.find((x) => x !== undefined && x > 0)!).toBeGreaterThanOrEqual(4000);
  });

  test("starts an ordinary one-sitting deal linked to the new big one, and logs text-free events", async () => {
    const t = newT();
    const before = Date.now();
    const { as, taskId, sessionId, serverNow } = await paper(t);
    expect(serverNow).toBeGreaterThanOrEqual(before);

    const s = await as.query(api.sessions.current, {});
    expect(s?._id).toBe(sessionId);
    expect(s?.status).toBe("running");
    expect(s?.taskId).toBe(taskId);
    expect(s!.state.blocks.filter((b) => b.type === "focus").map((b) => b.min)).toEqual([15]);

    const task = await getTask(t, taskId);
    expect(task).toMatchObject({ title: "Paper", taskType: "writing", gutMin: 120, openTermsMin: 120, workedMin: 0, status: "open", workedDays: [] });

    const events = await allEvents(t);
    expect(events.map((e) => e.kind).sort()).toEqual(["big_one_named", "first_payment_started"]);
    for (const e of events) {
      expect(e.taskId).toBe(taskId);
      for (const k of Object.keys(e)) expect(["_id", "_creationTime", "userId", "kind", "taskId", "ms", "at"]).toContain(k);
    }
  });

  test("rejects a bad big one or a bad deal", async () => {
    const t = newT();
    const { as } = await makeMember(t, "Ada");
    const base = { title: "Paper", firstMove: "", deal: deal(), dayKey: DAY };
    expect(await codeOf(as.mutation(api.tasks.create, { ...base, title: "  " }))).toBe("BAD_BIG_ONE");
    expect(await codeOf(as.mutation(api.tasks.create, { ...base, gutMin: 90 }))).toBe("BAD_BIG_ONE");
    expect(await codeOf(as.mutation(api.tasks.create, { ...base, deal: deal("Paper", 17) }))).toBe("BAD_DEAL");
    expect(await codeOf(as.mutation(api.tasks.create, { ...base, dayKey: "11/08/2026" }))).toBe("BAD_DAY");
    expect(await t.run((ctx) => ctx.db.query("tasks").take(10))).toEqual([]);
  });

  test("no gut size keeps open terms null", async () => {
    const t = newT();
    const { as } = await makeMember(t, "Ada");
    const { taskId } = await as.mutation(api.tasks.create, { title: "Paper", firstMove: "", deal: deal(), dayKey: DAY });
    expect((await getTask(t, taskId))?.openTermsMin).toBeNull();
  });
});

describe("credited minutes", () => {
  test("a finished 15 min sitting credits 15 and the day when it stops, once", async () => {
    const t = newT();
    const { as, taskId, sessionId } = await paper(t);
    await elapse(t, sessionId, 15);
    // spec 010: the last block has no next, so nothing is credited until the deal stops
    await as.mutation(api.sessions.next, { sessionId, fromIdx: 0, dayKey: DAY });
    expect((await getTask(t, taskId))?.workedMin).toBe(0);
    await as.mutation(api.sessions.end, { sessionId, dayKey: DAY });
    const task = await getTask(t, taskId);
    expect(task).toMatchObject({ workedMin: 15, openTermsMin: 105, workedDays: [DAY], lastFocusMin: 15 });
    expect(task?.lastWorkedAt).toBeTypeOf("number");
    // a second device stopping the same deal does not credit twice
    await expect(as.mutation(api.sessions.end, { sessionId, dayKey: DAY })).rejects.toThrow();
    expect((await getTask(t, taskId))?.workedMin).toBe(15);
  });

  test("leaving a break credits nothing", async () => {
    const t = newT();
    const { as } = await makeMember(t, "Ada");
    const { taskId, sessionId } = await as.mutation(api.tasks.create, { title: "Paper", firstMove: "", deal: { ...deal(), activity: "Reels" }, dayKey: DAY });
    await elapse(t, sessionId, 5);
    await as.mutation(api.sessions.next, { sessionId, fromIdx: 0, dayKey: DAY });
    expect((await getTask(t, taskId))?.workedMin).toBe(0);
  });

  test("end 6 min into a focus block credits 6", async () => {
    const t = newT();
    const { as, taskId, sessionId } = await paper(t);
    await elapse(t, sessionId, 6);
    await as.mutation(api.sessions.end, { sessionId, dayKey: DAY });
    expect(await getTask(t, taskId)).toMatchObject({ workedMin: 6, openTermsMin: 114, workedDays: [DAY] });
  });

  test("starting an unrelated Quick Deal credits the partial minutes to the big one", async () => {
    const t = newT();
    const { as, taskId, sessionId } = await paper(t);
    await elapse(t, sessionId, 7);
    const r = await as.mutation(api.sessions.start, { deal: deal("Reading"), dayKey: DAY });
    expect(r.sessionId).not.toBe(sessionId);
    expect(r.serverNow).toBeTypeOf("number");
    expect((await getSession(t, sessionId))?.status).toBe("ended");
    expect(await getTask(t, taskId)).toMatchObject({ workedMin: 7, workedDays: [DAY] });
    const s = await as.query(api.sessions.current, {});
    expect(s?._id).toBe(r.sessionId);
    expect(s?.taskId).toBeUndefined();
  });

  test("an old client without a day key still credits minutes, without a worked day", async () => {
    const t = newT();
    const { as, taskId, sessionId } = await paper(t);
    await elapse(t, sessionId, 15);
    await as.mutation(api.sessions.end, { sessionId });
    expect(await getTask(t, taskId)).toMatchObject({ workedMin: 15, workedDays: [] });
  });
});

describe("blockNotes", () => {
  test("is idempotent per (sessionId, fromIdx): the second call changes nothing", async () => {
    const t = newT();
    const { as, taskId, sessionId } = await paper(t);
    await elapse(t, sessionId, 15);
    // the done sheet sends the notes while the finished deal is still running
    await as.mutation(api.tasks.blockNotes, { sessionId, fromIdx: 0, bookmark: "  claim ", done: false, dayKey: DAY });
    await as.mutation(api.tasks.blockNotes, { sessionId, fromIdx: 0, done: false, dayKey: DAY });
    await as.mutation(api.tasks.blockNotes, { sessionId, fromIdx: 0, bookmark: "other", done: true, dayKey: DAY });
    await as.mutation(api.sessions.end, { sessionId, dayKey: DAY });
    expect(await getTask(t, taskId)).toMatchObject({ bookmark: "claim", workedMin: 15, status: "open" });
    expect((await allEvents(t)).filter((e) => e.kind === "bookmark_written")).toHaveLength(1);
  });

  test("a skipped bookmark keeps the old one; an empty one writes no event", async () => {
    const t = newT();
    const { as, taskId, sessionId } = await paper(t);
    await as.mutation(api.tasks.blockNotes, { sessionId, fromIdx: 0, bookmark: "claim", done: false, dayKey: DAY });
    // the next sitting on the same big one
    const next = await as.mutation(api.tasks.startFromCard, { taskId, deal: deal(), dayKey: DAY });
    await as.mutation(api.tasks.blockNotes, { sessionId: next.sessionId, fromIdx: 0, bookmark: "   ", done: false, dayKey: DAY });
    expect((await getTask(t, taskId))?.bookmark).toBe("claim");
    expect((await allEvents(t)).filter((e) => e.kind === "bookmark_written")).toHaveLength(1);
  });

  test("done stamps the first unstamped piece, or marks a big one without pieces done", async () => {
    const t = newT();
    const { as, taskId, sessionId } = await paper(t);
    await as.mutation(api.tasks.saveSplit, { taskId, pieces: [{ title: "Intro", minutes: 30 }, { title: "Body", minutes: 60 }] });
    await as.mutation(api.tasks.blockNotes, { sessionId, fromIdx: 0, done: true, dayKey: DAY });
    const task = await getTask(t, taskId);
    expect(task?.pieces?.[0].stampedAt).toBeTypeOf("number");
    expect(task?.pieces?.[1].stampedAt).toBeUndefined();
    expect(task?.status).toBe("open");

    const other = await as.mutation(api.tasks.create, { title: "Lab", firstMove: "", deal: deal("Lab"), dayKey: DAY });
    await as.mutation(api.tasks.blockNotes, { sessionId: other.sessionId, fromIdx: 0, done: true, dayKey: DAY });
    expect((await getTask(t, other.taskId))?.status).toBe("done");
  });

  test("rejects a bookmark over 140 characters and a block that is not focus", async () => {
    const t = newT();
    const { as, sessionId } = await paper(t);
    expect(await codeOf(as.mutation(api.tasks.blockNotes, { sessionId, fromIdx: 0, bookmark: "b".repeat(141), done: false, dayKey: DAY }))).toBe("BAD_BIG_ONE");
    expect(await codeOf(as.mutation(api.tasks.blockNotes, { sessionId, fromIdx: 1, done: false, dayKey: DAY }))).toBeDefined();
  });
});

describe("ownership", () => {
  test("a second member can't touch the first member's big one", async () => {
    const t = newT();
    const { taskId, sessionId } = await paper(t, "Ada");
    const { as: bo } = await makeMember(t, "Bo");
    expect(await codeOf(bo.mutation(api.tasks.blockNotes, { sessionId, fromIdx: 0, bookmark: "mine", done: true, dayKey: DAY }))).toBeDefined();
    expect(await codeOf(bo.mutation(api.tasks.saveSplit, { taskId, pieces: [{ title: "x", minutes: 30 }] }))).toBeDefined();
    expect(await codeOf(bo.mutation(api.tasks.remove, { taskId }))).toBeDefined();
    expect(await codeOf(bo.mutation(api.tasks.startFromCard, { taskId, deal: deal(), dayKey: DAY }))).toBeDefined();
    expect(await codeOf(bo.mutation(api.sessions.start, { deal: deal(), taskId, dayKey: DAY }))).toBeDefined();
    expect(await codeOf(bo.query(api.tasks.history, { taskId }))).toBeDefined();
    expect(await bo.query(api.tasks.open, {})).toEqual([]);
    const task = await getTask(t, taskId);
    expect(task).toMatchObject({ status: "open", workedMin: 0 });
    expect(task?.bookmark).toBeUndefined();
    expect(task?.pieces).toBeUndefined();
  });
});

describe("split, spread and the card menu", () => {
  test("saveSplit with 13 pieces throws BAD_BIG_ONE", async () => {
    const t = newT();
    const { as, taskId } = await paper(t);
    const pieces = Array.from({ length: 13 }, (_, i) => ({ title: `p${i}`, minutes: 30 }));
    expect(await codeOf(as.mutation(api.tasks.saveSplit, { taskId, pieces }))).toBe("BAD_BIG_ONE");
    expect(await codeOf(as.mutation(api.tasks.saveSplit, { taskId, pieces: [{ title: " ", minutes: 30 }] }))).toBe("BAD_BIG_ONE");
  });

  test("saveSplit keeps the gut size and logs split_saved; signSpread plans pieces and logs spread_signed", async () => {
    const t = newT();
    const { as, taskId } = await paper(t);
    await as.mutation(api.tasks.saveSplit, { taskId, pieces: [{ title: " Intro ", minutes: 30 }, { title: "Body", minutes: 90 }, { title: "End", minutes: 100 }] });
    let task = await getTask(t, taskId);
    expect(task?.gutMin).toBe(120);
    expect(task?.pieces?.map((p) => p.title)).toEqual(["Intro", "Body", "End"]);

    await as.mutation(api.tasks.signSpread, {
      taskId, dueDay: "2026-11-10",
      plan: [{ day: "2026-11-08", pieceIndex: 0, minutes: 30 }, { day: "2026-11-09", pieceIndex: 1, minutes: 90 }],
    });
    task = await getTask(t, taskId);
    expect(task?.dueDay).toBe("2026-11-10");
    expect(task?.spreadSignedAt).toBeTypeOf("number");
    expect(task?.pieces?.map((p) => p.plannedDay)).toEqual(["2026-11-08", "2026-11-09", undefined]);

    expect(await codeOf(as.mutation(api.tasks.signSpread, { taskId, dueDay: "2026-11-10", plan: [{ day: "2026-11-11", minutes: 30 }] }))).toBe("BAD_SPREAD");
    expect(await codeOf(as.mutation(api.tasks.signSpread, { taskId, dueDay: "2026-11-10", plan: [{ day: "2026-11-09", pieceIndex: 3, minutes: 30 }] }))).toBe("BAD_SPREAD");

    const kinds = (await allEvents(t)).map((e) => e.kind);
    expect(kinds.filter((k) => k === "split_saved")).toHaveLength(1);
    expect(kinds.filter((k) => k === "spread_signed")).toHaveLength(1);
  });

  test("startFresh clears open terms, bookmark and spread; pieces and their stamps stay", async () => {
    const t = newT();
    const { as, taskId, sessionId } = await paper(t);
    await as.mutation(api.tasks.saveSplit, { taskId, pieces: [{ title: "Intro", minutes: 30 }, { title: "Body", minutes: 60 }] });
    await as.mutation(api.tasks.blockNotes, { sessionId, fromIdx: 0, bookmark: "claim", done: true, dayKey: DAY });
    await as.mutation(api.tasks.signSpread, { taskId, dueDay: "2026-11-10", plan: [{ day: "2026-11-09", pieceIndex: 1, minutes: 60 }] });
    await as.mutation(api.tasks.startFresh, { taskId });
    const task = await getTask(t, taskId);
    expect(task?.openTermsMin).toBeNull();
    expect(task?.bookmark).toBeUndefined();
    expect(task?.spreadSignedAt).toBeUndefined();
    expect(task?.dueDay).toBeUndefined();
    expect(task?.pieces?.map((p) => p.plannedDay)).toEqual([undefined, undefined]);
    expect(task?.pieces?.[0].stampedAt).toBeTypeOf("number");
    expect(task?.pieces?.[1].stampedAt).toBeUndefined();
    // later minutes don't bring a number back
    await elapse(t, sessionId, 15);
    await as.mutation(api.sessions.end, { sessionId, dayKey: DAY });
    expect(await getTask(t, taskId)).toMatchObject({ openTermsMin: null, workedMin: 15 });
  });

  test("setAside moves a big one out of open; reopen brings it back; all lists both", async () => {
    const t = newT();
    const { as, taskId } = await paper(t);
    await as.mutation(api.tasks.setAside, { taskId });
    expect(await as.query(api.tasks.open, {})).toEqual([]);
    expect((await as.query(api.tasks.all, {})).map((x) => x._id)).toEqual([taskId]);
    await as.mutation(api.tasks.reopen, { taskId });
    expect((await as.query(api.tasks.open, {})).map((x) => x._id)).toEqual([taskId]);
  });

  test("remove deletes the big one and unlinks a running session, which keeps running", async () => {
    const t = newT();
    const { as, taskId, sessionId } = await paper(t);
    await as.mutation(api.tasks.remove, { taskId });
    expect(await getTask(t, taskId)).toBeNull();
    expect((await getSession(t, sessionId))?.taskId).toBeUndefined();
    const s = await as.query(api.sessions.current, {});
    expect(s?._id).toBe(sessionId);
    expect(s?.status).toBe("running");
    // minutes on an unlinked session credit nothing and don't throw
    await elapse(t, sessionId, 15);
    await as.mutation(api.sessions.next, { sessionId, fromIdx: 0, dayKey: DAY });
    await as.mutation(api.tasks.blockNotes, { sessionId, fromIdx: 0, bookmark: "x", done: true, dayKey: DAY });
  });
});

describe("cards and history", () => {
  test("open lists most recently worked first; startFromCard links a new session; history lists its sessions", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      const t = newT();
      const tick = () => vi.setSystemTime(Date.now() + MIN);
      const { as, taskId: paperId, sessionId } = await paper(t);
      tick();
      await elapse(t, sessionId, 15);
      await as.mutation(api.sessions.next, { sessionId, fromIdx: 0, dayKey: DAY });
      tick();
      // naming Lab counts as touching it, so it leads until Paper is worked again
      const lab = await as.mutation(api.tasks.create, { title: "Lab", firstMove: "", deal: deal("Lab"), dayKey: DAY });
      expect((await as.query(api.tasks.open, {})).map((x) => x._id)).toEqual([lab.taskId, paperId]);

      tick();
      const r = await as.mutation(api.tasks.startFromCard, { taskId: paperId, deal: deal("Paper", 30), dayKey: "2026-11-09" });
      expect(r.serverNow).toBe(Date.now());
      expect((await as.query(api.sessions.current, {}))?.taskId).toBe(paperId);
      expect((await getTask(t, paperId))?.lastFocusMin).toBe(30);
      tick();
      await elapse(t, r.sessionId, 10); // 11 min in, with the tick
      await as.mutation(api.sessions.end, { sessionId: r.sessionId, dayKey: "2026-11-09" });
      expect((await as.query(api.tasks.open, {})).map((x) => x._id)).toEqual([paperId, lab.taskId]);
      expect(await getTask(t, paperId)).toMatchObject({ workedMin: 15 + 11, workedDays: ["2026-11-09", DAY] });

      const hist = await as.query(api.tasks.history, { taskId: paperId });
      expect(hist.map((s) => s._id)).toEqual([r.sessionId, sessionId]);
    } finally {
      vi.useRealTimers();
    }
  });

  test("startFromCard on a set-aside big one opens it again", async () => {
    const t = newT();
    const { as, taskId } = await paper(t);
    await as.mutation(api.tasks.setAside, { taskId });
    await as.mutation(api.tasks.startFromCard, { taskId, deal: deal(), dayKey: DAY });
    expect((await getTask(t, taskId))?.status).toBe("open");
  });
});

describe("ADR 0005: last repayment pick", () => {
  test("borrow and trade are remembered, override is not, and current carries it", async () => {
    const t = newT();
    const { as, userId } = await makeMember(t, "Ada");
    // a break first: asks are made on it, and the trade goes into the focus block after
    const { sessionId } = await as.mutation(api.sessions.start, { deal: { ...deal("Reading"), activity: "Reels" } });
    const lastRepay = () => t.run(async (ctx) => (await ctx.db.get(userId))?.lastRepay ?? "none");

    expect((await as.query(api.sessions.current, {}))?.lastRepay).toBeNull();
    await as.mutation(api.sessions.ask, { sessionId, pick: 0 }); // freebie
    expect(await lastRepay()).toBe("none");
    await as.mutation(api.sessions.ask, { sessionId, pick: 0 }); // borrow
    expect(await lastRepay()).toBe("borrow");
    await as.mutation(api.sessions.ask, { sessionId, pick: 1, intention: "finish the page" }); // trade
    expect(await lastRepay()).toBe("trade");
    await as.mutation(api.sessions.ask, { sessionId, pick: "override" });
    expect(await lastRepay()).toBe("trade");
    expect((await as.query(api.sessions.current, {}))?.lastRepay).toBe("trade");
  });
});

describe("client events", () => {
  test("logClient accepts the client-only kinds and rejects others", async () => {
    const t = newT();
    const { as, taskId } = await paper(t);
    await as.mutation(api.events.logClient, { kind: "comeback_shown", taskId });
    await as.mutation(api.events.logClient, { kind: "push_enabled" });
    // @ts-expect-error not a client kind
    expect(await codeOf(as.mutation(api.events.logClient, { kind: "big_one_named" }))).toBeDefined();
    // @ts-expect-error not a kind at all
    expect(await codeOf(as.mutation(api.events.logClient, { kind: "anything" }))).toBeDefined();
    const kinds = (await allEvents(t)).map((e) => e.kind);
    expect(kinds.filter((k) => k === "comeback_shown" || k === "push_enabled")).toHaveLength(2);
    expect(kinds.filter((k) => k === "big_one_named")).toHaveLength(1);
  });

  test("logClient refuses another member's big one", async () => {
    const t = newT();
    const { taskId } = await paper(t, "Ada");
    const { as: bo } = await makeMember(t, "Bo");
    expect(await codeOf(bo.mutation(api.events.logClient, { kind: "comeback_started", taskId }))).toBeDefined();
  });
});
