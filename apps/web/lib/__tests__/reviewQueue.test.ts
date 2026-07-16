import {
  isReviewStatus,
  reviewWindow,
  PUBLIC_REVIEW_STATUSES,
  REVIEW_STATUSES,
} from "../reviewQueue";

describe("reviewQueue", () => {
  it("validates review statuses", () => {
    for (const s of REVIEW_STATUSES) expect(isReviewStatus(s)).toBe(true);
    expect(isReviewStatus("bogus")).toBe(false);
    expect(isReviewStatus(null)).toBe(false);
    expect(isReviewStatus(3)).toBe(false);
  });

  it("only approved/featured are public", () => {
    expect(PUBLIC_REVIEW_STATUSES.has("approved")).toBe(true);
    expect(PUBLIC_REVIEW_STATUSES.has("featured")).toBe(true);
    expect(PUBLIC_REVIEW_STATUSES.has("pending")).toBe(false);
    expect(PUBLIC_REVIEW_STATUSES.has("rejected")).toBe(false);
  });

  it("default window is the trailing 7 days", () => {
    const now = new Date("2026-07-10T00:00:00.000Z");
    const { gte, lt } = reviewWindow({ now });
    expect(lt.toISOString()).toBe("2026-07-10T00:00:00.000Z");
    expect(gte.toISOString()).toBe("2026-07-03T00:00:00.000Z");
  });

  it("weeksAgo shifts the window back by whole weeks", () => {
    const now = new Date("2026-07-10T00:00:00.000Z");
    const { gte, lt } = reviewWindow({ now, weeksAgo: 1 });
    expect(lt.toISOString()).toBe("2026-07-03T00:00:00.000Z");
    expect(gte.toISOString()).toBe("2026-06-26T00:00:00.000Z");
  });

  it("clamps negative/NaN weeksAgo to 0", () => {
    const now = new Date("2026-07-10T00:00:00.000Z");
    expect(reviewWindow({ now, weeksAgo: -5 }).lt.toISOString()).toBe("2026-07-10T00:00:00.000Z");
  });
});
