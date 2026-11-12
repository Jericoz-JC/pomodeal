// The study day runs from 4am to 4am local time, so a late night is one night (issue #26).
// These read local time, so each test pins the zone it means.
import { afterEach, describe, expect, it, vi } from "vitest";
import { msToNextStudyDay, STUDY_DAY_STARTS_AT, studyDayKey, studyDayStart } from "../src";

afterEach(() => { vi.unstubAllEnvs(); });
const at = (y: number, mo: number, d: number, h: number, mi = 0) => new Date(y, mo - 1, d, h, mi).getTime();

describe("study day", () => {
  it("starts at 4am", () => {
    expect(STUDY_DAY_STARTS_AT).toBe(4);
  });

  it("before 4am still belongs to the day before", () => {
    vi.stubEnv("TZ", "America/Los_Angeles");
    expect(studyDayKey(at(2026, 11, 12, 1, 30))).toBe("2026-11-11");
    expect(studyDayKey(at(2026, 11, 12, 3, 59))).toBe("2026-11-11");
    expect(studyDayKey(at(2026, 11, 12, 4, 0))).toBe("2026-11-12");
    expect(studyDayKey(at(2026, 11, 12, 23, 59))).toBe("2026-11-12");
    expect(studyDayKey(at(2027, 1, 1, 2, 0))).toBe("2026-12-31");
  });

  it("starts at 4am local, the same day or the day before", () => {
    vi.stubEnv("TZ", "America/Los_Angeles");
    expect(studyDayStart(at(2026, 11, 12, 11, 19))).toBe(at(2026, 11, 12, 4));
    expect(studyDayStart(at(2026, 11, 12, 0, 30))).toBe(at(2026, 11, 11, 4));
    expect(studyDayStart(at(2026, 11, 12, 4, 0))).toBe(at(2026, 11, 12, 4));
  });

  it("yesterday's 11:56am and 12:11pm are before today's start (the bug in #26)", () => {
    vi.stubEnv("TZ", "America/Los_Angeles");
    const from = studyDayStart(at(2026, 11, 12, 11, 19));
    expect(at(2026, 11, 11, 11, 56)).toBeLessThan(from);
    expect(at(2026, 11, 11, 12, 11)).toBeLessThan(from);
    expect(at(2026, 11, 12, 10, 49)).toBeGreaterThanOrEqual(from);
  });

  it("counts down to the next 4am", () => {
    vi.stubEnv("TZ", "America/Los_Angeles");
    expect(msToNextStudyDay(at(2026, 11, 12, 23, 0))).toBe(5 * 3_600_000);
    expect(msToNextStudyDay(at(2026, 11, 12, 3, 0))).toBe(3_600_000);
    expect(msToNextStudyDay(at(2026, 11, 12, 4, 0))).toBe(24 * 3_600_000);
  });

  it("never re-arms at 0 ms", () => {
    vi.stubEnv("TZ", "America/Los_Angeles");
    expect(msToNextStudyDay(at(2026, 11, 12, 4, 0) - 1)).toBe(1000);
  });

  it("keeps 4am across a DST change (a 25-hour study day)", () => {
    vi.stubEnv("TZ", "America/Los_Angeles"); // clocks go back at 2am on 2026-11-01
    expect(studyDayStart(at(2026, 11, 1, 12, 0))).toBe(at(2026, 11, 1, 4));
    expect(msToNextStudyDay(at(2026, 10, 31, 4, 0))).toBe(25 * 3_600_000);
  });

  it("works east of UTC too", () => {
    vi.stubEnv("TZ", "Asia/Tokyo");
    expect(studyDayKey(at(2026, 11, 12, 2, 0))).toBe("2026-11-11");
    expect(studyDayStart(at(2026, 11, 12, 9, 0))).toBe(at(2026, 11, 12, 4));
  });
});
