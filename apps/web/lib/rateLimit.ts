/**
 * Helpers for the nonce-endpoint abuse controls (Audit-1 TOB-06).
 *
 * The rate-limit counting itself is done against the DB in the route (so it
 * holds across serverless instances); these are the pure, testable pieces:
 * client-IP extraction and the configurable window/limit.
 */

export interface NonceRateLimit {
  /** Max nonce requests allowed per IP within the window. */
  maxPerWindow: number;
  /** Sliding window length, in milliseconds. */
  windowMs: number;
}

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/** Defaults: 10 nonce requests per IP per 60s. Env-overridable without redeploy. */
export function getNonceRateLimit(): NonceRateLimit {
  return {
    maxPerWindow: intFromEnv("NONCE_RATE_LIMIT_MAX", 10),
    windowMs: intFromEnv("NONCE_RATE_LIMIT_WINDOW_MS", 60 * 1000),
  };
}

/**
 * Resolves the client IP from proxy headers. Vercel/most proxies set
 * `x-forwarded-for` (a comma-separated list; the first entry is the original
 * client). Falls back to `x-real-ip`. Returns "unknown" when nothing is
 * present, so header-stripping attackers share a single rate-limit bucket
 * rather than escaping the limit entirely.
 */
export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  return "unknown";
}
