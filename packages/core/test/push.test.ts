// Spec 008 "Push": the words on a block-boundary push and the declarative payload around them.
import { describe, expect, it } from "vitest";
import { advance, buildSession, pushBody, pushPayload, type SessionState } from "../src";

const T0 = 1_700_000_000_000;
const deal = (focusMin: number, activity: string | null = "Reels") => ({ activity, breakMin: 10, task: "BIO 180 ch. 7", focusMin });
/** The session moved on to block `idx`. */
const at = (s: SessionState, idx: number): SessionState => {
  let out = s;
  while (out.idx < idx) out = advance(out, T0);
  return out;
};

describe("push body", () => {
  it("heads-up says 2 min on a short block, with the block's label", () => {
    const s = at(buildSession(deal(15), T0), 1); // focus 15
    expect(pushBody(s, "headsUp")).toBe("2 min to wrap up BIO 180 ch. 7.");
  });

  it("heads-up says 5 min on a block of 45+", () => {
    const s = at(buildSession(deal(45), T0), 1); // focus 45
    expect(pushBody(s, "headsUp")).toBe("5 min to wrap up BIO 180 ch. 7.");
  });

  it("heads-up on a break names the break", () => {
    expect(pushBody(buildSession(deal(15), T0), "headsUp")).toBe("2 min to wrap up Reels.");
  });

  it("end of a break names what is up next", () => {
    expect(pushBody(buildSession(deal(15), T0), "blockEnd")).toBe("BIO 180 ch. 7 is up next.");
  });

  it("end of a focus block says the break is ready", () => {
    const s = at(buildSession(deal(15), T0), 1);
    expect(pushBody(s, "blockEnd")).toBe("BIO 180 ch. 7 block is done. Your break is ready.");
  });

  it("end of the last focus block doesn't promise a break", () => {
    const s0 = buildSession(deal(15), T0);
    const s = at(s0, s0.blocks.length - 1);
    expect(pushBody(s, "blockEnd")).toBe("BIO 180 ch. 7 block is done. That was the last block.");
  });

  it("a break with no activity reads as your break", () => {
    const s = at(buildSession(deal(15, null), T0), 1); // "Your pick" break
    expect(s.blocks[s.idx].type).toBe("break");
    expect(pushBody(s, "headsUp")).toBe("2 min to wrap up your break.");
  });

  it("a lowercase next label still starts the sentence with a capital", () => {
    const s = buildSession({ ...deal(15), task: "reading" }, T0);
    expect(pushBody(s, "blockEnd")).toBe("Reading is up next.");
  });

  it("a blank label falls back to plain words", () => {
    const s = at(buildSession({ ...deal(15), task: "  " }, T0), 1);
    expect(pushBody(s, "headsUp")).toBe("2 min to wrap up this block.");
    expect(pushBody(s, "blockEnd")).toBe("This block is done. Your break is ready.");
  });
});

describe("push payload", () => {
  it("is declarative Web Push that opens the app", () => {
    const s = at(buildSession(deal(15), T0), 1);
    expect(pushPayload(s, "headsUp")).toEqual({
      web_push: 8030,
      notification: { title: "Pomodeal", body: "2 min to wrap up BIO 180 ch. 7.", navigate: "/" },
    });
  });
});
