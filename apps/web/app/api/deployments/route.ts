import { NextResponse } from "next/server";

import { z } from "zod";

import { Connection } from "@solana/web3.js";

import { prisma } from "../../../lib/prisma";

import { getSessionWallet } from "../../../lib/session";

import { checkMintCreation, mintProgramIdForTokenStandard } from "../../../lib/verifyDeployment";

import { fetchParsedTransactionWithRetry } from "../../../lib/fetchParsedTransaction";

import { DEFAULT_CHAIN_ID } from "../../../lib/constants";

import { SUPPORTED_CHAIN_IDS, chainIdForCluster, clusterFromRpcUrl } from "../../../lib/cluster";



const BASE58_PUBKEY = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const BASE58_SIGNATURE = /^[1-9A-HJ-NP-Za-km-z]{64,88}$/;



const CreateDeploymentSchema = z.object({

  // Audit-2 High-3: chain identity is an allowlist, not free text. Solana-only
  // until a real second-chain adapter ships.
  chainId: z.enum(SUPPORTED_CHAIN_IDS).default(DEFAULT_CHAIN_ID as (typeof SUPPORTED_CHAIN_IDS)[number]),

  tokenStandard: z.enum(["token-2022", "spl-legacy"]).default("token-2022"),

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



  // Audit-2 High-3: the claimed chainId must match the network this server

  // actually verifies against. When the RPC cluster is recognizable, a

  // mismatched chainId (e.g. "solana-devnet" records via a mainnet RPC) is

  // rejected instead of persisted.

  const authoritativeChainId = chainIdForCluster(clusterFromRpcUrl(RPC_URL));

  if (authoritativeChainId && validated.chainId !== authoritativeChainId) {

    return NextResponse.json(

      { error: `chainId must be "${authoritativeChainId}" — it is derived from the network deployments are verified on, not caller input.` },

      { status: 400 }

    );

  }



  const connection = new Connection(RPC_URL, "confirmed");

  const { tx, reachedNetwork } = await fetchParsedTransactionWithRetry(connection, validated.signature);



  if (!tx && !reachedNetwork) {

    return NextResponse.json(

      { error: "Could not reach the network to verify the deployment. Try again shortly." },

      { status: 503 }

    );

  }



  const verdict = checkMintCreation(tx, validated.mintAddress, walletAddress, {

    mintProgramId: mintProgramIdForTokenStandard(validated.tokenStandard),

  });

  if (verdict.ok === false) {

    return NextResponse.json({ error: verdict.reason }, { status: verdict.status });

  }



  const recordKey = {

    chainId: validated.chainId,

    mintAddress: validated.mintAddress,

  };



  const existing = await prisma.deployment.findUnique({ where: { chainId_mintAddress: recordKey } });

  if (existing && existing.walletAddress !== walletAddress) {

    return NextResponse.json(

      { error: "This mint is already registered to another wallet." },

      { status: 409 }

    );

  }

  if (existing) {

    return NextResponse.json({ deployment: existing });

  }



  const deployment = await prisma.deployment.create({

    data: {

      chainId: validated.chainId,

      tokenStandard: validated.tokenStandard,

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



  return NextResponse.json({ deployment });

}


