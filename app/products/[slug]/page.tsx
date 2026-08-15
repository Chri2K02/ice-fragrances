import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PRODUCTS, getProduct } from "@/lib/products";
import { getProductView } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import {
  getReviewAggregate,
  getProductSoldOut,
  getRecentReviews,
} from "@/lib/productStats";
import { SITE, SITE_URL } from "@/lib/site";
import {
  ORG_ID,
  RETURN_POLICY,
  SHIPPING_DETAILS,
  VIDEO_UPLOAD_DATES,
  CATEGORY_LABELS,
  AUDIENCE_GENDER,
  jsonLdString,
} from "@/lib/structuredData";
import { formatPrice } from "@/lib/currency";
import { glacial, glacialRegular } from "@/lib/fonts";
import { Chevron } from "@/components/Chevron";
import { Reveal } from "@/components/Reveal";

// Per-product pages are statically generated (one per catalog entry) so the
// name, description, price and rating are real server-rendered HTML for
// crawlers — no request-time fetch for the content. Ratings live in the DB, so
// the page is ISR: the static HTML is rebuilt at most hourly to fold in new
// reviews (see lib/productStats, which caches the reads on the same interval).
export const revalidate = 3600;
// Only the known catalog slugs are valid; anything else is a 404, never a
// runtime-rendered page.
export const dynamicParams = false;

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.id }));
}

// Absolute URL for an in-app path (JSON-LD and OG require absolute URLs).
const abs = (path: string) =>
  path.startsWith("http") ? path : `${SITE_URL}${path}`;

// Offer.priceValidUntil, rolling +1 year. Module scope (render must stay
// pure); re-evaluated on every build/server instance, and with hourly ISR it
// never drifts anywhere near the past — a stale past date would suppress the
// price display in results.
const PRICE_VALID_UNTIL = new Date(Date.now() + 365 * 24 * 3600 * 1000)
  .toISOString()
  .slice(0, 10);

function productCopy(p: NonNullable<ReturnType<typeof getProduct>>): string {
  return p.description ?? p.notes ?? p.tagline ?? SITE.description;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductView(slug);
  if (!product) return {};

  const description = productCopy(product);
  const canonical = `/products/${product.id}`;
  return {
    title: product.name,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      title: `${product.name} · ${SITE.name}`,
      description,
      url: abs(canonical),
      images: [{ url: abs(product.poster), alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} · ${SITE.name}`,
      description,
    },
  };
}

// Server-rendered star row for the visible rating summary (the interactive
// Reviews island fetches client-side; this is the crawlable copy).
function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span aria-hidden className="tracking-tight">
      <span style={{ color: "var(--accent)" }}>{"★★★★★".slice(0, full)}</span>
      <span className="opacity-25">{"★★★★★".slice(full)}</span>
    </span>
  );
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductView(slug);
  if (!product) notFound();

  const [agg, soldOut, recentReviews] = await Promise.all([
    getReviewAggregate(product.id),
    getProductSoldOut(product.id, product.sizes ?? []),
    getRecentReviews(product.id),
  ]);

  const description = productCopy(product);
  const canonical = `/products/${product.id}`;
  const pageUrl = abs(canonical);
  const images = (
    product.images?.length ? product.images : [product.poster]
  ).map(abs);

  // The video is only marked up when its publish date is known (catalog
  // videos; an admin-overlaid video has no date, so it gets no VideoObject).
  const videoUploadDate = product.video && VIDEO_UPLOAD_DATES[product.video];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${pageUrl}#product`,
        name: product.name,
        sku: product.id,
        image: images,
        description,
        category: CATEGORY_LABELS[product.category],
        brand: { "@type": "Brand", name: SITE.name },
        ...(AUDIENCE_GENDER[product.category]
          ? {
              audience: {
                "@type": "PeopleAudience",
                suggestedGender: AUDIENCE_GENDER[product.category],
              },
            }
          : {}),
        ...(product.material ? { material: product.material } : {}),
        offers: {
          "@type": "Offer",
          price: (product.priceCents / 100).toFixed(2),
          priceCurrency: "CAD",
          availability: soldOut
            ? "https://schema.org/OutOfStock"
            : "https://schema.org/InStock",
          itemCondition: "https://schema.org/NewCondition",
          priceValidUntil: PRICE_VALID_UNTIL,
          url: pageUrl,
          seller: { "@id": ORG_ID },
          shippingDetails: SHIPPING_DETAILS,
          hasMerchantReturnPolicy: RETURN_POLICY,
        },
        // Only assert ratings/reviews when real ones exist — no empty stars.
        ...(agg.count > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: agg.average.toFixed(1),
                reviewCount: agg.count,
                bestRating: 5,
                worstRating: 1,
              },
            }
          : {}),
        ...(recentReviews.length > 0
          ? {
              review: recentReviews.map((r) => ({
                "@type": "Review",
                author: { "@type": "Person", name: r.author },
                reviewRating: {
                  "@type": "Rating",
                  ratingValue: r.rating,
                  bestRating: 5,
                  worstRating: 1,
                },
                ...(r.body ? { reviewBody: r.body } : {}),
                datePublished: r.datePublished,
              })),
            }
          : {}),
        ...(videoUploadDate
          ? { subjectOf: { "@id": `${pageUrl}#video` } }
          : {}),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${SITE_URL}/`,
          },
          // Final crumb carries no `item` — Google uses the page URL.
          { "@type": "ListItem", position: 2, name: product.name },
        ],
      },
      ...(videoUploadDate
        ? [
            {
              "@type": "VideoObject",
              "@id": `${pageUrl}#video`,
              name: `${product.name} — ${SITE.name}`,
              description,
              thumbnailUrl: abs(product.poster),
              contentUrl: abs(product.video!),
              uploadDate: videoUploadDate,
            },
          ]
        : []),
    ],
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-12 md:py-16 min-h-[60vh]">
      <script
        type="application/ld+json"
        // jsonLdString escapes `<` — review bodies are user-generated text.
        dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }}
      />

      <nav className={`${glacialRegular.className} text-sm mb-8`}>
        <Link
          href="/#products"
          className="opacity-60 hover:opacity-100 inline-flex items-center gap-1.5"
        >
          <Chevron dir="left" />
          Back to the collection
        </Link>
      </nav>

      <Reveal as="section" className={`${glacial.className} uppercase mb-8 max-w-2xl block`}>
        <h1 className="text-4xl font-semibold">{product.name}</h1>

        {product.tagline && (
          <p
            className={`${glacialRegular.className} normal-case italic opacity-70 mt-3`}
          >
            {product.tagline}
          </p>
        )}

        <p className="mt-3 text-lg font-semibold normal-case">
          {formatPrice(product.priceCents, "CAD")}
        </p>

        {agg.count > 0 && (
          <div
            className={`${glacialRegular.className} normal-case mt-3 flex items-center gap-2 text-sm`}
          >
            <Stars value={agg.average} />
            <span className="opacity-70">
              {agg.average.toFixed(1)} ({agg.count}{" "}
              {agg.count === 1 ? "review" : "reviews"})
            </span>
          </div>
        )}

        {description && (
          <p
            className={`${glacialRegular.className} normal-case mt-5 text-base leading-relaxed opacity-90`}
          >
            {description}
          </p>
        )}
      </Reveal>

      {/* Interactive island: gallery, size/stock, add-to-cart, and the Reviews
          thread — reused from the storefront in `compact` mode so the name,
          tagline and price (already in the header above) aren't duplicated. */}
      <div className="max-w-md">
        <ProductCard product={product} compact audio={product.audio} />
      </div>
    </main>
  );
}
