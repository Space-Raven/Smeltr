import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";

/**
 * POST /api/beta/verify
 *
 * Accepts { code } and checks it against BETA_ALLOWLIST (comma-separated
 * invite codes). On success sets an httpOnly smeltr_beta_approved=1 cookie.
 *
 * Hardening (Audit-1 TOB-09):
 *   - Invite codes ONLY. The previous version also accepted a bare
 *     `walletAddress` as proof of identity — but a wallet address is public,
 *     so anyone who knew an allowlisted address could gain access without
 *     proving ownership. Wallet-based access would require SIWS, which is
 *     impossible here (sign-in lives behind this same beta gate), so the
 *     correct fix is high-entropy invite codes. Operators must now issue
 *     codes in BETA_ALLOWLIST, not wallet addresses.
 *   - Constant-time membership check (SHA-256 + timingSafeEqual, no early
 *     return) so response timing can't be used to guess a code.
 *   - Best-effort per-IP rate limiting to slow code-guessing.
 *
 * This gates only site access during beta — never token authority or funds.
 */

function getAllowlist(): string[] {
  const raw = process.env.BETA_ALLOWLIST ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function sha256(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

/**
 * Constant-time allowlist membership. Hashing to a fixed 32-byte digest makes
 * the comparison length-independent, and we check every entry (no early exit)
 * so timing leaks neither the matching code nor its position.
 */
function allowlistHas(allowlist: string[], candidate: string): boolean {
  const target = sha256(candidate);
  let matched = false;
  for (const entry of allowlist) {
    if (timingSafeEqual(sha256(entry), target)) matched = true;
  }
  return matched;
}

// Best-effort in-memory limiter. Per serverless instance (not global), which
// is acceptable for a site-access gate; combined with high-entropy codes it
// meaningfully slows guessing. A distributed limiter would need shared state.
const RATE_MAX = 5;
const RATE_WINDOW_MS = 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now > rec.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  rec.count += 1;
  return rec.count > RATE_MAX;
}

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(req: Request) {
  if (isRateLimited(clientIp(req))) {
    return NextResponse.json(
      { approved: false, error: "Too many attempts. Please wait a minute." },
      { status: 429 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as { code?: string };
  const candidate = (body.code ?? "").trim();

  if (!candidate) {
    return NextResponse.json({ approved: false, error: "No code provided" }, { status: 400 });
  }

  if (!allowlistHas(getAllowlist(), candidate)) {
    return NextResponse.json({ approved: false }, { status: 403 });
  }

  const res = NextResponse.json({ approved: true });
  res.cookies.set("smeltr_beta_approved", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
  return res;
}
