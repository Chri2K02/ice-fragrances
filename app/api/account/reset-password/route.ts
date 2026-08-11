import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Logged-out password reset via email OTP, in two actions — both scrubbed so
// neither reveals whether an email has an account (anti-enumeration, per
// zcanon auth.md). "request" always returns ok; "reset" returns a single
// generic error for any failure (unknown email, bad/expired code alike).
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    action?: "request" | "reset";
    email?: string;
    otp?: string;
    password?: string;
  };
  const email = (body.email ?? "").trim().toLowerCase();

  if (body.action === "request") {
    if (email) {
      // Fire-and-forget; swallow everything so timing/errors don't leak.
      try {
        await auth.api.forgetPasswordEmailOTP({ body: { email } });
      } catch {
        /* ignore — never reveal account existence */
      }
    }
    return NextResponse.json({ ok: true });
  }

  if (body.action === "reset") {
    const otp = (body.otp ?? "").trim();
    const password = body.password ?? "";
    if (!email || !otp || password.length < 8) {
      return NextResponse.json(
        { error: "Enter the code and a password of at least 8 characters." },
        { status: 400 }
      );
    }
    try {
      await auth.api.resetPasswordEmailOTP({ body: { email, otp, password } });
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json(
        { error: "That code didn't work. Request a new one and try again." },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
