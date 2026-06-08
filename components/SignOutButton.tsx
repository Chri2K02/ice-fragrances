"use client";
import { useClerk } from "@clerk/nextjs";

export function SignOutButton() {
  const { signOut } = useClerk();
  return (
    <button
      type="button"
      onClick={() => signOut({ redirectUrl: "/" })}
      className="rounded-full px-4 py-2 text-sm font-medium border-2 border-black dark:border-white/40 hover:opacity-70 whitespace-nowrap"
    >
      Sign out
    </button>
  );
}
