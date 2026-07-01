import { checkQuota, utcDayKey, type QuotaLimits } from "../uploadQuota";

const LIMITS: QuotaLimits = { maxRequestsPerDay: 50, maxBytesPerDay: 100 * 1024 * 1024 };

describe("checkQuota (Audit-1 TOB-04)", () => {
  it("allows usage at exactly the limits", () => {
    expect(checkQuota(50, 100 * 1024 * 1024, LIMITS)).toEqual({ ok: true });
  });

  it("allows usage below the limits", () => {
    expect(checkQuota(1, 1024, LIMITS)).toEqual({ ok: true });
  });

  it("denies when the request count exceeds the daily limit", () => {
    const r = checkQuota(51, 1024, LIMITS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/request limit/i);
  });

  it("denies when the byte total exceeds the daily limit", () => {
    const r = checkQuota(1, 100 * 1024 * 1024 + 1, LIMITS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/size limit/i);
  });

  it("checks request count before bytes when both exceed", () => {
    const r = checkQuota(999, 999 * 1024 * 1024, LIMITS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/request limit/i);
  });
});

describe("utcDayKey", () => {
  it("formats a date as a UTC YYYY-MM-DD key", () => {
    expect(utcDayKey(new Date("2026-06-30T23:59:59.000Z"))).toBe("2026-06-30");
  });

  it("uses UTC, not local time, at day boundaries", () => {
    // 00:30 UTC on July 1 is still July 1 in UTC regardless of server tz.
    expect(utcDayKey(new Date("2026-07-01T00:30:00.000Z"))).toBe("2026-07-01");
  });
});
