import { redirect } from "next/navigation";
import { desc, inArray } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { adminPermsFor } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { AdminOrders } from "@/components/AdminOrders";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Orders",
  robots: { index: false, follow: false },
};

export default async function AdminOrdersPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (!(await adminPermsFor(session.user.email)).orders) redirect("/admin");

  const db = getDb();
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
  const ids = rows.map((o) => o.id);
  const items = ids.length
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids))
    : [];

  const byOrder = new Map<number, { name: string; qty: number; size: string | null }[]>();
  for (const it of items) {
    const arr = byOrder.get(it.orderId) ?? [];
    arr.push({ name: it.name, qty: it.qty, size: it.size });
    byOrder.set(it.orderId, arr);
  }

  const list = rows.map((o) => ({
    id: o.id,
    createdAt: o.createdAt.toISOString(),
    email: o.email,
    name: o.name,
    totalCents: o.totalCents,
    currency: o.currency,
    taxCents: o.taxCents,
    status: o.status,
    trackingNumber: o.trackingNumber,
    adminNote: o.adminNote,
    testMode: o.testMode,
    paymentIntentId: o.stripePaymentIntentId,
    ship: {
      name: o.shipName,
      line1: o.shipLine1,
      line2: o.shipLine2,
      city: o.shipCity,
      state: o.shipState,
      postal: o.shipPostal,
      country: o.shipCountry,
    },
    items: byOrder.get(o.id) ?? [],
  }));

  return (
    <>
      <h1 className="text-2xl font-semibold mb-2">Orders</h1>
      <p className="opacity-70 text-sm mb-6">
        Every order, newest first. Stripe remains the record for the payment
        itself — this is fulfilment: mark orders shipped, attach tracking, and
        keep notes. Test-mode orders are hidden until you ask for them.
      </p>
      <AdminOrders initial={list} />
    </>
  );
}
