import { NextResponse } from "next/server";
import { and, desc, eq, or } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/db";
import { reviews, orders, orderItems } from "@/lib/db/schema";
import { getProduct } from "@/lib/products";
import { hasAdminPerm, recipientsFor } from "@/lib/admin";
import { sendEmail } from "@/lib/email";

type DB = ReturnType<typeof getDb>;

async function hasPurchased(
  db: DB,
  userId: string,
  productId: string,
  email: string | null
) {
  // Match the order to the buyer by their account OR the email they used at
  // checkout — so guest purchases count once they sign up with that email.
  // Matching by email also covers legacy orders whose user_id isn't backfilled
  // yet (A4), since they still carry the checkout email.
  const owner = email
    ? or(eq(orders.userId, userId), eq(orders.email, email))
    : eq(orders.userId, userId);
  const rows = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(owner, eq(orderItems.productId, productId)))
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

  const session = await getSession();
  const userId = session?.user.id ?? null;
  const email = session?.user.email ?? null;
  let canReview = false;
  let alreadyReviewed = false;
  let isAdmin = false;
  if (userId) {
    // Any signed-in account can post a review (verification is a badge, not a
    // gate); they just can't review the same product twice.
    alreadyReviewed = list.some((r) => r.userId === userId);
    canReview = !alreadyReviewed;
    // Drives the admin reply controls in the public review list, so it tracks
    // the reviews surface permission specifically.
    isAdmin = await hasAdminPerm(email, "reviews");
  }

  return NextResponse.json({
    count,
    average,
    reviews: list.map((r) => ({
      id: r.id,
      // Anonymous reviews never expose the stored real name to the client.
      authorName: r.anonymous ? "Anonymous" : r.authorName,
      anonymous: r.anonymous,
      // Frozen at post time; drives the "Verified Buyer" badge.
      verified: r.verified,
      rating: r.rating,
      body: r.body,
      adminReply: r.adminReply,
      // replied_by is omitted: the public reply face is always Ice Fragrances.
      repliedAt: r.repliedAt,
      createdAt: r.createdAt,
    })),
    signedIn: !!userId,
    canReview,
    alreadyReviewed,
    isAdmin,
  });
}

// Whether the signed-in user holds the reviews surface permission.
async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return hasAdminPerm(session?.user.email ?? null, "reviews");
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await getDb().delete(reviews).where(eq(reviews.id, id));
  return NextResponse.json({ ok: true });
}

// Admin posts (or clears) the store's public reply to a review.
export async function PATCH(req: Request) {
  const session = await getSession();
  const email = session?.user.email ?? null;
  if (!(await hasAdminPerm(email, "reviews"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id, reply } = (await req.json()) as { id?: number; reply?: string };
  if (!Number.isInteger(id) || (id ?? 0) <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const text = (reply ?? "").toString().trim().slice(0, 2000);
  await getDb()
    .update(reviews)
    .set({
      adminReply: text || null,
      // Internal record of which admin replied; never surfaced publicly.
      repliedBy: text ? email : null,
      repliedAt: text ? new Date() : null,
    })
    .where(eq(reviews.id, id!));
  return NextResponse.json({ ok: true, reply: text || null });
}

export async function POST(req: Request) {
  const session = await getSession();
  const userId = session?.user.id ?? null;
  if (!userId) {
    return NextResponse.json({ error: "Sign in to review" }, { status: 401 });
  }
  const { productId, rating, body, anonymous } = (await req.json()) as {
    productId?: string;
    rating?: number;
    body?: string;
    anonymous?: boolean;
  };
  if (!productId || !getProduct(productId)) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }
  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) {
    return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 });
  }

  const db = getDb();
  const email = session?.user.email ?? null;

  // One review per account per product.
  const existing = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.userId, userId)))
    .limit(1);
  if (existing.length) {
    return NextResponse.json(
      { error: "You already reviewed this item" },
      { status: 409 }
    );
  }

  // Verified is FROZEN here: whether this account owns an order containing the
  // product AT POST TIME. Stored and never recomputed, so it stays stable if
  // orders change, and lets seeded reviews be verified without a real order.
  const verified = await hasPurchased(db, userId, productId, email);

  // Prefer the Better Auth profile name; fall back to the checkout name. The
  // real name is always stored; the `anonymous` flag controls public display.
  let name = session?.user.name ?? "";
  if (!name) {
    const ord = await db
      .select({ name: orders.name })
      .from(orders)
      .where(
        email
          ? or(eq(orders.userId, userId), eq(orders.email, email))
          : eq(orders.userId, userId)
      )
      .orderBy(desc(orders.createdAt))
      .limit(1);
    name = ord[0]?.name ?? "";
  }
  name = name || "Customer";

  await db.insert(reviews).values({
    productId,
    userId,
    authorName: name,
    rating: r,
    body: (body ?? "").toString().slice(0, 2000),
    verified,
    anonymous: !!anonymous,
  });

  // Notify the store (best-effort; sendEmail no-ops without RESEND_API_KEY and
  // never throws). Recipients come from the notification surface.
  const productName = getProduct(productId)?.name ?? productId;
  const to = await recipientsFor("reviews");
  if (to.length) {
    await sendEmail({
      to: to.join(", "),
      subject: `New review — ${productName} (${r}★)`,
      html: `
        <h2 style="margin:0 0 8px">New ${r}★ review on ${productName}</h2>
        <p><strong>By:</strong> ${name}${anonymous ? " (posted anonymously)" : ""}${verified ? " · verified buyer" : ""}</p>
        ${body ? `<p>${(body as string).slice(0, 2000)}</p>` : ""}
      `,
    });
  }

  return NextResponse.json({ ok: true, verified });
}
