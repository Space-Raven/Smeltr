/**
 * Holder-milestone tiers (Phase D retention loop) — pure logic.
 *
 * Milestones are holder-count thresholds. A subscription remembers the
 * highest tier already announced (`lastMilestone`); the cron announces only
 * when a HIGHER tier is crossed, exactly once per tier. Craft/progress
 * framing per brand guidance — never price, volume, or market metrics.
 */

export const HOLDER_MILESTONES = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000] as const;

/**
 * The highest milestone at or below `holderCount`, or 0 if none reached.
 */
export function highestMilestoneReached(holderCount: number): number {
  let reached = 0;
  for (const m of HOLDER_MILESTONES) {
    if (holderCount >= m) reached = m;
    else break;
  }
  return reached;
}

/**
 * The milestone to announce now, or null if nothing new was crossed.
 * Announces only the highest newly-crossed tier (no catch-up spam if a token
 * jumps from 8 to 300 holders — one email for 250, not three).
 */
export function milestoneToAnnounce(lastMilestone: number, holderCount: number): number | null {
  const reached = highestMilestoneReached(holderCount);
  return reached > lastMilestone ? reached : null;
}
