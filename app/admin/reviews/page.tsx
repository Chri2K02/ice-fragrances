import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { reviews } from "@/lib/db/schema";
import { getProduct } from "@/lib/products";
import { AdminReviewList } from "@/components/AdminReviewList";

export default async function AdminReviewsPage() {
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
  const all = await db.select().from(reviews).orderBy(desc(reviews.createdAt));
  const list = all.map((r) => ({
    id: r.id,
    productName: getProduct(r.productId)?.name ?? r.productId,
    authorName: r.authorName,
    rating: r.rating,
    body: r.body,
    adminReply: r.adminReply,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : "",
  }));

  return (
    <main className="px-4 py-12 max-w-2xl mx-auto min-h-[70vh]">
      <div className="flex items-center justify-between mb-2 gap-3">
        <h1 className="text-2xl font-semibold">Reviews</h1>
        <Link href="/admin" className="text-sm underline opacity-70">
          ← Stock
        </Link>
      </div>
      <p className="opacity-70 text-sm mb-6">
        Every review across all products. Remove any here.
      </p>
      <AdminReviewList reviews={list} />
    </main>
  );
}
