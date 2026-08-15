import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  STRIPE_MODE_COOKIE,
  STRIPE_MODE_MAX_AGE,
  isStripeModeAdmin,
  resolveStripeMode,
  testKeysConfigured,
} from "@/lib/stripeMode";

// Reads and applies the admin-only Stripe test mode.
//
// GET  → the badge's source of truth on every page load.
// POST → applies `?stripeMode=…` after server-side admin verification.
//
// Non-admins get "live" and no cookie no matter what they send, so appending
// the param is inert rather than an error — nothing reveals that the mode
// even exists.

export async function GET() {
  return NextResponse.json({ mode: await resolveStripeMode() });
}

export async function POST(req: Request) {
  const { mode } = (await req.json().catch(() => ({}))) as { mode?: string };
  const jar = await cookies();

  // "live" is the absence of the flag — always just clear, for anyone. No
  // admin check needed to turn something OFF.
  if (mode !== "test") {
    jar.delete(STRIPE_MODE_COOKIE);
    return NextResponse.json({ mode: "live", applied: true });
  }

  // Turning test mode ON requires a real admin AND configured test keys.
  if (!(await isStripeModeAdmin())) {
    jar.delete(STRIPE_MODE_COOKIE);
    return NextResponse.json({ mode: "live", applied: false });
  }
  if (!testKeysConfigured()) {
    jar.delete(STRIPE_MODE_COOKIE);
    return NextResponse.json({
      mode: "live",
      applied: false,
      // Admin-only detail: the keys simply aren't in the environment yet.
      reason: "Stripe test keys are not configured on this deployment.",
    });
  }

  jar.set(STRIPE_MODE_COOKIE, "test", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: STRIPE_MODE_MAX_AGE,
  });
  return NextResponse.json({ mode: "test", applied: true });
}
