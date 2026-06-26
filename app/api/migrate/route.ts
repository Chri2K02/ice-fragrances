import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

// One-time (idempotent) table setup. Guarded by MIGRATE_SECRET.
export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret");
  if (!process.env.MIGRATE_SECRET || secret !== process.env.MIGRATE_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const sql = neon(process.env.DATABASE_URL!);

  await sql`CREATE TABLE IF NOT EXISTS orders (
    id serial PRIMARY KEY,
    stripe_session_id text NOT NULL UNIQUE,
    clerk_user_id text,
    email text,
    total_cents integer NOT NULL DEFAULT 0,
    created_at timestamp NOT NULL DEFAULT now()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS order_items (
    id serial PRIMARY KEY,
    order_id integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id text NOT NULL,
    name text NOT NULL,
    qty integer NOT NULL DEFAULT 1
  )`;

  await sql`CREATE TABLE IF NOT EXISTS reviews (
    id serial PRIMARY KEY,
    product_id text NOT NULL,
    clerk_user_id text NOT NULL,
    author_name text NOT NULL,
    rating integer NOT NULL,
    body text NOT NULL DEFAULT '',
    created_at timestamp NOT NULL DEFAULT now()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS inventory (
    id serial PRIMARY KEY,
    product_id text NOT NULL,
    size text NOT NULL DEFAULT '',
    stock integer NOT NULL DEFAULT 0,
    CONSTRAINT inventory_product_size UNIQUE (product_id, size)
  )`;

  // Customer name from checkout — used as a reliable fallback for review names.
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS name text`;

  // Store's public reply to a review ("Response from Ice Fragrances").
  await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS admin_reply text`;
  await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS replied_at timestamp`;

  // ── A2 cutover: Better Auth user id on orders/reviews ─────────────────
  // Additive: add user_id (holds the Better Auth user.id), and relax the old
  // NOT NULL on reviews.clerk_user_id so new reviews can write user_id only.
  // A4 backfills user_id for legacy rows; clerk_user_id is dropped later
  // (lead-gated) once every row has a user_id.
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id text`;
  await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_id text`;
  await sql`ALTER TABLE reviews ALTER COLUMN clerk_user_id DROP NOT NULL`;
  await sql`CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders (user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON reviews (user_id)`;

  // ── Better Auth core tables (additive alongside Clerk) ────────────────
  // Mirrors lib/auth-schema.ts. "user" is a reserved word — must be quoted.
  await sql`CREATE TABLE IF NOT EXISTS "user" (
    id text PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    email_verified boolean NOT NULL DEFAULT false,
    image text,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS "session" (
    id text PRIMARY KEY,
    expires_at timestamp NOT NULL,
    token text NOT NULL UNIQUE,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now(),
    ip_address text,
    user_agent text,
    user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
  )`;
  await sql`CREATE INDEX IF NOT EXISTS session_userId_idx ON "session" (user_id)`;

  await sql`CREATE TABLE IF NOT EXISTS account (
    id text PRIMARY KEY,
    account_id text NOT NULL,
    provider_id text NOT NULL,
    user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    access_token text,
    refresh_token text,
    id_token text,
    access_token_expires_at timestamp,
    refresh_token_expires_at timestamp,
    scope text,
    password text,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS account_userId_idx ON account (user_id)`;

  await sql`CREATE TABLE IF NOT EXISTS verification (
    id text PRIMARY KEY,
    identifier text NOT NULL,
    value text NOT NULL,
    expires_at timestamp NOT NULL,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS verification_identifier_idx ON verification (identifier)`;

  await sql`CREATE TABLE IF NOT EXISTS rate_limit (
    id text PRIMARY KEY,
    key text NOT NULL UNIQUE,
    count integer NOT NULL,
    last_request bigint NOT NULL
  )`;

  return NextResponse.json({
    ok: true,
    tables: [
      "orders",
      "order_items",
      "reviews",
      "inventory",
      "user",
      "session",
      "account",
      "verification",
      "rate_limit",
    ],
  });
}
