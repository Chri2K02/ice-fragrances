"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CurrencyToggle } from "@/components/CurrencyToggle";
import { CartDrawer } from "@/components/CartDrawer";
import { NavDrawer, PRIMARY_LINKS, MORE_LINKS } from "@/components/NavDrawer";
import { MoreMenu } from "@/components/MoreMenu";
import { glacialRegular } from "@/lib/fonts";
import { PILL_BUTTON } from "@/lib/ui";
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
  // tiny server endpoint rather than anything the client could spoof. The
  // answer is stored with the email it was fetched for, so signing out or
  // switching accounts derives back to false — no state reset in the effect.
  const [admin, setAdmin] = useState<{ email: string; ok: boolean } | null>(
    null
  );
  const email = session?.user?.email ?? null;
  const isAdmin = !!email && admin?.email === email && admin.ok;
  useEffect(() => {
    if (!email) return;
    let alive = true;
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d) => alive && setAdmin({ email, ok: !!d.isAdmin }))
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
        {/* Glacial Regular is the header's UI face — nav links, More menu and
            the pill buttons inherit it; the Logo overrides with the Bold cut. */}
        <div
          className={`${glacialRegular.className} max-w-6xl mx-auto px-4 py-5 relative flex items-center justify-center`}
        >
          <nav className="absolute left-4 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-4 text-xs xl:text-sm uppercase tracking-widest">
            {PRIMARY_LINKS.map((l) => (
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
            <MoreMenu links={MORE_LINKS} />
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
            {/* Account/sign-in as an icon, desktop only — the mobile drawer
                carries the labelled link. Filled dot when signed in. */}
            <Link
              href={isSignedIn ? "/account" : "/sign-in"}
              aria-label={isSignedIn ? "Your account" : "Sign in"}
              className={`${PILL_BUTTON} hidden lg:grid place-items-center w-9 h-9 px-0!`}
            >
              <svg
                viewBox="0 0 24 24"
                width="17"
                height="17"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" fill={isSignedIn ? "currentColor" : "none"} />
              </svg>
            </Link>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Open cart (${count} ${count === 1 ? "item" : "items"})`}
              className={`${PILL_BUTTON} inline-flex items-center gap-1.5`}
            >
              {/* Feather-style bag, matching the Instagram icon's stroke language. */}
              <svg
                viewBox="0 0 24 24"
                width="15"
                height="15"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span>{count}</span>
            </button>
            <button
              type="button"
              onClick={() => setNavOpen((o) => !o)}
              aria-label={navOpen ? "Close menu" : "Open menu"}
              aria-expanded={navOpen}
              aria-controls="site-nav-drawer"
              className="relative w-9 h-9 -mr-1.5 grid place-items-center lg:hidden rounded-full hover:bg-black/5 dark:hover:bg-white/10"
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
