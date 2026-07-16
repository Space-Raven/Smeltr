import { clusterFromRpcUrl } from "./cluster";

/** Hostnames that rate-limit under real traffic — not suitable for production beta. */
export const PUBLIC_RATE_LIMITED_RPC_HOSTS = [
  "api.mainnet-beta.solana.com",
  "api.devnet.solana.com",
  "api.testnet.solana.com",
] as const;

const BASE58_PUBKEY = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export interface BetaBlocker {
  id: "rpc" | "sweeper" | "mainnet-smoke";
  label: string;
  /** Automated checks passed — manual smokes may still be open. */
  automatedReady: boolean;
  detail: string;
}

export interface SweeperReadiness {
  cronSecretConfigured: boolean;
  founderConfigured: boolean;
  founderValidBase58: boolean;
  irysKeyConfigured: boolean;
  automatedReady: boolean;
}

export interface RpcReadiness {
  configured: boolean;
  cluster: ReturnType<typeof clusterFromRpcUrl> | null;
  usesPublicRateLimitedEndpoint: boolean;
  automatedReady: boolean;
}

export interface BetaReadinessReport {
  /** All automated beta blockers satisfied (excludes manual mainnet smoke). */
  automatedReady: boolean;
  blockers: BetaBlocker[];
  rpc: RpcReadiness;
  sweeper: SweeperReadiness;
  denylist: { configured: boolean; keyCount: number };
}

function parseDenylistCount(raw: string | undefined): number {
  if (!raw?.trim()) return 0;
  return raw.split(/[\s,]+/).filter((k) => k.length > 0).length;
}

export function isPublicRateLimitedRpc(url: string): boolean {
  const lower = url.toLowerCase();
  return PUBLIC_RATE_LIMITED_RPC_HOSTS.some((host) => lower.includes(host));
}

/**
 * Assess production beta blockers from env (no secret values returned).
 * Used by /api/ops/readiness and local verify scripts.
 */
export function assessBetaReadiness(
  env: Record<string, string | undefined>
): BetaReadinessReport {
  const rpcUrl = env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim() ?? "";
  const rpcConfigured = rpcUrl.length > 0;
  const usesPublicRateLimitedEndpoint = rpcConfigured && isPublicRateLimitedRpc(rpcUrl);
  const rpcCluster = rpcConfigured ? clusterFromRpcUrl(rpcUrl) : null;

  const rpcAutomatedReady = rpcConfigured && !usesPublicRateLimitedEndpoint;

  const cronSecretConfigured = !!env.CRON_SECRET?.trim();
  const founderRaw = env.PLATFORM_FOUNDER_PUBKEY?.trim() ?? "";
  const founderConfigured = founderRaw.length > 0;
  const founderValidBase58 = founderConfigured && BASE58_PUBKEY.test(founderRaw);
  const irysKeyConfigured = !!env.PLATFORM_IRYS_PRIVATE_KEY?.trim();

  const sweeperAutomatedReady =
    cronSecretConfigured && founderValidBase58 && irysKeyConfigured;

  const denylistRaw = env.NEXT_PUBLIC_PLATFORM_AUTHORITY_DENYLIST;
  const feeRecipient = env.NEXT_PUBLIC_PLATFORM_FEE_RECIPIENT?.trim();
  const denylistKeys = parseDenylistCount(denylistRaw);
  const denylistCount =
    denylistKeys + (feeRecipient && !denylistRaw?.includes(feeRecipient) ? 1 : 0);

  const blockers: BetaBlocker[] = [
    {
      id: "rpc",
      label: "Dedicated mainnet RPC",
      automatedReady: rpcAutomatedReady,
      detail: !rpcConfigured
        ? "Set NEXT_PUBLIC_SOLANA_RPC_URL to a Helius/QuickNode mainnet URL (build-time NEXT_PUBLIC_ var)."
        : usesPublicRateLimitedEndpoint
          ? `RPC points at public Solana endpoint (${rpcCluster}) — rate-limits getBalance/confirmTransaction under traffic.`
          : `RPC configured (${rpcCluster}).`,
    },
    {
      id: "sweeper",
      label: "Irys sweeper cron env",
      automatedReady: sweeperAutomatedReady,
      detail: sweeperAutomatedReady
        ? "CRON_SECRET, PLATFORM_FOUNDER_PUBKEY, and PLATFORM_IRYS_PRIVATE_KEY are set."
        : [
            !cronSecretConfigured && "CRON_SECRET missing",
            !founderConfigured && "PLATFORM_FOUNDER_PUBKEY missing",
            founderConfigured && !founderValidBase58 && "PLATFORM_FOUNDER_PUBKEY invalid",
            !irysKeyConfigured && "PLATFORM_IRYS_PRIVATE_KEY missing",
          ]
            .filter(Boolean)
            .join("; ") || "Incomplete sweeper configuration.",
    },
    {
      id: "mainnet-smoke",
      label: "Live mainnet mint smoke test",
      automatedReady: false,
      detail:
        "Partial (2026-07-07): production mainnet mint verified. Formal checklist " +
        "(SIWS/dashboard B3-6, Classic SPL B3-7) not signed off — docs/BETA_LAUNCH_CHECKLIST.md.",
    },
  ];

  const automatedReady = blockers
    .filter((b) => b.id !== "mainnet-smoke")
    .every((b) => b.automatedReady);

  return {
    automatedReady,
    blockers,
    rpc: {
      configured: rpcConfigured,
      cluster: rpcCluster,
      usesPublicRateLimitedEndpoint,
      automatedReady: rpcAutomatedReady,
    },
    sweeper: {
      cronSecretConfigured,
      founderConfigured,
      founderValidBase58,
      irysKeyConfigured,
      automatedReady: sweeperAutomatedReady,
    },
    denylist: {
      configured: denylistCount > 0,
      keyCount: denylistCount,
    },
  };
}
