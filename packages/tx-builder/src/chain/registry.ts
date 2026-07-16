import type { SolanaMintAdapter, SolanaTokenStandard } from "./types";
import type { ChainRecordId } from "./deploymentTarget";
import { token2022Adapter } from "./solana/token2022Adapter";
import { legacySplAdapter } from "./solana/legacySplAdapter";
import type { DeploymentTarget, SolanaDeploymentTarget } from "./deploymentTarget";
import { assertSolanaTarget, chainRecordKey } from "./deploymentTarget";

const SOLANA_ADAPTERS: Record<SolanaTokenStandard, SolanaMintAdapter> = {
  "token-2022": token2022Adapter,
  "spl-legacy": legacySplAdapter,
};

export function getSolanaMintAdapter(tokenStandard: SolanaTokenStandard): SolanaMintAdapter {
  return SOLANA_ADAPTERS[tokenStandard];
}

/** @deprecated Use getSolanaMintAdapter */
export const getSolanaAdapter = getSolanaMintAdapter;

export function getSolanaMintAdapterForTarget(target: SolanaDeploymentTarget): SolanaMintAdapter {
  return getSolanaMintAdapter(target.tokenStandard);
}

export function resolveSolanaContext(target: DeploymentTarget): {
  adapter: SolanaMintAdapter;
  chainRecordId: ChainRecordId;
} {
  const solana = assertSolanaTarget(target);
  return {
    adapter: getSolanaMintAdapter(solana.tokenStandard),
    chainRecordId: chainRecordKey(target),
  };
}

/** @deprecated Use resolveSolanaContext — generic multi-chain resolver comes with EVM */
export function getChainAdapter(
  chainRecordId: ChainRecordId,
  options?: { solanaTokenStandard?: SolanaTokenStandard }
): SolanaMintAdapter {
  if (!chainRecordId.startsWith("solana-")) {
    throw new Error(`[chain] No adapter registered for chainRecordId "${chainRecordId}"`);
  }
  return getSolanaMintAdapter(options?.solanaTokenStandard ?? "token-2022");
}

export { token2022Adapter, legacySplAdapter };
