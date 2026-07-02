// Code-driven catalog of notification TYPES — the columns of the admin
// notification surface. Adding a column is a one-line change here; the admin UI
// and routing derive from this list. Keys are stored in admins.notify; a
// missing key means "default on".
export const NOTIFICATION_TYPES = [
  { key: "orders", label: "New orders" },
  { key: "support", label: "Support requests" },
  { key: "reviews", label: "New reviews" },
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]["key"];

export const NOTIFICATION_KEYS: NotificationType[] = NOTIFICATION_TYPES.map(
  (t) => t.key
);
