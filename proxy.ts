import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { ADMIN_ORIGIN, canonicalOriginFor, isAdminHost } from "@/lib/site";

// Two jobs, both CHEAP (no DB):
//
// 1. Host topology. admin.icefragrances.com serves the admin dashboard at the
//    subdomain ROOT: / → /admin, /catalog → /admin/catalog (invisible
//    rewrite). Auth pages never render there — sign-in is forced through the
//    canonical host with a callbackURL back to the admin host, and the session
//    carries over via cross-subdomain cookies (lib/auth.ts). On the canonical
//    PROD host, /admin/* bounces to the subdomain so the dashboard has one
//    home; dev localhost keeps serving /admin directly.
//
// 2. Cookie-presence gating (Better Auth). Bounce visibly-signed-out users
//    away from protected routes before the page runs. The REAL validation —
//    session freshness + per-surface admin permissions — happens in the pages
//    themselves via getSession() (see app/account, app/admin). A
//    present-but-stale cookie passes here and is caught there.
const PROTECTED_PREFIXES = ["/account", "/admin"];

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host") ?? "";

  if (isAdminHost(host)) {
    const proto = request.nextUrl.protocol;
    const canonical = canonicalOriginFor(host, proto);
    const self = `${proto}//${host}`;

    // Server code redirects in /admin-prefixed terms (e.g. redirect("/admin")
    // after a permission bounce). Normalize those to the subdomain root form.
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      const stripped = pathname.slice("/admin".length) || "/";
      return NextResponse.redirect(new URL(`${stripped}${search}`, self));
    }

    // Auth lives on the canonical host only; come back here after.
    if (pathname === "/sign-in" || pathname === "/sign-up") {
      const back = encodeURIComponent(`${self}/`);
      return NextResponse.redirect(
        new URL(`${canonical}${pathname}?callbackURL=${back}`)
      );
    }

    // Signed-out (no cookie): force login through the canonical host, then
    // return to the page that was asked for.
    if (!getSessionCookie(request)) {
      const back = encodeURIComponent(`${self}${pathname}${search}`);
      return NextResponse.redirect(
        new URL(`${canonical}/sign-in?callbackURL=${back}`)
      );
    }

    // Serve the admin tree from the subdomain root.
    const target = pathname === "/" ? "/admin" : `/admin${pathname}`;
    return NextResponse.rewrite(new URL(`${target}${search}`, request.url));
  }

  // Canonical prod host: the dashboard moved to the subdomain.
  if (
    host.split(":")[0].endsWith("icefragrances.com") &&
    (pathname === "/admin" || pathname.startsWith("/admin/"))
  ) {
    const stripped = pathname.slice("/admin".length) || "/";
    return NextResponse.redirect(new URL(`${stripped}${search}`, ADMIN_ORIGIN));
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isProtected && !getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Everything except API routes, Next internals, and static files (dot in the
  // last segment). API stays un-proxied so the admin host reaches the same
  // /api/* tree directly; the handlers do their own permission checks.
  matcher: ["/((?!api/|_next/|.*\\.[^/]+$).*)"],
};
