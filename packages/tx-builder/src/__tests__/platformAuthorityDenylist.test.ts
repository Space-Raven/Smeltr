import { Keypair } from "@solana/web3.js";
import {
  getDenylistDebugSnapshot,
  parsePlatformAuthorityDenylist,
  assertNoPlatformAuthority,
  assertPlatformDenylistConfigured,
} from "@platform/module-registry";

/**
 * Audit-1 TOB-01 regression test. Verifies the platform authority denylist:
 *   1. parses from the NEXT_PUBLIC_ env vars (the browser-effective source), and
 *   2. actually rejects a platform key for an authority field while allowing a
 *      non-platform key.
 *
 * Lives in tx-builder because its jest config is already wired; it exercises
 * module-registry's exported logic directly.
 */
describe("parsePlatformAuthorityDenylist", () => {
  it("parses comma- and whitespace-separated keys from NEXT_PUBLIC_PLATFORM_AUTHORITY_DENYLIST", () => {
    const a = Keypair.generate().publicKey.toBase58();
    const b = Keypair.generate().publicKey.toBase58();
    const c = Keypair.generate().publicKey.toBase58();
    const set = parsePlatformAuthorityDenylist({
      NEXT_PUBLIC_PLATFORM_AUTHORITY_DENYLIST: `${a}, ${b}   ${c}`,
    });
    expect(set.has(a)).toBe(true);
    expect(set.has(b)).toBe(true);
    expect(set.has(c)).toBe(true);
    expect(set.size).toBe(3);
  });

  it("folds in the platform fee recipient (TOB-11)", () => {
    const fee = Keypair.generate().publicKey.toBase58();
    const set = parsePlatformAuthorityDenylist({
      NEXT_PUBLIC_PLATFORM_FEE_RECIPIENT: fee,
    });
    expect(set.has(fee)).toBe(true);
  });

  it("is empty when nothing is configured (local dev) — and reads NEXT_PUBLIC_ only", () => {
    // The old, broken vars must NOT contribute (they are server-only and were
    // undefined in the browser — the TOB-01 root cause).
    const set = parsePlatformAuthorityDenylist({
      PLATFORM_FEE_PAYER_PUBKEY: Keypair.generate().publicKey.toBase58(),
      PLATFORM_SERVICE_WALLET_PUBKEY: Keypair.generate().publicKey.toBase58(),
    });
    expect(set.size).toBe(0);
  });

  it("readPublicDenylistEnv path: static NEXT_PUBLIC_ keys are the only source", () => {
    const a = Keypair.generate().publicKey.toBase58();
    const set = parsePlatformAuthorityDenylist({
      NEXT_PUBLIC_PLATFORM_AUTHORITY_DENYLIST: a,
    });
    expect(set.has(a)).toBe(true);
  });
});

describe("getDenylistDebugSnapshot", () => {
  it("reports parsed keys and raw length from explicit env", () => {
    const a = Keypair.generate().publicKey.toBase58();
    const snap = parsePlatformAuthorityDenylist({
      NEXT_PUBLIC_PLATFORM_AUTHORITY_DENYLIST: a,
    });
    expect(snap.size).toBe(1);
    expect([...snap][0]).toBe(a);
  });
});

describe("assertNoPlatformAuthority", () => {
  it("rejects a key on the denylist and allows one that is not", () => {
    const platformKey = Keypair.generate().publicKey;
    const userKey = Keypair.generate().publicKey;
    const denylist = new Set([platformKey.toBase58()]);

    expect(() =>
      assertNoPlatformAuthority(platformKey, "delegate", "permanent-delegate", denylist)
    ).toThrow(/SECURITY/);

    expect(() =>
      assertNoPlatformAuthority(userKey, "delegate", "permanent-delegate", denylist)
    ).not.toThrow();
  });

  it("enforces the denylist for every authority field name", () => {
    const platformKey = Keypair.generate().publicKey;
    const denylist = new Set([platformKey.toBase58()]);
    for (const field of [
      "mintAuthority",
      "freezeAuthority",
      "transferFeeConfigAuthority",
      "withdrawWithheldAuthority",
      "delegate",
    ]) {
      expect(() =>
        assertNoPlatformAuthority(platformKey, field, "test", denylist)
      ).toThrow(/SECURITY/);
    }
  });
});

describe("assertPlatformDenylistConfigured (fail-closed guard)", () => {
  const nonEmpty = new Set([Keypair.generate().publicKey.toBase58()]);

  it("throws in production when the denylist is empty", () => {
    expect(() =>
      assertPlatformDenylistConfigured({ isProduction: true, denylist: new Set() })
    ).toThrow(/not configured/i);
  });

  it("does not throw in production when the denylist is populated", () => {
    expect(() =>
      assertPlatformDenylistConfigured({ isProduction: true, denylist: nonEmpty })
    ).not.toThrow();
  });

  it("does not throw outside production even when empty (local dev)", () => {
    expect(() =>
      assertPlatformDenylistConfigured({ isProduction: false, denylist: new Set() })
    ).not.toThrow();
  });
});
