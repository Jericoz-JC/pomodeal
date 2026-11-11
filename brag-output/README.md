# Launch videos (vertical)

Two 1080x1920, 60 fps ads made with the `/brag` skill (latent-spaces/brag) on Hyperframes. Both open on the same hook and name card, then show one thing each, slowly enough to follow on a first watch.

- `pomodeal-phone.mp4` (34 s): a deal on the phone, asking for 5 more minutes, and a big task torn into pieces
- `pomodeal-desktop.mp4` (22.6 s): tonight typed as one line on the desk, printed, first deal stamped
- `*.jpg`: the poster for each, also baked in as frame 0
- `phone-ad/`, `desk-ad/`: the two Hyperframes projects. In either: `npm run check`, then `npx hyperframes render --fps 60 --quality delivery --output ../raw.mp4`
- `capture/`: records the real prototype for the videos. `node brag-output/capture/capture.mjs all` rewrites the three clips into the two projects; add `--sheet` for contact sheets. Needs Playwright and ffmpeg. No finger is drawn on the phone clips; the desktop keeps its pointer.
- `brag-plan.md`, `composition-brief.md`: the first cut's plan (one 27 s video). The second round split it in two and slowed it down; the angle, look and sound are unchanged.
- `share-copy.txt`: one caption

## Credits to keep with the videos
- Music: Sascha Ende, ende.app, "Happy Beats / Business Moves Vol. 11" (CC BY 4.0). The licence asks for this credit wherever a video is posted.
- Sound effects: Kenney (CC0); key sounds by unicae_games (CC0).
