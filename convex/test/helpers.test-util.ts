// Type-only imports. Multi-dot names (*.test-util.ts) are skipped by the Convex bundler,
// so nothing here is deployed. Tests build `t` with newT() from setup.test-util.ts
// and pass it here.
import type { TestConvexForDataModel } from "convex-test";
import type { DataModel, Id } from "../_generated/dataModel";

export type TestConvex = TestConvexForDataModel<DataModel>;

/** Inserts a `users` row and returns a client acting as that member (matches convex/lib/members.ts). */
export async function makeMember(t: TestConvex, name: string) {
  const tokenIdentifier = `https://test.pomodeal.app|${name}`;
  const userId: Id<"users"> = await t.run((ctx) =>
    ctx.db.insert("users", {
      tokenIdentifier,
      displayName: name,
      role: "member",
      inviteId: null,
      invitedBy: null,
      inviteAllowance: 0,
      joinedAt: Date.now(),
    }),
  );
  return { as: t.withIdentity({ tokenIdentifier }), userId };
}
