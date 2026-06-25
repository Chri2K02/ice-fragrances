"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { VideoPlayer } from "@/components/VideoPlayer";
import { useCart } from "@/lib/cartStore";
import type { Product } from "@/lib/products";
import { glacialRegular } from "@/lib/fonts";
import { Reviews } from "@/components/Reviews";
import { formatPrice, convertCents } from "@/lib/currency";
import { useDisplayCurrency } from "@/lib/currencyStore";
import { useToast } from "@/lib/toastStore";
import { fbTrack } from "@/lib/fbpixel";

type Slide =
  | { type: "image"; src: string }
  | { type: "video"; src: string; poster: string };

// `compact` strips the textual product info (name/price row, tagline/notes/oil,
// and the self-referential "More details" link) so the card can be embedded on
// the product page — where that copy is already server-rendered in the page
// header — as a pure gallery + buy box + reviews. Defaults off for the grid.
export function ProductCard({
  product,
  compact = false,
}: {
  product: Product;
  compact?: boolean;
}) {
  const add = useCart((s) => s.add);
  const show = useToast((s) => s.show);
  const currency = useDisplayCurrency();
  const price = formatPrice(product.priceCents, currency);

  // Build the ordered media list: first photo (thumbnail), then the video
  // (if any), then the rest of the gallery.
  const photos =
    product.images && product.images.length > 0
      ? product.images
      : [product.poster];
  const [firstPhoto, ...restPhotos] = photos;
  const slides: Slide[] = [
    { type: "image" as const, src: firstPhoto },
    ...(product.video
      ? [{ type: "video" as const, src: product.video, poster: product.poster }]
      : []),
    ...restPhotos.map((src) => ({ type: "image" as const, src })),
  ];

  const [idx, setIdx] = useState(0);
  const current = slides[idx];
  const multi = slides.length > 1;

  const needsSize = (product.sizes?.length ?? 0) > 0;
  const [size, setSize] = useState("");

  const [stockMap, setStockMap] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    fetch(`/api/stock?productId=${product.id}`)
      .then((r) => r.json())
      .then((d) => setStockMap(d.stock ?? {}))
      .catch(() => {});
  }, [product.id]);

  // Fire a Meta "ViewContent" once when this product scrolls into view.
  const cardRef = useRef<HTMLDivElement>(null);
  const viewedRef = useRef(false);
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !viewedRef.current) {
          viewedRef.current = true;
          fbTrack("ViewContent", {
            content_name: product.name,
            content_ids: [product.id],
            content_type: "product",
            value: convertCents(product.priceCents, currency) / 100,
            currency,
          });
          io.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const isOut = (variant: string) =>
    stockMap != null && variant in stockMap && stockMap[variant] <= 0;
  const productSoldOut = needsSize
    ? product.sizes!.every((s) => isOut(s))
    : isOut("");
  const addDisabled = productSoldOut || (needsSize && (!size || isOut(size)));

  const arrowBtn =
    "absolute z-10 top-1/2 -translate-y-1/2 rounded-full bg-black/60 text-white w-9 h-9 grid place-items-center backdrop-blur";

  return (
    <div
      ref={cardRef}
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: "var(--card)" }}
    >
      <div className="relative aspect-[9/16] overflow-hidden rounded-2xl">
        {current.type === "image" ? (
          <Image
            src={current.src}
            alt={product.name}
            fill
            data-testid="product-photo"
            className="object-cover"
          />
        ) : (
          <VideoPlayer
            src={current.src}
            poster={current.poster}
            label={product.name}
          />
        )}

        {multi && (
          <>
            <button
              type="button"
              onClick={() =>
                setIdx((i) => (i - 1 + slides.length) % slides.length)
              }
              aria-label="Previous media"
              className={`${arrowBtn} left-3`}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setIdx((i) => (i + 1) % slides.length)}
              aria-label="Next media"
              className={`${arrowBtn} right-3`}
            >
              ›
            </button>
          </>
        )}

        {productSoldOut && (
          <div className="absolute inset-0 z-20 grid place-items-center bg-black/50">
            <span className="rounded-full bg-black text-white px-4 py-1.5 text-sm font-medium uppercase tracking-wide">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {!compact && (
        <>
          <div className="flex items-center justify-between">
            {/* Title links to the product page; App Router <Link> prefetches the
                route on viewport/hover so the (statically hydrated) page opens
                instantly. */}
            <h3 className="text-lg font-medium">
              <Link
                href={`/products/${product.id}`}
                prefetch
                className="hover:opacity-70 transition-opacity"
              >
                {product.name}
              </Link>
            </h3>
            <span className="font-semibold">{price}</span>
          </div>

          {(product.tagline || product.notes || product.oil) && (
            <div
              className={`${glacialRegular.className} text-sm opacity-70 space-y-1`}
            >
              {product.tagline && <p className="italic">{product.tagline}</p>}
              {product.notes && <p>{product.notes}</p>}
              {product.oil && <p>Oil concentration: {product.oil}</p>}
            </div>
          )}

          {/* Explicit affordance to the full product page (additive — cart/gallery
              interactions below are unchanged). Prefetched like the title link. */}
          <Link
            href={`/products/${product.id}`}
            prefetch
            className={`${glacialRegular.className} w-fit text-sm underline underline-offset-4 opacity-70 hover:opacity-100 transition-opacity normal-case`}
          >
            More details →
          </Link>
        </>
      )}

      <div className="mt-auto flex flex-col gap-3">
        {needsSize && (
          <div className="flex flex-wrap gap-2 normal-case">
            {product.sizes!.map((s) => {
              const out = isOut(s);
              return (
                <button
                  key={s}
                  type="button"
                  disabled={out}
                  onClick={() => setSize(s)}
                  className={`rounded-full border-2 px-3 py-1 text-sm ${
                    out ? "line-through opacity-40" : ""
                  }`}
                  style={
                    size === s && !out
                      ? { background: "var(--accent)", color: "#000", borderColor: "#000" }
                      : { borderColor: "rgba(128,128,128,0.4)" }
                  }
                >
                  {s}
                </button>
              );
            })}
          </div>
        )}
        <button
          type="button"
          disabled={addDisabled || (needsSize && !size)}
          onClick={() => {
            add(product.id, size || undefined);
            show(`Added ${product.name}${size ? ` (${size})` : ""} to cart`);
            fbTrack("AddToCart", {
              content_name: product.name,
              content_ids: [product.id],
              content_type: "product",
              value: convertCents(product.priceCents, currency) / 100,
              currency,
            });
          }}
          className="rounded-full px-4 py-2 font-medium text-black border-2 border-black normal-case disabled:opacity-40"
          style={{ background: "var(--accent)" }}
        >
          {productSoldOut
            ? "Sold Out"
            : needsSize && !size
              ? "Select a size"
              : "Add to Cart"}
        </button>
      </div>

      <Reviews productId={product.id} />
    </div>
  );
}
