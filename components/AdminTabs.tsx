"use client";

import { useEffect, useState } from "react";
import { TabNav } from "@/components/TabNav";
import { PERMISSION_TYPES } from "@/lib/permissions";

// The admin section bar: the surfaces from lib/permissions.ts, filtered to
// what the viewer may open (fetched from /api/admin/me, same as the header's
// Admin link). Purely cosmetic — every page and API re-checks server-side.
export function AdminTabs() {
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

  const tabs = PERMISSION_TYPES.filter((t) => perms?.[t.key]).map((t) => ({
    href: t.href,
    // The `team` surface's tab reads "Settings" (it holds the Team and
    // Notifications subroutes); the permission checkbox keeps the Team label.
    label: t.key === "team" ? "Settings" : t.label,
  }));

  // min-h keeps the bar's height while perms load so the page doesn't jump.
  return (
    <TabNav tabs={tabs} ariaLabel="Admin sections" className="mb-8 min-h-10" />
  );
}
