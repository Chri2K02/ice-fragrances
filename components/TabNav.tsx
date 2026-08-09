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
}: {
  tabs: Tab[];
  ariaLabel: string;
  className?: string;
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
      className={`flex flex-wrap gap-1 border-b border-black/10 dark:border-white/10 ${className}`}
    >
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.href === active ? "page" : undefined}
          className={`px-3 py-2 text-sm whitespace-nowrap -mb-px border-b-2 transition-opacity ${
            tab.href === active
              ? "font-semibold"
              : "border-transparent opacity-60 hover:opacity-100"
          }`}
          style={tab.href === active ? { borderColor: "var(--accent)" } : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
