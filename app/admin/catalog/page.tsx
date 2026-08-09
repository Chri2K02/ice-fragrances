import { redirect } from "next/navigation";
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
    <>
      <h1 className="text-2xl font-semibold mb-2">Catalog content</h1>
      <p className="opacity-70 text-sm mb-6">
        Edit copy, media, and per-video audio. Prices, sizes and availability
        live in Stock. Blank fields fall back to the built-in defaults; saves go
        live right away.
      </p>
      <AdminCatalog products={products} />
    </>
  );
}
