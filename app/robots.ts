import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Crawl rules: index everything public, keep account/admin/checkout-flow and
// API routes out of the index. Page-level `robots: { index: false }` metadata
// on those same routes is the belt-and-suspenders pair — this stops crawling,
// that de-indexes any URL already discovered.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account",
        "/admin",
        "/success",
        "/sign-in",
        "/sign-up",
        "/api/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
