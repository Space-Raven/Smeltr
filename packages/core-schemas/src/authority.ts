import { PublicKey } from "@solana/web3.js";

/**
 * ============================================================================
 * PLATFORM AUTHORITY DENYLIST
 * ============================================================================
 * Critical Security Path — Risk 2 mitigation.
 *
 * No module may ever assign a Token-2022 authority field (transfer fee
 * authority, withdraw authority, permanent delegate, etc.) to a
 * platform-held key. This denylist is the runtime backstop for that
 * invariant; `assertNoPlatformAuthority` is called by every module that
 * accepts an authority parameter.
 *
 * Populate from secure environment config at startup. Never hardcode real
 * keys in source — placeholders only.
 */
export const PLATFORM_AUTHORITY_DENYLIST: ReadonlySet<string> = new Set<string>([
  // process.env.PLATFORM_FEE_PAYER_PUBKEY ?? "",
  // process.env.PLATFORM_SERVICE_WALLET_PUBKEY ?? "",
]);

export function assertNoPlatformAuthority(
  authority: PublicKey,
  fieldName: string,
  moduleId: string
): void {
  if (PLATFORM_AUTHORITY_DENYLIST.has(authority.toBase58())) {
    throw new Error(
      `[SECURITY] Module "${moduleId}" attempted to set "${fieldName}" to a ` +
        `platform-controlled key (${authority.toBase58()}). This violates the ` +
        `platform's non-custodial guarantee and has been blocked.`
    );
  }
}
