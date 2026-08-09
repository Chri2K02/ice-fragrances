"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Persistent tab bar for the admin section, rendered by app/admin/layout.tsx.
// Client component because the active state needs the live pathname — layouts
// don't re-render on navigation, so a server layout can't know which tab is
// current (see the Next.js layout docs).
const TABS = [
  { href: "/admin", label: "Stock" },
  { href: "/admin/catalog", label: "Catalog" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/settings", label: "Team" },
];

export function AdminTabs() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Admin sections"
      className="flex gap-1 mb-8 border-b border-black/10 dark:border-white/10 overflow-x-auto"
    >
      {TABS.map((tab) => {
        // "/admin" is a tab of its own, not a prefix of the others.
        const active =
          tab.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`px-3 py-2 text-sm whitespace-nowrap -mb-px border-b-2 transition-opacity ${
              active
                ? "font-semibold"
                : "border-transparent opacity-60 hover:opacity-100"
            }`}
            style={active ? { borderColor: "var(--accent)" } : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
