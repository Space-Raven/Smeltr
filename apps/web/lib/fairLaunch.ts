/**
 * Fair-Launch Check — pure interpretation layer (strategy overhaul Phase B).
 *
 * Turns already-fetched on-chain mint facts into the "Smeltr Fair-Launch
 * Check": a checklist of CONTROL, never a score of value. Each item states
 * who can still do what to holders — mint more supply, freeze balances, move
 * tokens — in plain language. This is a read-only attestation (display only,
 * no endorsement, no investment signal), per market-expansion-roadmap.
 *
 * Kept free of network/web3 imports so it is unit-testable; the on-chain
 * fetcher lives in fairLaunchServer.ts.
 */

export interface MintFacts {
  mintAddress: string;
  tokenStandard: "token-2022" | "spl-legacy";
  supply: bigint;
  decimals: number;
  /** null = revoked / never set. */
  mintAuthority: string | null;
  freezeAuthority: string | null;
  /** Token-2022 only; always null for legacy SPL. */
  permanentDelegate: string | null;
  /** Basis points, if the Transfer Fee extension is present. */
  transferFeeBps: number | null;
  nonTransferable: boolean;
  mintCloseAuthority: string | null;
  /** On-chain TokenMetadata, if present. updateAuthority null = immutable. */
  metadata: {
    name: string;
    symbol: string;
    uri: string;
    updateAuthority: string | null;
  } | null;
}

export type CheckStatus = "pass" | "caution" | "info";

export interface FairLaunchCheck {
  id: string;
  label: string;
  status: CheckStatus;
  /** Plain-language explanation of what this means for a holder. */
  detail: string;
}

export interface FairLaunchReport {
  checks: FairLaunchCheck[];
  /**
   * True when every control that could act on holders is revoked/absent:
   * fixed supply, no freeze, no permanent delegate. The bar for the badge.
   */
  allControlsRevoked: boolean;
}

export function buildFairLaunchReport(facts: MintFacts): FairLaunchReport {
  const checks: FairLaunchCheck[] = [];

  const supplyFixed = facts.mintAuthority === null;
  checks.push(
    supplyFixed
      ? {
          id: "supply",
          label: "Fixed supply",
          status: "pass",
          detail: "Mint authority is revoked — no one can ever create more of this token.",
        }
      : {
          id: "supply",
          label: "Supply can grow",
          status: "caution",
          detail: "The mint authority is active, so the creator can mint more tokens at any time.",
        }
  );

  const noFreeze = facts.freezeAuthority === null;
  checks.push(
    noFreeze
      ? {
          id: "freeze",
          label: "No freeze authority",
          status: "pass",
          detail: "No one can freeze holders' balances.",
        }
      : {
          id: "freeze",
          label: "Freeze authority active",
          status: "caution",
          detail: "An authority can freeze any holder's balance, blocking transfers.",
        }
  );

  const noDelegate = facts.permanentDelegate === null;
  checks.push(
    noDelegate
      ? {
          id: "delegate",
          label: "No permanent delegate",
          status: "pass",
          detail: "No address can move or burn tokens out of holders' wallets.",
        }
      : {
          id: "delegate",
          label: "Permanent delegate present",
          status: "caution",
          detail:
            "A permanent delegate can transfer or burn tokens from ANY holder's wallet. Used for compliance — make sure you trust it.",
        }
  );

  if (facts.metadata) {
    checks.push(
      facts.metadata.updateAuthority === null
        ? {
            id: "metadata",
            label: "Metadata locked",
            status: "pass",
            detail: "The name, symbol, and image can never be changed.",
          }
        : {
            id: "metadata",
            label: "Metadata can change",
            status: "info",
            detail: "The creator can still update the token's name, symbol, or image.",
          }
    );
  }

  if (facts.transferFeeBps !== null) {
    checks.push({
      id: "transfer-fee",
      label: `Transfer fee: ${formatBps(facts.transferFeeBps)}`,
      status: "info",
      detail: `Every transfer pays a ${formatBps(facts.transferFeeBps)} fee to the token's fee authority.`,
    });
  }

  if (facts.nonTransferable) {
    checks.push({
      id: "soulbound",
      label: "Non-transferable (soulbound)",
      status: "info",
      detail: "Tokens stay with whoever receives them — they cannot be transferred or sold.",
    });
  }

  if (facts.mintCloseAuthority !== null) {
    checks.push({
      id: "close",
      label: "Mint can be closed",
      status: "info",
      detail: "An authority can close the mint account once supply is zero.",
    });
  }

  return {
    checks,
    allControlsRevoked: supplyFixed && noFreeze && noDelegate,
  };
}

export function formatBps(bps: number): string {
  return `${(bps / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
}

/** "12345678" + decimals 6 → "12.345678" with thousands grouping on the whole part. */
export function formatSupply(supply: bigint, decimals: number): string {
  if (decimals === 0) return supply.toLocaleString("en-US");
  const base = 10n ** BigInt(decimals);
  const whole = supply / base;
  const frac = (supply % base).toString().padStart(decimals, "0").replace(/0+$/, "");
  return frac ? `${whole.toLocaleString("en-US")}.${frac}` : whole.toLocaleString("en-US");
}

/** Only render token images from hosts we already trust for next/image. */
const TRUSTED_IMAGE_HOSTS = [/(^|\.)arweave\.net$/, /^gateway\.irys\.xyz$/, /^devnet\.irys\.xyz$/];

export function trustedImageUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    return TRUSTED_IMAGE_HOSTS.some((re) => re.test(parsed.hostname)) ? url : null;
  } catch {
    return null;
  }
}
