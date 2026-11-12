// Issue #26: the study day. A day of studying runs from 4am to 4am local time, so a deal made at 1am belongs to
// the night it was part of: on the tape, on tonight's plan and in a big one's worked days.
// Unlike days.ts, these read the device's local time, so only clients call them; the server only sees the
// keys and instants they produce.

/** The local hour a study day starts. */
export const STUDY_DAY_STARTS_AT = 4;

/** The start of the study day `ms` falls in, as epoch ms (4am local, today or the day before). */
export function studyDayStart(ms: number): number {
  const d = new Date(ms);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), STUDY_DAY_STARTS_AT);
  if (start.getTime() <= ms) return start.getTime();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1, STUDY_DAY_STARTS_AT).getTime();
}

/** The study day `ms` falls in, as the "YYYY-MM-DD" key of the date it started on. */
export function studyDayKey(ms: number): string {
  const d = new Date(studyDayStart(ms));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Milliseconds from `ms` to the next study day's start (at least 1 s, so a re-arm never spins). */
export function msToNextStudyDay(ms: number): number {
  const d = new Date(studyDayStart(ms));
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, STUDY_DAY_STARTS_AT).getTime();
  return Math.max(1000, next - ms);
}
