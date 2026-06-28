import { NextResponse } from "next/server";
import { headers } from "next/headers";
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
 *
 * Domain is derived from the request's Host header, NOT from
 * NEXT_PUBLIC_APP_DOMAIN. Phantom (and all SIWS-compliant wallets) reject
 * the sign-in request if input.domain !== window.location.hostname. Using
 * the env var hard-codes a single hostname and breaks whenever the user
 * reaches the site via www., a preview URL, or any redirect variant.
 */
export async function POST() {
  const headersList = headers();
  const host = headersList.get("host") ?? process.env.NEXT_PUBLIC_APP_DOMAIN;
  if (!host) {
    return NextResponse.json(
      { error: "Server misconfigured: cannot determine domain" },
      { status: 500 }
    );
  }
  // Strip port (localhost:3000 → localhost) — Phantom compares against
  // window.location.hostname which never includes a port.
  const domain = host.split(":")[0];

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
