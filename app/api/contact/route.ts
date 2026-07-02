import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { recipientsFor } from "@/lib/admin";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Public support/contact form. Routes to the notification surface's "support"
// recipients (admins with that toggle on). Best-effort send (sendEmail no-ops
// without RESEND_API_KEY and never throws).
export async function POST(req: Request) {
  const { name, email, message } = (await req.json()) as {
    name?: string;
    email?: string;
    message?: string;
  };
  const n = (name ?? "").toString().trim().slice(0, 200);
  const e = (email ?? "").toString().trim().slice(0, 200);
  const m = (message ?? "").toString().trim().slice(0, 5000);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
    return NextResponse.json(
      { error: "Enter a valid email so we can reply." },
      { status: 400 }
    );
  }
  if (!m) {
    return NextResponse.json({ error: "Please include a message." }, { status: 400 });
  }

  const to = await recipientsFor("support");
  if (to.length) {
    await sendEmail({
      to: to.join(", "),
      replyTo: e,
      subject: `Support request${n ? ` from ${n}` : ""}`,
      html: `
        <h2 style="margin:0 0 8px">New support request</h2>
        <p><strong>From:</strong> ${esc(n) || "(no name)"} &lt;${esc(e)}&gt;</p>
        <p style="white-space:pre-wrap">${esc(m)}</p>
      `,
    });
  }
  return NextResponse.json({ ok: true });
}
