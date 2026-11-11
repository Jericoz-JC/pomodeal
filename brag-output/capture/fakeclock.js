// Injected before the app's own scripts. Replaces the page's clocks (Date, performance.now, timers, rAF) with one
// the recorder steps by hand, and seeks every CSS/WAAPI animation to match, so a clip renders the same every time
// and each frame can take as long as it needs to capture.
(() => {
  const RealDate = Date, BASE = new RealDate(2026, 10, 11, 19, 52, 0).getTime();
  let now = 0, seq = 1;
  const timers = new Map(), rafs = new Map(), born = new WeakMap();
  class FDate extends RealDate { constructor(...a) { if (a.length) super(...a); else super(BASE + now); } static now() { return BASE + now; } }
  window.Date = FDate;
  performance.now = () => now;
  window.setTimeout = (fn, ms, ...args) => { const id = seq++; timers.set(id, { at: now + Math.max(0, +ms || 0), fn, args }); return id; };
  window.setInterval = (fn, ms, ...args) => { const id = seq++, every = Math.max(1, +ms || 0); timers.set(id, { at: now + every, fn, args, every }); return id; };
  window.clearTimeout = window.clearInterval = id => { timers.delete(id); };
  window.requestAnimationFrame = fn => { const id = seq++; rafs.set(id, fn); return id; };
  window.cancelAnimationFrame = id => { rafs.delete(id); };
  function seek(prev) {
    for (const a of document.getAnimations()) {
      let b = born.get(a);
      if (b === undefined) { b = prev; born.set(a, b); try { a.pause(); } catch (e) {} }
      const t = now - b, end = a.effect ? a.effect.getComputedTiming().endTime : Infinity;
      try { if (t >= end) a.finish(); else a.currentTime = t; } catch (e) {}
    }
  }
  window.__advance = dt => {
    const prev = now, target = now + dt;
    for (let guard = 0; guard < 5000; guard++) {
      let next = null, nid = 0;
      for (const [id, t] of timers) if (t.at <= target && (!next || t.at < next.at)) { next = t; nid = id; }
      if (!next) break;
      now = Math.max(now, next.at);
      if (next.every) next.at += next.every; else timers.delete(nid);
      try { typeof next.fn === "function" && next.fn(...next.args); } catch (e) { console.error(e); }
    }
    now = target;
    const cbs = [...rafs.values()]; rafs.clear();
    for (const f of cbs) try { f(now); } catch (e) { console.error(e); }
    seek(prev);
    return now;
  };
})();
