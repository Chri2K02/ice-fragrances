import { SITE_URL } from "@/lib/site";

// Shared schema.org building blocks, consumed by the site-wide JSON-LD
// (components/JsonLd.tsx) and the per-product pages (app/products/[slug]).
// Everything asserted here must be backed by visible page copy — the shipping
// and returns facts mirror /shipping and /terms; keep them in sync when those
// pages change.

// The Organization node's @id (declared in components/JsonLd.tsx, which the
// root layout renders on every page) — other nodes reference it by id.
export const ORG_ID = `${SITE_URL}/#organization`;

// Returns per /terms: damaged items are replaced, opened items are otherwise
// non-returnable. That nuance has no clean returnPolicyCategory, so use the
// link form of MerchantReturnPolicy and let the policy page speak for itself.
export const RETURN_POLICY = {
  "@type": "MerchantReturnPolicy",
  merchantReturnLink: `${SITE_URL}/terms`,
} as const;

// Shipping per /shipping: paid on our end (free to the buyer), US + Canada,
// delivered within at most 10 days. Duties/import taxes are the receiver's and
// are not part of the shipping rate.
export const SHIPPING_DETAILS = {
  "@type": "OfferShippingDetails",
  shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "CAD" },
  shippingDestination: [
    { "@type": "DefinedRegion", addressCountry: "US" },
    { "@type": "DefinedRegion", addressCountry: "CA" },
  ],
  deliveryTime: {
    "@type": "ShippingDeliveryTime",
    transitTime: {
      "@type": "QuantitativeValue",
      minValue: 1,
      maxValue: 10,
      unitCode: "DAY",
    },
  },
} as const;

// First-published dates of the catalog videos, from git history (the date each
// file landed in public/media). VideoObject requires uploadDate, so a video
// with no entry here — e.g. one swapped in through the admin overlay — simply
// gets no VideoObject rather than a fabricated date.
export const VIDEO_UPLOAD_DATES: Record<string, string> = {
  "/media/frost-mind.mp4": "2026-06-05",
  "/media/glacier-hours.mp4": "2026-06-05",
  "/media/hailstone-wildflower.mp4": "2026-06-05",
  "/media/iceberg-embrace.mp4": "2026-06-05",
  "/media/humidifier.mp4": "2026-06-05",
};

// Human-readable schema.org Product.category per catalog category.
export const CATEGORY_LABELS: Record<string, string> = {
  womens: "Women's fragrances",
  mens: "Men's fragrances",
  apparel: "Apparel",
  accessories: "Accessories",
};

// PeopleAudience.suggestedGender for the gendered fragrance lines (a
// merchant-listing recommended property). Apparel/accessories are unstated in
// the catalog, so they assert no audience rather than a guessed one.
export const AUDIENCE_GENDER: Record<string, string> = {
  womens: "female",
  mens: "male",
};

// JSON-LD payloads go through dangerouslySetInnerHTML, and review bodies are
// user-generated — escape `<` so a "</script>" in a review can't break out of
// the script tag (per the Next.js JSON-LD guide).
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
