import { clusterFromRpcUrl } from "./cluster";

const DEVNET_FALLBACK = "https://api.devnet.solana.com";

/**
 * Resolves the client RPC endpoint.
 *
 * Production (NODE_ENV=production or VERCEL=1): NEXT_PUBLIC_SOLANA_RPC_URL is
 * **required** — we never silently default to devnet on a live deploy.
 *
 * Development: falls back to public devnet for local convenience.
 */
export function resolveClientRpcUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim();
  if (configured) return configured;

  const isProd =
    process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

  if (isProd) {
    throw new Error(
      "NEXT_PUBLIC_SOLANA_RPC_URL is not configured. Set a mainnet RPC URL in production."
    );
  }

  return DEVNET_FALLBACK;
}

/** True when production build is missing a required RPC URL. */
export function isRpcMisconfigured(): boolean {
  if (process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim()) return false;
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

export function describeRpcEndpoint(rpcUrl: string): string {
  return clusterFromRpcUrl(rpcUrl);
}
