import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { getSessionWallet } from "../../../../lib/session";

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

  const existing = await prisma.deployment.findUnique({
    where: { mintAddress: params.mintAddress },
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
    where: { mintAddress: params.mintAddress },
    data: { metadataAttached: true, metadataSignature: validation.data.metadataSignature },
  });

  return NextResponse.json({ deployment: updated });
}
