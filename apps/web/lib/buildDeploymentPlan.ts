import { Connection, PublicKey } from "@solana/web3.js";
import {
  BuildMintInstructionsResult,
  ModuleSelection,
  PlatformFeeConfig,
  resolveSolanaContext,
  type DeploymentTarget,
} from "@platform/tx-builder";
import { ModuleId, MetadataProvider, TokenMetadataInput } from "@platform/module-registry";
import { HIGH_IMPACT_MODULES } from "./risk";
import { PLATFORM_FEE_LAMPORTS, PLATFORM_FEE_RECIPIENT } from "./constants";

export interface DeploymentPlan extends BuildMintInstructionsResult {
  highImpactModules: ModuleId[];
  requiresExplicitConfirmation: boolean;
  target: DeploymentTarget;
}

export interface BuildDeploymentPlanArgs {
  target: DeploymentTarget;
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
 * Builds a deployment plan via the Solana mint adapter for `target.tokenStandard`.
 * Flags high-impact modules for explicit acknowledgment before signing.
 */
export async function buildDeploymentPlan(
  args: BuildDeploymentPlanArgs
): Promise<DeploymentPlan> {
  let platformFee: PlatformFeeConfig | undefined;
  if (PLATFORM_FEE_RECIPIENT) {
    platformFee = {
      feeLamports: PLATFORM_FEE_LAMPORTS,
      feeRecipient: new PublicKey(PLATFORM_FEE_RECIPIENT),
    };
  }

  const { adapter, chainRecordId } = resolveSolanaContext(args.target);
  const result = await adapter.buildMintInstructions(
    { chainRecordId, connection: args.connection },
    { ...args, platformFee }
  );

  const highImpactModules = args.modules
    .map((m) => m.id)
    .filter((id) => HIGH_IMPACT_MODULES.has(id));

  return {
    ...result,
    highImpactModules,
    requiresExplicitConfirmation: highImpactModules.length > 0,
    target: args.target,
  };
}
