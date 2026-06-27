import { prisma } from "./prisma";

/**
 * Returns true if the wallet has an active (or trialing) Stripe subscription.
 *
 * "trialing" is included because Stripe uses it for free-trial periods before
 * the first charge — the user has signed up and should have premium access.
 *
 * "past_due" is NOT included: the payment failed and the subscription may
 * cancel soon. The user should see an upgrade/payment-method prompt instead.
 */
export async function isPremium(walletAddress: string): Promise<boolean> {
  const sub = await prisma.subscription.findUnique({
    where: { walletAddress },
    select: { status: true, currentPeriodEnd: true },
  });

  if (!sub) return false;
  if (sub.status !== "active" && sub.status !== "trialing") return false;

  // Guard against stale webhook delivery: if currentPeriodEnd is in the past
  // but status is still "active", treat as expired.
  if (sub.currentPeriodEnd && sub.currentPeriodEnd < new Date()) return false;

  return true;
}

/** Full subscription row, or null if no record exists. */
export async function getSubscription(walletAddress: string) {
  return prisma.subscription.findUnique({ where: { walletAddress } });
}
