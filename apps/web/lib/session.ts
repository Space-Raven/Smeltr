import { jwtVerify } from "jose";
import { cookies } from "next/headers";

/**
 * Reads and verifies the session cookie set by /api/auth/verify (SIWS).
 * Returns the authenticated wallet's base58 address, or null if absent,
 * invalid, or expired.
 *
 * Used by gated endpoints (e.g. /api/deployments) to determine the
 * requesting wallet — NEVER trust a wallet address passed directly in a
 * request body.
 */
export async function getSessionWallet(): Promise<string | null> {
  const token = cookies().get("session")?.value;
  if (!token) return null;

  const sessionSecret = process.env.SESSION_JWT_SECRET;
  if (!sessionSecret) {
    throw new Error("Server misconfigured: SESSION_JWT_SECRET not set");
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(sessionSecret));
    return typeof payload.walletAddress === "string" ? payload.walletAddress : null;
  } catch {
    return null;
  }
}
