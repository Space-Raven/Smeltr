export const LIMITS = {
  MAX_TX_SIZE: 1232,
  IRYS_FREE_THRESHOLD: 100 * 1024,
  IMAGE_MAX_BYTES: 95 * 1024,
  IMAGE_MAX_DIMENSION: 512,
};

export const TIMEOUTS = {
  DEFAULT_FETCH_MS: 30_000,
  TRANSACTION_CONFIRMATION_MS: 60_000,
};

export const API_ENDPOINTS = {
  DEPLOYMENTS: "/api/deployments",
  AUTH_NONCE: "/api/auth/nonce",
  AUTH_VERIFY: "/api/auth/verify",
  AUTH_SIGNOUT: "/api/auth/signout",
} as const;

export const EXPLORER = {
  BASE_URL: "https://explorer.solana.com",
} as const;

/**
 * Platform protocol fee (per-mint), captured in transaction 1.
 *
 * Canonical pricing: 0.03–0.05 SOL (corporate/monetization-strategy.md §1).
 * Set to 0.03 SOL — the cost-efficient entry point that undercuts competitors
 * (typically 0.05–0.1 SOL). Adjust here as the competitive benchmark settles.
 *
 * The fee only applies when PLATFORM_FEE_RECIPIENT is configured; if unset, no
 * fee is added (local dev / fee-disabled environments). The fee is always shown
 * to the user as an explicit line item in DeploymentReviewPanel — never hidden.
 *
 * NOTE (Smeltr+): subscribers receive a fee waiver/discount. That gating is a
 * follow-up — wire it where the plan is prepared once the subscription check is
 * available, by overriding feeLamports (e.g. 0) for active subscribers.
 */
export const PLATFORM_FEE_LAMPORTS = 30_000_000; // 0.03 SOL
export const PLATFORM_FEE_RECIPIENT = process.env.NEXT_PUBLIC_PLATFORM_FEE_RECIPIENT ?? "";
