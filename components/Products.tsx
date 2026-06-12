import { getProduct, type Product } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { glacial } from "@/lib/fonts";

const WOMEN_IDS = ["frost-mind", "hailstone-wildflower"];
const MEN_IDS = ["glacier-hours", "iceberg-embrace"];
const APPAREL_IDS = ["tshirt", "dress-shirt"];

function pick(ids: string[]): Product[] {
  return ids.map(getProduct).filter((p): p is Product => Boolean(p));
}

export function Products() {
  const women = pick(WOMEN_IDS);
  const men = pick(MEN_IDS);
  const apparel = pick(APPAREL_IDS);
  const accessories = pick(["humidifier", "air-freshener"]);

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
            {women.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>

        {/* Men — right on desktop, first on mobile */}
        <div className="order-1 md:order-none md:border-l md:border-black/15 dark:md:border-white/15 md:pl-10">
          <h3 className="mb-8 text-center text-sm font-semibold uppercase tracking-[0.3em] opacity-80">
            Men&apos;s
          </h3>
          <div className="grid gap-8">
            {men.map((p) => (
              <ProductCard key={p.id} product={p} />
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
            {apparel.map((p) => (
              <ProductCard key={p.id} product={p} />
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
            {accessories.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
