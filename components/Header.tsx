"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CurrencyToggle } from "@/components/CurrencyToggle";
import { CartDrawer } from "@/components/CartDrawer";
import { NavDrawer, NAV_LINKS } from "@/components/NavDrawer";
import { useCart } from "@/lib/cartStore";

export function Header() {
  const count = useCart((s) => s.count());
  // Better Auth's useSession is store-based (no provider needed); !!session
  // toggles the Account vs Sign-in link.
  const { data: session } = authClient.useSession();
  const isSignedIn = !!session;
  const [cartOpen, setCartOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();
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

  // Close the menu whenever a navigation lands (Link clicks also close it
  // eagerly, but this covers back/forward too). State-adjust-during-render
  // instead of an effect so the closed drawer never paints open.
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setNavOpen(false);
  }

  // At lg+ the hamburger/drawer give way to inline links — if the viewport
  // crosses that line while the drawer is open, close it or the body scroll
  // lock would linger with no visible drawer.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 64rem)");
    const onChange = () => mq.matches && setNavOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // The nav drawer slides in *below* the sticky header so the hamburger stays
  // visible as the X that dismisses it — so it needs the header's height.
  const headerRef = useRef<HTMLElement | null>(null);
  const [headerH, setHeaderH] = useState(0);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => setHeaderH(el.getBoundingClientRect().height);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const bar =
    "absolute h-0.5 w-5 rounded-full bg-current transition-all duration-300";

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-40 backdrop-blur-md border-b border-black/10 dark:border-white/10"
        style={{
          background: "color-mix(in srgb, var(--bg) 80%, transparent)",
          // Persist the sticky header across route navigations so only the
          // routed page crossfades (see app/globals.css view-transition rules).
          viewTransitionName: "site-header",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-5 relative flex items-center justify-center">
          <nav className="absolute left-4 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-4 text-xs xl:text-sm uppercase tracking-widest">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={pathname === l.href ? "page" : undefined}
                className={`hover:opacity-70 ${pathname === l.href ? "font-medium" : ""}`}
                style={pathname === l.href ? { color: "var(--accent)" } : undefined}
              >
                {l.label}
              </Link>
            ))}
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

          <Link href="/" aria-label="Ice Fragrances home">
            <Logo />
          </Link>

          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-3">
              <CurrencyToggle />
              <ThemeToggle />
            </div>
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
            <button
              type="button"
              onClick={() => setNavOpen((o) => !o)}
              aria-label={navOpen ? "Close menu" : "Open menu"}
              aria-expanded={navOpen}
              aria-controls="site-nav-drawer"
              className="relative w-9 h-9 -mr-1.5 grid place-items-center lg:hidden"
            >
              <span className={`${bar} ${navOpen ? "rotate-45" : "-translate-y-1.5"}`} />
              <span className={`${bar} ${navOpen ? "opacity-0" : "opacity-100"}`} />
              <span className={`${bar} ${navOpen ? "-rotate-45" : "translate-y-1.5"}`} />
            </button>
          </div>
        </div>
      </header>
      <NavDrawer
        open={navOpen}
        onClose={() => setNavOpen(false)}
        topOffset={headerH}
        isSignedIn={isSignedIn}
        isAdmin={isAdmin}
      />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
