import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Sign-up behind the same scrubbing proxy. Better Auth returns
// USER_ALREADY_EXISTS, which is a direct account-existence oracle — so this
// ALWAYS answers { ok: true } regardless of outcome. The client then shows
// the "check your email for a code" step either way: a new user gets the
// verification OTP, an existing one gets nothing, and neither the response nor
// the UI distinguishes them. Genuine input problems (weak/short password) are
// validated here so the user still gets actionable feedback.
// Same response-time floor as sign-in: creating a user costs a password hash
// that the already-exists path skips, so latency would otherwise distinguish
// them even though both bodies say { ok: true }.
const MIN_MS = 450;

export async function POST(req: Request) {
  const started = Date.now();
  const { name, email, password } = (await req.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    password?: string;
  };
  const clean = (email ?? "").trim().toLowerCase();
  if (!clean || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  try {
    await auth.api.signUpEmail({
      body: { name: (name ?? "").trim() || clean, email: clean, password },
      headers: req.headers,
    });
  } catch {
    /* Swallow — an existing address must look identical to a new one. */
  }
  const remaining = MIN_MS - (Date.now() - started);
  if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
  return NextResponse.json({ ok: true });
}
