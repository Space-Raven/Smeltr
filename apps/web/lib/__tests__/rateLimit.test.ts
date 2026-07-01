import { getClientIp, getNonceRateLimit } from "../rateLimit";

function headersWith(entries: Record<string, string>): Headers {
  return new Headers(entries);
}

describe("getClientIp (Audit-1 TOB-06)", () => {
  it("takes the first entry of x-forwarded-for", () => {
    const h = headersWith({ "x-forwarded-for": "1.2.3.4, 5.6.7.8, 9.10.11.12" });
    expect(getClientIp(h)).toBe("1.2.3.4");
  });

  it("trims whitespace around the first entry", () => {
    const h = headersWith({ "x-forwarded-for": "  1.2.3.4  , 5.6.7.8" });
    expect(getClientIp(h)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const h = headersWith({ "x-real-ip": "203.0.113.5" });
    expect(getClientIp(h)).toBe("203.0.113.5");
  });

  it("prefers x-forwarded-for over x-real-ip", () => {
    const h = headersWith({ "x-forwarded-for": "1.1.1.1", "x-real-ip": "2.2.2.2" });
    expect(getClientIp(h)).toBe("1.1.1.1");
  });

  it("returns 'unknown' when no IP headers are present", () => {
    expect(getClientIp(headersWith({}))).toBe("unknown");
  });

  it("returns 'unknown' for an empty x-forwarded-for", () => {
    expect(getClientIp(headersWith({ "x-forwarded-for": "" }))).toBe("unknown");
  });
});

describe("getNonceRateLimit", () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it("defaults to 10 requests per 60s", () => {
    delete process.env.NONCE_RATE_LIMIT_MAX;
    delete process.env.NONCE_RATE_LIMIT_WINDOW_MS;
    expect(getNonceRateLimit()).toEqual({ maxPerWindow: 10, windowMs: 60000 });
  });

  it("honors valid env overrides", () => {
    process.env.NONCE_RATE_LIMIT_MAX = "3";
    process.env.NONCE_RATE_LIMIT_WINDOW_MS = "5000";
    expect(getNonceRateLimit()).toEqual({ maxPerWindow: 3, windowMs: 5000 });
  });

  it("ignores non-positive / invalid overrides and uses the default", () => {
    process.env.NONCE_RATE_LIMIT_MAX = "0";
    process.env.NONCE_RATE_LIMIT_WINDOW_MS = "abc";
    expect(getNonceRateLimit()).toEqual({ maxPerWindow: 10, windowMs: 60000 });
  });
});
