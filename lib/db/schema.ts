import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  stripeSessionId: text("stripe_session_id").notNull().unique(),
  // Better Auth user id (post-cutover). Legacy clerk_user_id is kept until the
  // A4 backfill populates user_id for every row, then dropped (lead-gated).
  userId: text("user_id"),
  clerkUserId: text("clerk_user_id"),
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
  // Better Auth user id (post-cutover). clerk_user_id is now nullable — new
  // reviews write user_id only; A4 backfills it for legacy rows before the
  // column is dropped (lead-gated).
  userId: text("user_id"),
  clerkUserId: text("clerk_user_id"),
  authorName: text("author_name").notNull(),
  rating: integer("rating").notNull(),
  body: text("body").notNull().default(""),
  adminReply: text("admin_reply"),
  repliedAt: timestamp("replied_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Better Auth core tables live in lib/auth-schema.ts. Re-export them here so
// the app's Drizzle instance (lib/db) and drizzle.config.ts (which points at
// this file) both see them. Additive alongside Clerk — see lib/auth.ts.
export * from "../auth-schema";
