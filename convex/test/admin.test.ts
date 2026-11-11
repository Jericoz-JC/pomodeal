// Spec 016 "Admin screen": the numbers and the sign-up controls, for admins only.
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "../_generated/api";
import { getBetaSettings, putBetaSettings } from "../lib/signups";
import { makeMember, type TestConvex } from "./helpers.test-util";
import { newT } from "./setup.test-util";

// sessions.start schedules pushes: fake timers keep them from running in the background.
beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

const DAY = 86_400_000;
const deal = { activity: null, breakMin: 5, task: "read chapter 3", focusMin: 15 };

async function admin(t: TestConvex) {
  const m = await makeMember(t, "Chris");
  await t.run((ctx) => ctx.db.patch(m.userId, { role: "admin" }));
  return m;
}

describe("admin", () => {
  test("a member who isn't an admin is refused", async () => {
    const t = newT();
    const { as: sam } = await makeMember(t, "Sam");
    await expect(sam.query(api.admin.overview, { now: Date.now() })).rejects.toThrow(/Only admins/);
    await expect(sam.mutation(api.admin.setSignups, { mode: "open" })).rejects.toThrow(/Only admins/);
    await expect(sam.mutation(api.admin.setLimits, { memberCap: 10, dayLimit: 5 })).rejects.toThrow(/Only admins/);
  });

  test("overview counts what the screen shows", async () => {
    const t = newT();
    const now = Date.now();
    const { as: chris, userId: chrisId } = await admin(t);
    await t.run((ctx) => ctx.db.patch(chrisId, { joinedAt: now - 2 * DAY, emailHash: "h" }));
    const { as: maya } = await makeMember(t, "Maya");
    const { as: sam } = await makeMember(t, "Sam");
    await t.run((ctx) => ctx.db.insert("waitlist", { tokenIdentifier: "x|waiting", firstSeenAt: now }));
    const { sessionId } = await chris.mutation(api.sessions.start, { deal });
    await t.run((ctx) => ctx.db.patch(sessionId, { createdAt: now - 8 * DAY })); // older than a week
    await maya.mutation(api.sessions.start, { deal });
    await sam.mutation(api.sessions.start, { deal });

    const o = await chris.query(api.admin.overview, { now });
    expect(o).toMatchObject({
      signups: "inviteOnly", memberCap: 150, dayLimit: 40, paused: null,
      members: 3, newInDay: 2, activeInWeek: 2, waiting: 1, readyForProduction: 1,
    });
    expect(o.usageUrl).toMatch(/^https:\/\/dashboard\.convex\.dev\//);
  });

  test("setSignups open clears the pause and starts a window", async () => {
    const t = newT();
    const { as: chris } = await admin(t);
    await t.run((ctx) => putBetaSettings(ctx, { paused: { at: 1, reason: "dayLimit", count: 40 } }));
    const before = Date.now();
    await chris.mutation(api.admin.setSignups, { mode: "open" });
    const s = await t.run((ctx) => getBetaSettings(ctx));
    expect(s.signups).toBe("open");
    expect(s.paused).toBeUndefined();
    expect(s.windowStart).toBeGreaterThanOrEqual(before);
  });

  test("setSignups inviteOnly records a manual pause", async () => {
    const t = newT();
    const { as: chris } = await admin(t);
    await t.run((ctx) => putBetaSettings(ctx, { signups: "open" }));
    const before = Date.now();
    await chris.mutation(api.admin.setSignups, { mode: "inviteOnly" });
    const s = await t.run((ctx) => getBetaSettings(ctx));
    expect(s).toMatchObject({ signups: "inviteOnly", paused: { reason: "manual", count: 1 } });
    expect(s.paused!.at).toBeGreaterThanOrEqual(before);
  });

  test("setLimits rejects 0, negative and fractional limits and leaves settings unchanged", async () => {
    const t = newT();
    const { as: chris } = await admin(t);
    for (const bad of [{ memberCap: 0, dayLimit: 5 }, { memberCap: 10, dayLimit: -5 }, { memberCap: 2.5, dayLimit: 5 }]) {
      await expect(chris.mutation(api.admin.setLimits, bad)).rejects.toThrow(/whole numbers of at least 1/);
    }
    expect(await t.run((ctx) => getBetaSettings(ctx))).toMatchObject({ memberCap: 150, dayLimit: 40 });
  });

  test("setLimits saves good limits without changing the mode", async () => {
    const t = newT();
    const { as: chris } = await admin(t);
    await t.run((ctx) => putBetaSettings(ctx, { signups: "open" }));
    await chris.mutation(api.admin.setLimits, { memberCap: 300, dayLimit: 60 });
    expect(await t.run((ctx) => getBetaSettings(ctx))).toMatchObject({ signups: "open", memberCap: 300, dayLimit: 60 });
  });
});
