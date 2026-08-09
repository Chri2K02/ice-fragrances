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

  // ── Better Auth user id on orders/reviews ─────────────────────────────
  // user_id holds the Better Auth user.id. Legacy clerk_user_id has been
  // dropped (go-live §5); on a fresh DB these tables are created without it.
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id text`;
  await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_id text`;
  // Reviews: any account can post; `verified` is FROZEN at post time (see
  // app/api/reviews). `anonymous` hides the name publicly; `replied_by` is the
  // internal reply author (never shown; public face is always Ice Fragrances).
  await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false`;
  await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS anonymous boolean NOT NULL DEFAULT false`;
  await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS replied_by text`;
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

  // Admin management (see lib/admin.ts, lib/permissions.ts,
  // lib/notifications.ts). Rows are emails and persist for good; `perms` holds
  // per-surface access toggles (missing key = no access; no perms = not an
  // admin), `notify` holds per-type notification toggles (missing key = on).
  await sql`CREATE TABLE IF NOT EXISTS admins (
    id serial PRIMARY KEY,
    email text NOT NULL UNIQUE,
    notify jsonb NOT NULL DEFAULT '{}'::jsonb,
    perms jsonb NOT NULL DEFAULT '{}'::jsonb,
    reply_to boolean NOT NULL DEFAULT false,
    created_at timestamp NOT NULL DEFAULT now()
  )`;
  // Reply-to opt-in flag (see lib/email.ts). Off by default — no backfill
  // needed, so a plain idempotent ALTER suffices.
  await sql`ALTER TABLE admins ADD COLUMN IF NOT EXISTS reply_to boolean NOT NULL DEFAULT false`;
  // Adding `perms` to a pre-existing table must backfill existing rows with
  // full access exactly ONCE (they were unconditional admins before the column
  // existed). Guarded by a column-existence probe so re-running the migration
  // never re-grants access to admins revoked since.
  const permsCol = await sql`SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admins' AND column_name = 'perms'`;
  if (permsCol.length === 0) {
    await sql`ALTER TABLE admins ADD COLUMN perms jsonb NOT NULL DEFAULT '{}'::jsonb`;
    await sql`UPDATE admins SET perms =
      '{"stock":true,"catalog":true,"reviews":true,"team":true}'::jsonb`;
  }
  // Seed the bootstrap owner so the team is never empty and can't lock out.
  // (It has full access regardless of the row — see lib/admin.ts.)
  if (process.env.ADMIN_EMAIL) {
    await sql`INSERT INTO admins (email, perms) VALUES (${process.env.ADMIN_EMAIL},
      '{"stock":true,"catalog":true,"reviews":true,"team":true}'::jsonb)
      ON CONFLICT (email) DO NOTHING`;
  }

  // Editable catalog content overlay (copy/media/audio) merged over
  // data/products.json at request time. See lib/catalog.ts.
  await sql`CREATE TABLE IF NOT EXISTS product_content (
    product_id text PRIMARY KEY,
    tagline text,
    notes text,
    description text,
    oil text,
    poster text,
    video text,
    images jsonb,
    audio_muted boolean NOT NULL DEFAULT true,
    audio_volume integer NOT NULL DEFAULT 100,
    updated_at timestamp NOT NULL DEFAULT now()
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
      "admins",
      "product_content",
    ],
  });
}
