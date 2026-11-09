// Spec 008 "Push": the words on a block-boundary push and the declarative payload around them.
import { describe, expect, it } from "vitest";
import { advance, buildSession, notificationFromPush, pushBody, pushPayload, type SessionState } from "../src";

const T0 = 1_700_000_000_000;
const deal = (focusMin: number, activity: string | null = "Reels") => ({ activity, breakMin: 10, task: "BIO 180 ch. 7", focusMin });
/** The session moved on to block `idx`. */
const at = (s: SessionState, idx: number): SessionState => {
  let out = s;
  while (out.idx < idx) out = advance(out, T0);
  return out;
};

describe("push body", () => {
  it("heads-up says 2 min on a short block, with the block's label", () => {
    const s = at(buildSession(deal(15), T0), 1); // focus 15
    expect(pushBody(s, "headsUp")).toBe("2 min to wrap up BIO 180 ch. 7.");
  });

  it("heads-up says 5 min on a block of 45+", () => {
    const s = at(buildSession(deal(45), T0), 1); // focus 45
    expect(pushBody(s, "headsUp")).toBe("5 min to wrap up BIO 180 ch. 7.");
  });

  it("heads-up on a break names the break", () => {
    expect(pushBody(buildSession(deal(15), T0), "headsUp")).toBe("2 min to wrap up Reels.");
  });

  it("end of a break names what is up next", () => {
    expect(pushBody(buildSession(deal(15), T0), "blockEnd")).toBe("BIO 180 ch. 7 is up next.");
  });

  it("end of a focus block says the break is ready", () => {
    const s = at(buildSession(deal(15), T0), 1);
    expect(pushBody(s, "blockEnd")).toBe("BIO 180 ch. 7 block is done. Your break is ready.");
  });

  it("end of the last focus block doesn't promise a break", () => {
    const s0 = buildSession(deal(15), T0);
    const s = at(s0, s0.blocks.length - 1);
    expect(pushBody(s, "blockEnd")).toBe("BIO 180 ch. 7 block is done. That was the last block.");
  });

  it("a break with no activity reads as your break", () => {
    const s = at(buildSession(deal(15, null), T0), 1); // "Your pick" break
    expect(s.blocks[s.idx].type).toBe("break");
    expect(pushBody(s, "headsUp")).toBe("2 min to wrap up your break.");
  });

  it("a lowercase next label still starts the sentence with a capital", () => {
    const s = buildSession({ ...deal(15), task: "reading" }, T0);
    expect(pushBody(s, "blockEnd")).toBe("Reading is up next.");
  });

  it("a blank label falls back to plain words", () => {
    const s = at(buildSession({ ...deal(15), task: "  " }, T0), 1);
    expect(pushBody(s, "headsUp")).toBe("2 min to wrap up this block.");
    expect(pushBody(s, "blockEnd")).toBe("This block is done. Your break is ready.");
  });
});

describe("push payload", () => {
  it("is declarative Web Push that opens the app", () => {
    const s = at(buildSession(deal(15), T0), 1);
    expect(pushPayload(s, "headsUp")).toEqual({
      web_push: 8030,
      notification: { title: "Pomodeal", body: "2 min to wrap up BIO 180 ch. 7.", navigate: "/" },
    });
  });
});

describe("service worker notification", () => {
  it("shows a declarative payload's title and body, and opens its path", () => {
    const s = at(buildSession(deal(15), T0), 1);
    expect(notificationFromPush(pushPayload(s, "headsUp"))).toEqual({
      title: "Pomodeal",
      options: { body: "2 min to wrap up BIO 180 ch. 7.", tag: "pomodeal-block", renotify: true, icon: "/icon-192.png", data: { navigate: "/" } },
    });
  });

  it("reads a payload that arrives as JSON text", () => {
    const text = JSON.stringify({ web_push: 8030, notification: { title: "Pomodeal", body: "Reels is up next.", navigate: "/" } });
    expect(notificationFromPush(text)?.options.body).toBe("Reels is up next.");
  });

  it("keeps the payload's own tag when it has one", () => {
    const n = notificationFromPush({ web_push: 8030, notification: { title: "Pomodeal", body: "x", navigate: "/", tag: "s1-headsUp" } });
    expect(n?.options.tag).toBe("s1-headsUp");
    expect(n?.options.renotify).toBe(true);
  });

  it("alerts again when the block end replaces the heads-up under the same tag", () => {
    const s = at(buildSession(deal(15), T0), 1);
    const heads = notificationFromPush(pushPayload(s, "headsUp"));
    const end = notificationFromPush(pushPayload(s, "blockEnd"));
    expect(end?.options.tag).toBe(heads?.options.tag);
    expect(end?.options.renotify).toBe(true);
  });

  it("only ever opens a path on this site", () => {
    for (const navigate of ["https://evil.example/", "//evil.example/x", "javascript:alert(1)", 42, undefined]) {
      expect(notificationFromPush({ web_push: 8030, notification: { title: "Pomodeal", body: "x", navigate } })?.options.data.navigate).toBe("/");
    }
    expect(notificationFromPush({ web_push: 8030, notification: { title: "Pomodeal", body: "x", navigate: "/?s=1" } })?.options.data.navigate).toBe("/?s=1");
  });

  it("falls back to the app's name when the title is missing", () => {
    expect(notificationFromPush({ notification: { body: "x" } })?.title).toBe("Pomodeal");
  });

  it("shows nothing for an empty or unreadable payload", () => {
    expect(notificationFromPush(null)).toBeNull();
    expect(notificationFromPush("not json")).toBeNull();
    expect(notificationFromPush({ web_push: 8030 })).toBeNull();
    expect(notificationFromPush({ notification: { title: "Pomodeal" } })).toBeNull();
  });
});
