import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { inventory } from "@/lib/db/schema";
import { PRODUCTS } from "@/lib/products";
import { StockEditor } from "@/components/StockEditor";

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const user = await currentUser();
  if (
    !process.env.ADMIN_EMAIL ||
    user?.primaryEmailAddress?.emailAddress !== process.env.ADMIN_EMAIL
  ) {
    redirect("/");
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
    <main className="px-4 py-12 max-w-2xl mx-auto min-h-[70vh]">
      <div className="flex items-center justify-between mb-2 gap-3">
        <h1 className="text-2xl font-semibold">Stock</h1>
        <Link href="/admin/reviews" className="text-sm underline opacity-70">
          Reviews →
        </Link>
      </div>
      <p className="opacity-70 text-sm mb-6">
        Enter a number to track stock — it drops automatically on each sale, and
        the product shows <strong>Sold Out</strong> at 0. Leave blank to keep an
        item always available (untracked).
      </p>
      <StockEditor variants={variants} />
    </main>
  );
}
