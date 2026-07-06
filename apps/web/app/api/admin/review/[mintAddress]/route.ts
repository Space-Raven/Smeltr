import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getSessionWallet } from "../../../../../lib/session";
import { isAdminWallet } from "../../../../../lib/admin";
import { isReviewStatus } from "../../../../../lib/reviewQueue";

/**
 * PATCH /api/admin/review/[mintAddress]
 *
 * Flag a mint: set reviewStatus (approve/reject/feature/hide) + an optional
 * note. Admin-only. Only "approved"/"featured" ever surface in /created.
 *
 * Body: { status: ReviewStatus, note?: string }
 */
export async function PATCH(
  req: Request,
  { params }: { params: { mintAddress: string } }
) {
  const wallet = await getSessionWallet();
  if (!wallet) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!isAdminWallet(wallet)) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  let body: { status?: unknown; note?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isReviewStatus(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const note = typeof body.note === "string" ? body.note.slice(0, 500) : null;

  const existing = await prisma.deployment.findFirst({
    where: { mintAddress: params.mintAddress },
  });
  if (!existing) {
    return NextResponse.json({ error: "Mint not found" }, { status: 404 });
  }

  const deployment = await prisma.deployment.update({
    where: {
      chainId_mintAddress: {
        chainId: existing.chainId,
        mintAddress: existing.mintAddress,
      },
    },
    data: { reviewStatus: body.status, reviewedAt: new Date(), reviewNote: note },
  });
  return NextResponse.json({ deployment });
}
