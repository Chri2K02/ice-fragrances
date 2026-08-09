import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { adminPermsFor } from "@/lib/admin";
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
  if (!(await adminPermsFor(session.user.email)).reviews) redirect("/admin");

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
    <>
      <h1 className="text-2xl font-semibold mb-2">Reviews</h1>
      <p className="opacity-70 text-sm mb-6">
        Every review across all products. Remove any here.
      </p>
      <AdminReviewList reviews={list} />
    </>
  );
}
