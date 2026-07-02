import "server-only";
import { unstable_cache } from "next/cache";
import { getDb } from "@/lib/db";
import { productContent } from "@/lib/db/schema";
import { PRODUCTS, getProduct, type Product } from "@/lib/products";

// Server-side catalog view: the versioned JSON base (identity + price) merged
// with the editable DB overlay (copy, media, per-video audio). Cached and
// tagged "catalog" so it stays SSG/ISR and refreshes when the admin editor
// calls revalidateTag("catalog"). Degrades to the pure JSON base if the DB is
// unreachable, so the storefront never breaks on a DB blip.

export type ProductAudio = { muted: boolean; volume: number };
export type ProductView = Product & { audio: ProductAudio };

type Overlay = typeof productContent.$inferSelect;

const CATALOG_TAG = "catalog";

const loadOverlay = unstable_cache(
  async (): Promise<Record<string, Overlay>> => {
    try {
      const rows = await getDb().select().from(productContent);
      return Object.fromEntries(rows.map((r) => [r.productId, r]));
    } catch {
      return {};
    }
  },
  ["product-content"],
  { tags: [CATALOG_TAG], revalidate: 3600 }
);

function merge(base: Product, o: Overlay | undefined): ProductView {
  return {
    ...base,
    tagline: o?.tagline ?? base.tagline,
    notes: o?.notes ?? base.notes,
    description: o?.description ?? base.description,
    oil: o?.oil ?? base.oil,
    poster: o?.poster ?? base.poster,
    video: o?.video ?? base.video,
    images: o?.images && o.images.length ? o.images : base.images,
    audio: {
      muted: o?.audioMuted ?? true,
      volume: o?.audioVolume ?? 100,
    },
  };
}

export async function getCatalog(): Promise<ProductView[]> {
  const overlay = await loadOverlay();
  return PRODUCTS.map((p) => merge(p, overlay[p.id]));
}

export async function getProductView(
  id: string
): Promise<ProductView | undefined> {
  const base = getProduct(id);
  if (!base) return undefined;
  const overlay = await loadOverlay();
  return merge(base, overlay[id]);
}
