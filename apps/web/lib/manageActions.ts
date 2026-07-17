import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import {
  AuthorityType,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createHarvestWithheldTokensToMintInstruction,
  createSetAuthorityInstruction,
  createWithdrawWithheldTokensFromMintInstruction,
  getAssociatedTokenAddressSync,
  getMetadataPointerState,
  getMintCloseAuthority,
  getNonTransferable,
  getPermanentDelegate,
  getTransferFeeAmount,
  getTransferFeeConfig,
  getExtensionData,
  ExtensionType,
  unpackAccount,
  unpackMint,
} from "@solana/spl-token";
import { unpack as unpackTokenMetadata } from "@solana/spl-token-metadata";
import type { MintFacts } from "./fairLaunch";

/**
 * Post-launch management actions (strategy overhaul Phase D — retention loop).
 *
 * Everything here is NON-CUSTODIAL: pure instruction builders the user's
 * wallet signs. The platform never holds an authority, so every action only
 * succeeds if the connected wallet IS the on-chain authority — the UI
 * pre-checks that, the chain enforces it.
 *
 * Builders are pure (unit-testable); `inspectManagedMint` and
 * `findAccountsWithWithheldFees` do network reads and live at the bottom.
 */

export type TokenStandardId = "token-2022" | "spl-legacy";

function programIdFor(standard: TokenStandardId): PublicKey {
  return standard === "spl-legacy" ? TOKEN_PROGRAM_ID : TOKEN_2022_PROGRAM_ID;
}

/** Revoke the mint authority — fixes supply permanently. IRREVERSIBLE. */
export function buildRevokeMintAuthority(args: {
  mint: PublicKey;
  currentAuthority: PublicKey;
  standard: TokenStandardId;
}): TransactionInstruction[] {
  return [
    createSetAuthorityInstruction(
      args.mint,
      args.currentAuthority,
      AuthorityType.MintTokens,
      null,
      [],
      programIdFor(args.standard)
    ),
  ];
}

/** Revoke the freeze authority — no one can ever freeze holders. IRREVERSIBLE. */
export function buildRevokeFreezeAuthority(args: {
  mint: PublicKey;
  currentAuthority: PublicKey;
  standard: TokenStandardId;
}): TransactionInstruction[] {
  return [
    createSetAuthorityInstruction(
      args.mint,
      args.currentAuthority,
      AuthorityType.FreezeAccount,
      null,
      [],
      programIdFor(args.standard)
    ),
  ];
}

/** Cap on harvest sources per transaction, well under the 1232-byte limit. */
export const MAX_HARVEST_SOURCES_PER_TX = 20;

/**
 * Permissionless: move withheld transfer fees from holder token accounts onto
 * the mint, where the withdraw authority can collect them. Token-2022 only.
 */
export function buildHarvestWithheldToMint(args: {
  mint: PublicKey;
  sources: PublicKey[];
}): TransactionInstruction[] {
  if (args.sources.length === 0) return [];
  if (args.sources.length > MAX_HARVEST_SOURCES_PER_TX) {
    throw new Error(`At most ${MAX_HARVEST_SOURCES_PER_TX} accounts per harvest transaction.`);
  }
  return [createHarvestWithheldTokensToMintInstruction(args.mint, args.sources)];
}

/**
 * Withdraw fees already harvested onto the mint into the authority's own
 * associated token account (created idempotently if missing). Token-2022 only;
 * requires the connected wallet to be the withdraw-withheld authority.
 */
export function buildWithdrawWithheldFromMint(args: {
  mint: PublicKey;
  withdrawAuthority: PublicKey;
}): { instructions: TransactionInstruction[]; destination: PublicKey } {
  const destination = getAssociatedTokenAddressSync(
    args.mint,
    args.withdrawAuthority,
    false,
    TOKEN_2022_PROGRAM_ID
  );
  return {
    destination,
    instructions: [
      createAssociatedTokenAccountIdempotentInstruction(
        args.withdrawAuthority,
        destination,
        args.withdrawAuthority,
        args.mint,
        TOKEN_2022_PROGRAM_ID
      ),
      createWithdrawWithheldTokensFromMintInstruction(
        args.mint,
        destination,
        args.withdrawAuthority,
        [],
        TOKEN_2022_PROGRAM_ID
      ),
    ],
  };
}

// --- On-chain inspection (network reads) ------------------------------------

export interface ManagedMintFacts extends MintFacts {
  /** Transfer-fee extension details, when present (Token-2022 only). */
  transferFee: {
    withdrawWithheldAuthority: string | null;
    /** Fees already harvested to the mint, ready to withdraw. */
    withheldOnMint: bigint;
  } | null;
}

/**
 * Read one mint account and produce the facts the manage page needs — the
 * fair-launch fields (superset of lib/fairLaunch's MintFacts, so
 * buildFairLaunchReport renders directly) plus fee-collection state.
 */
export async function inspectManagedMint(
  connection: Connection,
  mintAddress: string
): Promise<ManagedMintFacts | null> {
  const mintPubkey = new PublicKey(mintAddress);
  const info = await connection.getAccountInfo(mintPubkey);
  if (!info) return null;

  const owner = info.owner.toBase58();
  const isToken2022 = owner === TOKEN_2022_PROGRAM_ID.toBase58();
  if (!isToken2022 && owner !== TOKEN_PROGRAM_ID.toBase58()) return null;

  const mint = unpackMint(mintPubkey, info, info.owner);

  let metadata: MintFacts["metadata"] = null;
  if (isToken2022 && getMetadataPointerState(mint)?.metadataAddress?.equals(mintPubkey)) {
    const data = getExtensionData(ExtensionType.TokenMetadata, mint.tlvData);
    if (data) {
      const tm = unpackTokenMetadata(data);
      metadata = {
        name: tm.name,
        symbol: tm.symbol,
        uri: tm.uri,
        updateAuthority: tm.updateAuthority?.toBase58() ?? null,
      };
    }
  }

  const feeConfig = isToken2022 ? getTransferFeeConfig(mint) : null;

  return {
    mintAddress,
    tokenStandard: isToken2022 ? "token-2022" : "spl-legacy",
    supply: mint.supply,
    decimals: mint.decimals,
    mintAuthority: mint.mintAuthority?.toBase58() ?? null,
    freezeAuthority: mint.freezeAuthority?.toBase58() ?? null,
    permanentDelegate: isToken2022
      ? getPermanentDelegate(mint)?.delegate.toBase58() ?? null
      : null,
    transferFeeBps: feeConfig ? feeConfig.newerTransferFee.transferFeeBasisPoints : null,
    nonTransferable: isToken2022 ? getNonTransferable(mint) !== null : false,
    mintCloseAuthority: isToken2022
      ? getMintCloseAuthority(mint)?.closeAuthority?.toBase58() ?? null
      : null,
    metadata,
    transferFee: feeConfig
      ? {
          withdrawWithheldAuthority:
            feeConfig.withdrawWithheldAuthority?.toBase58() ?? null,
          withheldOnMint: feeConfig.withheldAmount,
        }
      : null,
  };
}

export interface WithheldAccount {
  address: PublicKey;
  withheldAmount: bigint;
}

/**
 * Find holder token accounts carrying withheld transfer fees, so they can be
 * harvested to the mint. Uses getProgramAccounts (mint pubkey at offset 0 of
 * every token account) — supported on dedicated RPCs (Helius/QuickNode); on
 * providers that refuse the scan this throws and the UI degrades gracefully
 * (withdraw-from-mint still works).
 */
export async function findAccountsWithWithheldFees(
  connection: Connection,
  mintAddress: string,
  { limit = MAX_HARVEST_SOURCES_PER_TX }: { limit?: number } = {}
): Promise<WithheldAccount[]> {
  const mintPubkey = new PublicKey(mintAddress);
  const accounts = await connection.getProgramAccounts(TOKEN_2022_PROGRAM_ID, {
    commitment: "confirmed",
    filters: [{ memcmp: { offset: 0, bytes: mintPubkey.toBase58() } }],
  });

  const withheld: WithheldAccount[] = [];
  for (const { pubkey, account } of accounts) {
    try {
      const parsed = unpackAccount(pubkey, account, TOKEN_2022_PROGRAM_ID);
      const fee = getTransferFeeAmount(parsed);
      if (fee && fee.withheldAmount > 0n) {
        withheld.push({ address: pubkey, withheldAmount: fee.withheldAmount });
        if (withheld.length >= limit) break;
      }
    } catch {
      // Not a parseable token account — skip.
    }
  }
  return withheld;
}
