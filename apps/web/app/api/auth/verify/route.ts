import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { z } from "zod";
import type { SolanaSignInInput } from "@solana/wallet-standard-features";
import { verifySignIn } from "@solana/wallet-standard-util";
import { prisma } from "../../../../lib/prisma";
import { fromWireOutput, SiwsOutputWire } from "../../../../lib/siws";

const SESSION_TTL_SECONDS = 60 * 60 * 24; // 24 hours

// Audit-2 Medium-2: bounded body validation on a public auth endpoint — a
// malformed or oversized body must be a controlled 400, never an unhandled
// 500. Byte arrays are the wire form of Uint8Array (lib/siws.ts).
const byteArray = (max: number) =>
  z.array(z.number().int().min(0).max(255)).min(1).max(max);

const VerifyBodySchema = z.object({
  // Only the nonce is read from the client's input — the signature is checked
  // against the server's stored canonical copy (TOB-07).
  input: z.object({ nonce: z.string().min(1).max(256) }).passthrough(),
  output: z.object({
    account: z
      .object({
        address: z.string().min(32).max(44),
        publicKey: byteArray(64),
      })
      .passthrough(),
    signature: byteArray(256),
    signedMessage: byteArray(16384),
  }),
});

export async function POST(req: Request) {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = VerifyBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid sign-in payload" }, { status: 400 });
  }
  const input = parsed.data.input as SolanaSignInInput & { nonce: string };
  const output = parsed.data.output as SiwsOutputWire;

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
