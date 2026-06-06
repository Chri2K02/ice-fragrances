import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserProfile } from "@clerk/nextjs";

export default async function AccountPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <main className="px-4 py-12 grid place-items-center min-h-[70vh]">
      <UserProfile routing="hash" />
    </main>
  );
}
