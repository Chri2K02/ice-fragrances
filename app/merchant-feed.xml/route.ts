import { getCatalog } from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { inventory } from "@/lib/db/schema";
import { SITE, SITE_URL } from "@/lib/site";
import { AUDIENCE_GENDER } from "@/lib/structuredData";

// Google Merchant Center product feed (RSS 2.0 + g: namespace), served at
// /merchant-feed.xml for the "add products from a file" link option. Built
// from the same sources as the storefront — the catalog view (JSON base +
// admin overlay) and the inventory table — so the feed can never disagree
// with the site. Regenerated at most hourly (ISR), which is ahead of
// Merchant Center's daily fetch schedule.
export const revalidate = 3600;

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const abs = (path: string) =>
  path.startsWith("http") ? path : `${SITE_URL}${path}`;

// Same availability rule as the storefront and the JSON-LD: a variant with no
// inventory row is untracked and treated as in stock. DB failure → everything
// in stock (the untracked default) rather than a feed full of out_of_stock.
async function stockMap(): Promise<Map<string, number>> {
  try {
    const rows = await getDb()
      .select({
        productId: inventory.productId,
        size: inventory.size,
        stock: inventory.stock,
      })
      .from(inventory);
    return new Map(rows.map((r) => [`${r.productId}|${r.size}`, r.stock]));
  } catch {
    return new Map();
  }
}

// Free shipping to US + Canada, mirroring /shipping and the Offer markup.
const SHIPPING = ["US", "CA"]
  .map(
    (c) =>
      `<g:shipping><g:country>${c}</g:country><g:price>0.00 CAD</g:price></g:shipping>`
  )
  .join("");

export async function GET() {
  const [products, stock] = await Promise.all([getCatalog(), stockMap()]);

  const items: string[] = [];
  for (const p of products) {
    const price = `${(p.priceCents / 100).toFixed(2)} CAD`;
    const link = `${SITE_URL}/products/${p.id}`;
    const images = (p.images?.length ? p.images : [p.poster]).map(abs);
    const description = p.description ?? p.notes ?? p.tagline ?? SITE.description;
    const gender = AUDIENCE_GENDER[p.category];
    // Sized products emit one item per size, grouped by item_group_id, since
    // Merchant Center models sizes as separate offers. Sizeless products are a
    // single ungrouped item with the empty-size inventory key.
    const variants = p.sizes?.length ? p.sizes : [""];
    for (const size of variants) {
      const key = `${p.id}|${size}`;
      const soldOut = stock.has(key) && (stock.get(key) ?? 0) <= 0;
      items.push(
        [
          "<item>",
          `<g:id>${esc(size ? `${p.id}-${size}` : p.id)}</g:id>`,
          `<g:title>${esc(size ? `${p.name} (${size})` : p.name)}</g:title>`,
          `<g:description>${esc(description)}</g:description>`,
          `<g:link>${esc(link)}</g:link>`,
          `<g:image_link>${esc(images[0])}</g:image_link>`,
          ...images
            .slice(1, 11)
            .map((i) => `<g:additional_image_link>${esc(i)}</g:additional_image_link>`),
          `<g:availability>${soldOut ? "out_of_stock" : "in_stock"}</g:availability>`,
          `<g:price>${price}</g:price>`,
          `<g:brand>${esc(SITE.name)}</g:brand>`,
          `<g:condition>new</g:condition>`,
          // Own-brand products without GTIN/MPN — declared, not fabricated.
          `<g:identifier_exists>no</g:identifier_exists>`,
          ...(size
            ? [
                `<g:item_group_id>${esc(p.id)}</g:item_group_id>`,
                `<g:size>${esc(size)}</g:size>`,
              ]
            : []),
          ...(gender ? [`<g:gender>${gender}</g:gender>`] : []),
          ...(p.material ? [`<g:material>${esc(p.material)}</g:material>`] : []),
          SHIPPING,
          "</item>",
        ].join("")
      );
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>${esc(SITE.name)}</title>
<link>${SITE_URL}</link>
<description>${esc(SITE.description)}</description>
${items.join("\n")}
</channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
