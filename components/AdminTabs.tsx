"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PERMISSION_TYPES } from "@/lib/permissions";

// Persistent tab bar for the admin section, rendered by app/admin/layout.tsx.
// Client component because the active state needs the live pathname — layouts
// don't re-render on navigation, so a server layout can't know which tab is
// current (see the Next.js layout docs). Tabs are the admin surfaces from
// lib/permissions.ts, filtered to what the viewer may open (fetched from
// /api/admin/me, same as the header's Admin link); the pages re-check
// server-side regardless.
export function AdminTabs() {
  const pathname = usePathname();
  const [perms, setPerms] = useState<Record<string, boolean> | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d) => alive && setPerms(d.perms ?? {}))
      .catch(() => alive && setPerms({}));
    return () => {
      alive = false;
    };
  }, []);

  const tabs = PERMISSION_TYPES.filter((t) => perms?.[t.key]);

  return (
    <nav
      aria-label="Admin sections"
      className="flex gap-1 mb-8 border-b border-black/10 dark:border-white/10 overflow-x-auto min-h-10"
    >
      {tabs.map((tab) => {
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
