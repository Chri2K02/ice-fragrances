import "server-only";
import { cookies } from "next/headers";
import Stripe from "stripe";
import { getSession } from "@/lib/session";
import { adminPermsFor, hasAnyPerm } from "@/lib/admin";

// Admin-only Stripe TEST mode.
//
// Entered with `?stripeMode=test` on any page (components/StripeModeBadge
// applies it, then strips the param). The param is only ever a SIGNAL — the
// authority is this module, which re-verifies on every server path that
// touches a Stripe key:
//
//   1. the mode cookie says "test", AND
//   2. test keys are configured in the environment, AND
//   3. the current session belongs to an admin (any surface permission).
//
// Fail any of the three and the answer is "live". Absence is inherently live:
// nothing is ever stored for live mode, and `?stripeMode=live` just clears.
//
// The cookie exists because a URL param cannot survive the full-page redirect
// to Stripe and back. The WEBHOOK can't read it at all (Stripe calls us
// directly) — it decides from the verified event's `livemode` flag instead.

export const STRIPE_MODE_COOKIE = "if_stripe_mode";
export type StripeMode = "test" | "live";

// Bounded lifetime: a forgotten test session shouldn't linger for weeks. The
// badge offers an explicit exit; this is the backstop.
export const STRIPE_MODE_MAX_AGE = 60 * 60 * 8; // 8 hours

/** True once the operator has added the test keys to the environment. */
export function testKeysConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_TEST_SECRET_KEY &&
      process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY
  );
}

/**
 * Test mode is an admin capability rather than one of the admin SURFACES
 * (stock/catalog/reviews/team), so any permission at all qualifies — the same
 * bar as "is an admin" everywhere else (see lib/admin).
 */
export async function isStripeModeAdmin(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  return hasAnyPerm(await adminPermsFor(session.user.email));
}

/** The authoritative mode for this request. Defaults to live on every doubt. */
export async function resolveStripeMode(): Promise<StripeMode> {
  const jar = await cookies();
  if (jar.get(STRIPE_MODE_COOKIE)?.value !== "test") return "live";
  if (!testKeysConfigured()) return "live";
  return (await isStripeModeAdmin()) ? "test" : "live";
}

export function secretKeyFor(mode: StripeMode): string {
  const key =
    mode === "test"
      ? process.env.STRIPE_TEST_SECRET_KEY
      : process.env.STRIPE_SECRET_KEY;
  return key!;
}

/**
 * Publishable keys are public by design and both are inlined into the client
 * bundle by Next; WHICH one gets used is decided server-side and handed back
 * with the Checkout Session (see app/api/checkout), never chosen by the client.
 */
export function publishableKeyFor(mode: StripeMode): string | undefined {
  return mode === "test"
    ? process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY
    : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
}

export function stripeFor(mode: StripeMode): Stripe {
  return new Stripe(secretKeyFor(mode));
}

/**
 * Retrieve a Checkout Session without knowing which mode created it — a
 * session id is only valid against its own mode's key, so try live, then
 * test. Used by /success, which may be reached in either mode (and after the
 * cookie has expired). Returns null when neither key resolves it.
 */
export async function retrieveSessionEitherMode(
  sessionId: string
): Promise<{ session: Stripe.Checkout.Session; mode: StripeMode } | null> {
  const modes: StripeMode[] = testKeysConfigured() ? ["live", "test"] : ["live"];
  for (const mode of modes) {
    try {
      const session = await stripeFor(mode).checkout.sessions.retrieve(sessionId);
      return { session, mode };
    } catch {
      /* wrong mode for this id (or a real failure) — try the next */
    }
  }
  return null;
}
