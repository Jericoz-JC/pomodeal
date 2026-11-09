// Type-only imports: Convex bundles every non-.test file under convex/ on deploy/codegen,
// so this file must not use import.meta or runtime test deps. Each *.test.ts builds its own
// `t` (convexTest + import.meta.glob) and passes it here.
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
