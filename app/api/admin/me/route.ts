import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { adminPermsFor, hasAnyPerm } from "@/lib/admin";

// The current session's admin standing: per-surface permissions plus the
// derived isAdmin (any permission at all). Used by the header to conditionally
// show the Admin link and by AdminTabs to show only permitted tabs.
// Server-resolved (DB-backed) so it can't be spoofed client-side; the admin
// pages/APIs re-check independently anyway.
export async function GET() {
  const session = await getSession();
  const perms = await adminPermsFor(session?.user.email ?? null);
  return NextResponse.json({ isAdmin: hasAnyPerm(perms), perms });
}
