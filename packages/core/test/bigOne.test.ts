// Spec 008: big ones. Types, copy tables and validation.
import { describe, expect, it } from "vitest";
import { cardsFor, AI_GLOBAL_DAILY, AI_MAX_PIECES, AI_USER_DAILY, aiAllowed, cleanSuggestion, scrubForAI, shouldAskCheckIn, weekKey, bigOneProblem, bookmarkPlaceholder, cleanLine, doneQuestion, firstMoveFor, splitSlots } from "../src";

describe("types and validation", () => {
  it("first moves per type, default and comeback", () => {
    expect(firstMoveFor("writing", false)).toBe("Open the doc and write one ugly sentence");
    expect(firstMoveFor("writing", true)).toBe("Read your last paragraph and fix one sentence");
    expect(firstMoveFor("problems", false)).toBe("Do problem 1 until you're stuck");
    expect(firstMoveFor("problems", true)).toBe("Reread your stuck question");
    expect(firstMoveFor("exam", false)).toBe("Quiz yourself on topic 1 without notes");
    expect(firstMoveFor("exam", true)).toBe("Recall three things from last time");
    expect(firstMoveFor("project", false)).toBe("Decide one thing: ___");
    expect(firstMoveFor("project", true)).toBe("Look at the last thing you made");
    expect(firstMoveFor(undefined, false)).toBe("");
    expect(firstMoveFor(undefined, true)).toBe("");
  });

  it("split slots per type", () => {
    expect(splitSlots("writing")).toEqual(["Intro", "Body", "Body", "Conclusion", "Revise"]);
    expect(splitSlots("problems")).toEqual(["Problems 1–3", "Problems 4–6", "Problems 7–9"]);
    expect(splitSlots("exam")).toEqual(["Topic 1", "Topic 2", "Topic 3"]);
    expect(splitSlots("project")).toEqual(["Decide", "Sketch", "Build", "Check"]);
    expect(splitSlots(undefined)).toEqual([""]);
  });

  it("done questions and bookmark placeholders", () => {
    expect(doneQuestion("writing")).toBe("Messy draft exists?");
    expect(doneQuestion("problems")).toBe("Tried each one, stuck ones written down?");
    expect(doneQuestion("exam")).toBe("Recalled each item once without notes?");
    expect(doneQuestion("project")).toBe("Decided or made?");
    expect(doneQuestion(undefined)).toBe("Done with this part?");
    expect(bookmarkPlaceholder("writing")).toBe("Claim for paragraph 2");
    expect(bookmarkPlaceholder("problems")).toBe("The question I'm stuck on");
    expect(bookmarkPlaceholder("exam")).toBe("Weak spot: …");
    expect(bookmarkPlaceholder("project")).toBe("Next visible thing: …");
    expect(bookmarkPlaceholder(undefined)).toBe("Where you'll pick up");
  });

  it("cleanLine trims and drops empties", () => {
    expect(cleanLine("   ")).toBeUndefined();
    expect(cleanLine(undefined)).toBeUndefined();
    expect(cleanLine("  claim  ")).toBe("claim");
  });

  it("bigOneProblem rejects bad input", () => {
    const ok = { title: "Essay" };
    expect(bigOneProblem(ok)).toBeNull();
    expect(bigOneProblem({ title: "" })).not.toBeNull();
    expect(bigOneProblem({ title: "   " })).not.toBeNull();
    expect(bigOneProblem({ title: "a".repeat(81) })).not.toBeNull();
    expect(bigOneProblem({ ...ok, pieces: Array.from({ length: 13 }, () => ({ title: "p", minutes: 30 })) })).not.toBeNull();
    expect(bigOneProblem({ ...ok, pieces: [{ title: "p", minutes: 4 }] })).not.toBeNull();
    expect(bigOneProblem({ ...ok, pieces: [{ title: "p", minutes: 241 }] })).not.toBeNull();
    expect(bigOneProblem({ ...ok, gutMin: 90 })).not.toBeNull();
    expect(bigOneProblem({ ...ok, bookmark: "b".repeat(141) })).not.toBeNull();
    expect(bigOneProblem({ ...ok, firstMove: "f".repeat(141) })).not.toBeNull();
  });

  it("bigOneProblem checks piece titles and whole-minute pieces", () => {
    const ok = { title: "Essay" };
    expect(bigOneProblem({ ...ok, pieces: [{ title: "", minutes: 30 }] })).not.toBeNull();
    expect(bigOneProblem({ ...ok, pieces: [{ title: "   ", minutes: 30 }] })).not.toBeNull();
    expect(bigOneProblem({ ...ok, pieces: [{ title: "p".repeat(81), minutes: 30 }] })).not.toBeNull();
    expect(bigOneProblem({ ...ok, pieces: [{ title: "p".repeat(80), minutes: 30 }] })).toBeNull();
    expect(bigOneProblem({ ...ok, pieces: [{ title: "p", minutes: 30.5 }] })).not.toBeNull();
    expect(bigOneProblem({ ...ok, pieces: [{ title: "p", minutes: Number.NaN }] })).not.toBeNull();
  });

  it("bigOneProblem accepts edge input", () => {
    expect(bigOneProblem({ title: "  " + "a".repeat(80) + "  " })).toBeNull();
    expect(bigOneProblem({ title: "😀".repeat(20) })).toBeNull();
    expect(bigOneProblem({ title: "😀".repeat(50) })).toBeNull();
    expect(bigOneProblem({ title: "😀".repeat(81) })).not.toBeNull();
    expect(bigOneProblem({ title: "x", pieces: Array.from({ length: 12 }, () => ({ title: "p", minutes: 30 })) })).toBeNull();
    expect(bigOneProblem({ title: "x", gutMin: 180, bookmark: "b".repeat(140),
      pieces: [{ title: "p", minutes: 5 }, { title: "q", minutes: 240 }] })).toBeNull();
  });
});

describe("AI limits, scrubbing and check-in week", () => {
  it("aiAllowed", () => {
    expect([AI_USER_DAILY, AI_GLOBAL_DAILY]).toEqual([10, 300]);
    expect(aiAllowed(9, 0)).toBe(true);
    expect(aiAllowed(10, 0)).toBe(false);
    expect(aiAllowed(0, 300)).toBe(false);
  });
  it("scrubForAI removes emails and phones", () => {
    const out = scrubForAI("Paper for jo@uw.edu call 206-555-0101");
    expect(out).not.toContain("jo@uw.edu");
    expect(out).not.toContain("206-555-0101");
    expect(out).toContain("Paper");
    expect(scrubForAI("a (206) 555-0101 b +1 206 555 0101 c")).toBe("a b c");
  });
  it("cleanSuggestion keeps 12 pieces, minutes in 5-minute steps from 5 to 240, titles up to 80, no empties", () => {
    const many = Array.from({ length: 15 }, (_, i) => ({ title: `Piece ${i + 1}`, minutes: 30 }));
    const out = cleanSuggestion({ pieces: many });
    expect(out).toHaveLength(AI_MAX_PIECES);
    expect(out[11]).toEqual({ title: "Piece 12", minutes: 30 });
    expect(cleanSuggestion({ pieces: [{ title: "a", minutes: 2 }, { title: "b", minutes: 999 }, { title: "c", minutes: 42 }, { title: "d", minutes: 47.6 }] }).map((p) => p.minutes))
      .toEqual([5, 240, 40, 50]);
    const long = "x".repeat(100);
    expect(cleanSuggestion({ pieces: [{ title: `  ${long}  `, minutes: 30 }] })[0].title).toHaveLength(80);
    expect(cleanSuggestion({ pieces: [{ title: "   ", minutes: 30 }, { title: "Outline", minutes: 20 }] })).toEqual([{ title: "Outline", minutes: 20 }]);
    // empties are dropped before the 12 are counted
    const padded = [{ title: "", minutes: 30 }, ...many];
    expect(cleanSuggestion({ pieces: padded })[0].title).toBe("Piece 1");
  });
  it("cleanSuggestion drops anything that isn't a piece", () => {
    expect(cleanSuggestion(null)).toEqual([]);
    expect(cleanSuggestion({ pieces: "Intro" })).toEqual([]);
    expect(cleanSuggestion({ pieces: [null, { title: 3, minutes: 30 }, { title: "Body", minutes: "30" }, { title: "Body", minutes: Number.NaN }, { title: "End", minutes: 25 }] }))
      .toEqual([{ title: "End", minutes: 25 }]);
  });
  it("weekKey and shouldAskCheckIn", () => {
    expect(weekKey("2026-11-08")).toBe("2026-11-08");
    expect(weekKey("2026-11-11")).toBe("2026-11-08");
    expect(shouldAskCheckIn("2026-11-11", "2026-11-08")).toBe(false);
    expect(shouldAskCheckIn("2026-11-15", "2026-11-08")).toBe(true);
    expect(shouldAskCheckIn("2026-11-11", undefined)).toBe(true);
  });
});

describe("cardsFor", () => {
  const base = { workedMin: 0, openTermsMin: null, firstMove: "Start", status: "open" as const, workedDays: [] as string[] };
  const TODAY = "2026-11-08";
  it("sorts comeback first, then newest lastWorkedAt; passes id, taskType, currentPiece", () => {
    const tasks = [
      { ...base, id: "a", title: "A", workedDays: ["2026-11-08"], lastWorkedAt: 100, taskType: "exam" as const },
      { ...base, id: "b", title: "B", workedDays: ["2026-11-08"], lastWorkedAt: 300 },
      { ...base, id: "c", title: "C", workedDays: ["2026-11-01"], lastWorkedAt: 50, taskType: "writing" as const,
        pieces: [{ title: "Intro", minutes: 30, stampedAt: 1 }, { title: "Body", minutes: 30 }, { title: "End", minutes: 30 }] },
    ];
    const cards = cardsFor(tasks, TODAY);
    expect(cards.map((c) => c.id)).toEqual(["c", "b", "a"]);
    expect(cards[0]).toMatchObject({ comeback: true, currentPiece: "Body", taskType: "writing", title: "C" });
    expect(cards[1].currentPiece).toBeUndefined();
    expect(cards[2].taskType).toBe("exam");
  });
  it("treats a missing lastWorkedAt as oldest", () => {
    const cards = cardsFor([{ ...base, id: "x", title: "X" }, { ...base, id: "y", title: "Y", lastWorkedAt: 5 }], TODAY);
    expect(cards.map((c) => c.id)).toEqual(["y", "x"]);
  });
});
