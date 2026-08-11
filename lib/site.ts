// Single source of truth for site-wide identity — consumed by root metadata,
// sitemap, robots, manifest, JSON-LD, and the OG/Twitter images. Mirrors the
// catalog's single-source ethos (lib/products.ts): one place to change a fact.

// www is the canonical host: the apex 301-redirects to www, and the Google
// OAuth redirect URIs are registered against www, so canonical/sitemap/OG must
// match the served host to avoid a redirect hop and OAuth state loss.
const PRODUCTION_URL = "https://www.icefragrances.com";

/**
 * The canonical origin for this deployment, with any trailing slash stripped.
 * Resolves from NEXT_PUBLIC_SITE_URL (set per-environment — localhost in dev,
 * the production domain in prod) and falls back to the production origin so
 * absolute OG/canonical URLs are always well-formed even if the env is unset.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_URL
).replace(/\/+$/, "");

// Purpose-specific inboxes (Google Workspace aliases on the main account).
// Use the narrowest fitting address so customers land in the right context
// and the inboxes stay filterable.
export const EMAILS = {
  general: "icefragrances@icefragrances.com", // the original catch-all
  support: "support@icefragrances.com", // order/product help — default public contact
  help: "help@icefragrances.com", // synonym; used where "help" reads better
  legal: "legal@icefragrances.com", // terms of service
  privacy: "privacy@icefragrances.com", // privacy policy / data requests
  orders: "orders@icefragrances.com", // transactional From (Resend EMAIL_FROM)
  security: "security@icefragrances.com", // vulnerability reports (security.txt)
  press: "press@icefragrances.com", // media / PR
} as const;

export const SITE = {
  name: "Ice Fragrances",
  title: "Ice Fragrances — Premium, Timeless Fragrances",
  description: "Premium, Timeless Fragrances. Free shipping to US & Canada.",
  url: SITE_URL,
  locale: "en_US",
  email: EMAILS.support,
} as const;
