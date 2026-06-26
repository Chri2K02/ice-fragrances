/**
 * A4 — Clerk → Better Auth data migration (standalone, idempotent).
 *
 * Pulls every Clerk user via the Backend API and:
 *   1. Upserts a Better Auth `user` row (keyed by email).
 *   2. Upserts a Google `account` link row (provider_id="google", account_id =
 *      the Google subject). No credential rows — Clerk password hashes are not
 *      exportable, so migrated users sign in via Google or email-OTP.
 *   3. Backfills `reviews.user_id` (via clerk_user_id → user.id) and
 *      `orders.user_id` (via email → user.id, falling back to clerk_user_id).
 *
 * Then it REPORTS how many CLERK-LINKED rows are still unmigrated
 * (clerk_user_id IS NOT NULL AND user_id IS NULL) — that remainder is lead's
 * gate for the eventual `DROP COLUMN clerk_user_id`. Guest orders (no
 * clerk_user_id) legitimately keep user_id NULL and are excluded from the gate.
 *
 * This is a SCRIPT, not a route: lead runs it once on prod with .env.local
 * (CLERK_SECRET_KEY + DATABASE_URL). It is safe to re-run — every write is
 * guarded by an existence/NULL check, so a second run is a no-op.
 *
 *   How to run:
 *     npx tsx scripts/migrate-clerk-to-ba.ts          # apply
 *     npx tsx scripts/migrate-clerk-to-ba.ts --dry     # report only, no writes
 *
 * Dependency: the `user_id` columns on reviews/orders are added by deputy's
 * core PR (/api/migrate). This script asserts they exist and fails loudly if
 * not — run /api/migrate first.
 */
import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { createClerkClient } from "@clerk/backend";

// Load env the way Next does: .env.local wins, .env fills the gaps. dotenv does
// not override already-set vars, so load .env.local first.
config({ path: ".env.local" });
config({ path: ".env" });

const DRY = process.argv.includes("--dry");

// neon(url) infers NeonQueryFunction<false, false>; pin the helper param type to
// match (the generic default <boolean, boolean> is not assignable to it).
type Db = ReturnType<typeof neon<false, false>>;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(
      `\n✗ ${name} is not set. This script needs CLERK_SECRET_KEY + ` +
        `DATABASE_URL (lead's .env.local). Aborting.\n`
    );
    process.exit(1);
  }
  return v;
}

// A Clerk user reduced to just what the migration needs.
type ClerkRow = {
  clerkId: string;
  email: string | null;
  name: string;
  emailVerified: boolean;
  googleSub: string | null;
};

async function main() {
  const DATABASE_URL = requireEnv("DATABASE_URL");
  const CLERK_SECRET_KEY = requireEnv("CLERK_SECRET_KEY");

  const sql = neon(DATABASE_URL);
  const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY });

  console.log(`\n— Clerk → Better Auth migration ${DRY ? "(DRY RUN)" : ""} —\n`);

  // ── Hard dependency check: the backfill target columns must exist ──────────
  await assertColumn(sql, "reviews", "user_id");
  await assertColumn(sql, "orders", "user_id");

  // ── 1. Pull all Clerk users (paginated) ────────────────────────────────────
  const clerkUsers = await pullClerkUsers(clerk);
  console.log(`Pulled ${clerkUsers.length} Clerk user(s).`);

  // ── 2 + 3. Upsert user + account rows; build id maps ───────────────────────
  const clerkIdToUserId = new Map<string, string>();
  const emailToUserId = new Map<string, string>();
  let usersCreated = 0;
  let usersReused = 0;
  let accountsCreated = 0;
  let skippedNoEmail = 0;
  const errors: string[] = [];

  for (const u of clerkUsers) {
    try {
      if (!u.email) {
        // No email → can't satisfy user.email NOT NULL UNIQUE. These users (and
        // any reviews keyed to them) stay unmapped and surface in the remainder.
        skippedNoEmail++;
        continue;
      }
      const emailKey = u.email.toLowerCase();

      // Upsert user by email. ON CONFLICT DO NOTHING + re-select keeps this
      // idempotent and race-safe; an existing row's id is reused, never dupes.
      const existing = (await sql`
        SELECT id FROM "user" WHERE lower(email) = ${emailKey} LIMIT 1
      `) as { id: string }[];

      let userId: string;
      if (existing.length) {
        userId = existing[0].id;
        usersReused++;
      } else if (DRY) {
        userId = `(dry:${u.clerkId})`; // placeholder so maps still count rows
        usersCreated++;
      } else {
        userId = randomUUID();
        const ins = (await sql`
          INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
          VALUES (${userId}, ${u.name}, ${u.email}, ${u.emailVerified}, now(), now())
          ON CONFLICT (email) DO NOTHING
          RETURNING id
        `) as { id: string }[];
        if (ins.length) {
          usersCreated++;
        } else {
          // Lost a race / case-variant email already present — reuse it.
          const got = (await sql`
            SELECT id FROM "user" WHERE lower(email) = ${emailKey} LIMIT 1
          `) as { id: string }[];
          userId = got[0].id;
          usersReused++;
        }
      }

      clerkIdToUserId.set(u.clerkId, userId);
      emailToUserId.set(emailKey, userId);

      // Upsert the Google account link (skip password/credential rows).
      if (u.googleSub) {
        const have = (await sql`
          SELECT 1 FROM account
          WHERE provider_id = 'google' AND account_id = ${u.googleSub} LIMIT 1
        `) as unknown[];
        if (!have.length) {
          if (!DRY) {
            await sql`
              INSERT INTO account (id, account_id, provider_id, user_id, created_at, updated_at)
              VALUES (${randomUUID()}, ${u.googleSub}, 'google', ${userId}, now(), now())
            `;
          }
          accountsCreated++;
        }
      }
    } catch (e) {
      errors.push(`user ${u.clerkId} (${u.email ?? "no-email"}): ${String(e)}`);
    }
  }

  // ── 4. Backfill reviews.user_id via clerk_user_id → user.id ────────────────
  let reviewsBackfilled = 0;
  for (const [clerkId, userId] of clerkIdToUserId) {
    if (DRY) {
      reviewsBackfilled += await countNull(
        sql`SELECT count(*)::int AS n FROM reviews WHERE clerk_user_id = ${clerkId} AND user_id IS NULL`
      );
    } else {
      const updated = (await sql`
        UPDATE reviews SET user_id = ${userId}
        WHERE clerk_user_id = ${clerkId} AND user_id IS NULL
        RETURNING id
      `) as unknown[];
      reviewsBackfilled += updated.length;
    }
  }

  // ── 5. Backfill orders.user_id: prefer email, fall back to clerk_user_id ────
  let ordersBackfilled = 0;
  for (const [emailKey, userId] of emailToUserId) {
    if (DRY) {
      ordersBackfilled += await countNull(
        sql`SELECT count(*)::int AS n FROM orders WHERE lower(email) = ${emailKey} AND user_id IS NULL`
      );
    } else {
      const updated = (await sql`
        UPDATE orders SET user_id = ${userId}
        WHERE lower(email) = ${emailKey} AND user_id IS NULL
        RETURNING id
      `) as unknown[];
      ordersBackfilled += updated.length;
    }
  }
  for (const [clerkId, userId] of clerkIdToUserId) {
    if (DRY) {
      ordersBackfilled += await countNull(
        sql`SELECT count(*)::int AS n FROM orders WHERE clerk_user_id = ${clerkId} AND user_id IS NULL`
      );
    } else {
      const updated = (await sql`
        UPDATE orders SET user_id = ${userId}
        WHERE clerk_user_id = ${clerkId} AND user_id IS NULL
        RETURNING id
      `) as unknown[];
      ordersBackfilled += updated.length;
    }
  }

  // ── 6. Report — the DROP-COLUMN gate ───────────────────────────────────────
  // The gate is "clerk-linked but unmigrated": clerk_user_id IS NOT NULL AND
  // user_id IS NULL. We must NOT count guest orders (clerk_user_id NULL — never
  // had an account, legitimately stay user_id NULL forever); counting those
  // would keep the gate above 0 and block the DROP permanently. For reviews the
  // extra clause is a no-op (clerk_user_id was NOT NULL) but kept for symmetry.
  const reviewsNull = await countNull(
    sql`SELECT count(*)::int AS n FROM reviews WHERE clerk_user_id IS NOT NULL AND user_id IS NULL`
  );
  const ordersNull = await countNull(
    sql`SELECT count(*)::int AS n FROM orders WHERE clerk_user_id IS NOT NULL AND user_id IS NULL`
  );
  const unmappedReviews = (await sql`
    SELECT id, clerk_user_id FROM reviews
    WHERE clerk_user_id IS NOT NULL AND user_id IS NULL ORDER BY id LIMIT 20
  `) as { id: number; clerk_user_id: string }[];
  const unmappedOrders = (await sql`
    SELECT id, email, clerk_user_id FROM orders
    WHERE clerk_user_id IS NOT NULL AND user_id IS NULL ORDER BY id LIMIT 20
  `) as { id: number; email: string | null; clerk_user_id: string | null }[];

  console.log("\n──────── Summary ────────");
  console.log(`mode:                 ${DRY ? "DRY RUN (no writes)" : "APPLIED"}`);
  console.log(`clerk users pulled:   ${clerkUsers.length}`);
  console.log(`users created:        ${usersCreated}`);
  console.log(`users reused:         ${usersReused}`);
  console.log(`users skipped(noemail):${skippedNoEmail}`);
  console.log(`google accounts made: ${accountsCreated}`);
  console.log(`reviews backfilled:   ${reviewsBackfilled}`);
  console.log(`orders backfilled:    ${ordersBackfilled}`);
  console.log("\n──────── DROP-COLUMN gate (clerk-linked but unmigrated) ────────");
  console.log(`reviews clerk-linked & NULL user_id: ${reviewsNull}`);
  console.log(`orders  clerk-linked & NULL user_id: ${ordersNull}`);
  console.log("(guest orders with no clerk_user_id are excluded — they stay NULL by design)");
  if (reviewsNull === 0 && ordersNull === 0) {
    console.log("✓ Every clerk-linked row mapped — safe to DROP clerk_user_id later.");
  } else {
    console.log("✗ Clerk-linked rows remain unmigrated — do NOT drop clerk_user_id yet.");
    if (unmappedReviews.length) {
      console.log("  unmapped reviews (id → clerk_user_id):");
      for (const r of unmappedReviews)
        console.log(`    #${r.id} → ${r.clerk_user_id}`);
    }
    if (unmappedOrders.length) {
      console.log("  unmapped orders (id → email / clerk_user_id):");
      for (const o of unmappedOrders)
        console.log(`    #${o.id} → ${o.email ?? "—"} / ${o.clerk_user_id ?? "—"}`);
    }
  }
  if (errors.length) {
    console.log(`\n⚠ ${errors.length} per-user error(s) (migrated the rest):`);
    for (const e of errors.slice(0, 20)) console.log(`    ${e}`);
  }
  console.log("");
}

// Fail loudly if a backfill target column is missing (dependency not yet run).
async function assertColumn(sql: Db, table: string, column: string) {
  const rows = (await sql`
    SELECT 1 FROM information_schema.columns
    WHERE table_name = ${table} AND column_name = ${column} LIMIT 1
  `) as unknown[];
  if (!rows.length) {
    console.error(
      `\n✗ ${table}.${column} does not exist. Run /api/migrate first ` +
        `(deputy's core PR adds the user_id columns). Aborting.\n`
    );
    process.exit(1);
  }
}

async function countNull(query: Promise<unknown>): Promise<number> {
  const rows = (await query) as { n: number }[];
  return rows[0]?.n ?? 0;
}

// Page through the Clerk Backend API and reduce each user to a ClerkRow.
async function pullClerkUsers(
  clerk: ReturnType<typeof createClerkClient>
): Promise<ClerkRow[]> {
  const out: ClerkRow[] = [];
  const limit = 100;
  let offset = 0;
  for (;;) {
    const page = await clerk.users.getUserList({ limit, offset });
    for (const u of page.data) {
      const primary =
        u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId) ??
        u.emailAddresses[0];
      const email = primary?.emailAddress ?? null;
      const emailVerified = primary?.verification?.status === "verified";
      const google = u.externalAccounts.find((a) =>
        a.provider.toLowerCase().includes("google")
      );
      const name =
        u.fullName?.trim() ||
        [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
        u.username ||
        (email ? email.split("@")[0] : "") ||
        "Customer";
      out.push({
        clerkId: u.id,
        email,
        name,
        emailVerified,
        googleSub: google?.providerUserId ?? null,
      });
    }
    offset += page.data.length;
    if (page.data.length < limit || offset >= page.totalCount) break;
  }
  return out;
}

main().catch((e) => {
  console.error("\n✗ Migration failed:", e);
  process.exit(1);
});
