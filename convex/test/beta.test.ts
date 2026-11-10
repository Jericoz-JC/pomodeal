import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
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
