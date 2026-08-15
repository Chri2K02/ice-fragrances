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
  // Placed through admin-only Stripe TEST mode (see lib/stripeMode). Test
  // orders are recorded but quarantined: no stock decrement, no Meta
  // Purchase event, and they're labelled wherever orders are displayed.
  testMode: boolean("test_mode").notNull().default(false),
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

// Admin management: each email is a ROW that persists for good. `perms` holds
// per-surface access toggles (missing key = NO access — deny by default); a row
// with no true perm is not an admin at all. "Removing" an admin clears perms
// but keeps the row. `notify` holds per-notification-type toggles (missing key
// = default on), honored only while the row has at least one perm. The
// bootstrap ADMIN_EMAIL always has full access regardless of its row, so the
// store can never lock itself out. See lib/admin.ts + lib/permissions.ts.
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  notify: jsonb("notify").$type<Record<string, boolean>>().notNull().default({}),
  perms: jsonb("perms").$type<Record<string, boolean>>().notNull().default({}),
  // Opt-in to the reply-to list: every outbound Resend email carries the
  // active opted-in admins as its reply-to (see lib/email.ts sendEmail).
  replyTo: boolean("reply_to").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Editable content OVERLAY for the catalog. Product IDENTITY (id, name, price,
// category, sizes, freeShipping) stays in data/products.json — versioned and
// safe to read synchronously on the client (cart/checkout) and server-trusted
// for the charge. Everything an admin edits — copy, media, and per-video audio
// — lives here, keyed by product id, and is merged over the JSON base at request
// time (see lib/catalog.ts). A missing row or null field means "use the JSON
// default".
export const productContent = pgTable("product_content", {
  productId: text("product_id").primaryKey(),
  tagline: text("tagline"),
  notes: text("notes"),
  description: text("description"),
  oil: text("oil"),
  poster: text("poster"),
  video: text("video"),
  images: jsonb("images").$type<string[]>(),
  // Per-video audio, tunable admin-side: muted-by-default + 0-100 volume.
  audioMuted: boolean("audio_muted").notNull().default(true),
  audioVolume: integer("audio_volume").notNull().default(100),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Better Auth core tables live in lib/auth-schema.ts. Re-export them here so
// the app's Drizzle instance (lib/db) and drizzle.config.ts (which points at
// this file) both see them. Additive alongside Clerk — see lib/auth.ts.
export * from "../auth-schema";
