import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { getSessionWallet } from "../../../lib/session";

const CreateDeploymentSchema = z.object({
  mintAddress: z.string().regex(/^[1-9A-HJ-NP-Z]{44}$/, "Invalid mint address"),
  decimals: z.number().int().min(0).max(255),
  signature: z.string().regex(/^[1-9A-HJ-NP-Z]+$/, "Invalid signature"),
  metadata: z
    .object({
      name: z.string().min(1).max(32),
      symbol: z.string().min(1).max(10),
      uri: z.string().url(),
    })
    .optional(),
});

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

  const deployment = await prisma.deployment.upsert({
    where: { mintAddress: validated.mintAddress },
    create: {
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
    update: {},
  });

  return NextResponse.json({ deployment });
}
