import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Two-layer auth gating (Better Auth). This proxy does only the CHEAP layer:
// a cookie-presence check that bounces visibly-signed-out users away from
// protected routes before the page runs (no DB hit). The REAL validation —
// session freshness + the admin-email check — happens in the pages themselves
// via getSession() (see app/account, app/admin). A present-but-stale cookie
// passes here and is caught there. Better Auth needs no middleware to read
// sessions, so the matcher is narrowed to protected paths only (was: every
// route, for Clerk's context injection).
const PROTECTED_PREFIXES = ["/account", "/admin"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isProtected && !getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Bare paths listed explicitly alongside the wildcards so the cheap redirect
  // fires on /account and /admin themselves, not just their sub-paths.
  matcher: ["/account", "/account/:path*", "/admin", "/admin/:path*"],
};
