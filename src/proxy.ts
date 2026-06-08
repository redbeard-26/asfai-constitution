import { NextResponse, type NextRequest } from "next/server";

/**
 * Canonical-domain redirect (Next.js "proxy", formerly middleware).
 *
 * The app may be reachable through several web addresses, but Auth.js (Google
 * OAuth callbacks, CSRF/session cookies) must live on a single host — otherwise
 * requests arriving on a non-canonical host fail with an "UntrustedHost"
 * configuration error on the sign-in flow.
 *
 * We treat the host of AUTH_URL as canonical and 308-redirect any other host to
 * it, preserving the path and query. This only runs on the production Vercel
 * deployment, so preview deployments (*.vercel.app) and local dev are untouched.
 */
export function proxy(request: NextRequest) {
  const canonical = process.env.AUTH_URL;
  if (process.env.VERCEL_ENV === "production" && canonical) {
    let target: URL;
    try {
      target = new URL(canonical);
    } catch {
      return NextResponse.next();
    }
    const host = request.headers.get("host");
    if (host && host !== target.host) {
      const url = request.nextUrl.clone();
      url.protocol = target.protocol;
      url.host = target.host; // hostname + port
      return NextResponse.redirect(url, 308);
    }
  }
  return NextResponse.next();
}

export const config = {
  // Run on all routes except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.png$).*)"],
};
