import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";

// Whether the current session belongs to an admin. Used by the header to
// conditionally show the Admin link. Server-resolved (DB-backed) so it can't be
// spoofed client-side; the admin pages/APIs re-check independently anyway.
export async function GET() {
  const session = await getSession();
  const isAdmin = await isAdminEmail(session?.user.email ?? null);
  return NextResponse.json({ isAdmin });
}
