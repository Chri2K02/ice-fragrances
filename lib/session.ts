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

// The current user's linked auth methods, for the account page. Read straight
// from the account table (not the client listAccounts) so the page server-
// renders. `hasPassword` drives change-vs-set-password; `google` gates the
// link/unlink control; `canUnlinkGoogle` blocks removing the only login
// method (which would lock the user out).
export async function getAuthMethods(userId: string): Promise<{
  hasPassword: boolean;
  google: boolean;
  canUnlinkGoogle: boolean;
}> {
  const { getDb } = await import("@/lib/db");
  const { account } = await import("@/lib/auth-schema");
  const { eq } = await import("drizzle-orm");
  try {
    const rows = await getDb()
      .select({ providerId: account.providerId, password: account.password })
      .from(account)
      .where(eq(account.userId, userId));
    const hasPassword = rows.some(
      (r) => r.providerId === "credential" && !!r.password
    );
    const google = rows.some((r) => r.providerId === "google");
    // Never let someone unlink their last remaining sign-in method.
    return { hasPassword, google, canUnlinkGoogle: google && hasPassword };
  } catch {
    return { hasPassword: false, google: false, canUnlinkGoogle: false };
  }
}
