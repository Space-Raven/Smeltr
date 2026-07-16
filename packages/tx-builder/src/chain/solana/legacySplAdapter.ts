import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  getMinimumBalanceForRentExemptMint,
} from "@solana/spl-token";
import { assertNoPlatformAuthority, assertPlatformDenylistConfigured } from "@platform/module-registry";
import type { SolanaMintAdapter, SolanaChainContext } from "../types";
import type { BuildMintInstructionsParams, BuildMintInstructionsResult } from "../../orchestrator";
import {
  buildMetadataAttachmentInstructions,
  type BuildMetadataAttachmentInstructionsParams,
} from "../../metadataAttachment";

/**
 * Classic SPL Token (TOKEN_PROGRAM_ID) — no Token-2022 extensions.
 * Metadata via Metaplex metadata PDA (transaction 2).
 */
export const legacySplAdapter: SolanaMintAdapter = {
  tokenStandard: "spl-legacy",
  displayName: "Solana (Classic SPL)",

  async buildMintInstructions(
    _ctx: SolanaChainContext,
    params: BuildMintInstructionsParams
  ): Promise<BuildMintInstructionsResult> {
    if (params.modules.length > 0) {
      throw new Error(
        "[legacy-spl] Extension modules require Token-2022. Switch token type or remove modules."
      );
    }
    assertPlatformDenylistConfigured();
    assertNoPlatformAuthority(params.mintAuthority, "mintAuthority", "legacy-spl");
    if (params.freezeAuthority) {
      assertNoPlatformAuthority(params.freezeAuthority, "freezeAuthority", "legacy-spl");
    }

    const rentExemptLamports = await getMinimumBalanceForRentExemptMint(params.connection);
    const createAccount = SystemProgram.createAccount({
      fromPubkey: params.payer,
      newAccountPubkey: params.mint,
      space: MINT_SIZE,
      lamports: rentExemptLamports,
      programId: TOKEN_PROGRAM_ID,
    });

    const initMint = createInitializeMintInstruction(
      params.mint,
      params.decimals,
      params.mintAuthority,
      params.freezeAuthority,
      TOKEN_PROGRAM_ID
    );

    const instructions: TransactionInstruction[] = [createAccount, initMint];

    if (params.platformFee && params.platformFee.feeLamports > 0) {
      instructions.push(
        SystemProgram.transfer({
          fromPubkey: params.payer,
          toPubkey: params.platformFee.feeRecipient,
          lamports: params.platformFee.feeLamports,
        })
      );
    }

    return {
      instructions,
      mintAccountSpace: MINT_SIZE,
      rentExemptLamports,
      warnings: [],
      platformFee: params.platformFee ?? null,
    };
  },

  buildMetadataAttachmentInstructions(
    _ctx: SolanaChainContext,
    params: BuildMetadataAttachmentInstructionsParams
  ): TransactionInstruction[] {
    return buildMetadataAttachmentInstructions({
      ...params,
      mintProgramId: TOKEN_PROGRAM_ID,
    });
  },
};

/** Smoke helper for unit tests — legacy mint without platform fee. */
export async function buildLegacySplMintInstructions(
  connection: Connection,
  params: Omit<BuildMintInstructionsParams, "modules" | "metadata" | "platformFee">
): Promise<BuildMintInstructionsResult> {
  return legacySplAdapter.buildMintInstructions(
    { chainRecordId: "solana-mainnet", connection },
    { ...params, modules: [], metadata: undefined, platformFee: undefined }
  );
}
