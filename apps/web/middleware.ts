import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isMutatingMethod, isCsrfExempt, originAllowed } from "./lib/csrf";

/**
 * Site-wide mode gate.
 *
 * SITE_MODE controls routing for the entire app:
 *
 *   coming-soon  — all traffic → /coming-soon (except /api/health)
 *   live         — no gating, normal routing (this is the open-beta mode)
 *
 * SITE_MODE is a server-side env var read at module init. NOTE: on Vercel,
 * changing any env var requires a redeploy to take effect — there is no
 * "flip without redeploy"; treat mode changes as deploys.
 * NEXT_PUBLIC_MODE is kept for client-side reads (e.g. the "public beta"
 * banner), but the middleware gate always reads the server-side SITE_MODE.
 *
 * The invite-code beta allowlist was removed for open beta — anyone can
 * access the app; the "beta" labeling (banner, disclaimer) stays.
 *
 * Paths that are always public regardless of mode:
 *   /coming-soon, /api/health, /_next/*, /favicon.ico, /robots.txt
 */

const MODE = process.env.SITE_MODE ?? process.env.NEXT_PUBLIC_MODE ?? "live";

// Paths that bypass all gating
const PUBLIC_PATHS = [
  "/coming-soon",
  // Legal pages stay reachable in every mode.
  "/terms",
  "/privacy",
  "/refunds",
  // Content pages stay live in every mode — the blog and about pages are the
  // site's reference/SEO surface and must be crawlable pre-launch.
  "/blog",
  "/about",
  "/llms.txt",
  "/api/health",
  // Vercel Cron ops endpoints — auth'd by CRON_SECRET, must bypass the mode gate
  // so a scheduled GET isn't redirected before reaching the handler.
  "/api/ops",
  // TOB-01 ops diagnostics (exposes only public pubkey prefixes/counts).
  "/api/debug/denylist",
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

  // ── CSRF: Origin allowlist on state-changing API routes (TOB-13) ─────────
  // Runs before the mode gate. Webhook is exempt (signature-authed, cross-origin).
  if (
    isMutatingMethod(req.method) &&
    pathname.startsWith("/api/") &&
    !isCsrfExempt(pathname) &&
    !originAllowed(req.headers.get("origin"), req.headers.get("host"))
  ) {
    return NextResponse.json({ error: "Cross-origin request blocked" }, { status: 403 });
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // ── coming-soon mode ──────────────────────────────────────────────────────
  if (MODE === "coming-soon") {
    return NextResponse.redirect(new URL("/coming-soon", req.url));
  }

  // ── live / open-beta: no access gating ───────────────────────────────────
  return NextResponse.next();
}

export const config = {
  // Run on every route except static assets Next.js serves internally
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
