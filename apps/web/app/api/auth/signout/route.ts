import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE = "session";

/**
 * POST /api/auth/signout
 *
 * Clears the SIWS session cookie. Idempotent — always returns 200.
 */
export async function POST() {
  cookies().set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return NextResponse.json({ ok: true });
}
