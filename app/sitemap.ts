import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { PRODUCTS } from "@/lib/products";

// Public, indexable routes only: the home page, each statically-generated
// product page (/products/<id>), and the policy pages.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const products: MetadataRoute.Sitemap = PRODUCTS.map((p) => ({
    url: `${SITE_URL}/products/${p.id}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));
  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    ...products,
    {
      url: `${SITE_URL}/shipping`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
