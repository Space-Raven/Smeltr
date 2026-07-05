import { parseAdminPubkeys, isAdminWallet } from "../admin";

const FOUNDER = "ChpQy2t78xwWhGm2R91xKe4aXtvrAPKYL8ufSXmSxFYh";
const OTHER = "OtherWallet111111111111111111111111111111";

describe("admin auth", () => {
  it("parses comma/space separated admin pubkeys", () => {
    const set = parseAdminPubkeys({ PLATFORM_ADMIN_PUBKEYS: `${FOUNDER}, ${OTHER}` });
    expect(set.has(FOUNDER)).toBe(true);
    expect(set.has(OTHER)).toBe(true);
    expect(set.size).toBe(2);
  });

  it("falls back to PLATFORM_FOUNDER_PUBKEY when admin list unset", () => {
    const set = parseAdminPubkeys({ PLATFORM_FOUNDER_PUBKEY: FOUNDER });
    expect(set.has(FOUNDER)).toBe(true);
  });

  it("is empty when nothing configured", () => {
    expect(parseAdminPubkeys({}).size).toBe(0);
  });

  it("isAdminWallet matches only allowlisted wallets", () => {
    const admins = new Set([FOUNDER]);
    expect(isAdminWallet(FOUNDER, admins)).toBe(true);
    expect(isAdminWallet(OTHER, admins)).toBe(false);
    expect(isAdminWallet(null, admins)).toBe(false);
    expect(isAdminWallet(undefined, admins)).toBe(false);
  });

  it("empty allowlist authorizes no one (fail closed)", () => {
    expect(isAdminWallet(FOUNDER, new Set())).toBe(false);
  });
});
