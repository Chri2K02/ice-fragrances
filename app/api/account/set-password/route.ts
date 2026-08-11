import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// Adds a password to a signed-in account that has none yet (Google-only
// users). setPassword requires a valid session and refuses if a credential
// password already exists, so it can't be used to overwrite one — that path
// is changePassword (needs the current password). No OTP round-trip: the
// session already proves identity.
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { password } = (await req.json()) as { password?: string };
  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }
  try {
    await auth.api.setPassword({
      body: { newPassword: password },
      headers: await headers(),
    });
    return NextResponse.json({ ok: true });
  } catch {
    // Generic: most likely a password already exists (use change-password).
    return NextResponse.json(
      { error: "Couldn't set a password on this account." },
      { status: 400 }
    );
  }
}
