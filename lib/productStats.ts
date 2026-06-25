import "server-only";
import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { reviews, inventory } from "@/lib/db/schema";

// Server-only, DB-derived per-product facts for the statically-generated
// product pages (app/products/[slug]). Both reads are wrapped in unstable_cache
// so the page stays prerenderable (SSG) and refreshes on the route's ISR
// interval instead of forcing dynamic rendering — and both degrade gracefully
// to a "no data" answer if the database is unreachable at build time, so a
// product page never blocks or emits a fabricated rating.

export type ReviewAggregate = { count: number; average: number };

// Mirrors the aggregate computed by GET /api/reviews: count of rows and the
// mean rating. A count of 0 (or a DB failure) means "no rating to show" — the
// caller must then omit aggregateRating from the structured data entirely.
export const getReviewAggregate = unstable_cache(
  async (productId: string): Promise<ReviewAggregate> => {
    try {
      const rows = await getDb()
        .select({ rating: reviews.rating })
        .from(reviews)
        .where(eq(reviews.productId, productId));
      const count = rows.length;
      const average = count
        ? rows.reduce((s, r) => s + r.rating, 0) / count
        : 0;
      return { count, average };
    } catch {
      return { count: 0, average: 0 };
    }
  },
  ["product-review-aggregate"],
  { tags: ["reviews"], revalidate: 3600 }
);

// Availability for the product's Offer, derived from the inventory table the
// same way ProductCard does: a variant with no row is untracked and treated as
// in stock; the product is sold out only when every tracked variant it offers
// is at zero. Defaults to in-stock when the DB is unreachable (the untracked
// default), so we never falsely advertise an item as sold out.
export const getProductSoldOut = unstable_cache(
  async (productId: string, sizes: string[]): Promise<boolean> => {
    try {
      const rows = await getDb()
        .select({ size: inventory.size, stock: inventory.stock })
        .from(inventory)
        .where(eq(inventory.productId, productId));
      const stock = new Map(rows.map((r) => [r.size, r.stock]));
      const isOut = (variant: string) =>
        stock.has(variant) && (stock.get(variant) ?? 0) <= 0;
      return sizes.length > 0 ? sizes.every(isOut) : isOut("");
    } catch {
      return false;
    }
  },
  ["product-sold-out"],
  { tags: ["inventory"], revalidate: 3600 }
);
