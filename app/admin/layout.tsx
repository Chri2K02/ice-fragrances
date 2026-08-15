import type { Metadata } from "next";
import { headers } from "next/headers";
import { AdminTabs } from "@/components/AdminTabs";
import { isAdminHost } from "@/lib/site";

// Shared shell for every /admin page. Auth stays in each page (layouts are
// cached across navigations, so they're the wrong place for per-request
// checks); this layer is purely presentational.
export const metadata: Metadata = {
  // Safety net for any future admin page; each page also sets this itself.
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // On the admin subdomain the section tabs live INSIDE the header (one bar,
  // see components/Header), so the standalone bar would be a duplicate. The
  // host is read server-side rather than in the client so the bar never
  // renders and then vanishes on hydration.
  const onAdminHost = isAdminHost((await headers()).get("host"));

  return (
    <main className="px-4 py-12 max-w-3xl mx-auto min-h-[70vh]">
      {!onAdminHost && <AdminTabs />}
      {children}
    </main>
  );
}
