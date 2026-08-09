import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { isAdminEmail, isBootstrapAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { AdminTeamMembers } from "@/components/AdminTeamMembers";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Team",
  robots: { index: false, follow: false },
};

export default async function AdminTeamPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (!(await isAdminEmail(session.user.email))) redirect("/");

  const rows = await getDb().select().from(admins).orderBy(admins.id);
  const list = rows.map((a) => ({
    email: a.email,
    bootstrap: isBootstrapAdmin(a.email),
  }));

  return (
    <>
      <p className="opacity-70 text-sm mb-6">
        Everyone listed can access the admin dashboard. New admins default to
        receiving every notification — tune that under Notifications. The owner
        account can&apos;t be removed.
      </p>
      <AdminTeamMembers initial={list} />
    </>
  );
}
