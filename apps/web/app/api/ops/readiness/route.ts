import { NextResponse } from "next/server";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import bs58 from "bs58";
import { assessBetaReadiness } from "../../../../lib/betaReadiness";
import { computeSweepLamports } from "../../../../lib/sweep";
import { checkAuthNonceReadiness } from "../../../../lib/authNonceReadiness";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FEE_BUFFER_LAMPORTS = 5000;

function solEnvToLamports(value: string | undefined, fallbackSol: number): number {
  const n = Number(value);
  const sol = Number.isFinite(n) && n >= 0 ? n : fallbackSol;
  return Math.floor(sol * LAMPORTS_PER_SOL);
}

/**
 * GET /api/ops/readiness
 *
 * Operator endpoint — reports beta blocker env status (no secret values).
 * Auth: `Authorization: Bearer <CRON_SECRET>` (same as sweep-irys cron).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const report = assessBetaReadiness(process.env);
  const authNonce = await checkAuthNonceReadiness({ prisma });

  let rpcReachable: boolean | null = null;
  let rpcSlot: number | null = null;
  const rpcUrl =
    process.env.PLATFORM_RPC_URL?.trim() ||
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim();

  if (rpcUrl && report.rpc.automatedReady) {
    try {
      const connection = new Connection(rpcUrl, "confirmed");
      rpcSlot = await connection.getSlot();
      rpcReachable = true;
    } catch {
      rpcReachable = false;
    }
  }

  let sweeperPreview: Record<string, unknown> | null = null;
  if (report.sweeper.automatedReady && rpcUrl) {
    try {
      const priv = process.env.PLATFORM_IRYS_PRIVATE_KEY!;
      const founder = process.env.PLATFORM_FOUNDER_PUBKEY!;
      const source = Keypair.fromSecretKey(bs58.decode(priv));
      const destination = new PublicKey(founder);
      const connection = new Connection(rpcUrl, "confirmed");
      const balance = await connection.getBalance(source.publicKey);
      const plan = computeSweepLamports({
        balanceLamports: balance,
        reserveLamports: solEnvToLamports(process.env.IRYS_SWEEP_RESERVE_SOL, 0.5),
        feeLamports: FEE_BUFFER_LAMPORTS,
        minSweepLamports: solEnvToLamports(process.env.IRYS_SWEEP_MIN_SOL, 0.05),
      });

      sweeperPreview = {
        from: source.publicKey.toBase58(),
        to: destination.toBase58(),
        balanceLamports: balance,
        wouldSweep: plan.sweep,
        sweepLamports: plan.sweep ? plan.lamports : 0,
        reason: plan.reason,
      };
    } catch (err) {
      sweeperPreview = {
        error: err instanceof Error ? err.message : "Could not preview sweeper",
      };
    }
  }

  return NextResponse.json({
    ts: Date.now(),
    automatedReady: report.automatedReady,
    blockers: report.blockers,
    rpc: { ...report.rpc, reachable: rpcReachable, slot: rpcSlot },
    sweeper: report.sweeper,
    sweeperPreview,
    denylist: report.denylist,
    authNonce,
  });
}
