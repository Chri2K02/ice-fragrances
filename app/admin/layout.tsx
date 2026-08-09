import type { Metadata } from "next";
import { TabNav } from "@/components/TabNav";

// Shared shell for every /admin page: one container width and the always-
// visible section tabs. Auth stays in each page (layouts are cached across
// navigations, so they're the wrong place for per-request checks); this
// layer is purely presentational.
export const metadata: Metadata = {
  // Safety net for any future admin page; each page also sets this itself.
  robots: { index: false, follow: false },
};

const TABS = [
  { href: "/admin", label: "Stock" },
  { href: "/admin/catalog", label: "Catalog" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="px-4 py-12 max-w-3xl mx-auto min-h-[70vh]">
      <TabNav tabs={TABS} ariaLabel="Admin sections" />
      {children}
    </main>
  );
}
