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
