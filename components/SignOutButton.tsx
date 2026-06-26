"use client";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  async function handleSignOut() {
    await authClient.signOut();
    // Hard navigation so server components re-render against the cleared
    // session cookie.
    window.location.href = "/";
  }
  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="rounded-full px-4 py-2 text-sm font-medium border-2 border-black dark:border-white/40 hover:opacity-70 whitespace-nowrap"
    >
      Sign out
    </button>
  );
}
