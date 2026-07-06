import type { SolanaMintAdapter, SolanaChainContext } from "../types";
import {
  buildMintInstructions,
  type BuildMintInstructionsParams,
  type BuildMintInstructionsResult,
} from "../../orchestrator";
import {
  buildMetadataAttachmentInstructions,
  type BuildMetadataAttachmentInstructionsParams,
} from "../../metadataAttachment";

/** Token-2022 composable modules — current production path. */
export const token2022Adapter: SolanaMintAdapter = {
  tokenStandard: "token-2022",
  displayName: "Solana (Token-2022)",

  async buildMintInstructions(
    _ctx: SolanaChainContext,
    params: BuildMintInstructionsParams
  ): Promise<BuildMintInstructionsResult> {
    return buildMintInstructions(params);
  },

  buildMetadataAttachmentInstructions(
    _ctx: SolanaChainContext,
    params: BuildMetadataAttachmentInstructionsParams
  ) {
    return buildMetadataAttachmentInstructions(params);
  },
};
