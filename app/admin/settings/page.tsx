import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { adminPermsFor, isBootstrapAdmin, normalizePerms } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { NOTIFICATION_TYPES } from "@/lib/notifications";
import { PERMISSION_TYPES } from "@/lib/permissions";
import { AdminTeam } from "@/components/AdminTeam";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Team",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (!(await adminPermsFor(session.user.email)).team) redirect("/admin");

  const rows = await getDb().select().from(admins).orderBy(admins.id);
  const list = rows.map((a) => ({
    email: a.email,
    notify: a.notify ?? {},
    perms: normalizePerms(a.perms),
    bootstrap: isBootstrapAdmin(a.email),
  }));

  return (
    <>
      <h1 className="text-2xl font-semibold mb-2">Team &amp; notifications</h1>
      <p className="opacity-70 text-sm mb-6">
        Access checkboxes control which admin sections each person can open —
        someone with none is not an admin at all. Notification checkboxes
        control which emails they receive while they have access. Removing
        someone only revokes their access; their row stays. The owner account
        always has full access.
      </p>
      <AdminTeam
        initial={list}
        permTypes={PERMISSION_TYPES.map((t) => ({ key: t.key, label: t.label }))}
        notifyTypes={NOTIFICATION_TYPES.map((t) => ({
          key: t.key,
          label: t.label,
        }))}
      />
    </>
  );
}
