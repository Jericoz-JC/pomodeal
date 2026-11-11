// Spec 016: the email hash that carries a member across WorkOS environments.
import { describe, expect, test } from "vitest";
import { emailHashOf, hashEmail } from "../lib/email";

describe("email hash", () => {
  test("hashEmail is SHA-256 hex of the trimmed, lower-cased address", async () => {
    expect(await hashEmail("a@b.co")).toBe("80305c9bb1bb2480e03894350e0a8a366dcbdeb302e69e0817aa0743abd77054");
    expect(await hashEmail(" A@B.co ")).toBe(await hashEmail("a@b.co"));
  });

  test("emailHashOf is null without an email claim", async () => {
    expect(await emailHashOf({ tokenIdentifier: "x|y", subject: "y", issuer: "x" })).toBeNull();
  });

  test("emailHashOf hashes the email claim", async () => {
    expect(await emailHashOf({ tokenIdentifier: "x|y", subject: "y", issuer: "x", email: "A@b.co" })).toBe(await hashEmail("a@b.co"));
  });
});
