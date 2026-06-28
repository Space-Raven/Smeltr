import { Connection, PublicKey } from "@solana/web3.js";
import {
  buildMintInstructions,
  BuildMintInstructionsResult,
  ModuleSelection,
  PlatformFeeConfig,
} from "@platform/tx-builder";
import { ModuleId, MetadataProvider, TokenMetadataInput } from "@platform/module-registry";
import { HIGH_IMPACT_MODULES } from "./risk";
import { PLATFORM_FEE_LAMPORTS, PLATFORM_FEE_RECIPIENT } from "./constants";

export interface DeploymentPlan extends BuildMintInstructionsResult {
  highImpactModules: ModuleId[];
  requiresExplicitConfirmation: boolean;
}

export interface BuildDeploymentPlanArgs {
  connection: Connection;
  payer: PublicKey;
  mint: PublicKey;
  userWallet: PublicKey;
  decimals: number;
  mintAuthority: PublicKey;
  freezeAuthority: PublicKey | null;
  modules: ModuleSelection[];
  metadata?: {
    provider: MetadataProvider;
    input: TokenMetadataInput;
  };
}

/**
 * Thin wrapper over `buildMintInstructions` that additionally flags any
 * selected modules requiring explicit user acknowledgment before the
 * frontend proceeds to the sign/submit step.
 */
export async function buildDeploymentPlan(
  args: BuildDeploymentPlanArgs
): Promise<DeploymentPlan> {
  // Apply the platform protocol fee when a recipient wallet is configured.
  // Left undefined (no fee) when PLATFORM_FEE_RECIPIENT is unset — e.g. local
  // dev or any environment where fee capture is intentionally disabled.
  let platformFee: PlatformFeeConfig | undefined;
  if (PLATFORM_FEE_RECIPIENT) {
    platformFee = {
      feeLamports: PLATFORM_FEE_LAMPORTS,
      feeRecipient: new PublicKey(PLATFORM_FEE_RECIPIENT),
    };
  }

  const result = await buildMintInstructions({ ...args, platformFee });

  const highImpactModules = args.modules
    .map((m) => m.id)
    .filter((id) => HIGH_IMPACT_MODULES.has(id));

  return {
    ...result,
    highImpactModules,
    requiresExplicitConfirmation: highImpactModules.length > 0,
  };
}
