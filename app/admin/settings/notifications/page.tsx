import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
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
  if (!(await isAdminEmail(session.user.email))) redirect("/");

  const rows = await getDb().select().from(admins).orderBy(admins.id);
  const list = rows.map((a) => ({
    email: a.email,
    notify: a.notify ?? {},
  }));

  return (
    <>
      <p className="opacity-70 text-sm mb-6">
        Each checkbox controls which emails that person receives. Unchecked
        means that notification type is muted for them.
      </p>
      <AdminNotifications
        initial={list}
        types={NOTIFICATION_TYPES.map((t) => ({ key: t.key, label: t.label }))}
      />
    </>
  );
}
