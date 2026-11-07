# The Build Loop

One loop, repeated per feature. Each turn of the loop leaves a trail in `docs/` so any teammate (or any Claude session) can pick up where the last one stopped.

```
 ┌──────────────────────────────────────────────────────────────┐
 │ 1 SHAPE ─► 2 SPEC ─► 3 PLAN ─► 4 BUILD ─► 5 VERIFY ─► 6 REVIEW │
 └──────▲───────────────────────────────────────────────────┬───┘
        │                                                   ▼
        └──────── 8 UPDATE ◄──────── 7 DOGFOOD / BETA ◄──────┘
```

| Step | What happens | Artifact | Skill / tool |
| --- | --- | --- | --- |
| 1 Shape | Pick the next item from the current phase in the roadmap. Ask "which arrow of the core loop does this improve?" (concept-v2 §3). If none, it waits. | — | `superpowers:brainstorming` |
| 2 Spec | Write what it does, edge cases, copy, what's out of scope | `docs/specs/NNN-name.md` | `superpowers:brainstorming`, `design:ux-copy` |
| 3 Plan | Break into small tasks with file paths and tests | `docs/plans/NNN-name.md` | `superpowers:writing-plans` |
| 4 Build | Logic test-first in `packages/core` and `convex/`; UI with the design skill | code | `superpowers:test-driven-development`, `frontend-design` |
| 5 Verify | Run the app in the built-in browser at phone width and desktop; check push, offline, dark mode | screenshots in the PR | `/run`, `superpowers:verification-before-completion` |
| 6 Review | Diff review; security review for anything touching auth, the extension, or user data | PR comments | `/code-review`, `/security-review`, `design:accessibility-review` |
| 7 Dogfood | Use it in a real study session that day. Note friction | `docs/dogfood-log.md` entry | — |
| 8 Update | Record any decision as an ADR; update roadmap status and CLAUDE.md if conventions changed | `docs/decisions/NNNN-*.md` | `design:research-synthesis` (after beta rounds) |

## Step 5 in detail: the design hill climb

Adapted from Theo's "Agents Sucked At UI (Until Today)" (t3.gg, 2026). His point: agents get good at UI when you turn taste into a **score they can climb**, not when you add more instructions.

1. **Screenshot every state** at 375 px (and desktop when relevant), light and dark. Prototypes expose states by URL hash (`#deal`, `#running`, `#boundary`, …) so screenshots are scriptable (headless Edge/Chrome `--screenshot`).
2. **A council of independent reviewers** scores each category 1–10: *hierarchy, typography, color & contrast, consistency, clarity of the one action, tone (no-shame), delight*. Reviewers are separate subagents with different lenses: a product designer, a stressed student at 11 PM, and an accessibility reviewer. Read-only, no shared context.
3. **Score against references, not in a vacuum.** Absolute scores drift; relative ones are honest. Include screenshots or descriptions of 2–3 reference apps (e.g. Focusmate, Forest, Opal, one sec) and ask: is ours better than these?
4. **Don't tell reviewers the target score.** Knowing "we need a 9" inflates scores.
5. **Log every round** in the spec's "Design rounds" table: scores per reviewer per category, and what changed. Before/after screenshots side by side.
6. **Cheap reviewer first,** bring in the rest once it clears the bar. Stop at a target set by the human (start with "every reviewer ≥ 8 in every category"), then the human looks and adds taste direction ("too gray, bring color back").
7. **Prefer programmatic scores where they exist.** Timer drift, negotiation rules, and accessibility contrast are tests, not opinions. Climb those with code.

Budget: one round is ~3 subagent reviews. Two to four rounds per screen is plenty for a prototype.

## Cadence

- **Per feature:** steps 1–8, usually 1–3 days.
- **Per week:** 15-minute review of `dogfood-log.md` → reorder the phase backlog.
- **Per phase:** check the gate in [03-roadmap.md](03-roadmap.md). Don't open the next phase until it passes.

## Rules that keep the loop honest

1. **Specs before code** for anything user-facing. Spikes are the exception, and spike code never merges into `apps/`.
2. **Timer and negotiation logic is pure and tested.** If a bug involves time, the fix starts with a failing test in `packages/core`.
3. **Every PR is checked at 375 px wide.** Phone is the primary surface.
4. **Copy goes through the voice guide** (`specs/003-voice-and-copy.md`). No "ADHD", no "failed", no streak shaming.
5. **Privacy inventory is updated in the same PR** as any new field that stores user behavior.

## Skill map by phase

| Phase | Lean on |
| --- | --- |
| 0 Concepts | ux-superpowers (`jobs-to-be-done`, `persona-builder`, `user-journey`, `telemetry-designer`), `design:user-research`, `superpowers:brainstorming`, HTML artifacts for clickable prototypes |
| 1 Solo PWA | `superpowers:writing-plans`, `superpowers:test-driven-development`, `frontend-design`, `/run`, `/code-review` |
| 1.5 Beta | `design:research-synthesis`, `design:accessibility-review`, `/security-review` |
| 2 Extension | Chrome Extension Builder (`architecture`, `security`, `testing`, `prepare-release`), `/security-review` |
| 3–4 | Same loop; `dataviz` for the weekly recap |
