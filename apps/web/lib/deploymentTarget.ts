import type { DeploymentTarget, SolanaDeploymentTarget, SolanaTokenStandard } from "@platform/tx-builder";
import {
  defaultSolanaTarget,
  getDeploymentCapabilities,
  chainRecordKey,
  assertSolanaTarget,
} from "@platform/tx-builder";
import { DEFAULT_CHAIN_ID } from "./constants";

export type { DeploymentTarget, SolanaDeploymentTarget, SolanaTokenStandard };
export { defaultSolanaTarget, getDeploymentCapabilities, chainRecordKey, assertSolanaTarget, DEFAULT_CHAIN_ID };

/** Cluster derived from wallet connection at prepare time */
export function solanaTargetFromConnection(
  connection: import("@solana/web3.js").Connection,
  tokenStandard: SolanaTokenStandard = "token-2022"
): SolanaDeploymentTarget {
  return {
    ...defaultSolanaTarget(connection),
    tokenStandard,
  };
}

/** Reconstruct target from a persisted deployment record */
export function solanaTargetFromRecord(
  chainId: string,
  tokenStandard: string | null | undefined
): SolanaDeploymentTarget {
  return {
    chain: "solana",
    cluster: chainId === "solana-devnet" ? "devnet" : "mainnet-beta",
    tokenStandard: tokenStandard === "spl-legacy" ? "spl-legacy" : "token-2022",
  };
}

export function deploymentRecordKey(chainId: string, mintAddress: string) {
  return { chainId, mintAddress };
}
