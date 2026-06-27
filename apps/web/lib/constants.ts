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
