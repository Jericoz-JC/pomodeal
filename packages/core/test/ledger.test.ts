// Ledger entries for what a student does outside an ask: making the deal, stopping, ending a block early
// (spec 001 "Ask: skip a break / end early"). Every outcome becomes a ledger entry.
import { describe, expect, it } from "vitest";
import { advance, buildSession, dealEntry, endEarlyEntry, skipEntry, type SessionState } from "../src";

const T0 = 1_700_000_000_000;
const MIN = 60_000;
const withBreak = (): SessionState => buildSession({ activity: "Reels", breakMin: 10, task: "Reading", focusMin: 15 }, T0);
const focusFirst = (focusMin = 60): SessionState => buildSession({ activity: null, breakMin: 5, task: "History paper", focusMin }, T0);

describe("dealEntry", () => {
  it("records the task and the focus length chosen, even when a planned break comes first", () => {
    expect(dealEntry(withBreak(), T0)).toEqual({ at: T0, kind: "deal", blockLabel: "Reading", minutes: 15 });
  });
  it("names a big one by its title when given one", () => {
    expect(dealEntry(focusFirst(), T0, "History paper, part 2")).toMatchObject({ kind: "deal", blockLabel: "History paper, part 2", minutes: 60 });
  });
});

describe("endEarlyEntry", () => {
  it("records the focus minutes done in the running block", () => {
    expect(endEarlyEntry(focusFirst(), T0 + 40 * MIN + 30_000)).toEqual({ at: T0 + 40 * MIN + 30_000, kind: "end_early", blockLabel: "History paper", minutes: 40 });
  });
  it("names the big one, not the break, when stopped during a break", () => {
    const s = advance(focusFirst(), T0 + 60 * MIN);
    expect(endEarlyEntry(s, T0 + 63 * MIN, "History paper")).toMatchObject({ kind: "end_early", blockLabel: "History paper", minutes: 0 });
    expect(endEarlyEntry(withBreak(), T0 + 2 * MIN)).toMatchObject({ blockLabel: "Reading", minutes: 0 });
  });
  it("never counts more than the block's length", () => {
    expect(endEarlyEntry(focusFirst(30), T0 + 90 * MIN).minutes).toBe(30);
  });
});

describe("skipEntry", () => {
  it("records the block that ended early and the whole minutes it ran", () => {
    expect(skipEntry(withBreak(), T0 + 6 * MIN + 59_000)).toEqual({ at: T0 + 6 * MIN + 59_000, kind: "skip", blockLabel: "Reels", minutes: 6 });
    expect(skipEntry(focusFirst(), T0 + 50 * MIN)).toMatchObject({ kind: "skip", blockLabel: "History paper", minutes: 50 });
  });
  it("is nothing once the block's time is up: moving on then isn't early", () => {
    expect(skipEntry(withBreak(), T0 + 10 * MIN)).toBeNull();
  });
});
