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
