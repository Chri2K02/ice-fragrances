import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import type { NotificationType } from "@/lib/notifications";
import {
  PERMISSION_KEYS,
  PERMISSION_TYPES,
  type PermissionMap,
  type PermissionType,
} from "@/lib/permissions";

// The bootstrap owner (env ADMIN_EMAIL). Always a full admin even without an
// `admins` row, and un-revocable from the team UI, so the store can never lock
// itself out.
export function bootstrapAdminEmail(): string | null {
  return process.env.ADMIN_EMAIL || null;
}

export function isBootstrapAdmin(email: string | null | undefined): boolean {
  const boot = bootstrapAdminEmail();
  return !!email && !!boot && email === boot;
}

export function fullPerms(): PermissionMap {
  return Object.fromEntries(
    PERMISSION_KEYS.map((k) => [k, true])
  ) as PermissionMap;
}

function noPerms(): PermissionMap {
  return Object.fromEntries(
    PERMISSION_KEYS.map((k) => [k, false])
  ) as PermissionMap;
}

// Normalize a stored jsonb perms blob to the full key set. Missing or non-true
// keys are false: access is deny-by-default.
export function normalizePerms(
  stored: Record<string, boolean> | null | undefined
): PermissionMap {
  return Object.fromEntries(
    PERMISSION_KEYS.map((k) => [k, stored?.[k] === true])
  ) as PermissionMap;
}

export function hasAnyPerm(perms: PermissionMap): boolean {
  return PERMISSION_KEYS.some((k) => perms[k]);
}

// Resolve the per-surface permissions for an email. Bootstrap owner gets
// everything; anyone else gets their row's perms; no row, no session, or a DB
// error resolves to all-false, so a transient DB blip never silently grants
// access.
export async function adminPermsFor(
  email: string | null | undefined
): Promise<PermissionMap> {
  if (!email) return noPerms();
  if (isBootstrapAdmin(email)) return fullPerms();
  try {
    const rows = await getDb()
      .select({ perms: admins.perms })
      .from(admins)
      .where(eq(admins.email, email))
      .limit(1);
    return normalizePerms(rows[0]?.perms);
  } catch {
    return noPerms();
  }
}

export async function hasAdminPerm(
  email: string | null | undefined,
  perm: PermissionType
): Promise<boolean> {
  return (await adminPermsFor(email))[perm];
}

// First admin surface this permission set can open — where /admin sends someone
// who can't see the default tab. Null when they hold no permissions.
export function firstAdminPathFor(perms: PermissionMap): string | null {
  return PERMISSION_TYPES.find((t) => perms[t.key])?.href ?? null;
}

// Recipients for a notification type: every ACTIVE admin (at least one surface
// permission — revoked rows never receive email) whose toggle for that type is
// not explicitly false (missing key = default on). Falls back to the bootstrap
// owner if nobody qualifies or the DB is unreachable, so notifications are
// never silently dropped.
export async function recipientsFor(type: NotificationType): Promise<string[]> {
  try {
    const rows = await getDb()
      .select({ email: admins.email, notify: admins.notify, perms: admins.perms })
      .from(admins);
    const out = rows
      .filter(
        (r) =>
          (hasAnyPerm(normalizePerms(r.perms)) || isBootstrapAdmin(r.email)) &&
          (r.notify?.[type] ?? true)
      )
      .map((r) => r.email);
    if (out.length) return [...new Set(out)];
  } catch {
    /* fall through to bootstrap */
  }
  const boot = bootstrapAdminEmail();
  return boot ? [boot] : [];
}
