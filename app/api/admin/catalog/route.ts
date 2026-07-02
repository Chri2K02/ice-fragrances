import { NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { getCatalog } from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { productContent } from "@/lib/db/schema";
import { getProduct } from "@/lib/products";

async function requireAdmin(): Promise<boolean> {
  const session = await getSession();
  return isAdminEmail(session?.user.email ?? null);
}

const forbidden = () =>
  NextResponse.json({ error: "Forbidden" }, { status: 403 });

export async function GET() {
  if (!(await requireAdmin())) return forbidden();
  return NextResponse.json({ products: await getCatalog() });
}

export async function PATCH(req: Request) {
  if (!(await requireAdmin())) return forbidden();
  const body = (await req.json()) as {
    productId?: string;
    tagline?: string | null;
    notes?: string | null;
    description?: string | null;
    oil?: string | null;
    poster?: string | null;
    video?: string | null;
    images?: string[] | null;
    audioMuted?: boolean;
    audioVolume?: number;
  };
  const id = (body.productId ?? "").toString();
  if (!id || !getProduct(id)) {
    return NextResponse.json({ error: "Unknown product" }, { status: 400 });
  }
  // Empty string -> null so the field falls back to the JSON base.
  const norm = (v: string | null | undefined) => {
    const t = (v ?? "").toString().trim();
    return t ? t : null;
  };
  const images = Array.isArray(body.images)
    ? body.images.map((s) => (s ?? "").toString().trim()).filter(Boolean)
    : null;
  const vol = Math.min(
    100,
    Math.max(0, Math.round(Number(body.audioVolume ?? 100)))
  );
  const row = {
    productId: id,
    tagline: norm(body.tagline),
    notes: norm(body.notes),
    description: norm(body.description),
    oil: norm(body.oil),
    poster: norm(body.poster),
    video: norm(body.video),
    images: images && images.length ? images : null,
    audioMuted: body.audioMuted ?? true,
    audioVolume: Number.isFinite(vol) ? vol : 100,
    updatedAt: new Date(),
  };
  await getDb()
    .insert(productContent)
    .values(row)
    .onConflictDoUpdate({ target: productContent.productId, set: row });

  // Bust the catalog cache + the pages that render it so edits show right away.
  // Next 16 requires a cache-life profile as the 2nd arg ("max" = full purge).
  revalidateTag("catalog", "max");
  revalidatePath("/");
  revalidatePath(`/products/${id}`);
  return NextResponse.json({ ok: true });
}
