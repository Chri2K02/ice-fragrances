"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { STRIPE_SECTIONS, stripeSectionHref } from "@/lib/stripeSections";
import { isAdminHost } from "@/lib/site";
import { useBrowserValue } from "@/lib/ui";

// Side nav for the Stripe section. Driven entirely by STRIPE_SECTIONS, so a
// new section appears here the moment it's added to that list — sections not
// built yet render as disabled labels rather than dead links.
export function StripeSideNav() {
  const pathname = usePathname();
  // On admin.icefragrances.com the tree is served from the subdomain root, so
  // hrefs drop the /admin prefix (same rule as the section tabs).
  const stripPrefix = useBrowserValue(
    () => isAdminHost(window.location.host),
    false
  );
  const href = (slug: string) => {
    const full = stripeSectionHref(slug);
    return stripPrefix ? full.slice("/admin".length) || "/" : full;
  };

  return (
    <nav
      aria-label="Stripe sections"
      className="flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible sm:w-44 shrink-0"
    >
      {STRIPE_SECTIONS.map((s) => {
        const to = href(s.slug);
        const active = pathname === to;
        if (!s.built) {
          return (
            <span
              key={s.slug || "root"}
              title={`${s.description} (not built yet)`}
              className="rounded-lg px-3 py-2 text-sm whitespace-nowrap opacity-35 cursor-default"
            >
              {s.label}
            </span>
          );
        }
        return (
          <Link
            key={s.slug || "root"}
            href={to}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-sm whitespace-nowrap ${
              active
                ? "font-semibold"
                : "opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10"
            }`}
            style={
              active
                ? { background: "var(--card)", color: "var(--accent)" }
                : undefined
            }
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
