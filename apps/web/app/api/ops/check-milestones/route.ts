import { NextResponse } from "next/server";
import { Connection } from "@solana/web3.js";
import { prisma } from "../../../../lib/prisma";
import { resolveServerRpcUrl } from "../../../../lib/fairLaunchServer";
import { chainIdForCluster, clusterFromRpcUrl } from "../../../../lib/cluster";
import { countHolders } from "../../../../lib/holderCount";
import { milestoneToAnnounce } from "../../../../lib/milestones";
import { buildMilestoneEmail, sendAlertEmail } from "../../../../lib/alerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Mints scanned per run — one getProgramAccounts scan each. */
const MAX_MINTS_PER_RUN = 50;

/**
 * GET /api/ops/check-milestones  (Vercel Cron, daily)
 *
 * For every VERIFIED alert subscription on the cluster this server is
 * authoritative for: count holders, and when a new milestone tier is
 * crossed, send one email and record the tier. Failures on one mint never
 * block the rest.
 *
 * Auth: `Authorization: Bearer <CRON_SECRET>` — same as sweep-irys.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rpcUrl = resolveServerRpcUrl();
  const connection = new Connection(rpcUrl, "confirmed");
  // Only touch subscriptions for the cluster this RPC answers for — never
  // announce devnet milestones off mainnet data or vice versa.
  const authoritativeChainId = chainIdForCluster(clusterFromRpcUrl(rpcUrl));

  const subscriptions = await prisma.alertSubscription.findMany({
    where: {
      verifiedAt: { not: null },
      ...(authoritativeChainId ? { chainId: authoritativeChainId } : {}),
    },
    orderBy: { updatedAt: "asc" },
  });

  // One scan per mint, shared across its subscribers.
  const mintKeys = [...new Set(subscriptions.map((s) => `${s.chainId}:${s.mintAddress}`))].slice(
    0,
    MAX_MINTS_PER_RUN
  );

  let scanned = 0;
  let announced = 0;
  const errors: string[] = [];

  for (const key of mintKeys) {
    const [chainId, mintAddress] = key.split(":");
    const subs = subscriptions.filter(
      (s) => s.chainId === chainId && s.mintAddress === mintAddress
    );

    try {
      const deployment = await prisma.deployment.findUnique({
        where: { chainId_mintAddress: { chainId, mintAddress } },
      });
      const tokenStandard = deployment?.tokenStandard === "spl-legacy" ? "spl-legacy" : "token-2022";

      const holders = await countHolders(connection, mintAddress, tokenStandard);
      scanned++;

      for (const sub of subs) {
        const milestone = milestoneToAnnounce(sub.lastMilestone, holders);
        if (milestone === null) continue;

        const sent = await sendAlertEmail(
          sub.email,
          buildMilestoneEmail({
            tokenName: deployment?.name ?? null,
            mintAddress,
            milestone,
            holderCount: holders,
            unsubToken: sub.unsubToken,
          })
        );
        if (sent) {
          // Only record the tier when the email actually went out, so a
          // Resend outage retries on the next run instead of losing the
          // milestone forever.
          await prisma.alertSubscription.update({
            where: { id: sub.id },
            data: { lastMilestone: milestone },
          });
          announced++;
        }
      }
    } catch (err) {
      errors.push(`${key}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({
    cluster: authoritativeChainId ?? "unconstrained",
    subscriptions: subscriptions.length,
    mintsScanned: scanned,
    milestonesAnnounced: announced,
    errors: errors.slice(0, 10),
  });
}
