"use client";
import { useState } from "react";
import Image from "next/image";
import { VideoPlayer } from "@/components/VideoPlayer";
import { useCart } from "@/lib/cartStore";
import type { Product } from "@/lib/products";
import { glacialRegular } from "@/lib/fonts";

export function ProductCard({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const price = `$${(product.priceCents / 100).toFixed(2)}`;

  const hasVideo = Boolean(product.video);
  const gallery =
    product.images && product.images.length > 0
      ? product.images
      : [product.poster];

  // Video products toggle photo <-> video; gallery products cycle photos.
  const [showPhoto, setShowPhoto] = useState(true);
  const [idx, setIdx] = useState(0);

  const arrowBtn =
    "absolute z-10 rounded-full bg-black/60 text-white w-9 h-9 grid place-items-center backdrop-blur";

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: "var(--card)" }}
    >
      <div className="relative aspect-[9/16] overflow-hidden rounded-2xl">
        {hasVideo ? (
          showPhoto ? (
            <Image
              src={product.poster}
              alt={product.name}
              fill
              data-testid="product-photo"
              className="object-cover"
            />
          ) : (
            <VideoPlayer
              src={product.video!}
              poster={product.poster}
              label={product.name}
            />
          )
        ) : (
          <Image
            src={gallery[idx]}
            alt={`${product.name} (${idx + 1} of ${gallery.length})`}
            fill
            data-testid="product-photo"
            className="object-cover"
          />
        )}

        {hasVideo ? (
          <button
            type="button"
            onClick={() => setShowPhoto((v) => !v)}
            aria-label={showPhoto ? "Show video" : "Show photo"}
            className={`${arrowBtn} top-3 right-3`}
          >
            {showPhoto ? "›" : "‹"}
          </button>
        ) : gallery.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() =>
                setIdx((i) => (i - 1 + gallery.length) % gallery.length)
              }
              aria-label="Previous photo"
              className={`${arrowBtn} top-1/2 left-3 -translate-y-1/2`}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setIdx((i) => (i + 1) % gallery.length)}
              aria-label="Next photo"
              className={`${arrowBtn} top-1/2 right-3 -translate-y-1/2`}
            >
              ›
            </button>
          </>
        ) : null}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{product.name}</h3>
        <span className="font-semibold">{price}</span>
      </div>

      {(product.tagline || product.notes || product.oil) && (
        <div className={`${glacialRegular.className} text-sm opacity-70 space-y-1`}>
          {product.tagline && <p className="italic">{product.tagline}</p>}
          {product.notes && <p>{product.notes}</p>}
          {product.oil && <p>Oil concentration: {product.oil}</p>}
        </div>
      )}

      <button
        type="button"
        onClick={() => add(product.id)}
        className="mt-1 rounded-full px-4 py-2 font-medium text-black"
        style={{ background: "var(--accent)" }}
      >
        Add to Cart
      </button>
    </div>
  );
}
