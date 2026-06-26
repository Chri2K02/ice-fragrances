import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/db";
import { inventory } from "@/lib/db/schema";
import { getProduct } from "@/lib/products";

async function isAdmin() {
  const session = await getSession();
  const email = session?.user.email ?? null;
  return !!process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL;
}

// Public: stock map { [sizeOrEmpty]: number } for tracked variants of a product.
// Variants with no row are untracked (treated as in-stock).
export async function GET(req: Request) {
  const productId = new URL(req.url).searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }
  const db = getDb();
  const rows = await db
    .select()
    .from(inventory)
    .where(eq(inventory.productId, productId));
  const stock: Record<string, number> = {};
  for (const r of rows) stock[r.size] = r.stock;
  return NextResponse.json({ stock });
}

// Admin: set stock for a product variant.
export async function PUT(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { productId, size, stock } = (await req.json()) as {
    productId?: string;
    size?: string;
    stock?: number;
  };
  if (!productId || !getProduct(productId)) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }
  const s = (size ?? "").toString();
  const n = Number(stock);
  if (!Number.isInteger(n) || n < 0) {
    return NextResponse.json({ error: "Invalid stock" }, { status: 400 });
  }
  const db = getDb();
  await db
    .insert(inventory)
    .values({ productId, size: s, stock: n })
    .onConflictDoUpdate({
      target: [inventory.productId, inventory.size],
      set: { stock: n },
    });
  return NextResponse.json({ ok: true });
}
