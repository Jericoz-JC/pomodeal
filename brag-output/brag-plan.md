# Brag Plan: Pomodeal

## What is this app?
A study timer that negotiates with you instead of fighting you: say what you're scrolling, and it turns it into a planned break, then a short focus block.

## The angle
Every student has said "10 more minutes, then I'll start." Pomodeal takes that sentence literally and stamps it: a deal ticket, in writing, with terms. The video is the bargain being made on screen, by the real app, three times: a quick deal on the phone, a big task torn into pieces, and a whole night printed on the desktop.

## Hook (first 2-3 seconds)
Frame 0 is the quote, already on screen, with the Pomodeal lockup above it: "10 more minutes, then I'll start." (the landing page's own headline). On the first strong beat a green DEAL stamp slams onto it.

## Key moments (the middle)
- Phone: the ticket "10 min of Reels, then 8 min of BIO 180 ch. 7." A finger presses DEAL, the stamp lands, the break wheel runs out.
- Phone: "Time's up on Reels." Ask for 5 more; the clock answers "Sure. Where do the 5 minutes come from?" and a term gets stamped.
- Phone: History paper opened and torn into pieces; tear lines dragged to resize; Save pieces stamped.
- Desktop: "history paper 1h, orgo set 4, bio ch 7" typed as one line; PRINT; the night appears to scale along the front edge of the desk; DEAL.

## Outro / punchline
Green floods the frame. The logo draws itself, "Pomodeal" lands at full width, then "Make a deal." and pomodeal.app.

## User flow worth showing
Stamp a deal, then ask for more and take the terms, then split a big task, then plan tonight on the desk. All four are recorded from the real prototype (`prototypes/quick-deal/index.html`), not redrawn.

## Tone
- Preset: app-store
- Creative direction: a stamped ticket. Paper, one green ink, heavy condensed type; fast cuts on the stamp.
- Interpretation: quick and physical. Motion comes from stamps landing and paper moving; text lands fast and then sits still long enough to read.

## Format: vertical, 1080x1920, 60 fps
## Duration: 27.2 seconds
Two seconds over /brag's 25 s ceiling, on purpose: the brief asks for phone, desktop, task splitting and a prominent logo, and each needs a readable hold.

## Visual identity (from the project)
- Background: #CDD5CA (paper)
- Accent: #0E7447 (deal green); logo ground #1E6A46
- Text: #1B211D (ink); cards #FEFEFA
- Display font: Archivo (condensed widths)
- Body font: Atkinson Hyperlegible
- Strongest visual element: the DEAL stamp on a torn ticket; the hatched break wheel
- Rules carried over from CLAUDE.md: no purple or yellow, no all-caps eyebrow labels, no middle-dot separators, no monospace labels; never framed as an ADHD or health product; no shame, no streaks.

## Share copy (draft)
"10 more minutes, then I'll start." Pomodeal turns that into a deal: your break first, then the work, and if you want more time, the clock tells you what it costs.

## Audio direction
- Role: warm rhythmic bed with physical accents
- Music: happy-beats-business-moves-vol-11 (Sascha Ende, CC BY 4.0), from 0:00
- Music treatment: steady level, one-second fade under the end card
- Music cue guidance: preset `cues/...vol-11...music-cues.json` read; 114.84 BPM. Strong cues used: 1.60 (hook stamp), 5.80 (DEAL on the phone), 22.65 (DEAL on the desk), 24.23 (logo). Scene seams sit on bar lines: 2.65, 4.75, 12.65, 17.91, 23.70.
- Audio-reactive treatment: none. Extraction is skipped on purpose; a pulsing glow would fight the flat paper look.
- SFX posture: moderate, every sound has a cause on screen: soft thuds on stamps, short clicks on taps, a few key ticks under the typing, a paper slide on scene changes.
- Restraint rule: no chimes or risers; nothing louder than the stamps.

## Storyboard

### Scene 1: the excuse, 0.00 to 2.65
Paper ground. Lockup (logo + Pomodeal) at the top. The quote "10 more minutes, then I'll start." large, already on screen at frame 0. DEAL stamp slams on at 1.60.
Sequential/interaction: stamp lands on the beat.
Audio intent: music in, one heavy thud.
Transition mood: hard, zoom through the stamp's green into Scene 2.

### Scene 2: the name, 2.65 to 4.75
Green ground. The logo ring draws, "Pomodeal" lands very large, "The study timer that negotiates with you." under it.
Audio intent: soft landing hit.
Transition mood: clean, the green sheet tears away upward.

### Scene 3: a deal on the phone, 4.75 to 12.65
The phone rises. Real app: DEAL pressed (5.55), stamp lands (5.80), break runs out, "Time's up on Reels.", ask for 5 more (9.10), terms shown, a term stamped (10.75).
Captions: "Scroll first. Then study." / "Want 5 more minutes? Ask." / "The clock tells you what it costs."
Sequential/interaction: simulated taps.
Audio-coupled idea: click on each tap, thud on each stamp.
Transition mood: hard, a squash cut inside the phone.

### Scene 4: a big task in pieces, 12.65 to 17.91
Same phone. History paper opened, Split into pieces, two tear lines dragged, Save pieces stamped.
Captions: "Big task? Tear it into pieces." / "One piece per sitting."
Transition mood: clean, phone leaves left, the desk arrives from the right.

### Scene 5: the desk, 17.91 to 23.70
A browser window. Camera close on the ticket while tonight is typed as one line; pulls back as PRINT lands and the night is laid out along the desk; DEAL at 22.65.
Captions: "On your laptop, type tonight in one line." / "It prints the whole night."
Audio-coupled idea: key ticks under the typing, thud on PRINT and DEAL.
Transition mood: hard, green flood.

### Scene 6: end card, 23.70 to 27.20
Green ground, logo (lands 24.23), "Pomodeal" at full width, "Make a deal.", pomodeal.app, "Private beta".
Audio intent: one soft bell on the logo, music fades.

**Music mood for this video:** upbeat
**Audio summary:** a steady bright bed, thuds on every stamp, and a fade under the name.
