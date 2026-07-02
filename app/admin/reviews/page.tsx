import { redirect } from "next/navigation";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { reviews } from "@/lib/db/schema";
import { getProduct } from "@/lib/products";
import { AdminReviewList } from "@/components/AdminReviewList";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Reviews",
  robots: { index: false, follow: false },
};

export default async function AdminReviewsPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (!(await isAdminEmail(session.user.email))) {
    redirect("/");
  }

  const db = getDb();
  const all = await db.select().from(reviews).orderBy(desc(reviews.createdAt));
  const list = all.map((r) => ({
    id: r.id,
    productName: getProduct(r.productId)?.name ?? r.productId,
    authorName: r.authorName,
    anonymous: r.anonymous,
    verified: r.verified,
    rating: r.rating,
    body: r.body,
    adminReply: r.adminReply,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : "",
  }));

  return (
    <main className="px-4 py-12 max-w-2xl mx-auto min-h-[70vh]">
      <div className="flex items-center justify-between mb-2 gap-3">
        <h1 className="text-2xl font-semibold">Reviews</h1>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/admin" className="underline opacity-70">
            ← Stock
          </Link>
          <Link href="/admin/settings" className="underline opacity-70">
            Team →
          </Link>
        </nav>
      </div>
      <p className="opacity-70 text-sm mb-6">
        Every review across all products. Remove any here.
      </p>
      <AdminReviewList reviews={list} />
    </main>
  );
}
