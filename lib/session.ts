import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Server-side session helpers for Better Auth. Single-tenant subset of zcanon:
// no soft-delete grace window, no tenant/org resolution — just "is there a
// session" and "require one or bounce to sign-in". Nothing consumes these yet
// (Clerk still owns auth); A2/A3 wire them into pages during the cutover.

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }
  return session;
}
