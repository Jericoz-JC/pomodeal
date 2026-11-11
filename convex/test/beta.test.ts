import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import { hashEmail } from "../lib/email";
import { putBetaSettings } from "../lib/signups";
import { makeMember } from "./helpers.test-util";
import { newT } from "./setup.test-util";

describe("invite tickets", () => {
  test("a used ticket tells its maker who joined: first name only, and when", async () => {
    const t = newT();
    const { as: chris, userId } = await makeMember(t, "Chris");
    await t.run((ctx) => ctx.db.patch(userId, { inviteAllowance: 2 }));
    await chris.mutation(api.beta.createInvite, {});
    await chris.mutation(api.beta.createInvite, {});
    const [, first] = await chris.query(api.beta.myInvites, {});

    const maya = t.withIdentity({ tokenIdentifier: "https://test.pomodeal.app|maya" });
    await maya.mutation(api.beta.claim, { code: first.code, displayName: "Maya Okafor" });

    const tickets = await chris.query(api.beta.myInvites, {});
    const used = tickets.find((x) => x.code === first.code)!;
    expect(used).toMatchObject({ uses: 1, usedBy: "Maya" });
    expect(typeof used.usedAt).toBe("number");
    const unused = tickets.find((x) => x.code !== first.code)!;
    expect(unused).toMatchObject({ uses: 0, usedBy: null, usedAt: null });
  });

  test("nobody else sees who joined on a ticket they did not make", async () => {
    const t = newT();
    const { as: chris, userId } = await makeMember(t, "Chris");
    await t.run((ctx) => ctx.db.patch(userId, { inviteAllowance: 1 }));
    await chris.mutation(api.beta.createInvite, {});
    const [ticket] = await chris.query(api.beta.myInvites, {});
    await t.withIdentity({ tokenIdentifier: "https://test.pomodeal.app|maya" }).mutation(api.beta.claim, { code: ticket.code, displayName: "Maya Okafor" });
    const { as: sam } = await makeMember(t, "Sam");
    expect(await sam.query(api.beta.myInvites, {})).toEqual([]);
  });
});

// Spec 016: beta.enter runs on every app load.
const STAGING = "https://api.workos.com/user_management/client_STAGING";
const PROD = "https://api.workos.com/user_management/client_PROD";
function account(t: ReturnType<typeof newT>, issuer: string, subject: string, email?: string, emailVerified?: boolean) {
  return t.withIdentity({ issuer, subject, tokenIdentifier: `${issuer}|${subject}`, email, emailVerified });
}
const openSignups = (t: ReturnType<typeof newT>) => t.run((ctx) => putBetaSettings(ctx, { signups: "open" }));

describe("enter", () => {
  test("open: a new account joins with no invite", async () => {
    const t = newT();
    await openSignups(t);
    const maya = account(t, PROD, "maya", "maya@uw.edu", true);
    expect(await maya.mutation(api.beta.enter, { displayName: "Maya Okafor" })).toEqual({ status: "member", relinked: false });
    const [row] = await t.run((ctx) => ctx.db.query("users").collect());
    expect(row).toMatchObject({ displayName: "Maya Okafor", inviteId: null, invitedBy: null, inviteAllowance: 11, role: "member" });
    expect(row.emailHash).toBe(await hashEmail("maya@uw.edu"));
  });

  test("open: calling enter twice makes one member", async () => {
    const t = newT();
    await openSignups(t);
    const maya = account(t, PROD, "maya", "maya@uw.edu", true);
    await maya.mutation(api.beta.enter, { displayName: "Maya" });
    await maya.mutation(api.beta.enter, { displayName: "Maya" });
    expect(await t.run((ctx) => ctx.db.query("users").collect())).toHaveLength(1);
  });

  test("invite-only: a new account is waitlisted once", async () => {
    const t = newT();
    await t.run((ctx) => putBetaSettings(ctx, { signups: "inviteOnly" }));
    const maya = account(t, PROD, "maya");
    expect(await maya.mutation(api.beta.enter, { displayName: "Maya" })).toEqual({ status: "waitlist", relinked: false });
    const [first] = await t.run((ctx) => ctx.db.query("waitlist").collect());
    await maya.mutation(api.beta.enter, { displayName: "Maya" });
    const rows = await t.run((ctx) => ctx.db.query("waitlist").collect());
    expect(rows).toHaveLength(1);
    expect(rows[0].firstSeenAt).toBe(first.firstSeenAt);
    expect(await maya.query(api.beta.me, {})).toEqual({ status: "waitlist", signups: "inviteOnly" });
    expect(await t.run((ctx) => ctx.db.query("users").collect())).toHaveLength(0);
  });

  test("no settings row means invite-only", async () => {
    const t = newT();
    expect(await account(t, PROD, "maya").mutation(api.beta.enter, { displayName: "Maya" })).toMatchObject({ status: "waitlist" });
  });

  test("claim works while invite-only and clears the waitlist row", async () => {
    const t = newT();
    const { as: chris, userId } = await makeMember(t, "Chris");
    await t.run((ctx) => ctx.db.patch(userId, { inviteAllowance: 1 }));
    const code = await chris.mutation(api.beta.createInvite, {});
    const maya = account(t, PROD, "maya", "maya@uw.edu", true);
    await maya.mutation(api.beta.enter, { displayName: "Maya" });
    await maya.mutation(api.beta.claim, { code, displayName: "Maya" });
    expect(await t.run((ctx) => ctx.db.query("waitlist").collect())).toHaveLength(0);
    const joined = await t.run((ctx) => ctx.db.query("users").withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", `${PROD}|maya`)).unique());
    expect(joined!.emailHash).toBe(await hashEmail("maya@uw.edu"));
  });

  test("an existing member gets an emailHash backfilled", async () => {
    const t = newT();
    const userId = await t.run((ctx) => ctx.db.insert("users", { tokenIdentifier: `${STAGING}|chris`, displayName: "Chris", role: "admin", inviteId: null, invitedBy: null, inviteAllowance: 0, joinedAt: 1 }));
    const res = await account(t, STAGING, "chris", "Chris@UW.edu", true).mutation(api.beta.enter, { displayName: "Chris" });
    expect(res).toEqual({ status: "member", relinked: false });
    expect((await t.run((ctx) => ctx.db.get(userId)))!.emailHash).toBe(await hashEmail("chris@uw.edu"));
  });

  async function stagingMember(t: ReturnType<typeof newT>) {
    return t.run(async (ctx) => ctx.db.insert("users", { tokenIdentifier: `${STAGING}|user_A`, displayName: "Chris", role: "admin", inviteId: null, invitedBy: null, inviteAllowance: 0, joinedAt: 1, emailHash: await hashEmail("chris@uw.edu") }));
  }

  test("a verified email from another environment relinks the member", async () => {
    const t = newT();
    const userId = await stagingMember(t);
    const res = await account(t, PROD, "user_B", " CHRIS@uw.edu", true).mutation(api.beta.enter, { displayName: "Chris" });
    expect(res).toEqual({ status: "member", relinked: true });
    const users = await t.run((ctx) => ctx.db.query("users").collect());
    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject({ _id: userId, tokenIdentifier: `${PROD}|user_B`, role: "admin" });
  });

  test("an unverified email never relinks", async () => {
    const t = newT();
    const userId = await stagingMember(t);
    const res = await account(t, PROD, "user_B", "chris@uw.edu", false).mutation(api.beta.enter, { displayName: "Chris" });
    expect(res).toEqual({ status: "waitlist", relinked: false });
    expect((await t.run((ctx) => ctx.db.get(userId)))!.tokenIdentifier).toBe(`${STAGING}|user_A`);
  });

  test("a match in the same environment never relinks", async () => {
    const t = newT();
    const userId = await stagingMember(t);
    const res = await account(t, STAGING, "user_C", "chris@uw.edu", true).mutation(api.beta.enter, { displayName: "Chris" });
    expect(res.relinked).toBe(false);
    expect((await t.run((ctx) => ctx.db.get(userId)))!.tokenIdentifier).toBe(`${STAGING}|user_A`);
  });

  test("claim relinks a member from another environment instead of making a second account", async () => {
    const t = newT();
    const userId = await stagingMember(t);
    const { as: sam, userId: samId } = await makeMember(t, "Sam");
    await t.run((ctx) => ctx.db.patch(samId, { inviteAllowance: 1 }));
    const code = await sam.mutation(api.beta.createInvite, {});
    const res = await account(t, PROD, "user_B", "chris@uw.edu", true).mutation(api.beta.claim, { code, displayName: "Chris" });
    expect(res).toEqual({ already: true });
    expect((await t.run((ctx) => ctx.db.get(userId)))!.tokenIdentifier).toBe(`${PROD}|user_B`);
    expect(await t.run((ctx) => ctx.db.query("users").collect())).toHaveLength(2);
    const [ticket] = await sam.query(api.beta.myInvites, {});
    expect(ticket.uses).toBe(0); // the invite stays unspent
  });

  test("a signed-out caller can't enter", async () => {
    const t = newT();
    await expect(t.mutation(api.beta.enter, { displayName: "x" })).rejects.toThrow(/Sign in first/);
  });
});
