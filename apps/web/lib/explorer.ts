/**
 * Cluster-aware Solana Explorer links.
 *
 * explorer.solana.com defaults to mainnet — a devnet transaction linked
 * without `?cluster=devnet` shows "not found", which reads like a failed
 * deployment to the user. Derive the cluster from the RPC endpoint the app is
 * actually using.
 */

export function explorerClusterParam(rpcEndpoint: string): string {
  if (rpcEndpoint.includes("devnet")) return "?cluster=devnet";
  if (rpcEndpoint.includes("testnet")) return "?cluster=testnet";
  return "";
}

export function explorerTxUrl(signature: string, rpcEndpoint: string): string {
  return `https://explorer.solana.com/tx/${signature}${explorerClusterParam(rpcEndpoint)}`;
}
