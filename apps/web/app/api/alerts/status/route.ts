import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getSessionWallet } from "../../../../lib/session";
import { DEFAULT_CHAIN_ID } from "../../../../lib/constants";
import { isValidWalletAddress } from "../../../../lib/solanaAddress";

/**
 * GET /api/alerts/status?mint=…&chainId=… — the manage page's card state for
 * the signed-in creator. Never returns the email address of anyone else's
 * subscription: rows are filtered by the session wallet.
 */
export async function GET(req: Request) {
  const walletAddress = await getSessionWallet();
  if (!walletAddress) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(req.url);
  const mintAddress = url.searchParams.get("mint") ?? "";
  const chainId = url.searchParams.get("chainId") ?? DEFAULT_CHAIN_ID;
  if (!isValidWalletAddress(mintAddress)) {
    return NextResponse.json({ error: "Invalid mint" }, { status: 400 });
  }

  const subscriptions = await prisma.alertSubscription.findMany({
    where: { chainId, mintAddress, walletAddress },
    select: { email: true, verifiedAt: true, lastMilestone: true },
  });

  return NextResponse.json({
    subscriptions: subscriptions.map((s) => ({
      // Masked — enough for "which inbox was that again?", useless to a
      // session hijacker harvesting addresses.
      email: maskEmail(s.email),
      verified: s.verifiedAt !== null,
      lastMilestone: s.lastMilestone,
    })),
  });
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const head = local.slice(0, 2);
  return `${head}${"*".repeat(Math.max(1, local.length - 2))}@${domain}`;
}
