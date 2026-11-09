// Spec 008: big ones. Types, copy tables and validation.
import { describe, expect, it } from "vitest";
import { bigOneProblem, bookmarkPlaceholder, cleanLine, doneQuestion, firstMoveFor, splitSlots } from "../src";

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
