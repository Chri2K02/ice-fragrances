import { redirect } from "next/navigation";
import { desc, eq, inArray, or } from "drizzle-orm";
import { getSession, getAuthMethods } from "@/lib/session";
import { getDb } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { SignOutButton } from "@/components/SignOutButton";
import { AccountManager } from "@/components/AccountManager";
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

  const methods = await getAuthMethods(userId);

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
            <h1 className="text-2xl font-semibold">Your account</h1>
            <p className="opacity-70 text-sm mt-1">{email}</p>
          </div>
          <SignOutButton />
        </div>

        <AccountManager
          name={session.user.name ?? ""}
          email={email}
          hasPassword={methods.hasPassword}
          google={methods.google}
          canUnlinkGoogle={methods.canUnlinkGoogle}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Your orders</h2>
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
                  <span className="flex items-center gap-2">
                    {new Date(o.createdAt).toLocaleDateString()}
                    {/* Only ever present on an admin's own test purchases. */}
                    {o.testMode && (
                      <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-black">
                        TEST
                      </span>
                    )}
                  </span>
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
