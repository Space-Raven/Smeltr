import { NextResponse } from "next/server";
import { z } from "zod";
import { Connection } from "@solana/web3.js";
import { prisma } from "../../../../lib/prisma";
import { getSessionWallet } from "../../../../lib/session";
import { DEFAULT_CHAIN_ID } from "../../../../lib/constants";
import { checkMetadataAttachment } from "../../../../lib/verifyDeployment";
import { fetchParsedTransactionWithRetry } from "../../../../lib/fetchParsedTransaction";

// Same strict shape as deployment creation: base58, 64–88 chars (Audit-2 High-2).
const BASE58_SIGNATURE = /^[1-9A-HJ-NP-Za-km-z]{64,88}$/;

const PatchDeploymentSchema = z.object({
  metadataSignature: z.string().regex(BASE58_SIGNATURE, "Invalid signature"),
});

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

export async function PATCH(
  req: Request,
  { params }: { params: { mintAddress: string } }
) {
  const walletAddress = await getSessionWallet();
  if (!walletAddress) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(req.url);
  const chainId = url.searchParams.get("chainId") ?? DEFAULT_CHAIN_ID;
  const recordKey = { chainId, mintAddress: params.mintAddress };

  const existing = await prisma.deployment.findUnique({
    where: { chainId_mintAddress: recordKey },
  });
  if (!existing || existing.walletAddress !== walletAddress) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validation = PatchDeploymentSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: validation.error.flatten() },
      { status: 400 }
    );
  }

  // Audit-2 High-2: never trust the signature string — fetch the transaction
  // and verify it actually attaches metadata to THIS mint, fee-paid by the
  // session wallet, before flipping the index flag.
  const connection = new Connection(RPC_URL, "confirmed");
  const { tx, reachedNetwork } = await fetchParsedTransactionWithRetry(
    connection,
    validation.data.metadataSignature
  );
  if (!tx && !reachedNetwork) {
    return NextResponse.json(
      { error: "Could not reach the network to verify the metadata transaction. Try again shortly." },
      { status: 503 }
    );
  }

  const verdict = checkMetadataAttachment(
    tx,
    params.mintAddress,
    walletAddress,
    existing.tokenStandard === "spl-legacy" ? "spl-legacy" : "token-2022"
  );
  if (verdict.ok === false) {
    return NextResponse.json({ error: verdict.reason }, { status: verdict.status });
  }

  const updated = await prisma.deployment.update({
    where: { chainId_mintAddress: recordKey },
    data: { metadataAttached: true, metadataSignature: validation.data.metadataSignature },
  });

  return NextResponse.json({ deployment: updated });
}
