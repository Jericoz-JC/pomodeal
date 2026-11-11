# First-run test of the ticket, stamp and tape

Plan for [issue #17](https://github.com/Jericoz-JC/pomodeal/issues/17). November 11, 2026. Not run yet.

A beta tester found the ticket and the stamp somewhat redundant and confusing: what is a ticket, why is it stamped, what does the stub mean. The benchmarks rate the metaphor as the app's most original part, and `settled.md` rules out copy that explains the UI. So the question is whether the screens explain themselves, and whether the DEAL animation costs more time than it earns.

## What we need to learn

| # | Question | Decision it drives |
| --- | --- | --- |
| Q1 | Before pressing anything, can a new person say what the home screen is offering and what DEAL will do? | Whether the ticket reads as "a deal to agree to" or as decoration |
| Q2 | Right after pressing DEAL, can they say what just happened and what is running now? | Whether the stamp reads as "started", or as a second step |
| Q3 | Do they try to press anything during the animation, or look away? Does that change by the third deal? | Whether to shorten the stamp flight, and whether only repeats need shortening |
| Q4 | Can they say what the tape is and what one line and its stamp mean? | Whether the tape needs clearer print, or is fine |
| Q5 | When asking for 5 more, do they understand that pressing a term's stub accepts it? | Whether stamps on terms are clear without a separate button |
| Q6 | What words do they use for these things? | Whether "ticket", "stamp" and "tape" should ever appear on screen |

Two riders for [issue #15](https://github.com/Jericoz-JC/pomodeal/issues/15), asked last: "When did you last pause a timer or a study app? What for, and for how long?" and, during the focus block, watch what they look for if told "something came up, you need two minutes".

## Who

Three people who have never seen Pomodeal, not from the beta and not close friends of Chris. Students, 18 or older, who study with a phone nearby. Never screen on a diagnosis and never ask about one ([screener and consent](../03-screener-and-consent.md)). Three is enough to see whether a problem exists; it can't measure how common it is.

## Setup

- One person at a time, 15 minutes, in person, on their own phone.
- Part 1 on the live landing page (https://pomodeal.app, signed out): it has one playable deal and is the real first contact.
- Part 2 on the prototype (`prototypes/quick-deal/index.html`, served locally or as a private artifact) at 30× speed, so a break and a focus block end inside the session and the tape fills up.
- Screen recording on their phone with their consent, for timing only. No face, no audio unless they agree. Deleted once the notes are written.
- The moderator never says "ticket", "stamp", "stub", "tape" or "deal" before the participant does, and never explains a screen. If they are stuck for 20 seconds: "What would you try?"

## Script

1. **First look (1 min).** Open the landing page. After about five seconds: "What is this? What do you think happens if you press that?" (pointing at DEAL without naming it). Q1, Q6.
2. **Make a deal (2 min).** "Set this up for something you'd actually do tonight, and start it." Say nothing else. Note the first tap, any hesitation over the underlined words, and whether they look for a start button other than DEAL. Q1.
3. **Just after the stamp (1 min).** The moment the clock is running: "What just happened? What is it doing now?" Q2.
4. **Part 2, three deals in a row (5 min).** In the prototype: make a deal, let the break and the block run out, take the next round from the done sheet, then once more. Stay quiet. After the third: "Anything in that you'd change?" Only if they don't mention it: "How did starting feel the third time?" Q3.
5. **Ask for more (2 min).** In a break: "You want a few more minutes." Then again, so the terms appear. "What are these two? What happens if you press one?" Q5.
6. **The tape (2 min).** "Scroll down. What is this? What does this line tell you? What's that mark on it?" Q4, Q6.
7. **Close (2 min).** "How would you describe this app to a friend?" Then the two pause questions.

## What to record

From the screen recording, per deal:

- time from the first look at the home screen to pressing DEAL (deal 1 only);
- taps that land during the animation (the clearest sign it is too long);
- time from pressing DEAL to their next deliberate action or word.

For reference, read from the prototype's styles and spec 009 (not measured on a phone): the stamp comes down at about 200 ms, its stub tears off at 400 ms, the running ticket is drawn at 620 ms, and the stamp's flight and the dial winding in finish at roughly 1.3 to 1.5 s. A term's stamp closes its sheet at about 760 ms; other stamp buttons act at 280 ms. On a phone the tape's new line prints later, when scrolled into view.

In notes, per person: their words for each thing, word for word; what they said DEAL would do, before and after; anything they called confusing or extra, unprompted.

## Reading the results

With three people, call each question by count, and treat one person as a prompt to look, not a result.

| Question | Fine | A problem |
| --- | --- | --- |
| Q1 what DEAL will do | 3 of 3 say it starts the timer or agrees to the plan | 2 or more can't say, or look for another start button |
| Q2 what happened | 3 of 3 say it started | 2 or more think something else is needed |
| Q3 animation | No taps during it; nobody raises it | 2 or more tap during it or bring it up, on any deal. If only on deals 2 and 3, the first run is fine and repeats need a shorter version |
| Q4 the tape | 2 or more read a line correctly (what, when, how long) | 2 or more can't say what it is |
| Q5 terms | 3 of 3 press a stub to accept | Anyone looks for a confirm button |
| Q6 words | Any | Not pass or fail. If nobody says "ticket" or "tape", keep those words off the screen |

## If something fails

No explainer copy. Candidates for the design council to weigh, not decisions:

- **Stamp reads as a second step or as decoration:** the stub's DEAL die may need to look more like the one thing to press; check the landing and the app agree.
- **Animation too long:** drop the flight and cut to the printed stamp when the running ticket is drawn (about 620 ms); or start the dial winding while the stub tears; or play the full version on the first deal of a night and a short one on "Another round".
- **Tape unclear:** look at the head of the tape and the first printed line before anything else.

Any change goes through the council and is checked against `settled.md` first. Then re-run with three new people.

## Notes and privacy

Session notes go in `docs/research/sessions/`, which is never committed (the repo is public). First names only. Nothing about health or diagnoses is written down, even if offered. The write-up in this folder uses counts and unattributed quotes. Consent wording: the paragraph in [03-screener-and-consent.md](../03-screener-and-consent.md), with "15 minutes" and "a screen recording of your phone" in place of the audio line.

## Timeline

Recruit and run the three sessions in one week; notes the same day; a one-page result in this folder and a comment on issue #17 the day after the last session.
