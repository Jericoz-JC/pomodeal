// Spec 012 "Building it for real": tonight's plan, one row per member per local day.
import { ConvexError } from "convex/values";
import { describe, expect, test } from "vitest";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { makeMember, type TestConvex } from "./helpers.test-util";
import { newT } from "./setup.test-util";

const DAY = "2026-11-11";
const deal = (task = "History paper", focusMin = 45) => ({ activity: null, breakMin: 5, task, focusMin });
const history = { title: "History paper", sittings: 2, minutes: 45 };
const orgo = { title: "Orgo problem set 4", sittings: 1, minutes: 20 };

async function codeOf(p: Promise<unknown>): Promise<string | undefined> {
  try {
    await p;
  } catch (e) {
    if (e instanceof ConvexError) return (e.data as { code?: string }).code;
    return "THREW";
  }
  return undefined;
}

type Member = Awaited<ReturnType<typeof makeMember>>;

async function bigOne(m: Member, title = "BIO 180 midterm"): Promise<Id<"tasks">> {
  const r = await m.as.mutation(api.tasks.create, { title, firstMove: "", deal: deal(title, 30), dayKey: DAY });
  return r.taskId;
}

const tonight = (m: Member, dayKey = DAY) => m.as.query(api.nights.tonight, { dayKey });
const allNights = (t: TestConvex) => t.run((ctx) => ctx.db.query("nights").take(20));

describe("print and tonight", () => {
  test("prints tonight, reads it back, and logs only the item count", async () => {
    const t = newT();
    const m = await makeMember(t, "Ada");
    expect(await tonight(m)).toBeNull();
    await m.as.mutation(api.nights.print, { dayKey: DAY, items: [history, orgo] });
    expect(await tonight(m)).toMatchObject({ dayKey: DAY, items: [history, orgo], taken: 0 });
    const events = await t.run((ctx) => ctx.db.query("events").take(10));
    expect(events.map((e) => [e.kind, e.count])).toEqual([["night_printed", 2]]);
  });

  test("a new print replaces the day's night and starts it over", async () => {
    const t = newT();
    const m = await makeMember(t, "Ada");
    await m.as.mutation(api.nights.print, { dayKey: DAY, items: [history] });
    await m.as.mutation(api.sessions.start, { deal: deal(), dayKey: DAY, fromNight: 0 });
    await m.as.mutation(api.nights.print, { dayKey: DAY, items: [orgo] });
    expect(await tonight(m)).toMatchObject({ items: [orgo], taken: 0 });
    expect(await allNights(t)).toHaveLength(1);
  });

  test("each member sees only their own night, and only that day's", async () => {
    const t = newT();
    const a = await makeMember(t, "Ada");
    const b = await makeMember(t, "Ben");
    await a.as.mutation(api.nights.print, { dayKey: DAY, items: [history] });
    expect(await tonight(b)).toBeNull();
    expect(await tonight(a, "2026-11-12")).toBeNull();
    expect(await t.query(api.nights.tonight, { dayKey: DAY })).toBeNull();
  });

  test("refuses a night that isn't on offer, a bad day and someone else's big one", async () => {
    const t = newT();
    const a = await makeMember(t, "Ada");
    const b = await makeMember(t, "Ben");
    const theirs = await bigOne(b);
    const print = (dayKey: string, items: typeof history[]) => codeOf(a.as.mutation(api.nights.print, { dayKey, items }));
    expect(await print(DAY, [])).toBe("BAD_NIGHT");
    expect(await print(DAY, Array(7).fill(orgo))).toBe("BAD_NIGHT");
    expect(await print(DAY, [{ ...orgo, minutes: 25 }])).toBe("BAD_NIGHT");
    expect(await print(DAY, [{ ...orgo, title: "x".repeat(81) }])).toBe("BAD_NIGHT");
    expect(await print("2026-13-01", [orgo])).toBe("BAD_DAY");
    expect(await codeOf(a.as.mutation(api.nights.print, { dayKey: DAY, items: [{ ...orgo, taskId: theirs }] }))).toBe("NOT_FOUND");
    expect(await allNights(t)).toHaveLength(0);
  });
});

describe("taking sittings", () => {
  test("a deal from tonight takes its sitting, once, in the deal's transaction", async () => {
    const t = newT();
    const m = await makeMember(t, "Ada");
    await m.as.mutation(api.nights.print, { dayKey: DAY, items: [history, orgo] });
    await m.as.mutation(api.sessions.start, { deal: deal(), dayKey: DAY, fromNight: 0 });
    expect((await tonight(m))!.taken).toBe(1);
    // the same sitting again, from another device or a retry
    await m.as.mutation(api.sessions.start, { deal: deal(), dayKey: DAY, fromNight: 0 });
    expect((await tonight(m))!.taken).toBe(1);
    await m.as.mutation(api.sessions.start, { deal: deal(), dayKey: DAY, fromNight: 1 });
    await m.as.mutation(api.sessions.start, { deal: deal("Orgo problem set 4", 20), dayKey: DAY, fromNight: 2 });
    await m.as.mutation(api.sessions.start, { deal: deal("Orgo problem set 4", 20), dayKey: DAY, fromNight: 7 });
    expect((await tonight(m))!.taken).toBe(3);
  });

  test("a plain deal takes nothing, and a deal from tonight needs the day", async () => {
    const t = newT();
    const m = await makeMember(t, "Ada");
    await m.as.mutation(api.nights.print, { dayKey: DAY, items: [history] });
    await m.as.mutation(api.sessions.start, { deal: deal(), dayKey: DAY });
    expect((await tonight(m))!.taken).toBe(0);
    expect(await codeOf(m.as.mutation(api.sessions.start, { deal: deal(), fromNight: 0 }))).toBe("BAD_DAY");
    // no night that day: the deal starts all the same
    await m.as.mutation(api.sessions.start, { deal: deal(), dayKey: "2026-11-12", fromNight: 0 });
    expect((await tonight(m))!.taken).toBe(0);
  });

  test("a big one's card takes its sitting too", async () => {
    const t = newT();
    const m = await makeMember(t, "Ada");
    const taskId = await bigOne(m);
    await m.as.mutation(api.nights.print, { dayKey: DAY, items: [{ title: "BIO 180 midterm", taskId, sittings: 1, minutes: 30 }, orgo] });
    await m.as.mutation(api.tasks.startFromCard, { taskId, deal: deal("BIO 180 midterm", 30), dayKey: DAY, fromNight: 0 });
    expect((await tonight(m))!.taken).toBe(1);
  });
});

describe("stopping early gives the sitting back (spec 017)", () => {
  const MIN = 60_000;
  const elapse = (t: TestConvex, sessionId: Id<"sessions">, minutes: number) =>
    t.run(async (ctx) => {
      const s = (await ctx.db.get(sessionId))!;
      await ctx.db.patch(sessionId, { state: { ...s.state, startedAt: s.state.startedAt - minutes * MIN } });
    });

  test("Stop for now leaves the sitting at the front of tonight", async () => {
    const t = newT();
    const m = await makeMember(t, "Ada");
    await m.as.mutation(api.nights.print, { dayKey: DAY, items: [history, orgo] });
    const { sessionId } = await m.as.mutation(api.sessions.start, { deal: deal(), dayKey: DAY, fromNight: 0 });
    expect((await tonight(m))!.taken).toBe(1);
    await elapse(t, sessionId, 3);
    await m.as.mutation(api.sessions.end, { sessionId, dayKey: DAY });
    expect((await tonight(m))!.taken).toBe(0);
  });

  test("a deal that ran its full time keeps its sitting", async () => {
    const t = newT();
    const m = await makeMember(t, "Ada");
    await m.as.mutation(api.nights.print, { dayKey: DAY, items: [history, orgo] });
    const { sessionId } = await m.as.mutation(api.sessions.start, { deal: deal(), dayKey: DAY, fromNight: 0 });
    await elapse(t, sessionId, 45);
    await m.as.mutation(api.sessions.end, { sessionId, dayKey: DAY });
    expect((await tonight(m))!.taken).toBe(1);
  });

  test("a big one's card gives its sitting back too", async () => {
    const t = newT();
    const m = await makeMember(t, "Ada");
    const taskId = await bigOne(m);
    await m.as.mutation(api.nights.print, { dayKey: DAY, items: [{ title: "BIO 180 midterm", taskId, sittings: 1, minutes: 30 }, orgo] });
    const { sessionId } = await m.as.mutation(api.tasks.startFromCard, { taskId, deal: deal("BIO 180 midterm", 30), dayKey: DAY, fromNight: 0 });
    await m.as.mutation(api.sessions.end, { sessionId, dayKey: DAY });
    expect((await tonight(m))!.taken).toBe(0);
  });

  test("only the last sitting taken is given back", async () => {
    const t = newT();
    const m = await makeMember(t, "Ada");
    await m.as.mutation(api.nights.print, { dayKey: DAY, items: [history, orgo] });
    const { sessionId } = await m.as.mutation(api.sessions.start, { deal: deal(), dayKey: DAY, fromNight: 0 });
    // another device has already moved tonight on past this sitting
    await t.run(async (ctx) => {
      const n = (await ctx.db.query("nights").take(1))[0];
      await ctx.db.patch(n._id, { taken: 2 });
    });
    await m.as.mutation(api.sessions.end, { sessionId, dayKey: DAY });
    expect((await tonight(m))!.taken).toBe(2);
  });

  test("a plain deal stopped early gives nothing back", async () => {
    const t = newT();
    const m = await makeMember(t, "Ada");
    await m.as.mutation(api.nights.print, { dayKey: DAY, items: [history, orgo] });
    const first = await m.as.mutation(api.sessions.start, { deal: deal(), dayKey: DAY, fromNight: 0 });
    await elapse(t, first.sessionId, 45);
    await m.as.mutation(api.sessions.end, { sessionId: first.sessionId, dayKey: DAY });
    const { sessionId } = await m.as.mutation(api.sessions.start, { deal: deal("Email prof", 8), dayKey: DAY });
    await m.as.mutation(api.sessions.end, { sessionId, dayKey: DAY });
    expect((await tonight(m))!.taken).toBe(1);
  });
});

describe("the line is saved as it is written (spec 017)", () => {
  test("the ticket's own deal can be any length a deal can be", async () => {
    const t = newT();
    const m = await makeMember(t, "Ada");
    const quick = { title: "BIO 180 ch. 7", sittings: 1, minutes: 8 };
    await m.as.mutation(api.nights.print, { dayKey: DAY, items: [quick, orgo] });
    expect((await tonight(m))!.items).toEqual([quick, orgo]);
  });

  test("night_printed is logged once, on the day's first write", async () => {
    const t = newT();
    const m = await makeMember(t, "Ada");
    await m.as.mutation(api.nights.print, { dayKey: DAY, items: [history] });
    await m.as.mutation(api.nights.print, { dayKey: DAY, items: [history, orgo] });
    await m.as.mutation(api.nights.print, { dayKey: DAY, items: [orgo], keepTaken: true });
    const printed = await t.run((ctx) => ctx.db.query("events").withIndex("by_kind_and_at", (q) => q.eq("kind", "night_printed")).take(10));
    expect(printed.map((e) => e.count)).toEqual([1]);
  });

  test("clear deletes the day's night, and only the caller's", async () => {
    const t = newT();
    const a = await makeMember(t, "Ada");
    const b = await makeMember(t, "Ben");
    await a.as.mutation(api.nights.print, { dayKey: DAY, items: [history, orgo] });
    await b.as.mutation(api.nights.print, { dayKey: DAY, items: [orgo] });
    await a.as.mutation(api.nights.clear, { dayKey: DAY });
    expect(await tonight(a)).toBeNull();
    expect((await tonight(b))!.items).toEqual([orgo]);
    // nothing to clear: no error
    await a.as.mutation(api.nights.clear, { dayKey: DAY });
    expect(await codeOf(a.as.mutation(api.nights.clear, { dayKey: "2026-13-01" }))).toBe("BAD_DAY");
  });

  test("a line written again after a clear logs its first write again", async () => {
    const t = newT();
    const m = await makeMember(t, "Ada");
    await m.as.mutation(api.nights.print, { dayKey: DAY, items: [history] });
    await m.as.mutation(api.nights.clear, { dayKey: DAY });
    await m.as.mutation(api.nights.print, { dayKey: DAY, items: [orgo] });
    expect(await allNights(t)).toHaveLength(1);
    const printed = await t.run((ctx) => ctx.db.query("events").withIndex("by_kind_and_at", (q) => q.eq("kind", "night_printed")).take(10));
    expect(printed.map((e) => e.count)).toEqual([1, 1]);
  });
});

describe("reordering what is left", () => {
  test("keeps the sittings taken when they still lead the night, and logs no new print", async () => {
    const t = newT();
    const m = await makeMember(t, "Ada");
    await m.as.mutation(api.nights.print, { dayKey: DAY, items: [history, orgo] });
    await m.as.mutation(api.sessions.start, { deal: deal(), dayKey: DAY, fromNight: 0 });
    // History 1 of 2 done; Orgo moved ahead of History 2 of 2
    const reordered = [{ ...history, sittings: 1 }, orgo, { ...history, sittings: 1 }];
    await m.as.mutation(api.nights.print, { dayKey: DAY, items: reordered, keepTaken: true });
    expect(await tonight(m)).toMatchObject({ items: reordered, taken: 1 });
    const printed = await t.run((ctx) => ctx.db.query("events").withIndex("by_kind_and_at", (q) => q.eq("kind", "night_printed")).take(10));
    expect(printed).toHaveLength(1);
  });

  test("refuses a reorder that moves a sitting already taken", async () => {
    const t = newT();
    const m = await makeMember(t, "Ada");
    await m.as.mutation(api.nights.print, { dayKey: DAY, items: [history, orgo] });
    await m.as.mutation(api.sessions.start, { deal: deal(), dayKey: DAY, fromNight: 0 });
    expect(await codeOf(m.as.mutation(api.nights.print, { dayKey: DAY, items: [orgo, history], keepTaken: true }))).toBe("NIGHT_CHANGED");
    expect((await tonight(m))!.items).toEqual([history, orgo]);
  });
});

describe("deleting and sweeping", () => {
  test("deleting a big one leaves it in tonight by its title, unlinked", async () => {
    const t = newT();
    const m = await makeMember(t, "Ada");
    const taskId = await bigOne(m);
    await m.as.mutation(api.nights.print, { dayKey: DAY, items: [{ title: "BIO 180 midterm", taskId, sittings: 1, minutes: 30 }, orgo] });
    await m.as.mutation(api.tasks.remove, { taskId });
    expect((await tonight(m))!.items).toEqual([{ title: "BIO 180 midterm", sittings: 1, minutes: 30 }, orgo]);
  });

  test("the daily sweep deletes nights more than 2 days old", async () => {
    const t = newT();
    const { userId } = await makeMember(t, "Ada");
    const key = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString().slice(0, 10);
    await t.run(async (ctx) => {
      for (const d of [0, 1, 2, 3, 9]) await ctx.db.insert("nights", { userId, dayKey: key(d), items: [orgo], taken: 0, printedAt: Date.now() });
    });
    await t.mutation(internal.nights.sweep, {});
    expect((await allNights(t)).map((n) => n.dayKey).sort()).toEqual([key(2), key(1), key(0)]);
  });
});
