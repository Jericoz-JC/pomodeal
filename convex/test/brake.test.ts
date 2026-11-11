// Spec 016 "The brake": sign-ups close themselves at the day limit or the member cap, and admins get a push.
// No real network calls: the Node send action is only ever scheduled here, never run.
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api, internal } from "../_generated/api";
import { getBetaSettings, putBetaSettings } from "../lib/signups";
import { makeMember, type TestConvex } from "./helpers.test-util";
import { newT } from "./setup.test-util";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

const ISSUER = "https://api.workos.com/user_management/client_PROD";
const person = (t: TestConvex, name: string) => t.withIdentity({ issuer: ISSUER, subject: name, tokenIdentifier: `${ISSUER}|${name}` });
const enter = (t: TestConvex, name: string) => person(t, name).mutation(api.beta.enter, { displayName: name });
const settings = (t: TestConvex) => t.run((ctx) => getBetaSettings(ctx));

async function jobs(t: TestConvex, name: string) {
  const all = await t.run((ctx) => ctx.db.system.query("_scheduled_functions").collect());
  return all.filter((j) => j.name.replace(/\.js$/, "").endsWith(name) && j.state.kind === "pending");
}

describe("the brake", () => {
  test("the join that reaches the day limit succeeds, then sign-ups close", async () => {
    const t = newT();
    await t.run((ctx) => putBetaSettings(ctx, { signups: "open", dayLimit: 2 }));
    expect(await enter(t, "a")).toMatchObject({ status: "member" });
    expect(await enter(t, "b")).toMatchObject({ status: "member" });
    expect(await settings(t)).toMatchObject({ signups: "inviteOnly", paused: { reason: "dayLimit", count: 2 } });
    expect(await enter(t, "c")).toMatchObject({ status: "waitlist" });
  });

  test("the member cap closes sign-ups the same way", async () => {
    const t = newT();
    await makeMember(t, "Old1");
    await makeMember(t, "Old2");
    await t.run((ctx) => putBetaSettings(ctx, { signups: "open", memberCap: 3 }));
    expect(await enter(t, "a")).toMatchObject({ status: "member" });
    expect(await settings(t)).toMatchObject({ signups: "inviteOnly", paused: { reason: "memberCap", count: 3 } });
  });

  test("a claim never gets refused by the brake but still counts", async () => {
    const t = newT();
    const { as: chris, userId } = await makeMember(t, "Chris");
    await t.run((ctx) => ctx.db.patch(userId, { inviteAllowance: 1, joinedAt: 0 }));
    await t.run((ctx) => putBetaSettings(ctx, { signups: "open", dayLimit: 1 }));
    const code = await chris.mutation(api.beta.createInvite, {});
    expect(await person(t, "maya").mutation(api.beta.claim, { code, displayName: "Maya" })).toEqual({ already: false });
    expect(await settings(t)).toMatchObject({ signups: "inviteOnly", paused: { reason: "dayLimit", count: 1 } });
  });

  test("reopening starts a fresh window", async () => {
    const t = newT();
    await t.run((ctx) => putBetaSettings(ctx, { signups: "open", dayLimit: 1 }));
    await enter(t, "a");
    expect((await settings(t)).signups).toBe("inviteOnly");
    vi.advanceTimersByTime(1000);
    await t.run((ctx) => putBetaSettings(ctx, { signups: "open", paused: undefined, windowStart: Date.now() }));
    vi.advanceTimersByTime(1000);
    expect(await enter(t, "b")).toMatchObject({ status: "member" });
  });

  test("reopening at the cap closes again after one join", async () => {
    const t = newT();
    await makeMember(t, "Old1");
    await makeMember(t, "Old2");
    await t.run((ctx) => putBetaSettings(ctx, { signups: "open", memberCap: 2 }));
    expect(await enter(t, "a")).toMatchObject({ status: "member" });
    expect(await settings(t)).toMatchObject({ signups: "inviteOnly", paused: { reason: "memberCap", count: 3 } });
  });

  test("a trip schedules the admin alert", async () => {
    const t = newT();
    await t.run((ctx) => putBetaSettings(ctx, { signups: "open", dayLimit: 2 }));
    await enter(t, "a");
    expect(await jobs(t, "push:notifyAdmins")).toHaveLength(0);
    await enter(t, "b");
    const [job] = await jobs(t, "push:notifyAdmins");
    expect(job.args[0]).toEqual({ title: "Sign-ups paused", body: "2 new members in 24 hours." });
  });

  test("the cap alert names the cap", async () => {
    const t = newT();
    await makeMember(t, "Old");
    await t.run((ctx) => putBetaSettings(ctx, { signups: "open", memberCap: 2 }));
    await enter(t, "a");
    const [job] = await jobs(t, "push:notifyAdmins");
    expect(job.args[0]).toEqual({ title: "Sign-ups paused", body: "2 members, the cap." });
  });

  test("invite-only sign-ups never trip it again", async () => {
    const t = newT();
    const { as: chris, userId } = await makeMember(t, "Chris");
    await t.run((ctx) => ctx.db.patch(userId, { inviteAllowance: 1 }));
    await t.run((ctx) => putBetaSettings(ctx, { signups: "inviteOnly", dayLimit: 1 }));
    const code = await chris.mutation(api.beta.createInvite, {});
    await person(t, "maya").mutation(api.beta.claim, { code, displayName: "Maya" });
    expect((await settings(t)).paused).toBeUndefined();
    expect(await jobs(t, "push:notifyAdmins")).toHaveLength(0);
  });
});

describe("notifyAdmins", () => {
  test("sends to admin devices only", async () => {
    const t = newT();
    const { as: chris, userId } = await makeMember(t, "Chris");
    await t.run((ctx) => ctx.db.patch(userId, { role: "admin" }));
    const { as: sam } = await makeMember(t, "Sam");
    const sub = (n: number) => ({ endpoint: `https://push.example.com/send/${n}`, p256dh: "BPkey", auth: "authkey" });
    await chris.mutation(api.push.subscribe, sub(1));
    await chris.mutation(api.push.subscribe, sub(2));
    await sam.mutation(api.push.subscribe, sub(3));
    await t.mutation(internal.push.notifyAdmins, { title: "Sign-ups paused", body: "x" });
    const sends = await jobs(t, "pushNode:send");
    expect(sends).toHaveLength(2);
    const chrisSubs = await t.run((ctx) => ctx.db.query("pushSubscriptions").withIndex("by_userId", (q) => q.eq("userId", userId)).collect());
    expect(sends.map((j) => j.args[0].subscriptionId).sort()).toEqual(chrisSubs.map((s) => s._id).sort());
    expect(sends[0].args[0].payload.notification).toEqual({ title: "Sign-ups paused", body: "x", navigate: "/" });
  });
});
