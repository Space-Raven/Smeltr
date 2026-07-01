import { isMutatingMethod, isCsrfExempt, originAllowed } from "../csrf";

describe("isMutatingMethod (Audit-1 TOB-13)", () => {
  it("flags state-changing methods", () => {
    for (const m of ["POST", "PUT", "PATCH", "DELETE"]) {
      expect(isMutatingMethod(m)).toBe(true);
    }
  });
  it("ignores safe methods", () => {
    for (const m of ["GET", "HEAD", "OPTIONS"]) {
      expect(isMutatingMethod(m)).toBe(false);
    }
  });
});

describe("isCsrfExempt", () => {
  it("exempts the Stripe webhook", () => {
    expect(isCsrfExempt("/api/stripe/webhook")).toBe(true);
  });
  it("does not exempt other mutating routes", () => {
    expect(isCsrfExempt("/api/deployments")).toBe(false);
    expect(isCsrfExempt("/api/upload/metadata")).toBe(false);
    expect(isCsrfExempt("/api/beta/verify")).toBe(false);
  });
});

describe("originAllowed", () => {
  it("allows a matching same-origin request", () => {
    expect(originAllowed("https://smeltr.org", "smeltr.org")).toBe(true);
  });
  it("blocks a cross-origin request", () => {
    expect(originAllowed("https://evil.example", "smeltr.org")).toBe(false);
  });
  it("allows requests with no Origin header (non-browser clients)", () => {
    expect(originAllowed(null, "smeltr.org")).toBe(true);
  });
  it("blocks when Origin is present but host is missing", () => {
    expect(originAllowed("https://smeltr.org", null)).toBe(false);
  });
  it("blocks a malformed Origin", () => {
    expect(originAllowed("not-a-url", "smeltr.org")).toBe(false);
  });
  it("compares host including port", () => {
    expect(originAllowed("http://localhost:3000", "localhost:3000")).toBe(true);
    expect(originAllowed("http://localhost:3001", "localhost:3000")).toBe(false);
  });
});
