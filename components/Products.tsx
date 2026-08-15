import { getCatalog } from "@/lib/catalog";
import { getReviewAggregate } from "@/lib/productStats";
import { ProductCard } from "@/components/ProductCard";
import { glacial } from "@/lib/fonts";
import { Reveal } from "@/components/Reveal";

export async function Products() {
  // Catalog = versioned JSON identity merged with the editable DB overlay
  // (copy/media/audio). Server-side + cached, so the grid stays SSG/ISR.
  const catalog = await getCatalog();
  const byCat = (c: string) => catalog.filter((p) => p.category === c);
  const women = byCat("womens");
  const men = byCat("mens");
  const apparel = byCat("apparel");
  const accessories = byCat("accessories");

  // Per-product review summary shown in each card footer (cached).
  const ratings = new Map(
    await Promise.all(
      catalog.map(async (p) => [p.id, await getReviewAggregate(p.id)] as const)
    )
  );

  return (
    <section
      id="products"
      className={`${glacial.className} uppercase max-w-6xl mx-auto px-4 mt-24`}
    >
      <h2 className="text-3xl font-semibold mb-12 text-center">The Collection</h2>

      {/* Two gendered columns with vertical divider lines and space between */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
        {/* Women — left on desktop, second on mobile */}
        <div className="order-2 md:order-none md:border-r md:border-black/15 dark:md:border-white/15 md:pr-10">
          <h3 className="mb-8 text-center text-sm font-semibold uppercase tracking-[0.3em] opacity-80">
            Women&apos;s
          </h3>
          <div className="grid gap-8">
            {women.map((p, i) => (
              <Reveal key={p.id} index={i}>
                <ProductCard
                  product={p}
                  audio={p.audio}
                  rating={ratings.get(p.id)}
                />
              </Reveal>
            ))}
          </div>
        </div>

        {/* Men — right on desktop, first on mobile */}
        <div className="order-1 md:order-none md:border-l md:border-black/15 dark:md:border-white/15 md:pl-10">
          <h3 className="mb-8 text-center text-sm font-semibold uppercase tracking-[0.3em] opacity-80">
            Men&apos;s
          </h3>
          <div className="grid gap-8">
            {men.map((p, i) => (
              <Reveal key={p.id} index={i}>
                <ProductCard
                  product={p}
                  audio={p.audio}
                  rating={ratings.get(p.id)}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {/* Apparel — between the colognes and the humidifier */}
      {apparel.length > 0 && (
        <div className="mt-20 border-t border-black/15 dark:border-white/15 pt-12">
          <h3 className="mb-8 text-center text-sm font-semibold uppercase tracking-[0.3em] opacity-80">
            Apparel
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {apparel.map((p, i) => (
              <Reveal key={p.id} index={i}>
                <ProductCard
                  product={p}
                  audio={p.audio}
                  rating={ratings.get(p.id)}
                />
              </Reveal>
            ))}
          </div>
        </div>
      )}

      {/* Accessories — humidifier + air freshener */}
      {accessories.length > 0 && (
        <div className="mt-20 border-t border-black/15 dark:border-white/15 pt-12">
          <h3 className="mb-8 text-center text-sm font-semibold uppercase tracking-[0.3em] opacity-80">
            Accessories
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {accessories.map((p, i) => (
              <Reveal key={p.id} index={i}>
                <ProductCard
                  product={p}
                  audio={p.audio}
                  rating={ratings.get(p.id)}
                />
              </Reveal>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
