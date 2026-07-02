import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { isAdminEmail, isBootstrapAdmin } from "@/lib/admin";
import { NOTIFICATION_KEYS } from "@/lib/notifications";

// The team + notification surface. Rows are admin emails; `notify` is the
// per-notification-type toggle map (missing key = default on). Every handler is
// admin-gated. The bootstrap owner (ADMIN_EMAIL) can't be removed.
async function requireAdmin(): Promise<boolean> {
  const session = await getSession();
  return isAdminEmail(session?.user.email ?? null);
}

const forbidden = () =>
  NextResponse.json({ error: "Forbidden" }, { status: 403 });

export async function GET() {
  if (!(await requireAdmin())) return forbidden();
  const rows = await getDb().select().from(admins).orderBy(admins.id);
  return NextResponse.json({
    admins: rows.map((a) => ({
      email: a.email,
      notify: a.notify ?? {},
      bootstrap: isBootstrapAdmin(a.email),
    })),
  });
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return forbidden();
  const { email } = (await req.json()) as { email?: string };
  const e = (email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }
  await getDb().insert(admins).values({ email: e }).onConflictDoNothing();
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  if (!(await requireAdmin())) return forbidden();
  const { email, notify } = (await req.json()) as {
    email?: string;
    notify?: Record<string, boolean>;
  };
  const e = (email ?? "").trim().toLowerCase();
  if (!e || !notify || typeof notify !== "object") {
    return NextResponse.json({ error: "email and notify required" }, { status: 400 });
  }
  // Store only known notification-type keys.
  const clean: Record<string, boolean> = {};
  for (const k of NOTIFICATION_KEYS) if (k in notify) clean[k] = !!notify[k];
  await getDb().update(admins).set({ notify: clean }).where(eq(admins.email, e));
  return NextResponse.json({ ok: true, notify: clean });
}

export async function DELETE(req: Request) {
  if (!(await requireAdmin())) return forbidden();
  const email = (new URL(req.url).searchParams.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }
  if (isBootstrapAdmin(email)) {
    return NextResponse.json(
      { error: "The owner account can't be removed." },
      { status: 400 }
    );
  }
  await getDb().delete(admins).where(eq(admins.email, email));
  return NextResponse.json({ ok: true });
}
