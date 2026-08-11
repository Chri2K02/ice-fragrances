"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Desktop-nav disclosure for the less-used routes — keeps the inline nav to
// two destinations so the centered logo keeps its room. The mobile drawer
// stays flat (dropdowns inside drawers are an anti-pattern).
export function MoreMenu({
  links,
}: {
  links: { href: string; label: string }[];
}) {
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
        <svg
          viewBox="0 0 10 6"
          width="9"
          height="6"
          aria-hidden
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
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
      <div
        className={`absolute left-0 top-full mt-3 min-w-36 rounded-xl border border-black/10 dark:border-white/10 shadow-xl p-2 flex flex-col transition-all duration-150 ${
          open
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-1 pointer-events-none"
        }`}
        style={{ background: "var(--bg)" }}
        aria-hidden={!open}
      >
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            aria-current={pathname === l.href ? "page" : undefined}
            className="px-3 py-2 rounded-lg uppercase tracking-widest hover:bg-black/5 dark:hover:bg-white/10"
            style={pathname === l.href ? { color: "var(--accent)" } : undefined}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
