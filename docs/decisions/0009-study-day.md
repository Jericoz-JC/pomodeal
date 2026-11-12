# 0009: A study day runs from 4am to 4am

Date: 2026-11-12. Status: accepted by Chris, Nov 12.

## Context

"Today's deals" showed yesterday's rows ([issue #26](https://github.com/Jericoz-JC/pomodeal/issues/26)). At 11:19am Thursday the tape listed Wednesday's 11:56am and 12:11pm deals under Thursday's, with times only, so it read as a broken timeline, and the tape's totals counted them too.

`sessions.today` returned the 24 hours before a `now` the client sent. ADR 0006 moved `now` forward every hour so a phone left open overnight wouldn't keep an old window, but the window was still 24 hours wide: yesterday's rows stayed until the same clock time today.

The tape should show today. A midnight cutoff fits the calendar but not a student who studies late: a deal started at 11:50pm would leave the tape at midnight while its block was still running, and tonight's plan would vanish at midnight halfway through the night.

## Decision

- **A study day runs from 4am to 4am local time.** A deal made at 1am belongs to the night before.
- **It is the app's only day.** The tape, tonight's plan, the day a big one is credited to, due dates and spreads, the comeback card and the weekly check-in all use it. One boundary means the tape and the cards can never disagree about which day a deal was on.
- `packages/core/src/studyDay.ts` holds `studyDayKey`, `studyDayStart` and `msToNextStudyDay`. They read local time, so only clients call them; the server still only sees day keys and instants.
- `sessions.today` takes `from`, the study day's start. The client subscribes again when the next study day starts and when the app comes back to the front on a later study day.

## Consequences

- The tape and its totals start empty at 4am and hold only that study day's rows.
- Between midnight and 4am, "Tomorrow" on the due chips is the day after the night you're in, which is what a student up at 1am means by it.
- A night or big-one day written between midnight and 4am before this change is keyed by the calendar date, so the first night after the deploy may look a day off in that window. Nothing to migrate.
- `sessions.today` still accepts the old `now` (24 hours before it) for an app opened before the deploy. Drop it a release later.
- No new stored field, so the privacy inventory doesn't change.
