/**
 * Pure sweep math for the Irys hot-wallet sweeper (platform ops).
 *
 * The Irys upload wallet must stay hot (it signs uploads), so it accumulates
 * SOL. This computes how much to send to the Founder sink while leaving a
 * working reserve and a fee buffer. Kept pure so it is unit-testable; the route
 * handles keys, RPC, and the hard destination allowlist.
 */

export interface SweepPlan {
  sweep: boolean;
  /** Lamports to transfer (0 when not sweeping). */
  lamports: number;
  reason: string;
}

export function computeSweepLamports(params: {
  /** Current wallet balance, lamports. */
  balanceLamports: number;
  /** Lamports to leave behind for future uploads. */
  reserveLamports: number;
  /** Lamports to leave for the transfer fee. */
  feeLamports: number;
  /** Don't sweep if the excess is below this (avoids dust transactions). */
  minSweepLamports: number;
}): SweepPlan {
  const { balanceLamports, reserveLamports, feeLamports, minSweepLamports } = params;

  const spendable = balanceLamports - reserveLamports - feeLamports;
  if (spendable <= 0) {
    return { sweep: false, lamports: 0, reason: "Balance at or below reserve + fee." };
  }
  if (spendable < minSweepLamports) {
    return { sweep: false, lamports: 0, reason: "Excess below minimum sweep threshold." };
  }
  return { sweep: true, lamports: spendable, reason: "Sweeping excess above reserve." };
}

// --- RPC resolution (Audit-2 Medium-3) --------------------------------------

import { clusterFromRpcUrl, type SolanaCluster } from "./cluster";

export type SweepRpcResolution =
  | { ok: true; url: string }
  | { ok: false; reason: string };

/**
 * Resolve the RPC the sweeper may use. This moves real funds from a hot
 * wallet, so it is stricter than the app's client RPC fallback chain:
 *
 * - Production (NODE_ENV=production or VERCEL=1): an explicit URL is required
 *   (PLATFORM_RPC_URL, else NEXT_PUBLIC_SOLANA_RPC_URL) — never a silent
 *   devnet fallback. The URL's recognizable cluster must be mainnet unless
 *   PLATFORM_SOLANA_CLUSTER explicitly says otherwise.
 * - Development: falls back to public devnet for convenience.
 */
export function resolveSweepRpc(
  env: Record<string, string | undefined> = process.env
): SweepRpcResolution {
  const isProd = env.NODE_ENV === "production" || env.VERCEL === "1";
  const url = env.PLATFORM_RPC_URL?.trim() || env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim();

  if (!url) {
    if (isProd) {
      return {
        ok: false,
        reason: "PLATFORM_RPC_URL (or NEXT_PUBLIC_SOLANA_RPC_URL) is required in production — refusing to sweep on a fallback RPC.",
      };
    }
    return { ok: true, url: "https://api.devnet.solana.com" };
  }

  const expected = (env.PLATFORM_SOLANA_CLUSTER?.trim() ||
    (isProd ? "mainnet" : "")) as SolanaCluster | "";
  if (expected) {
    const actual = clusterFromRpcUrl(url);
    if (actual !== "unknown" && actual !== expected) {
      return {
        ok: false,
        reason: `RPC cluster mismatch: URL resolves to ${actual} but ${expected} is expected (PLATFORM_SOLANA_CLUSTER). Refusing to sweep.`,
      };
    }
  }

  return { ok: true, url };
}
