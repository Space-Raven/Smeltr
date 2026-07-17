import {
  HOLDER_MILESTONES,
  highestMilestoneReached,
  milestoneToAnnounce,
} from "../milestones";
import { isPlausibleEmail, newAlertToken, buildMilestoneEmail, buildVerifyEmail } from "../alerts";

describe("holder milestones (Phase D)", () => {
  it("returns 0 below the first tier", () => {
    expect(highestMilestoneReached(0)).toBe(0);
    expect(highestMilestoneReached(9)).toBe(0);
  });

  it("returns the highest tier at or below the count", () => {
    expect(highestMilestoneReached(10)).toBe(10);
    expect(highestMilestoneReached(24)).toBe(10);
    expect(highestMilestoneReached(100)).toBe(100);
    expect(highestMilestoneReached(9999)).toBe(5000);
    expect(highestMilestoneReached(1_000_000)).toBe(HOLDER_MILESTONES[HOLDER_MILESTONES.length - 1]);
  });

  it("announces only newly crossed tiers, once", () => {
    expect(milestoneToAnnounce(0, 5)).toBeNull();
    expect(milestoneToAnnounce(0, 12)).toBe(10);
    expect(milestoneToAnnounce(10, 12)).toBeNull(); // already announced
    expect(milestoneToAnnounce(10, 60)).toBe(50);
  });

  it("skips intermediate tiers on a jump — one email, not a backlog", () => {
    expect(milestoneToAnnounce(0, 300)).toBe(250); // not 10, 25, 50, 100 too
  });

  it("never announces on shrinking holder counts", () => {
    expect(milestoneToAnnounce(100, 40)).toBeNull();
  });
});

describe("alert email plumbing", () => {
  it("tokens are unique, url-safe, and long", () => {
    const a = newAlertToken();
    const b = newAlertToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]{40,}$/);
  });

  it("email plausibility bounds", () => {
    expect(isPlausibleEmail("a@b.co")).toBe(true);
    expect(isPlausibleEmail("not-an-email")).toBe(false);
    expect(isPlausibleEmail("a b@c.co")).toBe(false);
    expect(isPlausibleEmail("a@b.co".padStart(300, "x"))).toBe(false);
  });

  it("verify email carries the verify link and no unsubscribe token", () => {
    const e = buildVerifyEmail({ tokenName: "Forge Coin", mintAddress: "M".repeat(44), verifyToken: "VTOK" });
    expect(e.text).toContain("/api/alerts/verify?token=VTOK");
    expect(e.subject).toContain("Forge Coin");
  });

  it("milestone email links t/manage/unsubscribe and never mentions price", () => {
    const e = buildMilestoneEmail({
      tokenName: null,
      mintAddress: "Mint111111111111111111111111111111111111111",
      milestone: 50,
      holderCount: 61,
      unsubToken: "UTOK",
    });
    expect(e.text).toContain("/t/Mint111111111111111111111111111111111111111");
    expect(e.text).toContain("/manage/Mint111111111111111111111111111111111111111");
    expect(e.text).toContain("/api/alerts/unsubscribe?token=UTOK");
    expect(e.text.toLowerCase()).not.toMatch(/price|market cap|pump|moon/);
  });
});
