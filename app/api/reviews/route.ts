import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { reviews, orders, orderItems } from "@/lib/db/schema";
import { getProduct } from "@/lib/products";

type DB = ReturnType<typeof getDb>;

async function hasPurchased(db: DB, userId: string, productId: string) {
  const rows = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(eq(orders.clerkUserId, userId), eq(orderItems.productId, productId))
    )
    .limit(1);
  return rows.length > 0;
}

export async function GET(req: Request) {
  const productId = new URL(req.url).searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }
  const db = getDb();
  const list = await db
    .select()
    .from(reviews)
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt));

  const count = list.length;
  const average = count
    ? list.reduce((s, r) => s + r.rating, 0) / count
    : 0;

  const { userId } = await auth();
  let canReview = false;
  let alreadyReviewed = false;
  let isAdmin = false;
  if (userId) {
    alreadyReviewed = list.some((r) => r.clerkUserId === userId);
    canReview = !alreadyReviewed && (await hasPurchased(db, userId, productId));
    if (count > 0 && process.env.ADMIN_EMAIL) {
      const user = await currentUser();
      isAdmin =
        user?.primaryEmailAddress?.emailAddress === process.env.ADMIN_EMAIL;
    }
  }

  return NextResponse.json({
    count,
    average,
    reviews: list.map((r) => ({
      id: r.id,
      authorName: r.authorName,
      rating: r.rating,
      body: r.body,
      createdAt: r.createdAt,
    })),
    signedIn: !!userId,
    canReview,
    alreadyReviewed,
    isAdmin,
  });
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await currentUser();
  if (
    !process.env.ADMIN_EMAIL ||
    user?.primaryEmailAddress?.emailAddress !== process.env.ADMIN_EMAIL
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await getDb().delete(reviews).where(eq(reviews.id, id));
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to review" }, { status: 401 });
  }
  const { productId, rating, body } = (await req.json()) as {
    productId?: string;
    rating?: number;
    body?: string;
  };
  if (!productId || !getProduct(productId)) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }
  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) {
    return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 });
  }

  const db = getDb();
  if (!(await hasPurchased(db, userId, productId))) {
    return NextResponse.json(
      { error: "Only verified buyers can review this item" },
      { status: 403 }
    );
  }
  const existing = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.clerkUserId, userId)))
    .limit(1);
  if (existing.length) {
    return NextResponse.json(
      { error: "You already reviewed this item" },
      { status: 409 }
    );
  }

  const user = await currentUser();
  const name =
    [user?.firstName, user?.lastName ? user.lastName[0] + "." : ""]
      .filter(Boolean)
      .join(" ") ||
    user?.username ||
    "Customer";

  await db.insert(reviews).values({
    productId,
    clerkUserId: userId,
    authorName: name,
    rating: r,
    body: (body ?? "").toString().slice(0, 2000),
  });

  return NextResponse.json({ ok: true });
}
