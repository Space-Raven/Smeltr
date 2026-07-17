/**
 * Solana cluster detection from an RPC URL.
 * Used for network badges, copy, and guardrails — not security-critical
 * (users can point RPC at any endpoint).
 */
export type SolanaCluster = "mainnet" | "devnet" | "testnet" | "localnet" | "unknown";

export function clusterFromRpcUrl(rpcUrl: string): SolanaCluster {
  const lower = rpcUrl.toLowerCase();
  if (lower.includes("devnet")) return "devnet";
  if (lower.includes("testnet")) return "testnet";
  if (lower.includes("localhost") || lower.includes("127.0.0.1")) return "localnet";
  if (lower.includes("mainnet")) return "mainnet";
  // Public mainnet endpoint has no "mainnet" in the path
  if (lower.includes("api.mainnet-beta.solana.com")) return "mainnet";
  return "unknown";
}

export function clusterLabel(cluster: SolanaCluster): string {
  switch (cluster) {
    case "mainnet":
      return "Mainnet";
    case "devnet":
      return "Devnet";
    case "testnet":
      return "Testnet";
    case "localnet":
      return "Localnet";
    default:
      return "Unknown network";
  }
}

export function isProductionDeployTarget(cluster: SolanaCluster): boolean {
  return cluster === "mainnet";
}

/**
 * Chain record ids the deployment index accepts (Audit-2 High-3).
 * Solana-only until a real second-chain adapter ships — EVM/Cosmos ids are
 * rejected at the API boundary so chain separation can't be corrupted early.
 * Mirrors `chainRecordKey` in @platform/tx-builder (solana-mainnet | solana-devnet).
 */
export const SUPPORTED_CHAIN_IDS = ["solana-mainnet", "solana-devnet"] as const;
export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

/**
 * The chain record id a given RPC cluster is authoritative for, or null when
 * the cluster gives no signal (localnet, unknown/custom hostnames) — callers
 * skip the consistency check rather than guessing.
 */
export function chainIdForCluster(cluster: SolanaCluster): SupportedChainId | null {
  if (cluster === "mainnet") return "solana-mainnet";
  if (cluster === "devnet") return "solana-devnet";
  return null;
}
