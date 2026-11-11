# Planning several things for one day

Research for [spec 012](../../specs/012-tonights-line.md). November 10, 2026. Two researchers on Claude Fable 5.2 read help docs, product pages, changelogs and current App Store screenshots (iTunes Search API, `screenshotUrls`) for nine apps; a third on Claude Opus 5.5 checked the claims that mattered. Nothing was installed or signed into, so how things feel comes from docs and screenshots, not use. Screenshots were kept out of the repo.

The question: when a student has two or three assignments tonight, how do these apps let them add several things at once, give each a length, cut a long one into blocks, and show the night?

## App by app

| App | Adding several | Giving time | Cutting a long one | Showing the day |
| --- | --- | --- | --- | --- |
| **Things 3** | One at a time (the plus button, or drag it to where the to-do goes). Paste a list: each line becomes a to-do, up to 100. | None. No lengths at all. | Checklist inside a to-do | Ordered list; "This Evening" under a moon. Nothing says whether it fits. |
| **Structured** | One task per editor, or the AI tab ("What do you need to schedule?", Generate, then Accept all / Edit / Discard). Pro only. | Start time plus a length from preset chips, on every timeline task | Subtasks as a checklist | A vertical line of pills whose height follows the length; the running one partly filled |
| **Tiimo** | Manual, or the Co-planner chat: one run-on sentence becomes one card per task | The AI suggests a slot and a length; you correct it | AI step-by-step breakdown with minutes | Grouped by Anytime / Morning / Day / Evening; a task can have a length and no clock time ("Anytime, 25 min") |
| **Todoist** | Quick Add parses as you type. Pasting several lines asks "Add X tasks?". AI: Ramble (voice) and Extract tasks (capped on lower plans). | Typed ("for 10m"), refused without a date and time | None | List, board or calendar; a one-day grid |
| **Sunsama** | One task per submit; a beta agent builds the plan from a rough note (2 to 4 minutes) | A planned-time chip per task (0:30, 1:00) | Auto-schedule splits tasks over an hour across free blocks | List first; a day total ("6:00") and a thin progress bar on the header. With no room: Schedule anyway / Schedule another day / Defer. |
| **Akiflow** | Command bar, one task per Enter; parsed words light up and become chips ("Today", "at 8AM") | Defaults to 30 min; drag onto the calendar | None (an open feature request) | Today list and a separate grid |
| **Motion** | A full form per task (about ten rows) | Fully automatic from length, deadline and priority | A minimum chunk length turns a 3h task into blocks labelled 1/3, 2/3, 3/3 | Calendar with red "!" badges, "Tasks past deadline", "Could not fit" |
| **Amie** | Enter in the to-do panel, or natural language in the command bar | Drag a to-do onto the calendar ("Release to schedule") | None | Calendar on top, to-dos underneath, one phone screen |
| **Notion** | One database row per task | Drag rows onto the calendar; needs a date property first | Two rows | A calendar grid; whatever status you built |

The check found one correction to the first pass: Todoist does have a non-AI multi-add (paste several lines, "Add X tasks?"). Motion's "Min chunk" label is only in search snippets of a help page that now redirects; Sunsama's three overflow choices appear only when auto-schedule can't find room, not as a whole-day check.

## What this means for Pomodeal

**Worth taking**

- **Several things in one go, no AI.** Things and Todoist split on new lines; nobody splits one typed line on commas. "History paper, orgo set 4, bio ch 7" in one line is open ground.
- **Show what was understood before you commit.** Todoist and Akiflow light up parsed words and let you tap one back. In Pomodeal the sentence itself can be that: what you typed becomes underlined words you can change.
- **A length without a clock time** (Tiimo's "Anytime, 25 min"). A night is an order and a size, not a grid; clock times follow from when you actually start.
- **Length as shape** (Structured's pills): a 45 min sitting looks bigger than a 20.
- **One total, said calmly** (Sunsama's "6:00" on the day header).
- **A long task cut into numbered sittings** (Motion's 1/3, 2/3), which maps directly onto a big one's pieces.

**Worth avoiding**

- A start time on every task (Structured, Todoist): one late start and the whole night needs re-timing.
- A form per task (Motion), a chat turn before you can type (Tiimo), a daily ritual or a wait (Sunsama's agent).
- A symbol language to learn (Todoist's `#`, `/`, `+`, `!`; Akiflow's `=`, `>`, `<`).
- Plans that reshuffle on their own (Motion), and overflow said as alarms ("past deadline", "Could not fit", red badges).
- Setup before use (Notion's databases).

## Sources

Things: culturedcode.com/things/features, culturedcode.com/things/support/articles/2803569. Structured: help.structured.app/en/articles/331074, /338306, /5724034. Tiimo: tiimoapp.com/faq/manage-tasks, tiimoapp.com/product/ai-planning. Todoist: todoist.com/help/articles/use-task-quick-add-in-todoist-va4Lhpzz, /add-or-manage-multiple-tasks-in-todoist-PcPoskdUp, /capture-tasks-from-text-images-and-documents-cAflh0WKe, /set-a-task-duration-L1kYkZv8d, /time-blocking-in-todoist-d6Pf1uTpc, /dictate-to-add-tasks-with-ramble-P1Raq7vVF. Sunsama: help.sunsama.com/docs/usage-guides/daily-planning, /timeboxing-auto-scheduling. Akiflow: product.akiflow.com/articles/6483573-command-bar, akiflow.featurebase.app/p/mass-import-and-nlp-based-planning. Motion: usemotion.com/help/project-management/task/task-scheduling-faq. Amie: amie.so/documentation/features/tasks. Notion: notion.com/en-us/help/use-notion-calendar-with-notion.
