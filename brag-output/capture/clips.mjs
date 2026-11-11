// The three recordings the launch video is cut from. Times are ms from each clip's start.
export const PHONE = { w: 390, h: 844, dpr: 3, touch: true };
export const DESK = { w: 960, h: 660, dpr: 2.5, touch: false };
export const CLIPS = [
  /* one deal, start to finish: stamp it, the break runs out (sped up), ask for 5 more, take the clock's terms */
  { name: "phone-deal", ...PHONE, hash: "start", dur: 8300, cursor: [300, 620],
    script(a) {
      a.tap(700, "#shake", 320); a.hide(1050);
      a.js(1900, "S.askCount = 1; speed = 420");
      /* stop the fast-forward just short of the end, so the last second and "Time's up" play at real speed */
      for (let t = 1900; t < 4200; t += 16) a.js(t, "if (speed > 1 && remaining() <= 9000) { speed = 1; vnow = S.startedAt + S.durMs - 350; }");
      a.tap(4250, "#ask2", 320); a.hide(4600);
      a.tap(5900, '[data-term="0"]', 320); a.hide(6250);
    } },
  /* a big one torn into pieces */
  { name: "phone-split", ...PHONE, hash: "cards", dur: 5600, cursor: [300, 520], aim: { '[data-tear="0"]': [.5, .5], '[data-tear="2"]': [.5, .5] },
    script(a) {
      a.tap(450, '[data-menu="paper"]', 300);
      a.tap(1350, "#m-split", 300); a.hide(1650);
      a.drag(2500, '[data-tear="0"]', 0, -10, 420, 300);
      a.drag(3400, '[data-tear="2"]', 0, 20, 420, 300);
      a.tap(4500, "#s-save", 320); a.hide(4850);
    } },
  /* the desk: tonight written as one line, printed, and the first deal stamped */
  { name: "desk-tonight", ...DESK, hash: "tonight-empty", dur: 6300, cursor: [520, 330],
    script(a) {
      a.tap(300, "#nightin", 260); a.move(480, 250, 330, 380); // off the line, so the typing is not under the pointer
      const e = a.type(520, "history paper 1h, orgo set 4, bio ch 7,", 42);
      a.tap(e + 560, "#print", 380);
      a.tap(4350, "#shake", 420); a.hide(4800);
    } },
];
