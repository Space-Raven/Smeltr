import type { Connection } from "@solana/web3.js";
import type { SolanaTokenStandard } from "./types";

/** Network + mint program variant for Solana deployments. */
export type SolanaDeploymentTarget = {
  chain: "solana";
  cluster: SolanaCluster;
  tokenStandard: SolanaTokenStandard;
};

/** Future EVM — interface only; no adapter registered yet. */
export type EvmDeploymentTarget = {
  chain: "evm";
  evmChainId: "base" | "ethereum";
};

export type DeploymentTarget = SolanaDeploymentTarget | EvmDeploymentTarget;

export type SolanaCluster = "mainnet-beta" | "devnet" | "testnet";

/** Stable DB/API `chainId` string (not the adapter singleton). */
export type ChainRecordId = "solana-mainnet" | "solana-devnet" | "evm-base" | "evm-ethereum";

export interface DeploymentCapabilities {
  extensionModules: boolean;
  nativeTokenMetadata: boolean;
  metaplexMetadata: boolean;
  twoStepMetadataFlow: boolean;
  mcpModuleValidation: boolean;
  protocolFeeSol: boolean;
}

export function clusterFromConnection(connection: Connection): SolanaCluster {
  const url = connection.rpcEndpoint.toLowerCase();
  if (url.includes("devnet")) return "devnet";
  if (url.includes("testnet")) return "testnet";
  return "mainnet-beta";
}

export function defaultSolanaTarget(connection: Connection): SolanaDeploymentTarget {
  return {
    chain: "solana",
    cluster: clusterFromConnection(connection),
    tokenStandard: "token-2022",
  };
}

export function chainRecordKey(target: DeploymentTarget): ChainRecordId {
  if (target.chain === "solana") {
    return target.cluster === "mainnet-beta" ? "solana-mainnet" : "solana-devnet";
  }
  return target.evmChainId === "base" ? "evm-base" : "evm-ethereum";
}

export function getDeploymentCapabilities(target: DeploymentTarget): DeploymentCapabilities {
  if (target.chain === "evm") {
    return {
      extensionModules: true,
      nativeTokenMetadata: false,
      metaplexMetadata: false,
      twoStepMetadataFlow: false,
      mcpModuleValidation: false,
      protocolFeeSol: false,
    };
  }

  if (target.tokenStandard === "spl-legacy") {
    return {
      extensionModules: false,
      nativeTokenMetadata: false,
      metaplexMetadata: true,
      twoStepMetadataFlow: true,
      mcpModuleValidation: false, // A3
      protocolFeeSol: true,
    };
  }

  return {
    extensionModules: true,
    nativeTokenMetadata: true,
    metaplexMetadata: false,
    twoStepMetadataFlow: true,
    mcpModuleValidation: true,
    protocolFeeSol: true,
  };
}

export function assertSolanaTarget(target: DeploymentTarget): SolanaDeploymentTarget {
  if (target.chain !== "solana") {
    throw new Error(`Expected Solana deployment target, got "${target.chain}"`);
  }
  return target;
}
