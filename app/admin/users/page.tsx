import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { adminPermsFor } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { AdminUsers } from "@/components/AdminUsers";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Users",
  robots: { index: false, follow: false },
};

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  isAdmin: boolean;
  orderCount: number;
  reviewCount: number;
  // Spend is per-currency: the store settles in USD and CAD, so a single
  // number would be a lie. Test orders are excluded entirely.
  spend: Record<string, number>;
  lastOrderAt: string | null;
};

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (!(await adminPermsFor(session.user.email)).users) redirect("/admin");

  // Orders are matched by user_id OR email — guest checkouts never carry a
  // user id, so email is what links them to an account created later.
  const rows = await getDb().execute<{
    id: string;
    name: string;
    email: string;
    email_verified: boolean;
    created_at: Date;
    is_admin: boolean;
    order_count: number;
    review_count: number;
    spend: { currency: string; cents: number }[] | null;
    last_order_at: Date | null;
  }>(sql`
    SELECT u.id, u.name, u.email, u.email_verified, u.created_at,
      EXISTS (
        SELECT 1 FROM admins a
        WHERE a.email = u.email AND a.perms <> '{}'::jsonb
      ) AS is_admin,
      COALESCE(o.cnt, 0)::int AS order_count,
      COALESCE(r.cnt, 0)::int AS review_count,
      o.spend,
      o.last_at AS last_order_at
    FROM "user" u
    LEFT JOIN (
      SELECT COALESCE(ord.user_id, u2.id) AS uid,
             count(*)::int AS cnt,
             max(ord.created_at) AS last_at,
             jsonb_agg(jsonb_build_object('currency', ord.currency, 'cents', ord.total_cents)) AS spend
      FROM orders ord
      LEFT JOIN "user" u2 ON u2.email = ord.email
      WHERE ord.test_mode = false
      GROUP BY 1
    ) o ON o.uid = u.id
    LEFT JOIN (
      SELECT user_id AS uid, count(*)::int AS cnt FROM reviews
      WHERE user_id IS NOT NULL GROUP BY 1
    ) r ON r.uid = u.id
    ORDER BY COALESCE(o.last_at, u.created_at) DESC
  `);

  const list: AdminUserRow[] = (rows.rows ?? rows).map((u) => {
    const spend: Record<string, number> = {};
    for (const s of u.spend ?? []) {
      spend[s.currency] = (spend[s.currency] ?? 0) + s.cents;
    }
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      emailVerified: u.email_verified,
      createdAt: new Date(u.created_at).toISOString(),
      isAdmin: u.is_admin,
      orderCount: u.order_count,
      reviewCount: u.review_count,
      spend,
      lastOrderAt: u.last_order_at ? new Date(u.last_order_at).toISOString() : null,
    };
  });

  return (
    <>
      <h1 className="text-2xl font-semibold mb-2">Users</h1>
      <p className="opacity-70 text-sm mb-6">
        Everyone with an account, with their orders and reviews. Orders are
        matched by account id or checkout email, so guest purchases still link
        up once someone registers with the same address. Test orders are
        excluded.
      </p>
      <AdminUsers initial={list} />
    </>
  );
}
