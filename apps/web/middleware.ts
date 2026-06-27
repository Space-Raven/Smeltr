import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Site-wide mode gate.
 *
 * NEXT_PUBLIC_MODE controls routing for the entire app:
 *
 *   coming-soon  — all traffic → /coming-soon (except /api/health)
 *   beta         — unapproved wallets/codes → /beta (approved users pass through)
 *   live         — no gating, normal routing
 *
 * The beta allowlist lives in BETA_ALLOWLIST (comma-separated wallet addresses
 * and/or invite codes). Checked via a session cookie set by /api/beta/verify.
 *
 * Paths that are always public regardless of mode:
 *   /coming-soon, /beta, /api/health, /_next/*, /favicon.ico, /robots.txt
 */

const MODE = process.env.NEXT_PUBLIC_MODE ?? "live";

// Paths that bypass all gating
const PUBLIC_PATHS = [
  "/coming-soon",
  "/beta",
  "/api/health",
  "/api/beta/verify",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/")
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // ── coming-soon mode ──────────────────────────────────────────────────────
  if (MODE === "coming-soon") {
    return NextResponse.redirect(new URL("/coming-soon", req.url));
  }

  // ── beta mode ─────────────────────────────────────────────────────────────
  if (MODE === "beta") {
    const approved = req.cookies.get("smeltr_beta_approved")?.value === "1";
    if (!approved) {
      const url = new URL("/beta", req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // ── live mode (or approved beta user) ────────────────────────────────────
  return NextResponse.next();
}

export const config = {
  // Run on every route except static assets Next.js serves internally
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
