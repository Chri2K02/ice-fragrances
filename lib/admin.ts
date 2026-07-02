import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import type { NotificationType } from "@/lib/notifications";

// The bootstrap owner (env ADMIN_EMAIL). Always an admin even without an
// `admins` row, and un-removable from the team UI, so the store can never lock
// itself out.
export function bootstrapAdminEmail(): string | null {
  return process.env.ADMIN_EMAIL || null;
}

export function isBootstrapAdmin(email: string | null | undefined): boolean {
  const boot = bootstrapAdminEmail();
  return !!email && !!boot && email === boot;
}

// DB-backed admin check: the bootstrap ADMIN_EMAIL, or any email in `admins`.
// Replaces the scattered `email === ADMIN_EMAIL` comparisons.
export async function isAdminEmail(
  email: string | null | undefined
): Promise<boolean> {
  if (!email) return false;
  if (isBootstrapAdmin(email)) return true;
  try {
    const rows = await getDb()
      .select({ id: admins.id })
      .from(admins)
      .where(eq(admins.email, email))
      .limit(1);
    return rows.length > 0;
  } catch {
    // DB unreachable: fall back to the bootstrap owner only (already handled
    // above), so a transient DB blip never silently grants admin.
    return false;
  }
}

// Recipients for a notification type: every admin whose toggle for that type is
// not explicitly false (missing key = default on). Falls back to the bootstrap
// owner if the table is empty or unreachable, so notifications are never
// silently dropped.
export async function recipientsFor(type: NotificationType): Promise<string[]> {
  try {
    const rows = await getDb()
      .select({ email: admins.email, notify: admins.notify })
      .from(admins);
    const out = rows
      .filter((r) => (r.notify?.[type] ?? true))
      .map((r) => r.email);
    if (out.length) return [...new Set(out)];
  } catch {
    /* fall through to bootstrap */
  }
  const boot = bootstrapAdminEmail();
  return boot ? [boot] : [];
}
