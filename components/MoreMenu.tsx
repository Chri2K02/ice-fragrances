"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// An entry is either a destination or an action (Stripe test mode toggles in
// place rather than navigating). `accent` marks admin-only entries so they
// read as distinct from the public ones.
export type MoreItem = {
  label: string;
  href?: string;
  onSelect?: () => void;
  accent?: boolean;
};

// Desktop-nav disclosure for the less-used routes — keeps the inline nav to
// two destinations so the centered logo keeps its room. The mobile drawer
// stays flat (dropdowns inside drawers are an anti-pattern).
export function MoreMenu({ links }: { links: MoreItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

  // Close on navigation — state-adjust-during-render, same pattern as the
  // header's drawer, so a closed menu never paints open.
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // The trigger lights up when the current page lives inside the menu.
  const activeInside = links.some((l) => pathname === l.href);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`flex items-center gap-1 uppercase tracking-widest hover:opacity-70 ${
          activeInside ? "font-medium" : ""
        }`}
        style={activeInside ? { color: "var(--accent)" } : undefined}
      >
        More
        {/* Explicit transforms on BOTH states so the rotation always
            interpolates — a conditionally-removed class can snap. */}
        <svg
          viewBox="0 0 10 6"
          width="9"
          height="6"
          aria-hidden
          className="transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path
            d="M1 1l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {/* Scale from the trigger corner instead of translating: growing open
          and shrinking closed reads as intent in both directions, where the
          old slide-up exit looked like the panel bumping before the fade. */}
      <div
        className={`absolute left-0 top-full mt-3 min-w-36 rounded-xl border border-black/10 dark:border-white/10 shadow-xl p-2 flex flex-col origin-top-left transition-[opacity,scale] duration-150 ${
          open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
        style={{ background: "var(--bg)" }}
        aria-hidden={!open}
      >
        {links.map((l) => {
          const itemClass =
            "px-3 py-2 rounded-lg uppercase tracking-widest text-left whitespace-nowrap hover:bg-black/5 dark:hover:bg-white/10";
          const accent =
            l.accent || (l.href && pathname === l.href)
              ? { color: "var(--accent)" }
              : undefined;
          // Actions (test mode) close the menu and run in place; destinations
          // navigate. Both share the row styling.
          return l.href ? (
            <Link
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              aria-current={pathname === l.href ? "page" : undefined}
              className={itemClass}
              style={accent}
            >
              {l.label}
            </Link>
          ) : (
            <button
              key={l.label}
              type="button"
              onClick={() => {
                setOpen(false);
                l.onSelect?.();
              }}
              className={itemClass}
              style={accent}
            >
              {l.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
