import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import type { SolanaSignInInput } from "@solana/wallet-standard-features";
import { verifySignIn } from "@solana/wallet-standard-util";
import { prisma } from "../../../../lib/prisma";
import { fromWireOutput, SiwsOutputWire } from "../../../../lib/siws";

const SESSION_TTL_SECONDS = 60 * 60 * 24; // 24 hours

interface VerifyRequestBody {
  input: SolanaSignInInput;
  output: SiwsOutputWire;
}

export async function POST(req: Request) {
  const { input, output }: VerifyRequestBody = await req.json();

  // The client's `input` is used ONLY to look up the nonce. Everything the
  // signature is checked against comes from the server's stored copy below.
  if (!input?.nonce) {
    return NextResponse.json({ error: "Missing nonce" }, { status: 400 });
  }

  // --- 1. Nonce must exist, be unused, and not expired ---------------------
  const nonceRecord = await prisma.authNonce.findUnique({ where: { nonce: input.nonce } });
  if (!nonceRecord || nonceRecord.usedAt || nonceRecord.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invalid, expired, or already-used nonce" }, { status: 401 });
  }

  // --- 2. Recover the canonical input THIS server issued -------------------
  // Verifying against the stored input (not the client's echoed copy) makes
  // every field — uri, issuedAt, expirationTime, domain, statement — tamper-
  // evident: the wallet signed exactly this, so any client mutation breaks the
  // signature. Freshness is already bounded by the 5-minute nonce TTL above,
  // which equals input.expirationTime (TOB-07).
  if (!nonceRecord.issuedInput) {
    // Pre-migration nonce with no stored input — force a fresh sign-in.
    return NextResponse.json({ error: "Stale sign-in request, please retry" }, { status: 401 });
  }
  let issuedInput: SolanaSignInInput;
  try {
    issuedInput = JSON.parse(nonceRecord.issuedInput);
  } catch {
    // Corrupt stored input — treat like a stale nonce rather than a 500.
    return NextResponse.json({ error: "Stale sign-in request, please retry" }, { status: 401 });
  }

  // --- 3. Cryptographic verification against the canonical input -----------
  const isValid = verifySignIn(issuedInput, fromWireOutput(output));
  if (!isValid) {
    return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
  }

  // --- 4. Burn the nonce (single use) ----------------------------------------
  await prisma.authNonce.update({
    where: { nonce: input.nonce },
    data: { usedAt: new Date() },
  });

  // --- 5. Issue session --------------------------------------------------------
  const walletAddress = output.account.address;
  const sessionSecret = process.env.SESSION_JWT_SECRET;
  if (!sessionSecret) {
    return NextResponse.json(
      { error: "Server misconfigured: SESSION_JWT_SECRET not set" },
      { status: 500 }
    );
  }

  const token = await new SignJWT({ walletAddress })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(new TextEncoder().encode(sessionSecret));

  const response = NextResponse.json({ walletAddress });
  response.cookies.set("session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  return response;
}
