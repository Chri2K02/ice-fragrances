"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CurrencyToggle } from "@/components/CurrencyToggle";
import { CartDrawer } from "@/components/CartDrawer";
import { useCart } from "@/lib/cartStore";
import { CANONICAL_ORIGIN, canonicalOriginFor, isAdminHost } from "@/lib/site";

export function Header() {
  // On admin.icefragrances.com the header is the DASHBOARD chrome: no shop
  // nav/cart/currency — just the logo, a "Back to main site" link to the
  // canonical host, and the theme toggle. Detected after mount (host isn't
  // known during SSR of this shared shell).
  const [onAdminHost, setOnAdminHost] = useState(false);
  const [mainSiteUrl, setMainSiteUrl] = useState(CANONICAL_ORIGIN);
  useEffect(() => {
    if (isAdminHost(window.location.host)) {
      setOnAdminHost(true);
      setMainSiteUrl(
        canonicalOriginFor(window.location.host, window.location.protocol)
      );
    }
  }, []);
  const count = useCart((s) => s.count());
  // Better Auth's useSession is store-based (no provider needed); !!session
  // toggles the Account vs Sign-in link.
  const { data: session } = authClient.useSession();
  const isSignedIn = !!session;
  const [cartOpen, setCartOpen] = useState(false);
  // Admins get an Admin link. Admin status is DB-backed, so it's resolved via a
  // tiny server endpoint rather than anything the client could spoof.
  const [isAdmin, setIsAdmin] = useState(false);
  const email = session?.user?.email ?? null;
  useEffect(() => {
    if (!email) {
      setIsAdmin(false);
      return;
    }
    let alive = true;
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d) => alive && setIsAdmin(!!d.isAdmin))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [email]);

  if (onAdminHost) {
    return (
      <header
        className="sticky top-0 z-40 backdrop-blur-md border-b border-black/10 dark:border-white/10"
        style={{
          background: "color-mix(in srgb, var(--bg) 80%, transparent)",
          viewTransitionName: "site-header",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-5 relative flex items-center justify-center">
          <nav className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-4 text-xs sm:text-sm">
            <a
              href={mainSiteUrl}
              className="rounded-full border px-3 py-1 whitespace-nowrap hover:opacity-70"
            >
              ‹ Back to main site
            </a>
          </nav>
          <Link href="/" aria-label="Admin dashboard home">
            <Logo />
          </Link>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header
        className="sticky top-0 z-40 backdrop-blur-md border-b border-black/10 dark:border-white/10"
        style={{
          background: "color-mix(in srgb, var(--bg) 80%, transparent)",
          // Persist the sticky header across route navigations so only the
          // routed page crossfades (see app/globals.css view-transition rules).
          viewTransitionName: "site-header",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-5 relative flex items-center justify-center">
          <nav className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm">
            <Link href="/" className="hover:opacity-70">
              Home
            </Link>
            <Link href="/shipping" className="hover:opacity-70">
              Shipping/PSA
            </Link>
            <Link
              href={isSignedIn ? "/account" : "/sign-in"}
              className="hover:opacity-70"
            >
              {isSignedIn ? "Account" : "Sign in"}
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="hover:opacity-70 font-medium"
                style={{ color: "var(--accent)" }}
              >
                Admin
              </Link>
            )}
            <a
              href="https://www.instagram.com/icefragrances/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="hover:opacity-70"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
          </nav>

          <Link
            href="/"
            aria-label="Ice Fragrances home"
            className="-translate-y-2 sm:translate-y-0"
          >
            <Logo />
          </Link>

          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-3">
            <CurrencyToggle />
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label="Open cart"
              className="rounded-full border px-2 sm:px-3 py-1 text-xs sm:text-sm whitespace-nowrap"
            >
              <span className="sm:hidden" aria-hidden>
                🛒
              </span>
              <span className="hidden sm:inline">Cart</span>
              <span> ({count})</span>
            </button>
          </div>
        </div>
      </header>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
