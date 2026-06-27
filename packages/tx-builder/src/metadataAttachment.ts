import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import {
  MetadataProvider,
  TokenMetadataInputSchema,
  ModuleContext,
} from "@platform/module-registry";
import { ModuleValidationError } from "./orchestrator";

export interface BuildMetadataAttachmentInstructionsParams {
  mint: PublicKey;
  payer: PublicKey;
  userWallet: PublicKey;
  decimals: number;
  provider: MetadataProvider;
  input: unknown;
}

/**
 * Builds transaction 2's instructions: attaching metadata to a mint
 * created (and confirmed) via transaction 1
 * (buildMintInstructions). No connection needed — transaction 1 already
 * funded the rent for this resize (see CLAUDE.md).
 *
 * Call this only after transaction 1 has been confirmed on-chain.
 */
export function buildMetadataAttachmentInstructions(
  args: BuildMetadataAttachmentInstructionsParams
): TransactionInstruction[] {
  const parsed = TokenMetadataInputSchema.safeParse(args.input);
  if (!parsed.success) {
    throw new ModuleValidationError(parsed.error.issues, "metadata");
  }

  const ctx: ModuleContext = {
    mint: args.mint,
    payer: args.payer,
    userWallet: args.userWallet,
    decimals: args.decimals,
    programId: TOKEN_2022_PROGRAM_ID,
  };

  return args.provider.buildPostInitInstructions(ctx, parsed.data);
}
