import { isValidWalletAddress, assertValidWalletAddress } from "../solanaAddress";

describe("isValidWalletAddress (Audit-1 TOB-08)", () => {
  it("accepts a typical base58 Solana pubkey", () => {
    expect(isValidWalletAddress("So11111111111111111111111111111111111111112")).toBe(true);
  });

  it("accepts the 32-char lower bound", () => {
    expect(isValidWalletAddress("1".repeat(32))).toBe(true);
  });

  it("rejects too-short and too-long strings", () => {
    expect(isValidWalletAddress("1".repeat(31))).toBe(false);
    expect(isValidWalletAddress("1".repeat(45))).toBe(false);
  });

  it("rejects base58-forbidden characters (0 O I l)", () => {
    expect(isValidWalletAddress("0".repeat(40))).toBe(false);
    expect(isValidWalletAddress("O".repeat(40))).toBe(false);
    expect(isValidWalletAddress("l".repeat(40))).toBe(false);
  });

  it("rejects Stripe-query injection attempts", () => {
    // A payload trying to break out of the quoted literal must be rejected.
    expect(isValidWalletAddress("x' OR metadata['a']:'b")).toBe(false);
    expect(isValidWalletAddress("' OR '1'='1")).toBe(false);
  });

  it("assertValidWalletAddress throws on invalid input", () => {
    expect(() => assertValidWalletAddress("nope!")).toThrow(/invalid wallet address/i);
    expect(() => assertValidWalletAddress("So11111111111111111111111111111111111111112")).not.toThrow();
  });
});
