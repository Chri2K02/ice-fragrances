import { NextResponse } from "next/server";
import Stripe from "stripe";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { orders, orderItems, inventory } from "@/lib/db/schema";
import { getProduct } from "@/lib/products";
import { sendCapiEvent } from "@/lib/capi";
import { sendEmail, customerConfirmationHtml } from "@/lib/email";
import { recipientsFor } from "@/lib/admin";
import { EMAILS } from "@/lib/site";
import type { CartItem } from "@/lib/cartStore";

function formatAddress(a: Stripe.Address | null | undefined): string {
  if (!a) return "See Stripe dashboard for full address";
  return [
    a.line1,
    a.line2,
    [a.city, a.state, a.postal_code].filter(Boolean).join(" "),
    a.country,
  ]
    .filter(Boolean)
    .join(", ");
}

// Stripe calls this endpoint directly, so there's no cookie to read the
// admin's test mode from. Instead: verify against the LIVE signing secret
// first, then the TEST one if configured. Live verification is never weakened
// — a test-signed payload simply fails the live check and falls through — and
// the mode comes from `event.livemode` on the verified event, not from us.
function verifyEvent(body: string, sig: string): Stripe.Event | null {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const secrets = [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.STRIPE_TEST_WEBHOOK_SECRET,
  ].filter(Boolean) as string[];
  for (const secret of secrets) {
    try {
      return stripe.webhooks.constructEvent(body, sig, secret);
    } catch {
      /* not this secret — try the next */
    }
  }
  return null;
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  const event = sig ? verifyEvent(body, sig) : null;
  if (!event) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  // Authoritative, straight from the signed event.
  const isTestOrder = !event.livemode;

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    let items: CartItem[] = [];
    try {
      items = JSON.parse(session.metadata?.items ?? "[]");
    } catch {
      items = [];
    }
    const email =
      session.customer_details?.email ?? session.customer_email ?? null;
    // Better Auth user id passed through checkout metadata (empty for guests).
    const userId = session.metadata?.userId || null;

    // Shipping destination. Cologne carts let Stripe collect it, apparel carts
    // pass ours through — either way the session is authoritative. Persisted
    // (not just emailed) so fulfilment never depends on finding an email.
    const ship = session as unknown as {
      shipping_details?: { name?: string | null; address?: Stripe.Address };
      collected_information?: {
        shipping_details?: { name?: string | null; address?: Stripe.Address };
      };
    };
    const shipDetails =
      ship.collected_information?.shipping_details ??
      ship.shipping_details ??
      null;
    const shipAddress =
      shipDetails?.address ?? session.customer_details?.address ?? null;

    const db = getDb();
    const existing = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.stripeSessionId, session.id));

    if (existing.length === 0) {
      const [order] = await db
        .insert(orders)
        .values({
          stripeSessionId: session.id,
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : (session.payment_intent?.id ?? null),
          userId,
          email,
          name: session.customer_details?.name ?? null,
          totalCents: session.amount_total ?? 0,
          // Required to render any amount unambiguously — orders settle in USD
          // (US) or CAD (Canada).
          currency: (session.currency ?? "cad").toUpperCase(),
          taxCents: session.total_details?.amount_tax ?? null,
          shippingCents: session.total_details?.amount_shipping ?? null,
          shipName:
            shipDetails?.name ?? session.customer_details?.name ?? null,
          shipLine1: shipAddress?.line1 ?? null,
          shipLine2: shipAddress?.line2 ?? null,
          shipCity: shipAddress?.city ?? null,
          shipState: shipAddress?.state ?? null,
          shipPostal: shipAddress?.postal_code ?? null,
          shipCountry: shipAddress?.country ?? null,
          testMode: isTestOrder,
        })
        .returning({ id: orders.id });

      if (items.length > 0) {
        await db.insert(orderItems).values(
          items.map((i) => ({
            orderId: order.id,
            productId: i.id,
            // Name stays human-readable including the size; `size` is also its
            // own column so variants stay queryable.
            name:
              (getProduct(i.id)?.name ?? i.id) +
              (i.size ? ` (${i.size})` : ""),
            size: i.size ?? null,
            qty: i.qty,
            // Catalog price at the moment of sale — the list price can change
            // later, but the order must remember what it charged.
            unitPriceCents: getProduct(i.id)?.priceCents ?? null,
          }))
        );
      }

      // Decrement tracked inventory (no-op for untracked variants). Test
      // orders never touch real stock counts.
      if (!isTestOrder) {
        for (const i of items) {
          await db
            .update(inventory)
            .set({ stock: sql`GREATEST(${inventory.stock} - ${i.qty}, 0)` })
            .where(
              and(
                eq(inventory.productId, i.id),
                eq(inventory.size, i.size ?? "")
              )
            );
        }
      }

      // Server-side Purchase to Meta (Conversions API) — reliable, immune to
      // ad blockers. eventId = session.id matches the browser Purchase on
      // /success, so Meta de-duplicates the two. Skipped for test orders so
      // admin test runs never pollute real ad/conversion data.
      if (!isTestOrder) {
        await sendCapiEvent({
          eventName: "Purchase",
          eventId: session.id,
          eventSourceUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/success`,
          userData: {
            email,
            fbp: session.metadata?.fbp ?? null,
            fbc: session.metadata?.fbc ?? null,
          },
          customData: {
            value: (session.amount_total ?? 0) / 100,
            currency: (session.currency ?? "cad").toUpperCase(),
            content_ids: items.map((i) => i.id),
            content_type: "product",
            num_items: items.reduce((n, i) => n + i.qty, 0),
          },
        });
      }

      // Notify the store owner that an order came in.
      const totalStr = `${((session.amount_total ?? 0) / 100).toFixed(2)} ${(
        session.currency ?? "cad"
      ).toUpperCase()}`;
      // Same address resolved once above and persisted with the order.
      const address = shipAddress;
      const itemsHtml = items
        .map(
          (i) =>
            `<li>${getProduct(i.id)?.name ?? i.id}${
              i.size ? ` (${i.size})` : ""
            } &times; ${i.qty}</li>`
        )
        .join("");
      // Recipients come from the notification surface (admins with "orders"
      // on); falls back to the bootstrap owner. Keep one stable store address
      // for the customer email's reply-to.
      const orderRecipients = await recipientsFor("orders");
      const storeReplyTo = orderRecipients[0] ?? EMAILS.support;
      // Emails still send for test orders (that's the point of testing them),
      // but they're labelled so a test can never be mistaken for a real sale.
      const testTag = isTestOrder ? "[TEST] " : "";
      await sendEmail({
        to: orderRecipients.join(", "),
        replyTo: email ?? undefined,
        subject: `${testTag}New order — Ice Fragrances (${totalStr})`,
        html: `
          ${
            isTestOrder
              ? `<p style="background:#fef3c7;color:#000;padding:8px 12px;border-radius:8px;font-weight:600">Stripe TEST mode — no real payment was taken, and stock was not adjusted.</p>`
              : ""
          }
          <h2 style="margin:0 0 8px">New order — ${totalStr}</h2>
          <p><strong>Customer:</strong> ${
            session.customer_details?.name ?? ""
          } &lt;${email ?? "no email"}&gt;</p>
          <p><strong>Ship to:</strong> ${formatAddress(address)}</p>
          <p><strong>Items:</strong></p>
          <ul>${itemsHtml}</ul>
          <p style="color:#888;font-size:12px">Stripe session: ${session.id}</p>
        `,
      });

      // Send the customer their branded order confirmation. Replies route to
      // the store inbox. Guarded by `email` so we never send into the void.
      if (email) {
        const customerItems = items.map(
          (i) =>
            `${getProduct(i.id)?.name ?? i.id}${i.size ? ` (${i.size})` : ""} × ${i.qty}`
        );
        await sendEmail({
          to: email,
          replyTo: storeReplyTo,
          subject: `${testTag}Your Ice Fragrances order is confirmed ❄️`,
          html: customerConfirmationHtml(
            session.customer_details?.name ?? null,
            customerItems
          ),
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
