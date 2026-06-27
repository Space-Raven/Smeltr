import { TransactionInstruction } from "@solana/web3.js";
import { ExtensionType } from "@solana/spl-token";
import { z } from "zod";
import { ModuleContext } from "../schema";

export const TokenMetadataInputSchema = z.object({
  name: z.string().min(1).max(32, "Exceeds typical 32-byte on-chain name guidance"),
  symbol: z.string().min(1).max(10, "Exceeds typical 10-byte on-chain symbol guidance"),
  uri: z.string().url().max(200, "Exceeds typical 200-byte on-chain URI guidance"),
});

export type TokenMetadataInput = z.infer<typeof TokenMetadataInputSchema>;

/**
 * Minimal abstraction over a metadata standard, shaped around the
 * two-transaction deployment flow (mint creation, then a separate
 * metadata-attachment step the user explicitly continues to — this is a
 * deliberate, permanent product decision, see CLAUDE.md).
 *
 * Intentionally narrow: two phases, matching the two transactions. This is
 * NOT a general "metadata module" framework — it exists so a future second
 * provider (e.g. legacy Metaplex) can implement the same shape, but the
 * interface should be revisited once that implementation exists rather
 * than treated as final.
 */
export interface MetadataProvider {
  id: string;

  /**
   * Extension types this provider needs included in getMintLen at mint
   * creation (transaction 1). Return [] if the provider needs no
   * mint-account extension (e.g. a separate-PDA standard).
   */
  getPreInitExtensionTypes(): ExtensionType[];

  /** Instructions for transaction 1 (before initializeMint). Return [] if none. */
  buildPreInitInstructions(
    ctx: ModuleContext,
    input: TokenMetadataInput
  ): TransactionInstruction[];

  /**
   * Additional bytes this provider's metadata will occupy on the mint
   * account once transaction 2 runs. Used to overfund transaction 1's
   * CreateAccount lamports so the later resize stays rent-exempt without a
   * separate lamport transfer. Return 0 for providers using a separate
   * account (e.g. a legacy PDA-based standard).
   */
  getAdditionalMintSpace(ctx: ModuleContext, input: TokenMetadataInput): number;

  /**
   * Instructions for transaction 2, run after transaction 1 is confirmed.
   * No reallocate / lamport-transfer needed for the Token-2022 native
   * provider — see CLAUDE.md for why.
   */
  buildPostInitInstructions(
    ctx: ModuleContext,
    input: TokenMetadataInput
  ): TransactionInstruction[];
}
