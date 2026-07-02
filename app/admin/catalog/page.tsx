import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { getCatalog } from "@/lib/catalog";
import { AdminCatalog } from "@/components/AdminCatalog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Catalog",
  robots: { index: false, follow: false },
};

export default async function AdminCatalogPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (!(await isAdminEmail(session.user.email))) redirect("/");

  const products = await getCatalog();

  return (
    <main className="px-4 py-12 max-w-2xl mx-auto min-h-[70vh]">
      <div className="flex items-center justify-between mb-2 gap-3">
        <h1 className="text-2xl font-semibold">Catalog content</h1>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/admin" className="underline opacity-70">
            ← Stock
          </Link>
        </nav>
      </div>
      <p className="opacity-70 text-sm mb-6">
        Edit copy, media, and per-video audio. Prices, sizes and availability
        live in Stock. Blank fields fall back to the built-in defaults; saves go
        live right away.
      </p>
      <AdminCatalog products={products} />
    </main>
  );
}
