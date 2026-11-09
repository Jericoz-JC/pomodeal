import { expect, test } from "vitest";
import { api } from "../_generated/api";
import { makeMember } from "./helpers.test-util";
import { newT } from "./setup.test-util";

test("a member starts a 15 min deal and sees a running session with 3 focus blocks", async () => {
  const t = newT();
  const { as } = await makeMember(t, "Ada");
  await as.mutation(api.sessions.start, {
    deal: { activity: null, breakMin: 5, task: "read chapter 3", focusMin: 15 },
  });
  const s = await as.query(api.sessions.current, {});
  expect(s?.status).toBe("running");
  const focus = s!.state.blocks.filter((b) => b.type === "focus");
  expect(focus.map((b) => b.min)).toEqual([15, 19, 23]);
});
