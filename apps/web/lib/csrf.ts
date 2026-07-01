/**
 * CSRF defense-in-depth for cookie-authenticated mutations (Audit-1 TOB-13).
 *
 * Session auth uses an httpOnly `sameSite: "lax"` cookie, which already blocks
 * cross-site POSTs in modern browsers. This adds an explicit Origin-allowlist
 * check on state-changing API routes as a second layer, enforced in middleware.
 *
 * Pure helpers, unit-tested; the middleware wires them to the request.
 */

// Routes that legitimately receive cross-origin POSTs and authenticate by other
// means. The Stripe webhook is signed (STRIPE_WEBHOOK_SECRET) and posted by
// Stripe's servers with no matching Origin — it must be exempt.
export const CSRF_EXEMPT_PATHS = ["/api/stripe/webhook"];

export function isMutatingMethod(method: string): boolean {
  return (
    method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE"
  );
}

export function isCsrfExempt(pathname: string): boolean {
  return CSRF_EXEMPT_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/**
 * Whether a request's Origin is acceptable for a same-site mutation.
 *
 * - No Origin header → allow. Browsers always send Origin on cross-origin
 *   POSTs, so its absence means a non-browser client (curl, server-to-server),
 *   which is not a CSRF vector (CSRF relies on a browser auto-attaching the
 *   session cookie).
 * - Origin present → its host must equal the request host.
 */
export function originAllowed(origin: string | null, host: string | null): boolean {
  if (!origin) return true;
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
