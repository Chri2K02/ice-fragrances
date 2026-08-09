// Code-driven catalog of admin SURFACES — the access columns of the admin
// management page and the tabs of the admin dashboard. Keys are stored in
// admins.perms; a missing key means "no access" (deny by default). An admin
// with no permissions at all is not an admin: no Admin link, no /admin access,
// no notifications. See lib/admin.ts for the server-side checks.
export const PERMISSION_TYPES = [
  { key: "stock", label: "Stock", href: "/admin" },
  { key: "catalog", label: "Catalog", href: "/admin/catalog" },
  { key: "reviews", label: "Reviews", href: "/admin/reviews" },
  { key: "team", label: "Team", href: "/admin/settings" },
] as const;

export type PermissionType = (typeof PERMISSION_TYPES)[number]["key"];

export const PERMISSION_KEYS: PermissionType[] = PERMISSION_TYPES.map(
  (t) => t.key
);

export type PermissionMap = Record<PermissionType, boolean>;
