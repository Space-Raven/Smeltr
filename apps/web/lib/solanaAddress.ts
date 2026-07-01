/**
 * Centralized Solana address validation (Audit-1 TOB-08).
 *
 * A single strict base58 check so every caller that interpolates a wallet
 * address into a query, URL, or log treats it as validated code, not raw
 * input. Solana public keys are base58-encoded 32-byte values → 32–44 chars,
 * excluding the base58-forbidden characters 0 O I l.
 */

const BASE58_PUBKEY = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function isValidWalletAddress(value: string): boolean {
  return BASE58_PUBKEY.test(value);
}

/**
 * Throws if `value` is not a syntactically valid base58 Solana address.
 * Call immediately before using an address in a query/URL string.
 */
export function assertValidWalletAddress(value: string): void {
  if (!isValidWalletAddress(value)) {
    throw new Error("Invalid wallet address");
  }
}
