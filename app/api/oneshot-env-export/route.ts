import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import crypto from "node:crypto";

// ⚠️ TEMPORARY ONE-SHOT ENV EXPORT — DELETE THIS ROUTE IMMEDIATELY AFTER USE. ⚠️
//
// Why this exists: the project's secrets were set as *Sensitive / write-only*
// in Vercel, so they can never be read back via the dashboard or `vercel env
// pull`. The only way to recover them for a one-time hand-off (to the Vercel
// owner) is to read process.env from inside a running production deployment.
//
// Safeguards:
//   1. Must be signed in as the owner (Clerk) — so the hardcoded password being
//      visible in the git diff does NOT let a teammate hit this; they'd also
//      need the owner's authenticated session.
//   2. Hardcoded one-time password (constant-time compared).
//   3. Burns after a single successful use (best-effort; see note below).
//   4. no-store / noindex / attachment; values are never logged.
//
// Route: GET /api/oneshot-env-export?key=...  — must NOT live under a `_folder`;
// underscore-prefixed path segments are private and excluded from routing.
//
// NOTE on "burn": Vercel functions are stateless, so the in-memory flag only
// holds within a warm instance — a cold start could reset it. The real
// guarantee is deleting this route right after the single download.

const ALLOWED_EMAIL = "mbzuiter@gmail.com";
// One-time password — rotated by deleting this file. Not a long-lived secret.
const PASSWORD = "o0qetpdoKAEIcwC9VhPwIItG";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Module-scoped best-effort single-use latch.
let burned = false;

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function toEnvFile(env: NodeJS.ProcessEnv): string {
  const keys = Object.keys(env).sort();
  const lines = keys.map((k) => {
    const esc = String(env[k] ?? "")
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\r/g, "\\r")
      .replace(/\n/g, "\\n");
    return `${k}="${esc}"`;
  });
  return (
    `# Full process.env export — ${keys.length} keys.\n` +
    `# Lines prefixed AWS_/VERCEL_/ are ephemeral runtime values you can ignore.\n` +
    `# DELETE the export route after saving this file.\n\n` +
    lines.join("\n") +
    "\n"
  );
}

export async function GET(req: Request) {
  // Gate 1: signed-in owner only. Anything else looks like a 404.
  const { userId } = await auth();
  if (!userId) return new NextResponse("Not found", { status: 404 });
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  if (email !== ALLOWED_EMAIL) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Already used: refuse.
  if (burned) {
    return new NextResponse("Gone — already exported once.", { status: 410 });
  }

  // Gate 2: one-time password via ?key= or x-export-key header.
  const provided =
    new URL(req.url).searchParams.get("key") ??
    req.headers.get("x-export-key") ??
    "";
  if (!provided || !safeEqual(provided, PASSWORD)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Success — burn and return the dump as a download.
  burned = true;
  const body = toEnvFile(process.env);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'attachment; filename=".env"',
      "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer",
    },
  });
}
