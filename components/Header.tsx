"use client";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CurrencyToggle } from "@/components/CurrencyToggle";
import { CartDrawer } from "@/components/CartDrawer";
import { useCart } from "@/lib/cartStore";

export function Header() {
  const count = useCart((s) => s.count());
  const { isSignedIn } = useAuth();
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-40 backdrop-blur-md border-b border-black/10 dark:border-white/10"
        style={{ background: "color-mix(in srgb, var(--bg) 80%, transparent)" }}
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
