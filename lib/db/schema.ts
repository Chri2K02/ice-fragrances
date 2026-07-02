import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  stripeSessionId: text("stripe_session_id").notNull().unique(),
  // Better Auth user id (post-cutover). Legacy clerk_user_id was dropped
  // once every row had a user_id (go-live §5).
  userId: text("user_id"),
  email: text("email"),
  name: text("name"),
  totalCents: integer("total_cents").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull(),
  name: text("name").notNull(),
  qty: integer("qty").notNull().default(1),
});

export const inventory = pgTable(
  "inventory",
  {
    id: serial("id").primaryKey(),
    productId: text("product_id").notNull(),
    size: text("size").notNull().default(""),
    stock: integer("stock").notNull().default(0),
  },
  (t) => ({ uniq: unique("inventory_product_size").on(t.productId, t.size) })
);

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: text("product_id").notNull(),
  // Better Auth user id (post-cutover). Legacy clerk_user_id was dropped
  // once every row had a user_id (go-live §5).
  userId: text("user_id"),
  authorName: text("author_name").notNull(),
  rating: integer("rating").notNull(),
  body: text("body").notNull().default(""),
  // Verified-purchase status FROZEN at post time (see app/api/reviews), so it
  // is decoupled from live order state: seeds can read verified, and legacy
  // purchases never silently un-verify.
  verified: boolean("verified").notNull().default(false),
  // Hide the author's name publicly (rendered as "Anonymous"); the real name
  // is still stored for internal/admin use.
  anonymous: boolean("anonymous").notNull().default(false),
  adminReply: text("admin_reply"),
  // Internal-only: which admin wrote the reply. Never exposed — the external
  // face of every reply is always "Ice Fragrances".
  repliedBy: text("replied_by"),
  repliedAt: timestamp("replied_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Store admins + the notification surface in one table. Each admin email is a
// ROW; `notify` holds the per-notification-type column toggles (missing key =
// default on). Recipients for a notification type are the admins whose toggle
// for it isn't explicitly false. The bootstrap ADMIN_EMAIL is seeded here and
// is un-removable, so the store can never lock itself out. See lib/admin.ts.
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  notify: jsonb("notify").$type<Record<string, boolean>>().notNull().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Better Auth core tables live in lib/auth-schema.ts. Re-export them here so
// the app's Drizzle instance (lib/db) and drizzle.config.ts (which points at
// this file) both see them. Additive alongside Clerk — see lib/auth.ts.
export * from "../auth-schema";
