import { SITE, SITE_URL } from "@/lib/site";

// Organization + WebSite structured data for rich results. Both are facts the
// page visibly backs (name, logo, email from the privacy page). Per-product
// Product schema is intentionally omitted: products have no individual landing
// URLs (they are anchors on the home page) and prices are multi-currency, so
// emitting Product/Offer markup here would assert URLs and prices the page
// can't honor. Add it alongside per-product routes, not before.
const graph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE.name,
      url: SITE_URL,
      logo: `${SITE_URL}/logo-light.png`,
      email: SITE.email,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE.name,
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en",
    },
  ],
};

export function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
