import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PRODUCTS, getProduct } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { getReviewAggregate, getProductSoldOut } from "@/lib/productStats";
import { SITE, SITE_URL } from "@/lib/site";
import { formatPrice } from "@/lib/currency";
import { glacial, glacialRegular } from "@/lib/fonts";

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

function productCopy(p: NonNullable<ReturnType<typeof getProduct>>): string {
  return p.description ?? p.notes ?? p.tagline ?? SITE.description;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
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
  const product = getProduct(slug);
  if (!product) notFound();

  const [agg, soldOut] = await Promise.all([
    getReviewAggregate(product.id),
    getProductSoldOut(product.id, product.sizes ?? []),
  ]);

  const description = productCopy(product);
  const canonical = `/products/${product.id}`;
  const images = (
    product.images?.length ? product.images : [product.poster]
  ).map(abs);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: images,
    description,
    brand: { "@type": "Brand", name: SITE.name },
    offers: {
      "@type": "Offer",
      price: (product.priceCents / 100).toFixed(2),
      priceCurrency: "CAD",
      availability: soldOut
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      url: abs(canonical),
    },
    // Only assert a rating when real reviews exist — never emit empty stars.
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
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-12 md:py-16 min-h-[60vh]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className={`${glacialRegular.className} text-sm mb-8`}>
        <Link href="/#products" className="opacity-60 hover:opacity-100">
          ← Back to the collection
        </Link>
      </nav>

      <header className={`${glacial.className} uppercase mb-8 max-w-2xl`}>
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
      </header>

      {/* Interactive island: gallery, currency-aware price, size/stock,
          add-to-cart, and the Reviews thread — reused from the storefront. */}
      <div className="max-w-md">
        <ProductCard product={product} />
      </div>
    </main>
  );
}
