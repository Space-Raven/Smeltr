import { NextResponse } from "next/server";
import { z } from "zod";
import { Connection } from "@solana/web3.js";
import { prisma } from "../../../lib/prisma";
import { getSessionWallet } from "../../../lib/session";
import { checkMintCreation } from "../../../lib/verifyDeployment";

// Full base58 alphabet; Solana pubkeys are 32–44 chars, signatures 64–88.
const BASE58_PUBKEY = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const BASE58_SIGNATURE = /^[1-9A-HJ-NP-Za-km-z]{64,88}$/;

const CreateDeploymentSchema = z.object({
  mintAddress: z.string().regex(BASE58_PUBKEY, "Invalid mint address"),
  decimals: z.number().int().min(0).max(255),
  signature: z.string().regex(BASE58_SIGNATURE, "Invalid signature"),
  metadata: z
    .object({
      name: z.string().min(1).max(32),
      symbol: z.string().min(1).max(10),
      uri: z.string().url(),
    })
    .optional(),
});

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

export async function GET() {
  const walletAddress = await getSessionWallet();
  if (!walletAddress) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const deployments = await prisma.deployment.findMany({
    where: { walletAddress },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ deployments });
}

export async function POST(req: Request) {
  const walletAddress = await getSessionWallet();
  if (!walletAddress) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validation = CreateDeploymentSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: validation.error.flatten() },
      { status: 400 }
    );
  }

  const validated = validation.data;

  // --- On-chain attribution (Audit-1 TOB-03) -------------------------------
  // Prove the session wallet actually deployed this mint before recording it,
  // so a signed-in user cannot claim a mint they did not create.
  //
  // The client fires this POST the instant confirmTransaction resolves at
  // "confirmed". The server's RPC node may not have the transaction indexed
  // yet (propagation lag / load-balanced endpoints), so a single
  // getParsedTransaction often returns null and the deployment never gets
  // recorded — the "minted but not in my dashboard" bug. Poll briefly before
  // giving up.
  const connection = new Connection(RPC_URL, "confirmed");
  let tx = null;
  let reachedNetwork = false;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      tx = await connection.getParsedTransaction(validated.signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      reachedNetwork = true;
    } catch {
      // transient RPC error — retry
    }
    if (tx) break;
    if (attempt < 4) await new Promise((r) => setTimeout(r, 1500));
  }

  // Only report a network failure if we never reached the RPC at all. If we
  // reached it but the tx isn't visible yet, fall through to checkMintCreation,
  // which returns a 409 the client treats as "try again / not yet confirmed".
  if (!tx && !reachedNetwork) {
    return NextResponse.json(
      { error: "Could not reach the network to verify the deployment. Try again shortly." },
      { status: 503 }
    );
  }

  const verdict = checkMintCreation(tx, validated.mintAddress, walletAddress);
  if (verdict.ok === false) {
    return NextResponse.json({ error: verdict.reason }, { status: verdict.status });
  }

  // --- Persist (no first-writer-wins squatting) ----------------------------
  // Verification proves this wallet is the creator. If a record already exists
  // under a DIFFERENT wallet, refuse rather than silently no-op.
  const existing = await prisma.deployment.findUnique({
    where: { mintAddress: validated.mintAddress },
  });
  if (existing && existing.walletAddress !== walletAddress) {
    return NextResponse.json(
      { error: "This mint is already registered to another wallet." },
      { status: 409 }
    );
  }
  if (existing) {
    // Idempotent re-POST by the same owner.
    return NextResponse.json({ deployment: existing });
  }

  const deployment = await prisma.deployment.create({
    data: {
      mintAddress: validated.mintAddress,
      walletAddress,
      decimals: validated.decimals,
      signature: validated.signature,
      hasMetadata: !!validated.metadata,
      metadataAttached: !validated.metadata,
      name: validated.metadata?.name,
      symbol: validated.metadata?.symbol,
      uri: validated.metadata?.uri,
    },
  });

  // NOTE(post-beta): Smeltr+ benefit-usage recording (fee waiver / premium
  // module tracking) ships with the SubscriptionBenefitUsage migration on the
  // full feat/post-beta-rollout branch — intentionally excluded from this
  // beta hotfix.

  return NextResponse.json({ deployment });
}
