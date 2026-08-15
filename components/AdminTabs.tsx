"use client";

import { useEffect, useState } from "react";
import { TabNav } from "@/components/TabNav";
import { PERMISSION_TYPES } from "@/lib/permissions";
import { isAdminHost } from "@/lib/site";
import { useBrowserValue } from "@/lib/ui";

// The admin section bar: the surfaces from lib/permissions.ts, filtered to
// what the viewer may open (fetched from /api/admin/me, same as the header's
// Admin link). Purely cosmetic — every page and API re-checks server-side.
export function AdminTabs({ inline = false }: { inline?: boolean } = {}) {
  const [perms, setPerms] = useState<Record<string, boolean> | null>(null);
  // On admin.icefragrances.com the dashboard is served from the subdomain
  // ROOT (proxy.ts rewrites / → /admin/*), so tab hrefs drop the /admin
  // prefix there and the active check runs against the visible path.
  const stripPrefix = useBrowserValue(
    () => isAdminHost(window.location.host),
    false
  );

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
    // "/admin" itself becomes "/" on the admin host; the rest lose the prefix.
    // TabNav's longest-prefix match handles "/" correctly — it only matches an
    // exact "/" (nothing else starts with "//").
    href: stripPrefix ? t.href.slice("/admin".length) || "/" : t.href,
    // The `team` surface's tab reads "Settings" (it holds the Team and
    // Notifications subroutes); the permission checkbox keeps the Team label.
    label: t.key === "team" ? "Settings" : t.label,
  }));

  // Inline: sits in the admin header, so no bottom margin/min-height.
  // Standalone: min-h keeps the bar's height while perms load, so the page
  // below doesn't jump once they arrive.
  return (
    <TabNav
      tabs={tabs}
      ariaLabel="Admin sections"
      inline={inline}
      className={inline ? "" : "mb-8 min-h-10"}
    />
  );
}
