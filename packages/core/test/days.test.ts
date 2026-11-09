// Spec 008: day keys, open terms, progress, comeback, spread, card.
import { describe, expect, it } from "vitest";
import {
  addDays, addWorkedDay, cardFor, daysBetween, firstMoveFor, firstPaymentMinutes, isComeback,
  openTerms, progressLabel, proposeSpread, type BigOne, type Piece,
} from "../src";

const base: BigOne = { title: "Essay", workedMin: 0, openTermsMin: 60, firstMove: "Open doc", status: "open", workedDays: [] };
const piece = (o: Partial<Piece> = {}): Piece => ({ title: "p", minutes: 30, ...o });

describe("day keys", () => {
  it("addDays crosses month and year", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
  it("daysBetween ignores DST", () => {
    expect(daysBetween("2026-03-07", "2026-03-09")).toBe(2);
    expect(daysBetween("2026-11-01", "2026-11-03")).toBe(2);
    expect(daysBetween("2026-11-09", "2026-11-08")).toBe(-1);
  });
  it("addWorkedDay dedupes, newest first, caps at 30", () => {
    expect(addWorkedDay(["2026-11-08"], "2026-11-08")).toEqual(["2026-11-08"]);
    expect(addWorkedDay(["2026-11-07"], "2026-11-08")).toEqual(["2026-11-08", "2026-11-07"]);
    const many = Array.from({ length: 30 }, (_, i) => addDays("2026-01-01", i));
    const out = addWorkedDay(many, "2026-06-01");
    expect(out).toHaveLength(30);
    expect(out[0]).toBe("2026-06-01");
  });
});

describe("open terms and first payment", () => {
  it("openTerms", () => {
    expect(openTerms(120, 45)).toBe(75);
    expect(openTerms(120, 150)).toBe(0);
    expect(openTerms(undefined, 45)).toBeNull();
  });
  it("firstPaymentMinutes", () => {
    expect(firstPaymentMinutes({}, false)).toBe(15);
    expect(firstPaymentMinutes({ lastFocusMin: 30 }, true)).toBe(15);
    expect(firstPaymentMinutes({ lastFocusMin: 30 }, false)).toBe(30);
  });
});

describe("progressLabel", () => {
  const four = (n: number) => Array.from({ length: 4 }, (_, i) => piece(i < n ? { stampedAt: 1 } : {}));
  it("pieces", () => {
    expect(progressLabel({ taskType: "writing", pieces: four(1), workedMin: 0 })).toEqual({ kind: "stamped", n: 1 });
    expect(progressLabel({ taskType: "writing", pieces: four(3), workedMin: 0 })).toEqual({ kind: "toGo", n: 1 });
  });
  it("gut or worked time", () => {
    expect(progressLabel({ gutMin: 120, workedMin: 45 })).toEqual({ kind: "in", minutes: 45 });
    expect(progressLabel({ gutMin: 120, workedMin: 90 })).toEqual({ kind: "left", minutes: 30 });
    expect(progressLabel({ workedMin: 45 })).toEqual({ kind: "in", minutes: 45 });
  });
  it("exam with no pieces and no work shows nothing", () => {
    expect(progressLabel({ taskType: "exam", workedMin: 0 })).toBeNull();
  });
});

describe("isComeback", () => {
  const w = { ...base, workedDays: ["2026-11-08"] };
  it("gap of two days with open terms", () => {
    expect(isComeback(w, "2026-11-09")).toBe(false);
    expect(isComeback(w, "2026-11-10")).toBe(true);
  });
  it("no open terms left, done, or never worked", () => {
    expect(isComeback({ ...w, openTermsMin: 0 }, "2026-11-10")).toBe(false);
    expect(isComeback({ ...w, status: "done" }, "2026-11-10")).toBe(false);
    expect(isComeback({ ...base, workedDays: [] }, "2026-11-10")).toBe(false);
  });
  it("signed spread with a passed unstamped planned day", () => {
    const t = { ...w, openTermsMin: 0, spreadSignedAt: 1, pieces: [piece({ plannedDay: "2026-11-09" })] };
    expect(isComeback(t, "2026-11-10")).toBe(true);
  });
  it("midnight: worked yesterday is not a comeback", () => {
    const days = addWorkedDay([], "2026-11-08");
    expect(daysBetween(days[0], "2026-11-09")).toBe(1);
    expect(isComeback({ ...base, workedDays: days }, "2026-11-09")).toBe(false);
  });
});

describe("proposeSpread", () => {
  const three = [piece(), piece(), piece()];
  it("exam spreads over at least two days", () => {
    const s = proposeSpread({ taskType: "exam", pieces: three, openTermsMin: null }, "2026-11-08", "2026-11-11");
    expect(new Set(s.map((d) => d.day)).size).toBeGreaterThanOrEqual(2);
  });
  it("due today puts everything today", () => {
    const s = proposeSpread({ taskType: "exam", pieces: three, openTermsMin: null }, "2026-11-08", "2026-11-08");
    expect(s.every((d) => d.day === "2026-11-08")).toBe(true);
  });
  it("writing gets one piece a day", () => {
    const s = proposeSpread({ taskType: "writing", pieces: [piece(), piece(), piece(), piece()], openTermsMin: null }, "2026-11-08", "2026-11-11");
    expect(s.map((d) => d.day)).toEqual(["2026-11-08", "2026-11-09", "2026-11-10", "2026-11-11"]);
  });
  it("stays between today and due", () => {
    const s = proposeSpread({ taskType: "project", pieces: Array.from({ length: 9 }, () => piece()), openTermsMin: null }, "2026-11-08", "2026-11-11");
    for (const d of s) { expect(d.day >= "2026-11-08").toBe(true); expect(d.day <= "2026-11-11").toBe(true); }
  });
  it("no pieces splits open terms", () => {
    const s = proposeSpread({ openTermsMin: 120 }, "2026-11-08", "2026-11-10");
    expect(s).toEqual([
      { day: "2026-11-08", minutes: 40 }, { day: "2026-11-09", minutes: 40 }, { day: "2026-11-10", minutes: 40 },
    ]);
    const r = proposeSpread({ openTermsMin: 100 }, "2026-11-08", "2026-11-10");
    expect(r.map((d) => d.minutes)).toEqual([34, 33, 33]);
  });
});

describe("cardFor", () => {
  it("bookmark beats first move", () => {
    expect(cardFor({ ...base, bookmark: "Claim 2" }, "2026-11-08").startWith).toBe("Claim 2");
    expect(cardFor(base, "2026-11-08").startWith).toBe("Open doc");
  });
  it("comeback uses the comeback move and 15 minutes", () => {
    const t: BigOne = { ...base, taskType: "writing", bookmark: "Claim 2", lastFocusMin: 30, workedDays: ["2026-11-01"] };
    const c = cardFor(t, "2026-11-08");
    expect(c.comeback).toBe(true);
    expect(c.startWith).toBe(firstMoveFor("writing", true));
    expect(c.minutes).toBe(15);
    expect(c.offerRespread).toBe(false);
    expect(cardFor({ ...t, spreadSignedAt: 1 }, "2026-11-08").offerRespread).toBe(true);
  });
});
