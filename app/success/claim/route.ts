import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import {
  ORDER_ACCESS_COOKIE,
  ORDER_ACCESS_COOKIE_OPTIONS,
  addOrderToCookie,
} from "@/lib/orderAccess";

// Post-checkout worker. Stripe returns the buyer to /success?session_id=…; the
// success page is a read-only Server Component and cannot set cookies, so it
// hands off here. We resolve the order (tolerating webhook lag), stamp the
// order-access cookie so THIS device owns the order, then bounce to the clean,
// shareable /success?orderNumber=N. If the webhook hasn't recorded the order
// yet, we hand back to the page's Stripe-session receipt fallback.

export const dynamic = "force-dynamic";

const RETRIES = 5;
const DELAY_MS = 400;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId) return NextResponse.redirect(new URL("/", req.url));

  // Resolve the order by Stripe session id, retrying briefly for webhook lag.
  const db = getDb();
  let orderId: number | null = null;
  for (let i = 0; i < RETRIES; i++) {
    const rows = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.stripeSessionId, sessionId));
    if (rows.length) {
      orderId = rows[0].id;
      break;
    }
    if (i < RETRIES - 1) await sleep(DELAY_MS);
  }

  if (orderId == null) {
    // Still not recorded — let the page render the receipt straight from the
    // Stripe session (there's no order id to grant cookie access to yet).
    // `pending=1` stops the page from looping back into this handler.
    const back = new URL("/success", req.url);
    back.searchParams.set("session_id", sessionId);
    back.searchParams.set("pending", "1");
    return NextResponse.redirect(back);
  }

  // Stamp the order-access cookie onto the redirect response: this device now
  // owns the order and can view it as a guest.
  const existing = (await cookies()).get(ORDER_ACCESS_COOKIE)?.value;
  const value = addOrderToCookie(existing, orderId);

  const dest = new URL("/success", req.url);
  dest.searchParams.set("orderNumber", String(orderId));
  dest.searchParams.set("just", "1"); // first arrival → fire the Purchase pixel once
  const res = NextResponse.redirect(dest);
  res.cookies.set(ORDER_ACCESS_COOKIE, value, ORDER_ACCESS_COOKIE_OPTIONS);
  return res;
}
