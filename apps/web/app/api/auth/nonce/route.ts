import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import type { SolanaSignInInput } from "@solana/wallet-standard-features";
import { prisma } from "../../../../lib/prisma";

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Generates a single-use nonce and the full SolanaSignInInput the client
 * should pass UNMODIFIED to the wallet's signIn(). The server persists the
 * input it issued (specifically `domain`) so /api/auth/verify can detect
 * any tampering with the echoed input, independent of verifySignIn's own
 * internal consistency check.
 */
export async function POST() {
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN;
  if (!domain) {
    return NextResponse.json(
      { error: "Server misconfigured: NEXT_PUBLIC_APP_DOMAIN not set" },
      { status: 500 }
    );
  }

  const nonce = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + NONCE_TTL_MS);

  await prisma.authNonce.create({ data: { nonce, domain, expiresAt } });

  // Localhost is served over plain HTTP; production uses HTTPS.
  // Phantom validates that the URI scheme matches the actual page, so a
  // mismatch (https://localhost vs http://localhost) triggers an "unsafe" warning.
  const scheme = domain.startsWith("localhost") ? "http" : "https";

  const input: SolanaSignInInput = {
    domain,
    statement:
      "Sign in to verify wallet ownership. This will not trigger a blockchain transaction or cost any fees.",
    uri: `${scheme}://${domain}`,
    version: "1",
    nonce,
    issuedAt: new Date().toISOString(),
    expirationTime: expiresAt.toISOString(),
  };

  return NextResponse.json({ input });
}
