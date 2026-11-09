import { ConvexError } from "convex/values";
import { describe, expect, test } from "vitest";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { EventKind } from "../lib/events";
import { makeMember, type TestConvex } from "./helpers.test-util";
import { newT } from "./setup.test-util";

const DAY = 86_400_000;
const FROM = 1_000_000_000_000;
const TO = FROM + 30 * DAY;
const at = FROM + DAY;

function logAt(t: TestConvex, userId: Id<"users">, kind: EventKind, extra: { ms?: number; at?: number; taskId?: Id<"tasks"> } = {}) {
  return t.run((ctx) =>
    ctx.db.insert("events", {
      userId,
      kind,
      ...(extra.ms !== undefined ? { ms: extra.ms } : {}),
      ...(extra.taskId ? { taskId: extra.taskId } : {}),
      at: extra.at ?? at,
    }),
  );
}

const beta = (t: TestConvex, fromAt = FROM, toAt = TO) => t.query(internal.metrics.beta, { fromAt, toAt });

async function codeOf(p: Promise<unknown>): Promise<string | undefined> {
  try {
    await p;
  } catch (e) {
    if (e instanceof ConvexError) return (e.data as { code?: string }).code;
    return "THREW";
  }
  return undefined;
}

describe("check-in answers", () => {
  test("no answer yet gives null; answering twice in a week keeps one row (the later answer)", async () => {
    const t = newT();
    const { as } = await makeMember(t, "Ada");
    expect(await as.query(api.checkIns.lastWeekKey, {})).toBeNull();
    await as.mutation(api.checkIns.answer, { weekKey: "2026-11-08", answer: "better" });
    await as.mutation(api.checkIns.answer, { weekKey: "2026-11-08", answer: "worse" });
    const rows = await t.run((ctx) => ctx.db.query("checkIns").take(10));
    expect(rows).toHaveLength(1);
    expect(rows[0].answer).toBe("worse");
    expect(await as.query(api.checkIns.lastWeekKey, {})).toBe("2026-11-08");
  });

  test("lastWeekKey is the newest week, per member; a week key must be a Sunday", async () => {
    const t = newT();
    const a = await makeMember(t, "Ada");
    const b = await makeMember(t, "Bo");
    await a.as.mutation(api.checkIns.answer, { weekKey: "2026-11-01", answer: "same" });
    await a.as.mutation(api.checkIns.answer, { weekKey: "2026-11-08", answer: "better" });
    expect(await a.as.query(api.checkIns.lastWeekKey, {})).toBe("2026-11-08");
    expect(await b.as.query(api.checkIns.lastWeekKey, {})).toBeNull();
    expect(await codeOf(a.as.mutation(api.checkIns.answer, { weekKey: "2026-11-09", answer: "same" }))).toBe("BAD_WEEK");
    expect(await codeOf(a.as.mutation(api.checkIns.answer, { weekKey: "next week", answer: "same" }))).toBe("BAD_WEEK");
  });

  test("signed out is refused; lastWeekKey is null", async () => {
    const t = newT();
    expect(await codeOf(t.mutation(api.checkIns.answer, { weekKey: "2026-11-08", answer: "same" }))).toBe("NOT_A_MEMBER");
    expect(await t.query(api.checkIns.lastWeekKey, {})).toBeNull();
  });
});

describe("beta metrics", () => {
  test("first payment within 2 min: 2 of 3 big ones is 67", async () => {
    const t = newT();
    const { userId } = await makeMember(t, "Ada");
    for (const ms of [30_000, 119_999, 400_000]) {
      await logAt(t, userId, "big_one_named");
      await logAt(t, userId, "first_payment_started", { ms });
    }
    expect((await beta(t)).firstPaymentWithin2MinPct).toBe(67);
  });

  test("big ones that used an AI suggestion are left out of metric 1; events outside the window are ignored", async () => {
    const t = newT();
    const { userId } = await makeMember(t, "Ada");
    const task = (title: string) =>
      t.run((ctx) => ctx.db.insert("tasks", { userId, title, workedMin: 0, openTermsMin: null, firstMove: "", aiSuggested: false, status: "open", workedDays: [], createdAt: at }));
    const [fast, slow, ai] = [await task("a"), await task("b"), await task("c")];
    for (const [id, ms] of [[fast, 10_000], [slow, 500_000], [ai, 10_000]] as const) {
      await logAt(t, userId, "big_one_named", { taskId: id });
      await logAt(t, userId, "first_payment_started", { taskId: id, ms });
    }
    await logAt(t, userId, "ai_accepted", { taskId: ai });
    await logAt(t, userId, "big_one_named", { at: FROM - 1 });
    await logAt(t, userId, "big_one_named", { at: TO });
    expect((await beta(t)).firstPaymentWithin2MinPct).toBe(50);
  });

  test("nothing yet: every percentage is null, never NaN", async () => {
    const t = newT();
    expect(await beta(t)).toEqual({
      firstPaymentWithin2MinPct: null,
      secondDayPct: null,
      comebackStartedPct: null,
      checkIns: { better: 0, same: 0, worse: 0 },
      installRate: null,
      pushEnabledRate: null,
      bookmarkRate: null,
      aiAcceptRate: null,
    });
  });

  test("comebacks: 1 started of 2 shown is 50", async () => {
    const t = newT();
    const { userId } = await makeMember(t, "Ada");
    await logAt(t, userId, "comeback_shown");
    await logAt(t, userId, "comeback_shown");
    await logAt(t, userId, "comeback_started");
    expect((await beta(t)).comebackStartedPct).toBe(50);
  });

  test("second day: of big ones still open past day one (or worked on 2+ days), the share worked on 2+ days", async () => {
    const t = newT();
    const { userId } = await makeMember(t, "Ada");
    const add = (status: "open" | "done" | "set_aside", workedDays: string[], createdAt = at) =>
      t.run((ctx) => ctx.db.insert("tasks", { userId, workedMin: 0, openTermsMin: null, firstMove: "", aiSuggested: false, title: "t", status, workedDays, createdAt }));
    await add("open", ["2026-11-01", "2026-11-02"]); // yes
    await add("open", ["2026-11-01"]); // open, one day: counts against
    await add("done", ["2026-11-01", "2026-11-03"]); // finished on day 3: yes
    await add("done", ["2026-11-01"]); // finished on day one: not in the denominator
    await add("open", ["2026-11-01"], TO - 1000); // under a day old at the window's end: too soon to judge
    await add("open", ["2026-11-01"], FROM - DAY); // created before the window
    expect((await beta(t)).secondDayPct).toBe(67);
  });

  test("check-ins in the window are tallied by answer", async () => {
    const t = newT();
    const a = await makeMember(t, "Ada");
    const b = await makeMember(t, "Bo");
    await a.as.mutation(api.checkIns.answer, { weekKey: "2026-11-01", answer: "better" });
    await a.as.mutation(api.checkIns.answer, { weekKey: "2026-11-08", answer: "same" });
    await b.as.mutation(api.checkIns.answer, { weekKey: "2026-11-08", answer: "better" });
    await t.run(async (ctx) => {
      for (const c of await ctx.db.query("checkIns").take(10)) await ctx.db.patch(c._id, { at });
    });
    expect((await beta(t)).checkIns).toEqual({ better: 2, same: 1, worse: 0 });
    expect((await beta(t, TO + 1, TO + 2)).checkIns).toEqual({ better: 0, same: 0, worse: 0 });
  });

  test("context rates: per member who did anything in the window; AI accept per request", async () => {
    const t = newT();
    const [a, b, c, d] = [await makeMember(t, "A"), await makeMember(t, "B"), await makeMember(t, "C"), await makeMember(t, "D")];
    for (const m of [a, b, c, d]) await logAt(t, m.userId, "big_one_named");
    await logAt(t, a.userId, "install_done");
    await logAt(t, a.userId, "push_enabled");
    await logAt(t, b.userId, "push_enabled");
    await logAt(t, b.userId, "bookmark_written");
    await logAt(t, b.userId, "bookmark_written");
    await logAt(t, c.userId, "ai_requested");
    await logAt(t, c.userId, "ai_requested");
    await logAt(t, c.userId, "ai_accepted");
    const r = await beta(t);
    expect(r.installRate).toBe(25);
    expect(r.pushEnabledRate).toBe(50);
    expect(r.bookmarkRate).toBe(25);
    expect(r.aiAcceptRate).toBe(50);
  });
});
