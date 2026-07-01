import { prisma } from "./prisma";

/**
 * Per-wallet daily quota enforcement for the platform-funded upload endpoint
 * (Audit-1 TOB-04). The endpoint spends the platform's Irys/SOL balance, so an
 * attacker with any premium (or forged) session could drain it via repeated
 * large uploads. We cap both the request count and the total bytes per wallet
 * per UTC day, persisted so the limit survives cold starts and scales across
 * serverless instances.
 *
 * The policy decision (`checkQuota`) is a pure function so it is unit-testable;
 * the DB reserve/refund helpers wrap it with an atomic counter update.
 */

export interface QuotaLimits {
  maxRequestsPerDay: number;
  maxBytesPerDay: number;
}

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/** Limits, overridable via env without a redeploy. Defaults: 50 req / 100MB per day. */
export function getQuotaLimits(): QuotaLimits {
  return {
    maxRequestsPerDay: intFromEnv("UPLOAD_MAX_REQUESTS_PER_DAY", 50),
    maxBytesPerDay: intFromEnv("UPLOAD_MAX_BYTES_PER_DAY", 100 * 1024 * 1024),
  };
}

/** UTC calendar-day key, e.g. "2026-06-30". */
export function utcDayKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export type QuotaVerdict = { ok: true } | { ok: false; reason: string };

/**
 * Pure policy check: given the totals that WOULD result after counting this
 * request, decide whether it is within the daily caps.
 */
export function checkQuota(
  requestsAfter: number,
  bytesAfter: number,
  limits: QuotaLimits
): QuotaVerdict {
  if (requestsAfter > limits.maxRequestsPerDay) {
    return {
      ok: false,
      reason: "Daily upload request limit reached. Please try again tomorrow.",
    };
  }
  if (bytesAfter > limits.maxBytesPerDay) {
    return {
      ok: false,
      reason: "Daily upload size limit reached. Please try again tomorrow.",
    };
  }
  return { ok: true };
}

/**
 * Atomically reserve quota for an upload of `fileBytes`. Increments the wallet's
 * counters first (so concurrent requests can't both slip under the cap), then
 * checks the post-increment totals. If over the limit, the reservation is
 * refunded and a denial verdict is returned — the caller must NOT upload.
 */
export async function reserveQuota(
  walletAddress: string,
  fileBytes: number,
  limits: QuotaLimits = getQuotaLimits()
): Promise<QuotaVerdict> {
  const day = utcDayKey();
  const row = await prisma.uploadUsage.upsert({
    where: { walletAddress_day: { walletAddress, day } },
    create: { walletAddress, day, requests: 1, bytes: BigInt(fileBytes) },
    update: { requests: { increment: 1 }, bytes: { increment: BigInt(fileBytes) } },
  });

  const verdict = checkQuota(row.requests, Number(row.bytes), limits);
  if (!verdict.ok) {
    await refundQuota(walletAddress, fileBytes);
  }
  return verdict;
}

/**
 * Refund a previously-reserved quota amount. Called when the reservation is
 * denied, or when the upload itself fails so the attempt doesn't count against
 * the user. Best-effort: a missing row (e.g. day rolled over) is ignored.
 */
export async function refundQuota(walletAddress: string, fileBytes: number): Promise<void> {
  const day = utcDayKey();
  try {
    await prisma.uploadUsage.update({
      where: { walletAddress_day: { walletAddress, day } },
      data: { requests: { decrement: 1 }, bytes: { decrement: BigInt(fileBytes) } },
    });
  } catch {
    // Row may not exist anymore; refund is best-effort.
  }
}
