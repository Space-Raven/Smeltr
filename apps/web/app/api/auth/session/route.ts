import { NextResponse } from "next/server";
import { getSessionWallet } from "../../../../lib/session";

/**
 * GET /api/auth/session
 *
 * Returns the current SIWS session, if any, so the client can restore
 * authenticated state on page load instead of forcing a re-sign every
 * navigation. Reads the httpOnly session cookie server-side.
 *
 * Always 200 — `authenticated: false` is a normal answer, not an error, so
 * the client can distinguish "checked, signed out" from a network failure.
 */
export async function GET() {
  const walletAddress = await getSessionWallet();
  if (!walletAddress) {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({ authenticated: true, walletAddress });
}
