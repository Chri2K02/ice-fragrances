import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserProfile } from "@clerk/nextjs";
import { desc, eq, inArray, or } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { SignOutButton } from "@/components/SignOutButton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  const db = getDb();
  const myOrders = await db
    .select()
    .from(orders)
    .where(
      email
        ? or(eq(orders.clerkUserId, userId), eq(orders.email, email))
        : eq(orders.clerkUserId, userId)
    )
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
          <h1 className="text-2xl font-semibold">Your orders</h1>
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

      <section className="grid place-items-center">
        <UserProfile routing="hash" />
      </section>
    </main>
  );
}
