import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { hasAdminPerm, isBootstrapAdmin, normalizePerms } from "@/lib/admin";
import { NOTIFICATION_KEYS } from "@/lib/notifications";
import { PERMISSION_KEYS } from "@/lib/permissions";

// The admin management surface. Rows are emails and persist for good; `perms`
// holds per-surface access toggles (missing key = no access; no perms = not an
// admin at all), `notify` the per-notification-type toggles (missing key =
// default on). Every handler requires the `team` permission. "Removing" an
// admin only clears their perms — the row stays. The bootstrap owner
// (ADMIN_EMAIL) always has full access and can't be revoked.
async function requireTeamAdmin(): Promise<boolean> {
  const session = await getSession();
  return hasAdminPerm(session?.user.email ?? null, "team");
}

const forbidden = () =>
  NextResponse.json({ error: "Forbidden" }, { status: 403 });

export async function GET() {
  if (!(await requireTeamAdmin())) return forbidden();
  const rows = await getDb().select().from(admins).orderBy(admins.id);
  return NextResponse.json({
    admins: rows.map((a) => ({
      email: a.email,
      notify: a.notify ?? {},
      perms: normalizePerms(a.perms),
      bootstrap: isBootstrapAdmin(a.email),
    })),
  });
}

export async function POST(req: Request) {
  if (!(await requireTeamAdmin())) return forbidden();
  const { email } = (await req.json()) as { email?: string };
  const e = (email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }
  // New rows start with NO permissions: the person isn't an admin until a
  // surface is enabled on their row.
  await getDb().insert(admins).values({ email: e }).onConflictDoNothing();
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  if (!(await requireTeamAdmin())) return forbidden();
  const { email, notify, perms } = (await req.json()) as {
    email?: string;
    notify?: Record<string, boolean>;
    perms?: Record<string, boolean>;
  };
  const e = (email ?? "").trim().toLowerCase();
  const hasNotify = notify && typeof notify === "object";
  const hasPerms = perms && typeof perms === "object";
  if (!e || (!hasNotify && !hasPerms)) {
    return NextResponse.json(
      { error: "email and notify or perms required" },
      { status: 400 }
    );
  }
  if (hasPerms && isBootstrapAdmin(e)) {
    return NextResponse.json(
      { error: "The owner account always has full access." },
      { status: 400 }
    );
  }
  // Store only known keys.
  const set: Partial<{
    notify: Record<string, boolean>;
    perms: Record<string, boolean>;
  }> = {};
  if (hasNotify) {
    const clean: Record<string, boolean> = {};
    for (const k of NOTIFICATION_KEYS) if (k in notify) clean[k] = !!notify[k];
    set.notify = clean;
  }
  if (hasPerms) {
    const clean: Record<string, boolean> = {};
    for (const k of PERMISSION_KEYS) if (k in perms) clean[k] = !!perms[k];
    set.perms = clean;
  }
  await getDb().update(admins).set(set).where(eq(admins.email, e));
  return NextResponse.json({ ok: true, ...set });
}

export async function DELETE(req: Request) {
  if (!(await requireTeamAdmin())) return forbidden();
  const email = (new URL(req.url).searchParams.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }
  if (isBootstrapAdmin(email)) {
    return NextResponse.json(
      { error: "The owner account can't be revoked." },
      { status: 400 }
    );
  }
  // Revoke, don't delete: the row (and its notification prefs) persists; with
  // no permissions the person is simply not an admin anymore.
  await getDb().update(admins).set({ perms: {} }).where(eq(admins.email, email));
  return NextResponse.json({ ok: true });
}
