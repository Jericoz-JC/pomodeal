// Spec 008 "Optional AI: Suggest pieces": limits, the off switch, the transient suggestion row and its cleanup.
// No network: fake timers keep the scheduled Node action (aiNode:suggestPieces) from ever running here;
// tests only look at what was scheduled and call the internal write directly.
import { ConvexError } from "convex/values";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { makeMember, type TestConvex } from "./helpers.test-util";
import { newT } from "./setup.test-util";

const HOUR = 3_600_000;
const deal = { activity: null, breakMin: 5, task: "Lab report", focusMin: 15 };
/** The client's local day key; the server accepts keys within a day of its own clock. */
const today = () => new Date().toISOString().slice(0, 10);

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

function turnOn() {
  vi.stubEnv("AI_SUGGEST_ENABLED", "true");
  vi.stubEnv("ANTHROPIC_API_KEY", "unused-in-tests");
}

async function codeOf(p: Promise<unknown>): Promise<string | undefined> {
  try {
    await p;
  } catch (e) {
    if (e instanceof ConvexError) return (e.data as { code?: string }).code;
    return "THREW";
  }
  return undefined;
}

async function labReport(t: TestConvex, name = "Ada") {
  const m = await makeMember(t, name);
  const r = await m.as.mutation(api.tasks.create, {
    title: "Lab report due Thursday", taskType: "writing", gutMin: 120, firstMove: "Open the doc and write one ugly sentence", deal, dayKey: today(),
  });
  return { ...m, taskId: r.taskId };
}

async function suggestJobs(t: TestConvex) {
  const all = await t.run((ctx) => ctx.db.system.query("_scheduled_functions").collect());
  return all.filter((j) => j.name.replace(/\.js$/, "").endsWith("aiNode:suggestPieces"));
}

describe("the switch and the limits", () => {
  test("with AI_SUGGEST_ENABLED unset, enabled is false and a request is refused as off, scheduling nothing", async () => {
    const t = newT();
    const { as, taskId } = await labReport(t);
    expect(await as.query(api.ai.enabled, {})).toBe(false);
    expect(await as.mutation(api.ai.requestSuggestion, { taskId, title: "Lab report due Thursday", dayKey: today() })).toEqual({ refused: "off" });
    expect(await suggestJobs(t)).toHaveLength(0);
    expect(await t.run((ctx) => ctx.db.query("aiUsage").take(10))).toHaveLength(0);
    expect(await t.run((ctx) => ctx.db.query("pieceSuggestions").take(10))).toHaveLength(0);
  });

  test("set but without a key, it stays off", async () => {
    vi.stubEnv("AI_SUGGEST_ENABLED", "true");
    const t = newT();
    const { as } = await labReport(t);
    expect(await as.query(api.ai.enabled, {})).toBe(false);
  });

  test("spec test 12: the 11th request for one user on one day is refused as limit and schedules nothing", async () => {
    turnOn();
    const t = newT();
    const { as, taskId } = await labReport(t);
    expect(await as.query(api.ai.enabled, {})).toBe(true);
    for (let i = 0; i < 10; i++) {
      const r = await as.mutation(api.ai.requestSuggestion, { taskId, title: "Lab report due Thursday", dayKey: today() });
      expect(typeof r).toBe("string");
    }
    expect(await suggestJobs(t)).toHaveLength(10);
    expect(await as.mutation(api.ai.requestSuggestion, { taskId, title: "Lab report due Thursday", dayKey: today() })).toEqual({ refused: "limit" });
    expect(await suggestJobs(t)).toHaveLength(10);
    const usage = await t.run((ctx) => ctx.db.query("aiUsage").take(10));
    expect(usage.map((u) => u.count)).toEqual([10]);
    // one live suggestion per big one: each new request replaces the last
    expect(await t.run((ctx) => ctx.db.query("pieceSuggestions").take(20))).toHaveLength(1);
    const events = await t.run((ctx) => ctx.db.query("events").take(100));
    expect(events.filter((e) => e.kind === "ai_requested")).toHaveLength(10);
  });

  test("spec test 12: the 301st request across users on one day is refused as limit", async () => {
    turnOn();
    const t = newT();
    const { taskId: _, userId: other } = await labReport(t, "Bo");
    // 300 already used today by other members (the cap sums every row for the day)
    await t.run(async (ctx) => {
      for (let i = 0; i < 30; i++) await ctx.db.insert("aiUsage", { userId: other, dayKey: today(), count: 10 });
    });
    const { as, taskId } = await labReport(t, "Ada");
    expect(await as.mutation(api.ai.requestSuggestion, { taskId, title: "Lab report", dayKey: today() })).toEqual({ refused: "limit" });
    expect(await suggestJobs(t)).toHaveLength(0);
  });

  test("a day key far from the server's day is refused, so rotating keys can't reset the limit", async () => {
    turnOn();
    const t = newT();
    const { as, taskId } = await labReport(t);
    expect(await codeOf(as.mutation(api.ai.requestSuggestion, { taskId, title: "Lab report", dayKey: "2020-01-01" }))).toBe("BAD_DAY");
  });

  test("the action gets the scrubbed title, type, gut size and days left, never the bookmark", async () => {
    turnOn();
    const t = newT();
    const { as, taskId } = await labReport(t);
    await t.run((ctx) => ctx.db.patch(taskId, { bookmark: "the secret bookmark" }));
    await as.mutation(api.ai.requestSuggestion, { taskId, title: "Lab report for jo@uw.edu call 206-555-0101", daysLeft: 4, dayKey: today() });
    const [job] = await suggestJobs(t);
    const args = job.args[0] as Record<string, unknown>;
    expect(args.title).toBe("Lab report for call");
    expect(args).toMatchObject({ taskType: "writing", gutMin: 120, daysLeft: 4 });
    expect(JSON.stringify(args)).not.toContain("secret");
  });

  test("someone else's big one is not found", async () => {
    turnOn();
    const t = newT();
    const { taskId } = await labReport(t, "Ada");
    const { as: bo } = await makeMember(t, "Bo");
    expect(await codeOf(bo.mutation(api.ai.requestSuggestion, { taskId, title: "x", dayKey: today() }))).toBe("NOT_FOUND");
  });
});

describe("the suggestion row", () => {
  async function pending(t: TestConvex) {
    turnOn();
    const m = await labReport(t);
    const id = (await m.as.mutation(api.ai.requestSuggestion, { taskId: m.taskId, title: "Lab report", dayKey: today() })) as Id<"pieceSuggestions">;
    return { ...m, id };
  }

  test("writeSuggestion with 15 pieces stores 12, ready, and the owner sees them", async () => {
    const t = newT();
    const { as, id } = await pending(t);
    expect(await as.query(api.ai.suggestion, { suggestionId: id })).toEqual({ status: "pending" });
    const raw = { pieces: Array.from({ length: 15 }, (_, i) => ({ title: `Step ${i + 1}`, minutes: 22 })) };
    await t.mutation(internal.ai.writeSuggestion, { suggestionId: id, raw });
    const row = await t.run((ctx) => ctx.db.get(id));
    expect(row!.status).toBe("ready");
    expect(row!.pieces).toHaveLength(12);
    expect(row!.pieces![0]).toEqual({ title: "Step 1", minutes: 20 });
    const seen = await as.query(api.ai.suggestion, { suggestionId: id });
    expect(seen).toMatchObject({ status: "ready" });
  });

  test("nothing usable, or no answer at all, writes failed", async () => {
    const t = newT();
    const { id } = await pending(t);
    await t.mutation(internal.ai.writeSuggestion, { suggestionId: id, raw: { pieces: [] } });
    expect((await t.run((ctx) => ctx.db.get(id)))!.status).toBe("failed");
    await t.mutation(internal.ai.writeSuggestion, { suggestionId: id, raw: null });
    expect((await t.run((ctx) => ctx.db.get(id)))!.status).toBe("failed");
  });

  test("a write after a dismiss does nothing", async () => {
    const t = newT();
    const { as, id } = await pending(t);
    await as.mutation(api.ai.dismissSuggestion, { suggestionId: id });
    expect(await t.run((ctx) => ctx.db.get(id))).toBeNull();
    await t.mutation(internal.ai.writeSuggestion, { suggestionId: id, raw: { pieces: [{ title: "Intro", minutes: 30 }] } });
    expect(await t.run((ctx) => ctx.db.get(id))).toBeNull();
  });

  test("someone else can't read or dismiss it", async () => {
    const t = newT();
    const { id } = await pending(t);
    const { as: bo } = await makeMember(t, "Bo");
    expect(await bo.query(api.ai.suggestion, { suggestionId: id })).toBeNull();
    await bo.mutation(api.ai.dismissSuggestion, { suggestionId: id });
    expect(await t.run((ctx) => ctx.db.get(id))).not.toBeNull();
  });

  test("saveSplit from a suggestion deletes the row, sets aiSuggested and logs ai_accepted", async () => {
    const t = newT();
    const { as, taskId, id } = await pending(t);
    await t.mutation(internal.ai.writeSuggestion, { suggestionId: id, raw: { pieces: [{ title: "Methods", minutes: 30 }, { title: "Results", minutes: 45 }] } });
    // the student edited one before saving: only what they save is stored
    await as.mutation(api.tasks.saveSplit, { taskId, pieces: [{ title: "Methods", minutes: 30 }, { title: "Results and graphs", minutes: 50 }], fromSuggestion: true });
    expect(await t.run((ctx) => ctx.db.get(id))).toBeNull();
    const task = await t.run((ctx) => ctx.db.get(taskId));
    expect(task!.aiSuggested).toBe(true);
    expect(task!.pieces!.map((p) => p.title)).toEqual(["Methods", "Results and graphs"]);
    const kinds = (await t.run((ctx) => ctx.db.query("events").take(100))).map((e) => e.kind);
    expect(kinds).toContain("ai_accepted");
  });

  test("a plain saveSplit also clears a leftover suggestion but leaves aiSuggested alone", async () => {
    const t = newT();
    const { as, taskId, id } = await pending(t);
    await as.mutation(api.tasks.saveSplit, { taskId, pieces: [{ title: "Intro", minutes: 30 }] });
    expect(await t.run((ctx) => ctx.db.get(id))).toBeNull();
    expect((await t.run((ctx) => ctx.db.get(taskId)))!.aiSuggested).toBe(false);
  });

  test("deleting the big one deletes its suggestion", async () => {
    const t = newT();
    const { as, taskId, id } = await pending(t);
    await as.mutation(api.tasks.remove, { taskId });
    expect(await t.run((ctx) => ctx.db.get(id))).toBeNull();
  });
});

describe("daily cleanup", () => {
  test("sweepSuggestions deletes rows older than 24 hours and old usage days, keeps the rest", async () => {
    const t = newT();
    const { userId, taskId } = await labReport(t);
    const now = Date.now();
    const [oldId, newId] = await t.run(async (ctx) => [
      await ctx.db.insert("pieceSuggestions", { userId, taskId, status: "ready", pieces: [{ title: "a", minutes: 30 }], createdAt: now - 25 * HOUR }),
      await ctx.db.insert("pieceSuggestions", { userId, taskId, status: "pending", createdAt: now - 2 * HOUR }),
    ]);
    const old = new Date(now - 5 * 24 * HOUR).toISOString().slice(0, 10);
    await t.run(async (ctx) => {
      await ctx.db.insert("aiUsage", { userId, dayKey: old, count: 3 });
      await ctx.db.insert("aiUsage", { userId, dayKey: today(), count: 1 });
    });
    await t.mutation(internal.ai.sweepSuggestions, {});
    expect(await t.run((ctx) => ctx.db.get(oldId))).toBeNull();
    expect(await t.run((ctx) => ctx.db.get(newId))).not.toBeNull();
    expect((await t.run((ctx) => ctx.db.query("aiUsage").take(10))).map((u) => u.dayKey)).toEqual([today()]);
  });
});
