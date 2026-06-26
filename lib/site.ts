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

export const SITE = {
  name: "Ice Fragrances",
  title: "Ice Fragrances — Premium, Timeless Fragrances",
  description: "Premium, Timeless Fragrances. Free shipping to US & Canada.",
  url: SITE_URL,
  locale: "en_US",
  email: "icefragrances@icefragrances.com",
} as const;
