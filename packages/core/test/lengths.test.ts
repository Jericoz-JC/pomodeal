// Spec 007: study lengths. Long blocks, break scaling, the 75-minute ceiling, heads-up, halfway and dial ticks.
import { describe, expect, it } from "vitest";
import {
  FOCUS_CEILING_MIN, FOCUS_LENGTHS, FOCUS_LONG, FOCUS_QUICK, advance, applyBonus, buildSession, canOfferBonus,
  dealProblem, dialTicks, focusMinutesDone, headsUpMs, pushTimes, isHalfway, isHeadsUp, isLongFocus, makeOffer, type SessionState,
} from "../src";

const T0 = 1_700_000_000_000;
const MIN = 60_000;
const deal = (focusMin: number, activity: string | null = "Reels") => ({ activity, breakMin: 10, task: "Reading", focusMin });
const focusMins = (s: SessionState) => s.blocks.filter((b) => b.type === "focus").map((b) => b.min);
/** breaks between focus blocks (skips the first, chosen break) */
const laterBreaks = (s: SessionState) => s.blocks.slice(1).filter((b) => b.type === "break").map((b) => b.min);

describe("1. lengths on offer", () => {
  it("offers five quick and three longer lengths", () => {
    expect(FOCUS_QUICK).toEqual([5, 8, 12, 15, 20]);
    expect(FOCUS_LONG).toEqual([30, 45, 60]);
    expect(FOCUS_LENGTHS).toEqual([5, 8, 12, 15, 20, 30, 45, 60]);
  });
  it("calls 30 and up long", () => {
    expect(isLongFocus(20)).toBe(false);
    expect(isLongFocus(30)).toBe(true);
    expect(isLongFocus(60)).toBe(true);
  });
});

// Spec 010 makes a deal one sitting (sitting.test.ts); these rules still shape the older multi-block sessions that
// were running when it shipped, and the next-round ticket reuses the break rule.
describe("2–4. building an older multi-block session", () => {
  it("ramps quick lengths up to max(25, chosen)", () => {
    expect(focusMins(buildSession(deal(8), T0, 3))).toEqual([8, 12, 16]);
    expect(focusMins(buildSession(deal(20), T0, 3))).toEqual([20, 24, 25]);
  });
  it("starts long lengths at full length and holds", () => {
    expect(focusMins(buildSession(deal(30), T0, 3))).toEqual([30, 30, 30]);
    expect(focusMins(buildSession(deal(60), T0, 2))).toEqual([60, 60]);
  });
  it("keeps 5 and 7 min breaks for quick sessions", () => {
    expect(laterBreaks(buildSession(deal(8), T0, 3))).toEqual([5, 7]);
  });
  it("makes a long block's break a quarter of it", () => {
    expect(laterBreaks(buildSession(deal(30), T0, 3))).toEqual([8, 8]);
    expect(laterBreaks(buildSession(deal(45), T0, 2))).toEqual([11]);
    expect(laterBreaks(buildSession(deal(60), T0, 2))).toEqual([15]);
  });
  it("keeps the chosen first break and works with no break", () => {
    const s = buildSession(deal(60), T0);
    expect(s.blocks[0]).toMatchObject({ type: "break", label: "Reels", min: 10 });
    const n = buildSession(deal(60, null), T0, 2);
    expect(n.blocks.map((b) => b.type)).toEqual(["focus", "break", "focus"]);
    expect(n.durMs).toBe(60 * MIN);
  });
});

describe("5–6. the 75-minute ceiling", () => {
  it("lets a 60 take the full +15 in trades", () => {
    const s: SessionState = { ...buildSession(deal(60), T0), askCount: 1 };
    s.blocks[1] = { ...s.blocks[1], added: 10, min: 70 };
    expect(makeOffer(s).terms.map((t) => t.kind)).toEqual(["borrow", "trade"]);
  });
  it("offers no trade that would pass 75", () => {
    const s: SessionState = { ...buildSession(deal(60), T0), askCount: 1 };
    s.blocks[1] = { ...s.blocks[1], min: 72 };
    expect(makeOffer(s).terms.map((t) => t.kind)).toEqual(["borrow"]);
  });
  it("offers the bonus on a 60 but not on a 70", () => {
    const onFocus = advance(buildSession(deal(60), T0), T0);
    expect(canOfferBonus(onFocus, false)).toBe(true);
    expect(applyBonus(onFocus, T0).session.blocks[1].min).toBe(70);
    const traded = { ...onFocus, blocks: onFocus.blocks.map((b, i) => (i === 1 ? { ...b, min: 70 } : b)) };
    expect(canOfferBonus(traded, false)).toBe(false);
    expect(FOCUS_CEILING_MIN).toBe(75);
  });
});

describe("7. heads-up", () => {
  it("is 5 min on blocks of 45+, 2 min otherwise", () => {
    expect(headsUpMs(60 * MIN)).toBe(5 * MIN);
    expect(headsUpMs(45 * MIN)).toBe(5 * MIN);
    expect(headsUpMs(30 * MIN)).toBe(2 * MIN);
    expect(headsUpMs(8 * MIN)).toBe(2 * MIN);
  });
  it("flags the long heads-up from the stored start", () => {
    const s = { startedAt: T0, durMs: 60 * MIN };
    expect(isHeadsUp(s, T0 + 56 * MIN)).toBe(true);
    expect(isHeadsUp(s, T0 + 54 * MIN)).toBe(false);
  });
});

describe("8. halfway", () => {
  const on = (focusMin: number) => advance(buildSession(deal(focusMin), T0), T0);
  it("shows for 3 min after the midpoint of a 45+ focus block", () => {
    const s = on(60);
    expect(isHalfway(s, T0 + 29 * MIN)).toBe(false);
    expect(isHalfway(s, T0 + 30 * MIN)).toBe(true);
    expect(isHalfway(s, T0 + 32.9 * MIN)).toBe(true);
    expect(isHalfway(s, T0 + 33 * MIN)).toBe(false);
    expect(isHalfway(on(45), T0 + 23 * MIN)).toBe(true);
  });
  it("never shows on shorter blocks or breaks", () => {
    expect(isHalfway(on(30), T0 + 15 * MIN)).toBe(false);
    const brk: SessionState = { ...buildSession(deal(60), T0), durMs: 60 * MIN };
    expect(isHalfway(brk, T0 + 30 * MIN)).toBe(false);
  });
});

describe("9. dial ticks", () => {
  it("keeps only the 12 o'clock major when the block doesn't divide evenly", () => {
    expect(dialTicks(8)).toEqual({ minor: 8, majorEvery: 8 });
    expect(dialTicks(12)).toEqual({ minor: 12, majorEvery: 12 });
    expect(dialTicks(13)).toEqual({ minor: 13, majorEvery: 13 });
    expect(dialTicks(50)).toEqual({ minor: 50, majorEvery: 50 });
  });
  it("draws one tick per block minute, majors every 5 up to 30 and every 15 above", () => {
    expect(dialTicks(10)).toEqual({ minor: 10, majorEvery: 5 });
    expect(dialTicks(30)).toEqual({ minor: 30, majorEvery: 5 });
    expect(dialTicks(45)).toEqual({ minor: 45, majorEvery: 15 });
    expect(dialTicks(60)).toEqual({ minor: 60, majorEvery: 15 });
    expect(dialTicks(75)).toEqual({ minor: 75, majorEvery: 15 });
  });
});

describe("10. validating a deal", () => {
  it("accepts every offered length", () => {
    for (const f of FOCUS_LENGTHS) expect(dealProblem(deal(f))).toBeNull();
  });
  it("rejects lengths that aren't on offer", () => {
    expect(dealProblem(deal(40))).not.toBeNull();
    expect(dealProblem({ ...deal(30), breakMin: 0 })).not.toBeNull();
    expect(dealProblem({ ...deal(30), breakMin: 31 })).not.toBeNull();
    expect(dealProblem({ ...deal(30), breakMin: 2.5 })).not.toBeNull();
  });
});

describe("spec 008: credited minutes and push times", () => {
  const sess = (focusMin: number, activity: string | null = null) => ({ ...buildSession(deal(focusMin, activity), T0), startedAt: T0 });
  it("focusMinutesDone is whole minutes of the current focus block, capped, 0 on a break", () => {
    expect(focusMinutesDone(sess(15), T0 + 7.5 * MIN)).toBe(7);
    expect(focusMinutesDone(sess(15), T0 + 20 * MIN)).toBe(15);
    expect(focusMinutesDone(sess(15, "Reels"), T0 + 5 * MIN)).toBe(0);
  });
  it("pushTimes lists the future heads-up and block end for the current block", () => {
    expect(pushTimes(sess(15), T0)).toEqual([{ kind: "headsUp", at: T0 + 13 * MIN }, { kind: "blockEnd", at: T0 + 15 * MIN }]);
    expect(pushTimes(sess(60), T0)).toEqual([{ kind: "headsUp", at: T0 + 55 * MIN }, { kind: "blockEnd", at: T0 + 60 * MIN }]);
    expect(pushTimes(sess(15), T0 + 14 * MIN)).toEqual([{ kind: "blockEnd", at: T0 + 15 * MIN }]);
  });
});
