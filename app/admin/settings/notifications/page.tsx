import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  adminPermsFor,
  hasAnyPerm,
  isBootstrapAdmin,
  normalizePerms,
} from "@/lib/admin";
import { getDb } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { NOTIFICATION_TYPES } from "@/lib/notifications";
import { AdminNotifications } from "@/components/AdminNotifications";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Notifications",
  robots: { index: false, follow: false },
};

export default async function AdminNotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (!(await adminPermsFor(session.user.email)).team) redirect("/admin");

  const rows = await getDb().select().from(admins).orderBy(admins.id);
  const list = rows.map((a) => ({
    email: a.email,
    notify: a.notify ?? {},
    replyTo: a.replyTo,
    // Notifications are only honored while the row has admin access — the
    // matrix keeps revoked rows (prefs persist) but shows them dimmed.
    active:
      isBootstrapAdmin(a.email) || hasAnyPerm(normalizePerms(a.perms)),
  }));

  return (
    <>
      <p className="opacity-70 text-sm mb-6">
        Each checkbox controls which emails that person receives while they
        have admin access. Unchecked means that notification type is muted for
        them; dimmed rows have no access and receive nothing. Reply-to adds
        the address to the reply-to list of every email the store sends.
        Send test delivers a sample email to that address.
      </p>
      <AdminNotifications
        initial={list}
        types={NOTIFICATION_TYPES.map((t) => ({ key: t.key, label: t.label }))}
      />
    </>
  );
}
