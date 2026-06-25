import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Public, indexable routes only. Products are anchors on the home page (there
// are no per-product routes), so the catalog is covered by the home entry —
// when per-product pages exist, map PRODUCTS into entries here.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: "weekly", priority: 1 },
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
  ];
}
