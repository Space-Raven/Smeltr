import type { TransactionInstruction } from "@solana/web3.js";
import type {
  BuildMintInstructionsParams,
  BuildMintInstructionsResult,
} from "../orchestrator";
import type { BuildMetadataAttachmentInstructionsParams } from "../metadataAttachment";
import type { ChainRecordId } from "./deploymentTarget";

export type SolanaTokenStandard = "token-2022" | "spl-legacy";

/**
 * Solana mint program adapter (Token-2022 or classic SPL).
 * Network (mainnet/devnet) lives on ChainContext.chainRecordId — not on the adapter instance.
 */
export interface SolanaMintAdapter {
  readonly tokenStandard: SolanaTokenStandard;
  readonly displayName: string;

  buildMintInstructions(
    ctx: SolanaChainContext,
    params: BuildMintInstructionsParams
  ): Promise<BuildMintInstructionsResult>;

  buildMetadataAttachmentInstructions(
    ctx: SolanaChainContext,
    params: BuildMetadataAttachmentInstructionsParams
  ): Promise<TransactionInstruction[]> | TransactionInstruction[];
}

export interface SolanaChainContext {
  chainRecordId: ChainRecordId;
  connection: import("@solana/web3.js").Connection;
}

/** @deprecated Use SolanaMintAdapter + deploymentTarget — kept for transitional imports */
export type ChainAdapter = SolanaMintAdapter;

/** @deprecated Use chainRecordKey(target) */
export type ChainId = ChainRecordId;

export interface SolanaAdapterOptions {
  tokenStandard: SolanaTokenStandard;
}

export function solanaChainIdFromCluster(cluster: "mainnet-beta" | "devnet" | "testnet"): ChainRecordId {
  if (cluster === "mainnet-beta") return "solana-mainnet";
  return "solana-devnet";
}
