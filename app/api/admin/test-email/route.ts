import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { hasAdminPerm, isBootstrapAdmin } from "@/lib/admin";
import { sendEmail } from "@/lib/email";

// Sends a sample notification email to an admin row so delivery can be
// verified from the Notifications page. Team-permission gated, and only
// addresses that exist as admin rows (or the bootstrap owner) are accepted —
// this must not be usable to email arbitrary addresses.
export async function POST(req: Request) {
  const session = await getSession();
  if (!(await hasAdminPerm(session?.user.email ?? null, "team"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email } = (await req.json()) as { email?: string };
  const e = (email ?? "").trim().toLowerCase();
  if (!e) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }
  const rows = await getDb()
    .select({ email: admins.email })
    .from(admins)
    .where(eq(admins.email, e))
    .limit(1);
  if (rows.length === 0 && !isBootstrapAdmin(e)) {
    return NextResponse.json({ error: "Not an admin row" }, { status: 400 });
  }

  // sendEmail silently no-ops without RESEND_API_KEY — surface that instead
  // of reporting a send that never happened.
  const configured = !!process.env.RESEND_API_KEY;
  if (configured) {
    await sendEmail({
      to: e,
      subject: "Test notification — Ice Fragrances admin",
      html: `
  <div style="background:#0a0a0a;padding:32px 0;font-family:Helvetica,Arial,sans-serif">
    <div style="max-width:480px;margin:0 auto;background:#111;border:1px solid #1f1f1f;border-radius:16px;overflow:hidden">
      <div style="padding:28px 32px;border-bottom:1px solid #1f1f1f">
        <h1 style="margin:0;color:#fff;font-size:20px;letter-spacing:0.18em;text-transform:uppercase">Ice&nbsp;Fragrances</h1>
      </div>
      <div style="padding:28px 32px;color:#e8e8e8;font-size:15px;line-height:1.6">
        <p style="margin:0 0 16px">This is a test notification from the Ice Fragrances admin dashboard.</p>
        <p style="margin:0 0 16px">If you're reading this, notification delivery to <strong style="color:#34b6f5">${e}</strong> is working.</p>
        <p style="margin:0;color:#9a9a9a">Stay cool,<br/>The Ice Fragrances team</p>
      </div>
      <div style="padding:18px 32px;border-top:1px solid #1f1f1f;color:#5f5f5f;font-size:12px">
        icefragrances.com
      </div>
    </div>
  </div>`,
    });
  }
  return NextResponse.json({ ok: true, configured });
}
