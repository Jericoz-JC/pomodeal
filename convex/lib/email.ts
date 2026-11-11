// Spec 010: a member's sign-in email, kept only as a hash, so an account can be matched across WorkOS
// environments (staging to production) where the WorkOS user id and the token issuer both change.
import type { UserIdentity } from "convex/server";

/** SHA-256 hex of the trimmed, lower-cased address. */
export async function hashEmail(email: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email.trim().toLowerCase()));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** The hash of the token's email claim, or null when the token carries none. Callers check emailVerified. */
export async function emailHashOf(identity: UserIdentity): Promise<string | null> {
  return identity.email ? hashEmail(identity.email) : null;
}
