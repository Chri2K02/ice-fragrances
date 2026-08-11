import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Password sign-in behind a scrubbing proxy (zcanon auth.md pattern). Calling
// Better Auth's own endpoint from the browser leaks USER_NOT_FOUND vs
// INVALID_PASSWORD vs unverified-email — enough to enumerate accounts. Here
// every failure collapses to ONE message and status, while `asResponse` lets
// us forward the real Set-Cookie headers on success so the session still
// lands. (Route handler, not a server action: actions can't set cookies.)
const GENERIC = "Those credentials didn't match. Check them and try again.";

// Response-time floor. Without it the handler is still an oracle: a known
// email runs the password hash (~220ms measured) while an unknown one bails
// early (~157ms), so latency alone distinguishes them. Padding every answer
// to the same minimum hides the difference.
const MIN_MS = 450;
const floor = async <T>(started: number, value: T): Promise<T> => {
  const remaining = MIN_MS - (Date.now() - started);
  if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
  return value;
};

export async function POST(req: Request) {
  const started = Date.now();
  const { email, password } = (await req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };
  if (!email || !password) {
    return floor(started, NextResponse.json({ error: GENERIC }, { status: 400 }));
  }

  try {
    const response = await auth.api.signInEmail({
      body: { email: email.trim().toLowerCase(), password },
      asResponse: true,
      headers: req.headers,
    });
    if (!response.ok) {
      return floor(
        started,
        NextResponse.json({ error: GENERIC }, { status: 400 })
      );
    }
    const result = NextResponse.json({ ok: true });
    for (const cookie of response.headers.getSetCookie()) {
      result.headers.append("set-cookie", cookie);
    }
    return floor(started, result);
  } catch {
    return floor(started, NextResponse.json({ error: GENERIC }, { status: 400 }));
  }
}
