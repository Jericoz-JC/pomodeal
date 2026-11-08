// The ten cases from docs/specs/001-negotiation-rules.md, plus timer math.
import { describe, expect, it } from "vitest";
import {
  advance, applyBonus, applyTerm, borrowPreview, buildSession, canOfferBonus, dialLabel, earnedBreak,
  endSession, isHeadsUp, makeOffer, nextFocusLength, remainingMs, type SessionState,
} from "../src";

const T0 = 1_700_000_000_000;
const deal = { activity: "Reels", breakMin: 10, task: "Reading", focusMin: 8 };
const fresh = (): SessionState => buildSession(deal, T0);
const withAsks = (n: number): SessionState => ({ ...fresh(), askCount: n });

describe("makeOffer", () => {
  it("1. first ask is a single freebie, plus the override", () => {
    const o = makeOffer(fresh());
    expect(o.terms).toEqual([{ kind: "freebie", addMin: 5 }]);
    expect(o.requiresIntention).toBe(false);
    expect(o.override.kind).toBe("override");
  });
  it("2. second ask offers borrow and trade, no intention", () => {
    const o = makeOffer(withAsks(1));
    expect(o.terms.map((t) => t.kind)).toEqual(["borrow", "trade"]);
    expect(o.requiresIntention).toBe(false);
  });
  it("3. third ask requires an intention", () => {
    expect(makeOffer(withAsks(2)).requiresIntention).toBe(true);
  });
  it("6. no trade once the next focus is already +15", () => {
    const s = withAsks(1);
    s.blocks[1] = { ...s.blocks[1], added: 15 };
    expect(makeOffer(s).terms.map((t) => t.kind)).toEqual(["borrow"]);
  });
  it("10. the override is always present", () => {
    for (const n of [0, 1, 2, 5]) expect(makeOffer(withAsks(n)).override).toEqual({ kind: "override", addMin: 5 });
  });
});

describe("borrow", () => {
  it("4. repayment respects the 2-minute floor and carries the rest as debt", () => {
    const s = withAsks(1); // blocks: break Reels 10, focus 8, break 5, ...
    expect(borrowPreview(s)).toEqual({ from: 5, to: 2, carry: 2 });
    const { session, entry } = applyTerm(s, { kind: "borrow", addMin: 5, repayMin: 5 }, T0);
    expect(session.blocks[2].min).toBe(2);
    expect(session.debt).toBe(2);
    expect(session.blocks[0].min).toBe(15);
    expect(session.durMs).toBe(s.durMs + 5 * 60_000);
    expect(entry).toMatchObject({ kind: "borrow", blockLabel: "Reels", minutes: 5 });
  });
  it("does not mutate the input session", () => {
    const s = withAsks(1);
    const before = JSON.stringify(s);
    applyTerm(s, { kind: "borrow", addMin: 5, repayMin: 5 }, T0);
    expect(JSON.stringify(s)).toBe(before);
  });
  it("5. leftover debt is forgiven at session end", () => {
    const s = applyTerm(withAsks(1), { kind: "borrow", addMin: 5, repayMin: 5 }, T0).session;
    expect(endSession(s, T0)).toMatchObject({ kind: "forgiven", minutes: 2 });
    expect(endSession(fresh(), T0)).toBeNull();
  });
});

describe("trade and bonus", () => {
  it("trade lengthens the next focus and records it", () => {
    const { session } = applyTerm(withAsks(1), { kind: "trade", addMin: 5, addToNextFocusMin: 5 }, T0);
    expect(session.blocks[1]).toMatchObject({ min: 13, added: 5 });
  });
  it("7. bonus is not offered after a pause, and not twice in a row", () => {
    const onFocus = advance(fresh(), T0);
    expect(canOfferBonus(onFocus, false)).toBe(true);
    expect(canOfferBonus(onFocus, true)).toBe(false);
    const { session } = applyBonus(onFocus, T0);
    expect(session.blocks[1].min).toBe(18);
    expect(session.blocks[2].min).toBe(8);
    expect(canOfferBonus(session, false)).toBe(false);
  });
});

describe("ramp-up and earned breaks", () => {
  it("8. focus grows 8 → 12 → 16 without overrides and holds after one", () => {
    expect(nextFocusLength(8, false)).toBe(12);
    expect(nextFocusLength(12, false)).toBe(16);
    expect(nextFocusLength(12, true)).toBe(12);
    expect(nextFocusLength(24, false)).toBe(25);
  });
  it("9. earned mode: 30 min focus at 1:3 earns a 10 min break", () => {
    expect(earnedBreak(30)).toBe(10);
    expect(earnedBreak(4)).toBe(3);
    expect(earnedBreak(200)).toBe(30);
  });
});

describe("timer", () => {
  it("computes remaining time from the stored start", () => {
    const s = fresh();
    expect(remainingMs(s, T0 + 60_000)).toBe(9 * 60_000);
    expect(remainingMs(s, T0 + 11 * 60_000)).toBe(0);
  });
  it("flags the 2-minute heads-up", () => {
    const s = fresh();
    expect(isHeadsUp(s, T0 + 8 * 60_000 + 1)).toBe(true);
    expect(isHeadsUp(s, T0 + 7 * 60_000)).toBe(false);
    expect(isHeadsUp(s, T0 + 10 * 60_000)).toBe(false);
  });
  it("labels the dial in minutes, then m:ss, then 0:00", () => {
    expect(dialLabel(6.3 * 60_000)).toBe("7");
    expect(dialLabel(63_000)).toBe("1:03");
    expect(dialLabel(0)).toBe("0:00");
  });
});
