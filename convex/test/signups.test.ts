// Spec 016: sign-up settings, the brake's decision, and the member counts it reads.
import { describe, expect, test } from "vitest";
import { brakeReason, getBetaSettings, memberCounts, putBetaSettings } from "../lib/signups";
import { makeMember } from "./helpers.test-util";
import { newT } from "./setup.test-util";

const HOUR = 3_600_000;
const limits = { dayLimit: 40, memberCap: 150 };

describe("brakeReason", () => {
  test("the day limit wins when it is reached", () => {
    expect(brakeReason({ recent: 40, total: 10 }, limits)).toBe("dayLimit");
  });
  test("the member cap closes when it is reached", () => {
    expect(brakeReason({ recent: 39, total: 150 }, limits)).toBe("memberCap");
  });
  test("under both limits, no brake", () => {
    expect(brakeReason({ recent: 39, total: 149 }, limits)).toBeNull();
  });
});

describe("beta settings", () => {
  test("with no row, sign-ups are invite-only with the default limits", async () => {
    const t = newT();
    const s = await t.run((ctx) => getBetaSettings(ctx));
    expect(s).toMatchObject({ signups: "inviteOnly", memberCap: 150, dayLimit: 40 });
  });

  test("putting settings twice keeps one row", async () => {
    const t = newT();
    await t.run((ctx) => putBetaSettings(ctx, { signups: "open" }));
    await t.run((ctx) => putBetaSettings(ctx, { dayLimit: 5 }));
    const rows = await t.run((ctx) => ctx.db.query("settings").collect());
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ signups: "open", dayLimit: 5, memberCap: 150 });
  });

  test("passing undefined clears paused", async () => {
    const t = newT();
    await t.run((ctx) => putBetaSettings(ctx, { paused: { at: 1, reason: "manual", count: 0 } }));
    await t.run((ctx) => putBetaSettings(ctx, { paused: undefined }));
    const s = await t.run((ctx) => getBetaSettings(ctx));
    expect(s.paused).toBeUndefined();
  });
});

describe("memberCounts", () => {
  async function threeMembers() {
    const t = newT();
    const now = Date.now();
    for (const [name, ago] of [["Old", 25 * HOUR], ["Recent", 1 * HOUR], ["New", 0]] as const) {
      const { userId } = await makeMember(t, name);
      await t.run((ctx) => ctx.db.patch(userId, { joinedAt: now - ago }));
    }
    return { t, now };
  }

  test("recent counts the last 24 hours", async () => {
    const { t, now } = await threeMembers();
    const s = await t.run((ctx) => getBetaSettings(ctx));
    expect(await t.run((ctx) => memberCounts(ctx, s, now))).toEqual({ recent: 2, total: 3 });
  });

  test("a reopened window only counts joins since it started", async () => {
    const { t, now } = await threeMembers();
    const s = { ...(await t.run((ctx) => getBetaSettings(ctx))), windowStart: now - HOUR / 2 };
    expect(await t.run((ctx) => memberCounts(ctx, s, now))).toEqual({ recent: 1, total: 3 });
  });
});
