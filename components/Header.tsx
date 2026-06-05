"use client";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useCart } from "@/lib/cartStore";

export function Header({ onCartClick }: { onCartClick: () => void }) {
  const count = useCart((s) => s.count());
  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-md border-b border-black/10 dark:border-white/10"
      style={{ background: "color-mix(in srgb, var(--bg) 80%, transparent)" }}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            type="button"
            onClick={onCartClick}
            aria-label="Open cart"
            className="rounded-full border px-3 py-1 text-sm"
          >
            Cart ({count})
          </button>
        </div>
      </div>
    </header>
  );
}
