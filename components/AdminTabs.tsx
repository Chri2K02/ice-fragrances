"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PERMISSION_TYPES } from "@/lib/permissions";
import { isAdminHost } from "@/lib/site";

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
  // On admin.icefragrances.com the dashboard is served from the subdomain
  // ROOT (proxy.ts rewrites / → /admin/*), so tab hrefs drop the /admin
  // prefix there and the active check runs against the visible path.
  const [stripPrefix, setStripPrefix] = useState(false);
  useEffect(() => {
    setStripPrefix(isAdminHost(window.location.host));
  }, []);

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
        const href = stripPrefix
          ? tab.href.slice("/admin".length) || "/"
          : tab.href;
        // The root tab ("/admin", or "/" on the admin host) is a tab of its
        // own, not a prefix of the others.
        const active =
          href === "/admin" || href === "/"
            ? pathname === href
            : pathname.startsWith(href);
        return (
          <Link
            key={tab.href}
            href={href}
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
