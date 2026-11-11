# Hyperframes Composition Brief: Pomodeal

## Objective
A vertical launch video for Pomodeal that shows the real app on a phone and on the desktop, including splitting a big task, with the logo and name prominent throughout.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: vertical, 1080x1920, 60 fps
- Duration: 27.2 seconds (see the plan for why it runs past 25)

## Source Material
- Project root: the repo
- Primary files read: `prototypes/quick-deal/index.html`, `apps/web/src/landing.ts`, `apps/web/public/icon.svg`, `README.md`, `CHANGELOG.md`, `docs/01-concept-v2.md`, `CLAUDE.md`
- Product name: Pomodeal
- Tagline / strongest claim: "10 more minutes, then I'll start." (landing headline)
- Key UI to show: recorded, not recreated. `capture/capture.mjs` drives the prototype's demo mode on a stepped clock and writes three clips to `composition/assets/clips/`:
  - `phone-deal.mp4` (390x844 at 3x): DEAL, the break runs out, ask for 5 more, take a term
  - `phone-split.mp4` (390x844 at 3x): History paper split into pieces, tear lines dragged, saved
  - `desk-tonight.mp4` (960x660 at 2.5x): tonight typed in one line, printed, first deal stamped
- Copy that appears verbatim from the project:
  - "10 more minutes, then I'll start."
  - "Make a deal." / "Private beta" / pomodeal.app
- Copy adapted from the project (each is a claim the project makes):
  - "The study timer that negotiates with you." (README: "A study timer that negotiates with you instead of fighting you")
  - "The clock tells you what it costs." (landing sub-line)
  - "Want 5 more minutes? Ask." (landing: "Want more time? Ask.")
  - "Scroll first. Then study." (the ticket: Reels, then reading)
  - "Big task? Tear it into pieces." / "One piece per sitting." (spec 008: split a big one into pieces; "Needs more than one sitting?")
  - "On your laptop: tonight, in one line." / "It prints the whole night." (spec 012 and 014)
- Everything on the app's screens is the prototype's own sample data. No real names or accounts.

## Creative Direction
- Tone preset: app-store, steered toward a stamped paper ticket
- Angle, hook, outro: see `brag-plan.md`
- Avoid: generic SaaS language, abstract filler, any health or ADHD framing, purple or yellow, all-caps labels, middle-dot separators

## Visual Identity
- Background #CDD5CA, text #1B211D, accent #0E7447, cards #FEFEFA
- Display font: Archivo (variable, condensed widths), shipped in `assets/fonts/`
- Body font: Atkinson Hyperlegible, shipped in `assets/fonts/`
- Logo: `apps/web/public/icon.svg`, as the lockup on every product scene and drawn large on the two green cards

## Audio
- Music: `happy-beats-business-moves-vol-11-by-ende-dot-app.mp3` at 0.5, 1.2 s fade out
- Cue source: bundled preset. Beat locks at 1.60, 5.80, 22.65 and 24.23.
- SFX: soft impacts on each stamp, a short click on each tap, ten key ticks under the typing, a paper slide on three scene changes, one bell under the end logo. Each is timed to its frame in the recorded clip.
- Audio-reactive treatment: none, by choice (documented in the plan).

## Hyperframes notes
- One root composition (`index.html`) with one paused GSAP timeline. Lint warns that scenes could be split into sub-compositions; kept as one file because the phone and its two clips span two scenes.
- `npx hyperframes check` passes with 0 errors.
