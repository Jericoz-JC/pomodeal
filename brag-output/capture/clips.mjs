// The three recordings the launch videos are cut from. Times are ms from each clip's start.
// Paced for someone seeing the app for the first time: every screen rests before the next press.
export const PHONE = { w: 390, h: 844, dpr: 3, touch: true };
export const DESK = { w: 960, h: 660, dpr: 2.5, touch: false };
export const CLIPS = [
  /* one deal, start to finish: stamp it, the break runs out (sped up), ask for 5 more, take the clock's terms */
  { name: "phone-deal", ...PHONE, hash: "start", dur: 13600,
    script(a) {
      a.tap(1800, "#shake", 320);
      a.js(3400, "S.askCount = 1; speed = 300");
      /* stop the fast-forward just short of the end, so the last moment and "Time's up" play at real speed */
      for (let t = 3400; t < 6600; t += 16) a.js(t, "if (speed > 1 && remaining() <= 7000) { speed = 1; vnow = S.startedAt + S.durMs - 350; }");
      a.tap(7600, "#ask2", 320);
      a.tap(11200, '[data-term="0"]', 320);
    } },
  /* a big one torn into pieces */
  { name: "phone-split", ...PHONE, hash: "cards", dur: 10200,
    script(a) {
      a.tap(1500, '[data-menu="paper"]', 300);
      a.tap(3300, "#m-split", 300);
      a.drag(5300, '[data-tear="0"]', 0, -10, 700, 300);
      a.drag(6900, '[data-tear="2"]', 0, 20, 700, 300);
      a.tap(8900, "#s-save", 320);
    } },
  /* the desk: tonight written as one line, printed, and the first deal stamped */
  { name: "desk-tonight", ...DESK, hash: "tonight-empty", dur: 12300, cursor: [520, 330],
    script(a) {
      a.tap(900, "#nightin", 300); a.move(1080, 250, 330, 380); // off the line, so the typing is not under the pointer
      a.type(1300, "history paper 1h, orgo set 4, bio ch 7,", 85);
      a.tap(5500, "#print", 420);
      a.tap(9700, "#shake", 500); a.hide(10300);
    } },
];
