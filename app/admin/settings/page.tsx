import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { isAdminEmail, isBootstrapAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { NOTIFICATION_TYPES } from "@/lib/notifications";
import { AdminTeam } from "@/components/AdminTeam";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Team",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (!(await isAdminEmail(session.user.email))) redirect("/");

  const rows = await getDb().select().from(admins).orderBy(admins.id);
  const list = rows.map((a) => ({
    email: a.email,
    notify: a.notify ?? {},
    bootstrap: isBootstrapAdmin(a.email),
  }));

  return (
    <main className="px-4 py-12 max-w-3xl mx-auto min-h-[70vh]">
      <div className="flex items-center justify-between mb-2 gap-3">
        <h1 className="text-2xl font-semibold">Team &amp; notifications</h1>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/admin" className="underline opacity-70">
            ← Stock
          </Link>
          <Link href="/admin/reviews" className="underline opacity-70">
            Reviews →
          </Link>
        </nav>
      </div>
      <p className="opacity-70 text-sm mb-6">
        Everyone listed can access the admin dashboard. Each checkbox controls
        which emails that person receives. New admins default to receiving
        everything; the owner account can&apos;t be removed.
      </p>
      <AdminTeam
        initial={list}
        types={NOTIFICATION_TYPES.map((t) => ({ key: t.key, label: t.label }))}
      />
    </main>
  );
}
