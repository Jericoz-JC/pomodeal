# Launch video (vertical)

`brag.mp4` is a 27 second, 1080x1920, 60 fps launch video made with the `/brag` skill (latent-spaces/brag) on Hyperframes.

- `brag-plan.md`, `composition-brief.md`: the plan and the handoff
- `capture/`: records the real prototype for the video. `node brag-output/capture/capture.mjs all` rewrites the three clips; add `--sheet` for contact sheets instead. Needs Playwright and ffmpeg.
- `composition/`: the Hyperframes project. From that folder: `npm run check`, then `npx hyperframes render --fps 60 --quality delivery --output ../brag.mp4`
- `share-copy.txt`: one caption

## Credits to keep with the video
- Music: Sascha Ende, ende.app, "Happy Beats / Business Moves Vol. 11" (CC BY 4.0). The licence asks for this credit wherever the video is posted.
- Sound effects: Kenney (CC0); key sounds by unicae_games (CC0).
