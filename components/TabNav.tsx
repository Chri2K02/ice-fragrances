"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type Tab = { href: string; label: string };

// Routed tab bar (each tab is a real URL). Client component because active
// state needs the live pathname — layouts are cached across navigations and
// can't see it. Used by the admin section bar and the settings sub-bar.
export function TabNav({
  tabs,
  ariaLabel,
  className = "mb-8",
  /**
   * Inline mode: the tabs live INSIDE a bar (the admin header) rather than
   * forming their own bar under one. Drops the underline rail and the
   * -mb-px overlap, and marks the active tab with the accent colour instead
   * of an underline that would have nothing to sit on.
   */
  inline = false,
}: {
  tabs: Tab[];
  ariaLabel: string;
  className?: string;
  inline?: boolean;
}) {
  const pathname = usePathname();
  // Longest matching href wins, so "/admin" isn't lit on "/admin/catalog" and
  // a nested bar ("/admin/settings/team") can sit under the section bar.
  const active = tabs
    .filter((t) => pathname === t.href || pathname.startsWith(`${t.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <nav
      aria-label={ariaLabel}
      // No overflow container: the -mb-px underline overlap would make the
      // content 1px taller than the box and summon scrollbars. On viewports
      // too narrow for every tab, they wrap instead.
      className={`flex flex-wrap items-center gap-1 ${
        inline ? "" : "border-b border-black/10 dark:border-white/10"
      } ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.href === active;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={
              inline
                ? `rounded-full px-3 py-1.5 text-xs uppercase tracking-widest whitespace-nowrap transition-opacity ${
                    isActive
                      ? "font-semibold"
                      : "opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10"
                  }`
                : `px-3 py-2 text-sm whitespace-nowrap -mb-px border-b-2 transition-opacity ${
                    isActive
                      ? "font-semibold"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`
            }
            style={
              isActive
                ? inline
                  ? { color: "var(--accent)" }
                  : { borderColor: "var(--accent)" }
                : undefined
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
