// Spec 012 "Tonight in a line": one sentence of assignments, each a size and a name, printed as sittings.
import { describe, expect, it } from "vitest";
import {
  NIGHT_MAX_ITEMS, NIGHT_SIZES, applyBonus, buildSession, nightFit, nightProblem, nightRound, parseNightItem, sittingsOf,
  type KnownName, type NightItem,
} from "../src";

const T0 = 1_700_000_000_000;
const MIN = 60_000;
const known: KnownName[] = [
  { title: "BIO 180 midterm", taskId: "t1", minutes: 45, piece: "Practice exam" },
  { title: "BIO 180 ch. 7" },
  { title: "Orgo problem set 4" },
];

describe("sizes", () => {
  it("are the eight on offer, from the deal's lengths", () => {
    expect(NIGHT_SIZES).toEqual([[1, 15], [1, 20], [1, 30], [1, 45], [2, 30], [2, 45], [3, 30], [3, 45]]);
    expect(NIGHT_MAX_ITEMS).toBe(6);
  });
});

describe("parseNightItem", () => {
  it("keeps a number that isn't a size: orgo set 4", () => {
    expect(parseNightItem("orgo set 4", [])).toEqual({ title: "Orgo set 4", sittings: 1, minutes: 20 });
  });
  it("matches a known name and keeps its number", () => {
    expect(parseNightItem("orgo set 4", known)).toEqual({ title: "Orgo problem set 4", sittings: 1, minutes: 20 });
  });
  it("reads an hour as two sittings of 30", () => {
    expect(parseNightItem("history paper 1h", [])).toEqual({ title: "History paper", sittings: 2, minutes: 30 });
  });
  it("reads 1h30, 2h, 45m and 45 min", () => {
    expect(parseNightItem("essay 1h30", [])).toMatchObject({ sittings: 2, minutes: 45 });
    expect(parseNightItem("essay 2h", [])).toMatchObject({ sittings: 3, minutes: 45 });
    expect(parseNightItem("essay 45m", [])).toMatchObject({ sittings: 1, minutes: 45 });
    expect(parseNightItem("essay 45 min", [])).toMatchObject({ sittings: 1, minutes: 45 });
  });
  it("snaps 50m to 45, and keeps a bare 50 as part of the name", () => {
    expect(parseNightItem("reading 50m", [])).toMatchObject({ title: "Reading", sittings: 1, minutes: 45 });
    expect(parseNightItem("reading 50", [])).toMatchObject({ title: "Reading 50", minutes: 20 });
  });
  it("takes a bare number as a size only when it is one", () => {
    expect(parseNightItem("reading 45", [])).toMatchObject({ title: "Reading", minutes: 45 });
    expect(parseNightItem("bio ch 7", [])).toMatchObject({ title: "Bio ch 7" });
  });
  it("matches bio ch 7 to BIO 180 ch. 7, not the midterm", () => {
    expect(parseNightItem("bio ch 7", known)).toEqual({ title: "BIO 180 ch. 7", sittings: 1, minutes: 20 });
  });
  it("takes a big one's id, its next piece and its piece's size", () => {
    expect(parseNightItem("midterm", known)).toEqual({ title: "BIO 180 midterm", taskId: "t1", piece: "Practice exam", sittings: 1, minutes: 45 });
  });
  it("is nothing for a blank item", () => {
    expect(parseNightItem("  ", [])).toBeNull();
  });
  it("cuts a long name to 80 characters", () => {
    expect(parseNightItem("a".repeat(100), [])!.title).toHaveLength(80);
  });
});

const items: NightItem[] = [
  { title: "History paper", sittings: 2, minutes: 45 },
  { title: "BIO 180 midterm", taskId: "t1", sittings: 1, minutes: 30, piece: "Practice exam" },
];

describe("sittingsOf", () => {
  it("is the flat list in sentence order", () => {
    expect(sittingsOf(items)).toEqual([
      { title: "History paper", minutes: 45, k: 0, of: 2 },
      { title: "History paper", minutes: 45, k: 1, of: 2 },
      { title: "BIO 180 midterm", taskId: "t1", piece: "Practice exam", minutes: 30, k: 0, of: 1 },
    ]);
  });
});

describe("nightFit", () => {
  it("puts a quarter-length break between two 45-minute sittings", () => {
    const fit = nightFit(sittingsOf([{ title: "History paper", sittings: 2, minutes: 45 }]), T0);
    expect(fit).toEqual({ focusMin: 90, breakMin: 11, doneAt: T0 + 101 * MIN });
  });
  it("counts five minutes after a quick sitting, and the deal's own break first", () => {
    const fit = nightFit(sittingsOf([{ title: "A", sittings: 1, minutes: 20 }, { title: "B", sittings: 1, minutes: 30 }]), T0, 10);
    expect(fit).toEqual({ focusMin: 50, breakMin: 15, doneAt: T0 + 65 * MIN });
  });
  it("is nothing for no sittings", () => {
    expect(nightFit([], T0)).toEqual({ focusMin: 0, breakMin: 0, doneAt: T0 });
  });
});

describe("nightRound", () => {
  const deal = { activity: "Reels", breakMin: 10, task: "History paper", focusMin: 45 };
  it("is the next sitting with the break between rounds, of the same activity", () => {
    const s = buildSession(deal, T0);
    expect(nightRound(s, sittingsOf(items)[2])).toEqual({ activity: "Reels", breakMin: 11, task: "BIO 180 midterm", focusMin: 30 });
  });
  it("is an unnamed break when the deal had none, after the length chosen", () => {
    const s = applyBonus(buildSession({ ...deal, activity: null, focusMin: 20 }, T0), T0).session;
    expect(nightRound(s, sittingsOf(items)[0])).toEqual({ activity: "Your pick", breakMin: 5, task: "History paper", focusMin: 45 });
  });
});

describe("nightProblem", () => {
  it("accepts one to six items", () => {
    expect(nightProblem({ items })).toBeNull();
  });
  it("refuses none and seven", () => {
    expect(nightProblem({ items: [] })).not.toBeNull();
    expect(nightProblem({ items: Array.from({ length: 7 }, () => items[0]) })).not.toBeNull();
  });
  it("refuses a blank or long title", () => {
    expect(nightProblem({ items: [{ ...items[0], title: " " }] })).not.toBeNull();
    expect(nightProblem({ items: [{ ...items[0], title: "a".repeat(81) }] })).not.toBeNull();
    expect(nightProblem({ items: [{ ...items[0], title: "a".repeat(80) }] })).toBeNull();
  });
  it("refuses a size that isn't on offer", () => {
    expect(nightProblem({ items: [{ ...items[0], sittings: 2, minutes: 20 }] })).not.toBeNull();
    expect(nightProblem({ items: [{ ...items[0], sittings: 4, minutes: 30 }] })).not.toBeNull();
  });
});
