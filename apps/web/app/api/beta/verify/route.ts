import { NextResponse } from "next/server";

/**
 * POST /api/beta/verify
 *
 * Accepts { code } or { walletAddress } and checks against
 * the BETA_ALLOWLIST env var (comma-separated values).
 *
 * On success: sets httpOnly smeltr_beta_approved=1 cookie and
 * returns { approved: true }.
 *
 * On failure: returns 403 { approved: false }.
 */

function getAllowlist(): Set<string> {
  const raw = process.env.BETA_ALLOWLIST ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as {
    code?: string;
    walletAddress?: string;
  };

  const candidate = (body.code ?? body.walletAddress ?? "").trim().toLowerCase();

  if (!candidate) {
    return NextResponse.json({ approved: false, error: "No code provided" }, { status: 400 });
  }

  const allowlist = getAllowlist();

  if (!allowlist.has(candidate)) {
    return NextResponse.json({ approved: false }, { status: 403 });
  }

  const res = NextResponse.json({ approved: true });
  res.cookies.set("smeltr_beta_approved", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    // 30-day session
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
