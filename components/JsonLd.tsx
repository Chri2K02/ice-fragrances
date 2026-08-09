import { SITE, SITE_URL } from "@/lib/site";
import { ORG_ID, RETURN_POLICY, jsonLdString } from "@/lib/structuredData";

// Site-wide structured data, rendered on every page by the root layout.
// OnlineStore (an Organization subtype — Google's recommended type for
// e-commerce merchants) feeds the logo/knowledge-panel treatment and carries
// the org-level return policy that merchant listings inherit; WebSite names
// the site. Every fact here is visibly backed on the site (name, logo, email
// on the privacy page, returns on the terms page). Per-product Product/Offer
// markup lives with the product pages (app/products/[slug]), which reference
// the organization node by @id.
const graph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "OnlineStore",
      "@id": ORG_ID,
      name: SITE.name,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo-light.png`,
        width: 554,
        height: 283,
      },
      email: SITE.email,
      hasMerchantReturnPolicy: RETURN_POLICY,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE.name,
      url: SITE_URL,
      publisher: { "@id": ORG_ID },
      inLanguage: "en",
    },
  ],
};

export function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdString(graph) }}
    />
  );
}
