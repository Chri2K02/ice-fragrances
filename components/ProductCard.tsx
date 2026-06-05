"use client";
import { useState } from "react";
import Image from "next/image";
import { VideoPlayer } from "@/components/VideoPlayer";
import { useCart } from "@/lib/cartStore";
import type { Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const [showPhoto, setShowPhoto] = useState(true);
  const add = useCart((s) => s.add);
  const price = `$${(product.priceCents / 100).toFixed(2)}`;

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: "var(--card)" }}
    >
      <div className="relative aspect-[9/16] overflow-hidden rounded-2xl">
        {showPhoto ? (
          <Image
            src={product.poster}
            alt={product.name}
            fill
            data-testid="product-photo"
            className="object-cover"
          />
        ) : (
          <VideoPlayer
            src={product.video}
            poster={product.poster}
            label={product.name}
          />
        )}
        <button
          type="button"
          onClick={() => setShowPhoto((v) => !v)}
          aria-label={showPhoto ? "Show video" : "Show photo"}
          className="absolute top-3 right-3 rounded-full bg-black/60 text-white w-9 h-9 grid place-items-center backdrop-blur"
        >
          {showPhoto ? "›" : "‹"}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{product.name}</h3>
        <span className="font-semibold">{price}</span>
      </div>
      <div className="text-sm opacity-70 space-y-1">
        <p className="italic">{product.tagline}</p>
        <p>{product.notes}</p>
        {product.oil && <p>Oil concentration: {product.oil}</p>}
      </div>

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
