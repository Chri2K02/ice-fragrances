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

// ── Host topology ─────────────────────────────────────────────────────────
// The store lives on the canonical host above; the admin dashboard is ALSO
// served from admin.icefragrances.com, where the proxy rewrites / → /admin/*.
// Sign-in is forced through the canonical host — the admin host never renders
// auth pages — and the session carries across via cross-subdomain cookies
// (lib/auth.ts). In dev the same shape works on admin.localhost:<port>.
// Helpers are shared by proxy.ts, server pages, and client components.

export const CANONICAL_ORIGIN = PRODUCTION_URL;
export const ADMIN_ORIGIN = "https://admin.icefragrances.com";

// A host (optionally host:port) serving the admin dashboard.
export function isAdminHost(host: string | null | undefined): boolean {
  const h = (host ?? "").split(":")[0];
  return h === "admin.icefragrances.com" || h === "admin.localhost";
}

// The canonical (store) origin for a request/browser host. Prod admin host
// maps to the www origin; dev admin.localhost:3000 maps to localhost:3000 on
// the same protocol.
export function canonicalOriginFor(
  host: string | null | undefined,
  protocol: string = "https:"
): string {
  const h = host ?? "";
  if (h.split(":")[0].endsWith("icefragrances.com")) return CANONICAL_ORIGIN;
  return `${protocol}//${h.replace(/^admin\./, "")}`;
}

// Post-auth redirect targets arrive as a ?callbackURL= query param on the
// canonical sign-in page. Only same-site paths or our own origins are honored,
// so the param can never become an open redirect.
export function safeCallbackURL(raw: string | null | undefined): string {
  if (!raw) return "/";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  try {
    const u = new URL(raw);
    const h = u.hostname;
    const ours =
      h === "www.icefragrances.com" ||
      h === "icefragrances.com" ||
      h === "admin.icefragrances.com" ||
      h === "localhost" ||
      h === "admin.localhost" ||
      h === "127.0.0.1";
    if (ours && (u.protocol === "https:" || u.protocol === "http:")) {
      return u.toString();
    }
  } catch {
    /* fall through */
  }
  return "/";
}
