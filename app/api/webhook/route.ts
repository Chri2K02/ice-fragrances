import { NextResponse } from "next/server";
import Stripe from "stripe";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { orders, orderItems, inventory } from "@/lib/db/schema";
import { getProduct } from "@/lib/products";
import { sendCapiEvent } from "@/lib/capi";
import { sendEmail, customerConfirmationHtml } from "@/lib/email";
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

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

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
          userId,
          email,
          name: session.customer_details?.name ?? null,
          totalCents: session.amount_total ?? 0,
        })
        .returning({ id: orders.id });

      if (items.length > 0) {
        await db.insert(orderItems).values(
          items.map((i) => ({
            orderId: order.id,
            productId: i.id,
            name:
              (getProduct(i.id)?.name ?? i.id) +
              (i.size ? ` (${i.size})` : ""),
            qty: i.qty,
          }))
        );
      }

      // Decrement tracked inventory (no-op for untracked variants).
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

      // Server-side Purchase to Meta (Conversions API) — reliable, immune to
      // ad blockers. eventId = session.id matches the browser Purchase on
      // /success, so Meta de-duplicates the two.
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

      // Notify the store owner that an order came in.
      const totalStr = `${((session.amount_total ?? 0) / 100).toFixed(2)} ${(
        session.currency ?? "cad"
      ).toUpperCase()}`;
      const ship = session as unknown as {
        shipping_details?: { address?: Stripe.Address };
        collected_information?: { shipping_details?: { address?: Stripe.Address } };
      };
      const address =
        ship.collected_information?.shipping_details?.address ??
        ship.shipping_details?.address ??
        session.customer_details?.address ??
        null;
      const itemsHtml = items
        .map(
          (i) =>
            `<li>${getProduct(i.id)?.name ?? i.id}${
              i.size ? ` (${i.size})` : ""
            } &times; ${i.qty}</li>`
        )
        .join("");
      const orderEmail =
        process.env.ORDER_NOTIFICATION_EMAIL ??
        process.env.ADMIN_EMAIL ??
        "icefragrances@icefragrances.com";
      await sendEmail({
        to: orderEmail,
        replyTo: email ?? undefined,
        subject: `New order — Ice Fragrances (${totalStr})`,
        html: `
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
          replyTo: orderEmail,
          subject: "Your Ice Fragrances order is confirmed ❄️",
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
