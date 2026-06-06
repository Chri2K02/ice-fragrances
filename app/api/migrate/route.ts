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

  return NextResponse.json({ ok: true, tables: ["orders", "order_items", "reviews"] });
}
