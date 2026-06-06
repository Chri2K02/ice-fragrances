import { NextResponse } from "next/server";
import Stripe from "stripe";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { orders, orderItems, inventory } from "@/lib/db/schema";
import { getProduct } from "@/lib/products";
import type { CartItem } from "@/lib/cartStore";

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
    const clerkUserId = session.metadata?.userId || null;

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
          clerkUserId,
          email,
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
    }
  }

  return NextResponse.json({ received: true });
}
