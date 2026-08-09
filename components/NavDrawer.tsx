"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CurrencyToggle } from "@/components/CurrencyToggle";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shipping", label: "Shipping/PSA" },
  { href: "/contact", label: "Contact" },
];

export function NavDrawer({
  open,
  onClose,
  topOffset,
  isSignedIn,
  isAdmin,
}: {
  open: boolean;
  onClose: () => void;
  /** Height of the sticky header — the drawer slides in below it so the
   * hamburger/X button stays visible and clickable while open. */
  topOffset: number;
  isSignedIn: boolean;
  isAdmin: boolean;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const items: { href: string; label: string; accent?: boolean }[] = [
    ...NAV_LINKS,
    isSignedIn
      ? { href: "/account", label: "Account" }
      : { href: "/sign-in", label: "Sign in" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", accent: true }] : []),
  ];

  // Labels slide+fade in one after another as the drawer extends.
  const enter = (i: number) => ({
    className: `transition-all duration-300 ${
      open ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"
    }`,
    style: { transitionDelay: open ? `${100 + i * 50}ms` : "0ms" },
  });

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 overflow-hidden lg:hidden ${open ? "" : "pointer-events-none"}`}
      style={{ top: topOffset }}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <nav
        id="site-nav-drawer"
        aria-label="Site menu"
        className={`absolute right-0 top-0 h-full w-full max-w-xs border-l border-black/10 dark:border-white/10 shadow-xl overflow-y-auto transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ background: "var(--bg)" }}
      >
        <div className="p-6 flex min-h-full flex-col">
          <ul className="flex flex-col gap-1 uppercase tracking-widest text-2xl font-semibold">
            {items.map((l, i) => (
              <li key={l.href} {...enter(i)}>
                <Link
                  href={l.href}
                  onClick={onClose}
                  aria-current={pathname === l.href ? "page" : undefined}
                  className="block py-3 hover:opacity-70"
                  style={
                    l.accent || pathname === l.href
                      ? { color: "var(--accent)" }
                      : undefined
                  }
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li {...enter(items.length)}>
              <a
                href="https://www.instagram.com/icefragrances/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="flex items-center gap-3 py-3 hover:opacity-70"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
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
                Instagram
              </a>
            </li>
          </ul>

          {/* Currency/theme live inline in the header on desktop; on mobile the
              header only fits the cart, so they move down here. */}
          <div className="mt-auto pt-6 flex items-center gap-3 sm:hidden">
            <CurrencyToggle />
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </div>
  );
}
