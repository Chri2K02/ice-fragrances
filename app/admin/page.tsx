import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/session";
import { adminPermsFor, firstAdminPathFor } from "@/lib/admin";
import { canonicalOriginFor, isAdminHost } from "@/lib/site";
import { getDb } from "@/lib/db";
import { inventory } from "@/lib/db/schema";
import { PRODUCTS } from "@/lib/products";
import { StockEditor } from "@/components/StockEditor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  const perms = await adminPermsFor(session.user.email);
  // /admin is the Admin-link landing spot: someone without the Stock surface
  // still lands on the first surface they CAN open. With no permissions at
  // all they leave the dashboard — on the admin subdomain that must be the
  // ABSOLUTE canonical origin ("/" would rewrite straight back here and loop).
  if (!perms.stock) {
    const first = firstAdminPathFor(perms);
    if (first) redirect(first);
    const h = await headers();
    const host = h.get("host");
    const proto = `${h.get("x-forwarded-proto") ?? "https"}:`;
    redirect(isAdminHost(host) ? canonicalOriginFor(host, proto) : "/");
  }

  const db = getDb();
  const rows = await db.select().from(inventory);
  const stockMap = new Map<string, number>();
  for (const r of rows) stockMap.set(`${r.productId}|${r.size}`, r.stock);

  const variants = PRODUCTS.flatMap((p) =>
    (p.sizes && p.sizes.length ? p.sizes : [""]).map((size) => {
      const key = `${p.id}|${size}`;
      return {
        productId: p.id,
        name: p.name,
        size,
        stock: stockMap.has(key) ? stockMap.get(key)! : null,
      };
    })
  );

  return (
    <>
      <h1 className="text-2xl font-semibold mb-2">Stock</h1>
      <p className="opacity-70 text-sm mb-6">
        Enter a number to track stock — it drops automatically on each sale, and
        the product shows <strong>Sold Out</strong> at 0. Leave blank to keep an
        item always available (untracked).
      </p>
      <StockEditor variants={variants} />
    </>
  );
}
