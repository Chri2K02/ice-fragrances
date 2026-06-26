import { redirect } from "next/navigation";
import { desc, eq, inArray, or } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { SignOutButton } from "@/components/SignOutButton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  const userId = session.user.id;
  const email = session.user.email;

  const db = getDb();
  // Match orders by Better Auth id OR the checkout email — the email arm also
  // covers legacy/guest orders whose user_id isn't backfilled yet (A4).
  const myOrders = await db
    .select()
    .from(orders)
    .where(or(eq(orders.userId, userId), eq(orders.email, email)))
    .orderBy(desc(orders.createdAt));

  const orderIds = myOrders.map((o) => o.id);
  const items = orderIds.length
    ? await db
        .select()
        .from(orderItems)
        .where(inArray(orderItems.orderId, orderIds))
    : [];

  const itemsByOrder = new Map<number, typeof items>();
  for (const it of items) {
    const arr = itemsByOrder.get(it.orderId) ?? [];
    arr.push(it);
    itemsByOrder.set(it.orderId, arr);
  }

  return (
    <main className="px-4 py-12 max-w-3xl mx-auto min-h-[70vh] space-y-12">
      <section>
        <div className="flex items-center justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Your orders</h1>
            <p className="opacity-70 text-sm mt-1">{email}</p>
          </div>
          <SignOutButton />
        </div>
        {myOrders.length === 0 ? (
          <p className="opacity-70">No orders yet.</p>
        ) : (
          <ul className="space-y-4">
            {myOrders.map((o) => (
              <li
                key={o.id}
                className="rounded-2xl p-4"
                style={{ background: "var(--card)" }}
              >
                <div className="flex justify-between text-sm opacity-70">
                  <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                  <span>${(o.totalCents / 100).toFixed(2)}</span>
                </div>
                <ul className="mt-2 text-sm">
                  {(itemsByOrder.get(o.id) ?? []).map((it) => (
                    <li key={it.id}>
                      {it.name} × {it.qty}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
