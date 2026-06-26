import type { ReactNode } from "react";
import Link from "next/link";
import Stripe from "stripe";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { ORDER_ACCESS_COOKIE, hasOrderAccess } from "@/lib/orderAccess";
import { PurchaseTracker } from "@/components/PurchaseTracker";

// Order-specific, GATED confirmation page (goal 3). /success?orderNumber=N
// shows the real order only to its owner — the logged-in buyer OR a guest
// holding the order-access cookie from the checkout device. Everyone else gets
// a blurred FAKE placeholder + a sign-up CTA (the Google-ad landing experience).
//
// noindex: order-specific, ads point directly at the URL; no value in indexing.
export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false, follow: false },
};

type SearchParams = {
  session_id?: string;
  orderNumber?: string;
  pending?: string;
  just?: string;
};

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  // Post-checkout return: hand off to the claim Route Handler, which sets the
  // order-access cookie (a Server Component can't) and redirects to the
  // canonical URL. `pending` means claim already tried and the order isn't in
  // the DB yet → fall through to the Stripe-session receipt below.
  if (sp.session_id && !sp.pending) {
    redirect(`/success/claim?session_id=${encodeURIComponent(sp.session_id)}`);
  }

  if (sp.orderNumber) return renderGated(sp.orderNumber, sp.just === "1");
  if (sp.session_id) return renderStripeFallback(sp.session_id);

  // No order context — generic confirmation.
  return (
    <Shell>
      <ThankYou note="Your order is confirmed. A receipt is on its way to your email." />
    </Shell>
  );
}

// ── Gated canonical view ─────────────────────────────────────────────────────
async function renderGated(orderNumberStr: string, justArrived: boolean) {
  const session = await getSession();
  const n = Number(orderNumberStr);

  if (Number.isInteger(n) && n > 0) {
    const db = getDb();
    const [order] = await db.select().from(orders).where(eq(orders.id, n));
    if (order) {
      const cookieVal = (await cookies()).get(ORDER_ACCESS_COOKIE)?.value;
      const granted =
        (session != null &&
          (order.userId === session.user.id ||
            (!!order.email && order.email === session.user.email))) ||
        hasOrderAccess(cookieVal, n);

      if (granted) {
        const items = await db
          .select({ name: orderItems.name, qty: orderItems.qty })
          .from(orderItems)
          .where(eq(orderItems.orderId, n));

        // Fire the browser Purchase pixel ONCE, on first arrival after checkout
        // (just=1). eventId = Stripe session id, matching the webhook's CAPI
        // event so Meta de-duplicates them. Revisits/shared links never re-fire.
        let pixel: { value: number; currency: string } | null = null;
        if (justArrived) {
          try {
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
            const s = await stripe.checkout.sessions.retrieve(
              order.stripeSessionId
            );
            pixel = {
              value: (s.amount_total ?? 0) / 100,
              currency: (s.currency ?? "cad").toUpperCase(),
            };
          } catch {
            /* pixel is best-effort; the webhook CAPI event is the source of truth */
          }
        }

        const total = pixel
          ? `$${(order.totalCents / 100).toFixed(2)} ${pixel.currency}`
          : `$${(order.totalCents / 100).toFixed(2)}`;

        return (
          <Shell>
            <div className="w-full max-w-md">
              <h1 className="text-3xl font-semibold text-center">Thank you ❄️</h1>
              <p className="mt-2 text-center opacity-70">
                Order #{order.id} is confirmed
                {order.name ? `, ${order.name}` : ""}. A receipt is on its way
                {order.email ? ` to ${order.email}` : ""}.
              </p>
              <div className="mt-6 rounded-2xl p-5" style={{ background: "var(--card)" }}>
                <ul className="divide-y divide-black/10 dark:divide-white/10">
                  {items.length > 0 ? (
                    items.map((it, i) => (
                      <li key={i} className="flex items-center justify-between py-2">
                        <span>{it.name}</span>
                        <span className="opacity-70">× {it.qty}</span>
                      </li>
                    ))
                  ) : (
                    <li className="py-2 opacity-70">Your items are confirmed.</li>
                  )}
                </ul>
                <div className="mt-3 flex items-center justify-between border-t border-black/10 dark:border-white/10 pt-3 font-semibold">
                  <span>Total</span>
                  <span>{total}</span>
                </div>
              </div>
              <div className="mt-6 text-center">
                <BackToStore />
              </div>
            </div>
            {pixel && (
              <PurchaseTracker
                value={pixel.value}
                currency={pixel.currency}
                eventId={order.stripeSessionId}
              />
            )}
          </Shell>
        );
      }
    }
  }

  // No access, or missing/invalid order → identical blurred deny, so we never
  // reveal whether an order exists or leak any real order data.
  return (
    <Shell>
      <BlurredDeny signedIn={session != null} />
    </Shell>
  );
}

// ── Webhook-lag fallback: receipt straight from the Stripe session (as before).
async function renderStripeFallback(sessionId: string) {
  let purchase: { value: number; currency: string } | null = null;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    purchase = {
      value: (session.amount_total ?? 0) / 100,
      currency: (session.currency ?? "cad").toUpperCase(),
    };
  } catch {
    /* ignore — still show the thank-you */
  }
  return (
    <Shell>
      <ThankYou note="Your order is confirmed. A receipt is on its way to your email." />
      {purchase && (
        <PurchaseTracker
          value={purchase.value}
          currency={purchase.currency}
          eventId={sessionId}
        />
      )}
    </Shell>
  );
}

// ── Presentational pieces ────────────────────────────────────────────────────
function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen grid place-items-center px-4">{children}</main>
  );
}

function BackToStore() {
  return (
    <Link
      href="/"
      className="inline-block rounded-full px-6 py-3 font-medium text-black"
      style={{ background: "var(--accent)" }}
    >
      Back to store
    </Link>
  );
}

function ThankYou({ note }: { note: string }) {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-semibold">Thank you ❄️</h1>
      <p className="mt-3 opacity-70">{note}</p>
      <div className="mt-6">
        <BackToStore />
      </div>
    </div>
  );
}

// Denied view: a FAKE, realistic-looking order rendered blurred + non-selectable
// (never the real order — real data is never sent to a denied viewer), with a
// sign-up / use-your-checkout-device CTA overlaid.
function BlurredDeny({ signedIn }: { signedIn: boolean }) {
  const fake = [
    { name: "Frost Mind — Eau de Parfum", qty: 1 },
    { name: "Polar Ember (50ml)", qty: 2 },
    { name: "Glacier Tee (M)", qty: 1 },
  ];
  return (
    <div className="relative w-full max-w-md">
      <div aria-hidden className="pointer-events-none select-none blur-sm">
        <h1 className="text-3xl font-semibold text-center">Thank you ❄️</h1>
        <p className="mt-2 text-center opacity-70">
          Order #00000 is confirmed. A receipt is on its way.
        </p>
        <div className="mt-6 rounded-2xl p-5" style={{ background: "var(--card)" }}>
          <ul className="divide-y divide-black/10 dark:divide-white/10">
            {fake.map((it, i) => (
              <li key={i} className="flex items-center justify-between py-2">
                <span>{it.name}</span>
                <span className="opacity-70">× {it.qty}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-black/10 dark:border-white/10 pt-3 font-semibold">
            <span>Total</span>
            <span>$172.00</span>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 grid place-items-center px-4">
        <div className="max-w-sm rounded-2xl bg-black/60 p-6 text-center text-white backdrop-blur-sm">
          <h2 className="text-xl font-semibold">Order summary</h2>
          <p className="mt-2 text-sm opacity-90">
            Sign up or use the device you checked out on to view this order.
          </p>
          <div className="mt-4 flex flex-col items-center gap-3">
            <Link
              href="/sign-up"
              className="rounded-full px-6 py-3 font-medium text-black"
              style={{ background: "var(--accent)" }}
            >
              Sign up
            </Link>
            {!signedIn && (
              <Link href="/sign-in" className="text-sm underline underline-offset-4">
                Already have an account? Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
