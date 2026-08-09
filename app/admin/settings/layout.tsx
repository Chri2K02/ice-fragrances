import { TabNav } from "@/components/TabNav";

// Settings has real subroutes (deep-linkable, not client-side switching):
// /admin/settings/team and /admin/settings/notifications. This nested layout
// adds the sub-bar under the admin section tabs; auth stays in each page.
const TABS = [
  { href: "/admin/settings/team", label: "Team" },
  { href: "/admin/settings/notifications", label: "Notifications" },
];

export default function AdminSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <h1 className="text-2xl font-semibold mb-4">Settings</h1>
      <TabNav tabs={TABS} ariaLabel="Settings sections" className="mb-6" />
      {children}
    </>
  );
}
