import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { adminPermsFor } from "@/lib/admin";
import { StripeSideNav } from "@/components/StripeSideNav";
import { StripeModeNotice } from "@/components/StripeModeNotice";

// Shell for the Stripe section: permission gate + the side nav every page here
// shares. Gating in the layout is safe because it runs per-request (this tree
// is dynamic — the pages read the session anyway) and it means a new section
// page can't accidentally ship ungated.
export default async function StripeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (!(await adminPermsFor(session.user.email)).stripe) redirect("/admin");

  return (
    <>
      <h1 className="text-2xl font-semibold mb-2">Stripe</h1>
      <StripeModeNotice />
      <div className="mt-6 flex flex-col sm:flex-row gap-6">
        <StripeSideNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </>
  );
}
