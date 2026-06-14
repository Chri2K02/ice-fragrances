import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { sendEmail, customerConfirmationHtml } from "@/lib/email";

// Secret-guarded admin tool: list recent orders, and (re)send a branded
// customer order-confirmation email to an order's own stored address.
// Guarded by MIGRATE_SECRET — only ever emails the email on the order itself.
function authed(req: Request): boolean {
  const secret = new URL(req.url).searchParams.get("secret");
  return !!process.env.MIGRATE_SECRET && secret === process.env.MIGRATE_SECRET;
}

export async function GET(req: Request) {
  if (!authed(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const db = getDb();
  const recent = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(10);
  const result = [];
  for (const o of recent) {
    const its = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, o.id));
    result.push({
      id: o.id,
      name: o.name,
      email: o.email,
      totalCents: o.totalCents,
      createdAt: o.createdAt,
      items: its.map((i) => `${i.name} × ${i.qty}`),
    });
  }
  return NextResponse.json({ orders: result });
}

export async function POST(req: Request) {
  if (!authed(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { orderId } = (await req.json()) as { orderId?: number };
  if (!Number.isInteger(orderId) || (orderId ?? 0) <= 0) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }
  const db = getDb();
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId!))
    .limit(1);
  if (!order) {
    return NextResponse.json({ error: "order not found" }, { status: 404 });
  }
  if (!order.email) {
    return NextResponse.json({ error: "order has no email" }, { status: 400 });
  }
  const its = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));
  const itemLines = its.map((i) => `${i.name} × ${i.qty}`);

  await sendEmail({
    to: order.email,
    subject: "Your Ice Fragrances order is confirmed ❄️",
    html: customerConfirmationHtml(order.name, itemLines),
  });

  return NextResponse.json({
    ok: true,
    sentTo: order.email,
    name: order.name,
    items: itemLines,
  });
}
