import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { getSessionWallet } from "../../../../lib/session";
import { DEFAULT_CHAIN_ID } from "../../../../lib/constants";

const PatchDeploymentSchema = z.object({
  metadataSignature: z.string().regex(/^[1-9A-HJ-NP-Z]+$/, "Invalid signature"),
});

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

  const updated = await prisma.deployment.update({
    where: { chainId_mintAddress: recordKey },
    data: { metadataAttached: true, metadataSignature: validation.data.metadataSignature },
  });

  return NextResponse.json({ deployment: updated });
}
