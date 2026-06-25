import catalog from "@/data/products.json";

// Catalog data lives in data/products.json (file-based, no database). The JSON
// is statically imported, so the bundler inlines it into both the server and
// client bundles at build time — getProduct/PRODUCTS stay usable from anywhere
// (cart, checkout price validation, API routes, static pages) with no runtime
// I/O. To change the catalog, edit the JSON; this module is just the typed lens
// over it. Shape is enforced at test time by lib/__tests__/products.test.ts.

export type ProductCategory = "womens" | "mens" | "apparel" | "accessories";

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  priceCents: number; // server-trusted price
  poster: string; // primary still / first image
  video?: string; // cologne video (optional)
  images?: string[]; // photo gallery, e.g. apparel
  tagline?: string; // evocative line under the title
  notes?: string; // scent notes / description
  description?: string; // longer crawlable copy for the product page (SEO)
  oil?: string; // oil concentration, e.g. "18%"
  freeShipping?: boolean; // true = always free shipping (colognes)
  sizes?: string[]; // apparel size options
};

// JSON imports widen string literals to `string`; the validation test is what
// guarantees this cast holds (unique ids, valid categories, positive prices…).
export const PRODUCTS: Product[] = catalog as Product[];

// Display order of the storefront sections, derived from the data.
export const CATEGORY_ORDER: ProductCategory[] = [
  "womens",
  "mens",
  "apparel",
  "accessories",
];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

// Products in a section, in catalog order — replaces the id lists that used to
// be hardcoded in the grid component.
export function productsByCategory(category: ProductCategory): Product[] {
  return PRODUCTS.filter((p) => p.category === category);
}
