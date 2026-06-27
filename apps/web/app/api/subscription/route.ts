import { NextResponse } from "next/server";
import { getSessionWallet } from "../../../lib/session";
import { isPremium, getSubscription } from "../../../lib/subscription";

/**
 * GET /api/subscription
 *
 * Returns the current user's subscription status.
 * 401 if not signed in; 200 { premium, status, currentPeriodEnd } otherwise.
 *
 * "premium" is the boolean the client uses to gate UI paths.
 * "status" and "currentPeriodEnd" are exposed for the dashboard UI.
 */
export async function GET(req: Request) {
  const walletAddress = await getSessionWallet();
  if (!walletAddress) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const [premium, sub] = await Promise.all([
    isPremium(walletAddress),
    getSubscription(walletAddress),
  ]);

  return NextResponse.json({
    premium,
    status: sub?.status ?? "inactive",
    currentPeriodEnd: sub?.currentPeriodEnd?.toISOString() ?? null,
  });
}
