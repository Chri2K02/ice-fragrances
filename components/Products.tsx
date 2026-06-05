import { PRODUCTS } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export function Products() {
  return (
    <section id="products" className="max-w-6xl mx-auto px-4 mt-20">
      <h2 className="text-3xl font-semibold mb-8 text-center">The Collection</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCTS.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
