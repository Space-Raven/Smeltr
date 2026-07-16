/**
 * Pure helpers for the mint review queue (the weekly "data stream" the founder
 * reviews to curate the /created explorer). Kept free of Prisma/network so they
 * are unit-testable; the API route wires them to the DB.
 */

export const REVIEW_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "featured",
  "hidden",
] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

/** Statuses whose tokens are eligible to appear in the public /created explorer. */
export const PUBLIC_REVIEW_STATUSES: ReadonlySet<ReviewStatus> = new Set([
  "approved",
  "featured",
]);

export function isReviewStatus(value: unknown): value is ReviewStatus {
  return typeof value === "string" && (REVIEW_STATUSES as readonly string[]).includes(value);
}

/**
 * Resolve a review window. Defaults to the trailing 7 days ("this week's
 * mints"). `weeksAgo` shifts the window back N weeks for browsing history.
 */
export function reviewWindow(opts: { weeksAgo?: number; now?: Date } = {}): {
  gte: Date;
  lt: Date;
} {
  const now = opts.now ?? new Date();
  const weeksAgo = Number.isFinite(opts.weeksAgo) ? Math.max(0, Math.floor(opts.weeksAgo!)) : 0;
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const lt = new Date(now.getTime() - weeksAgo * WEEK_MS);
  const gte = new Date(lt.getTime() - WEEK_MS);
  return { gte, lt };
}
