"use client";
import { useState } from "react";
import Image from "next/image";
import { VideoPlayer } from "@/components/VideoPlayer";
import { useCart } from "@/lib/cartStore";
import type { Product } from "@/lib/products";
import { glacialRegular } from "@/lib/fonts";
import { Reviews } from "@/components/Reviews";

type Slide =
  | { type: "image"; src: string }
  | { type: "video"; src: string; poster: string };

export function ProductCard({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const price = `$${(product.priceCents / 100).toFixed(2)}`;

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

  const arrowBtn =
    "absolute z-10 top-1/2 -translate-y-1/2 rounded-full bg-black/60 text-white w-9 h-9 grid place-items-center backdrop-blur";

  return (
    <div
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
        className="mt-auto rounded-full px-4 py-2 font-medium text-black border-2 border-black normal-case"
        style={{ background: "var(--accent)" }}
      >
        Add to Cart
      </button>

      <Reviews productId={product.id} />
    </div>
  );
}
