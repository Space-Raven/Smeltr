import { Connection, PublicKey } from "@solana/web3.js";
import {
  buildMintInstructions,
  BuildMintInstructionsResult,
  ModuleSelection,
} from "@platform/tx-builder";
import { ModuleId, MetadataProvider, TokenMetadataInput } from "@platform/module-registry";
import { HIGH_IMPACT_MODULES } from "./risk";

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
  const result = await buildMintInstructions(args);

  const highImpactModules = args.modules
    .map((m) => m.id)
    .filter((id) => HIGH_IMPACT_MODULES.has(id));

  return {
    ...result,
    highImpactModules,
    requiresExplicitConfirmation: highImpactModules.length > 0,
  };
}
