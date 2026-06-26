import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

// Server-only: uses node:crypto and the app HMAC secret, so it must never reach
// a client bundle. The `server-only` guard above turns an accidental client
// import into a build error (a comment wouldn't). Tests alias `server-only` to
// an empty stub (see vitest.config.ts) so the primitive stays unit-testable.
//
// Signed `order-access` cookie primitive (Phase-B groundwork for goal 3).
//
// The cookie proves "this browser placed order(s) N…", so a guest with no
// account can still view their own /success?orderNumber=N. The value is an
// HMAC-signed list of order ids: `base64url(JSON(ids)).base64url(hmacSHA256)`,
// mirroring zcanon's claim-token shape. Tampering with either half makes
// verification fail closed (returns []).
//
// This module is the primitive ONLY — pure crypto + (de)serialization. The
// actual `cookies().set(...)` wiring onto the success page is a later Phase-B
// lane. Whoever wires it should set the cookie with the attributes documented
// in ORDER_ACCESS_COOKIE_OPTIONS below.

export const ORDER_ACCESS_COOKIE = "order-access";

// Cookie attributes for the Phase-B setter. httpOnly so JS can't read/forge it;
// secure in prod; lax so it rides top-level navigations to /success; long-lived
// because guests may return days later to re-check an order.
export const ORDER_ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365, // 1 year, in seconds
};

// Most-recent-N order ids kept in the cookie — bounds the value size.
const MAX_IDS = 50;

// Secret seam: callers (and tests) may inject a secret; runtime defaults to the
// app's HMAC secret. Fails CLOSED in production — if BETTER_AUTH_SECRET is unset
// there, signing/verifying with a predictable "dev-secret" would make the
// order-access cookie forgeable (anyone could view any order), so we throw loud
// instead. The dev fallback only applies outside production for local runs.
function resolveSecret(secret?: string): string {
  if (secret) return secret;
  const envSecret = process.env.BETTER_AUTH_SECRET;
  if (envSecret) return envSecret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "BETTER_AUTH_SECRET is not set — refusing to sign/verify order-access " +
        "cookies with a predictable fallback secret in production."
    );
  }
  return "dev-secret";
}

function hmac(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

/** Serialize + HMAC-sign an id list into a cookie value. */
export function signOrderAccess(ids: number[], secret?: string): string {
  const data = Buffer.from(JSON.stringify(ids)).toString("base64url");
  const sig = hmac(data, resolveSecret(secret));
  return `${data}.${sig}`;
}

/**
 * Verify a cookie value (timing-safe) and return its id list, or [] if the
 * value is missing, malformed, tampered, or signed with a different secret.
 */
export function verifyOrderAccess(
  cookieValue: string | undefined,
  secret?: string
): number[] {
  if (!cookieValue) return [];
  const parts = cookieValue.split(".");
  if (parts.length !== 2) return [];
  const [data, sig] = parts as [string, string];

  try {
    const provided = Buffer.from(sig);
    const expected = Buffer.from(hmac(data, resolveSecret(secret)));
    // timingSafeEqual throws on length mismatch, so length-guard first.
    if (provided.length !== expected.length) return [];
    if (!timingSafeEqual(provided, expected)) return [];

    const parsed = JSON.parse(Buffer.from(data, "base64url").toString());
    if (!Array.isArray(parsed)) return [];
    // Keep only sane positive integer ids; drop anything else defensively.
    return parsed.filter(
      (n): n is number => typeof n === "number" && Number.isInteger(n) && n > 0
    );
  } catch {
    // Corrupted base64 / non-JSON payload. The HMAC check already passed for
    // us to get here only on genuinely malformed-but-"signed" input, which we
    // still refuse. Fail closed.
    return [];
  }
}

/**
 * Verify the existing cookie, add `id` (deduped, most-recent kept, capped to
 * MAX_IDS), and re-sign. Safe to call with an undefined/tampered existing
 * value — it just starts from [].
 */
export function addOrderToCookie(
  existing: string | undefined,
  id: number,
  secret?: string
): string {
  const ids = verifyOrderAccess(existing, secret);
  // Move/insert `id` to the most-recent position, then keep the last MAX_IDS.
  const next = [...ids.filter((x) => x !== id), id].slice(-MAX_IDS);
  return signOrderAccess(next, secret);
}

/** True iff the cookie verifies and grants access to order `id`. */
export function hasOrderAccess(
  cookieValue: string | undefined,
  id: number,
  secret?: string
): boolean {
  return verifyOrderAccess(cookieValue, secret).includes(id);
}
