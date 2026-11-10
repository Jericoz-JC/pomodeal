// Spec 010: one ticket, one sitting. A deal is the break you chose, one focus block, then done; the next round is a
// fresh ticket; borrowed minutes come off its break; a deal that ran its full time is filed as `done`.
import { describe, expect, it } from "vitest";
import {
  advance, applyBonus, buildSession, canOfferBonus, endEntry, nextRound, pushBody, repayDebt, type SessionState,
} from "../src";

const T0 = 1_700_000_000_000;
const MIN = 60_000;
const deal = (focusMin: number, activity: string | null = "Reels") => ({ activity, breakMin: 10, task: "Reading, BIO 180 ch. 7", focusMin });
/** the focus block, `left` minutes before it ends */
const onFocus = (s: SessionState, left = 0): SessionState => {
  const a = s.blocks[s.idx].type === "focus" ? s : advance(s, T0);
  return { ...a, startedAt: T0 - (a.durMs - left * MIN) };
};

describe("a deal is one sitting", () => {
  it("is the break you chose, then one focus block", () => {
    expect(buildSession(deal(30), T0).blocks).toEqual([
      { type: "break", label: "Reels", min: 10 },
      { type: "focus", label: "Reading, BIO 180 ch. 7", min: 30 },
    ]);
  });
  it("is one focus block when no break was chosen", () => {
    const s = buildSession(deal(8, null), T0);
    expect(s.blocks).toEqual([{ type: "focus", label: "Reading, BIO 180 ch. 7", min: 8 }]);
    expect(s.durMs).toBe(8 * MIN);
  });
});

describe("nextRound", () => {
  it("steps quick lengths up one notch, with a 5 min break of the same activity", () => {
    expect(nextRound(buildSession(deal(5), T0))).toEqual({ activity: "Reels", breakMin: 5, task: "Reading, BIO 180 ch. 7", focusMin: 8 });
    expect(nextRound(buildSession(deal(8), T0)).focusMin).toBe(12);
    expect(nextRound(buildSession(deal(15), T0)).focusMin).toBe(20);
    expect(nextRound(buildSession(deal(20), T0)).focusMin).toBe(20);
  });
  it("repeats long lengths, with a break a quarter of the block", () => {
    expect(nextRound(buildSession(deal(30), T0))).toMatchObject({ focusMin: 30, breakMin: 8 });
    expect(nextRound(buildSession(deal(45), T0))).toMatchObject({ focusMin: 45, breakMin: 11 });
    expect(nextRound(buildSession(deal(60), T0))).toMatchObject({ focusMin: 60, breakMin: 15 });
  });
  it("offers an unnamed break after a deal that had none", () => {
    expect(nextRound(buildSession(deal(8, null), T0))).toMatchObject({ activity: "Your pick", breakMin: 5, focusMin: 12 });
  });
  it("reads the length chosen, not minutes added by trades or the bonus", () => {
    const s = onFocus(buildSession(deal(8), T0));
    const traded: SessionState = { ...s, blocks: s.blocks.map((b) => (b.type === "focus" ? { ...b, min: 13, added: 5 } : b)) };
    expect(nextRound(traded).focusMin).toBe(12);
    expect(nextRound(applyBonus(onFocus(buildSession(deal(30), T0)), T0).session).focusMin).toBe(30);
    // 8 + the 10 more is 18, which must not read as a 15 and step up to 20
    expect(nextRound(applyBonus(onFocus(buildSession(deal(8), T0)), T0).session).focusMin).toBe(12);
  });
});

describe("repayDebt", () => {
  it("takes borrowed minutes off the next deal's break, down to 2 min, and clears the rest", () => {
    expect(repayDebt({ ...deal(12), breakMin: 5 }, 5)).toEqual({ deal: { ...deal(12), breakMin: 2 }, repaid: 3, forgiven: 2 });
    expect(repayDebt({ ...deal(12), breakMin: 10 }, 5)).toEqual({ deal: { ...deal(12), breakMin: 5 }, repaid: 5, forgiven: 0 });
  });
  it("changes nothing without debt, and clears it all when the next deal has no break", () => {
    expect(repayDebt(deal(12), 0)).toEqual({ deal: deal(12), repaid: 0, forgiven: 0 });
    expect(repayDebt(deal(12, null), 5)).toEqual({ deal: deal(12, null), repaid: 0, forgiven: 5 });
  });
});

describe("endEntry", () => {
  it("files done, dated when the block ended, once the deal ran its full time", () => {
    const s = onFocus(buildSession(deal(30), T0));
    const ended = s.startedAt + s.durMs;
    expect(endEntry(s, ended + 9 * 60 * MIN)).toEqual({ at: ended, kind: "done", blockLabel: "Reading, BIO 180 ch. 7", minutes: 30 });
  });
  it("files end_early with the minutes done when stopped before the time is up", () => {
    const s = onFocus(buildSession(deal(30), T0), 12);
    expect(endEntry(s, T0, "History paper")).toEqual({ at: T0, kind: "end_early", blockLabel: "History paper", minutes: 18 });
  });
  it("files end_early when an older session with blocks still to come is stopped at a block end", () => {
    const s = onFocus(buildSession(deal(8), T0, 3));
    expect(endEntry(s, s.startedAt + s.durMs).kind).toBe("end_early");
  });
});

describe("the end of a sitting", () => {
  it("offers the 10 more minutes on the last block, once, never past the ceiling", () => {
    const s = onFocus(buildSession(deal(30), T0));
    expect(canOfferBonus(s, false)).toBe(true);
    expect(canOfferBonus(applyBonus(s, T0).session, false)).toBe(false);
    const long = onFocus(buildSession(deal(60), T0));
    expect(canOfferBonus({ ...long, blocks: long.blocks.map((b) => (b.type === "focus" ? { ...b, min: 70 } : b)) }, false)).toBe(false);
  });
  it("says the deal is done in the block-end push", () => {
    expect(pushBody(onFocus(buildSession(deal(30), T0)), "blockEnd")).toBe("Reading, BIO 180 ch. 7 is done. That was the deal.");
  });
});
