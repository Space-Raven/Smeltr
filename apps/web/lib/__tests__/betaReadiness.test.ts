import {
  assessBetaReadiness,
  isPublicRateLimitedRpc,
  PUBLIC_RATE_LIMITED_RPC_HOSTS,
} from "../betaReadiness";

describe("assessBetaReadiness", () => {
  it("flags missing RPC as not ready", () => {
    const r = assessBetaReadiness({});
    expect(r.rpc.automatedReady).toBe(false);
    expect(r.automatedReady).toBe(false);
    expect(r.blockers.find((b) => b.id === "rpc")?.automatedReady).toBe(false);
  });

  it("rejects public mainnet-beta RPC as rate-limited", () => {
    const r = assessBetaReadiness({
      NEXT_PUBLIC_SOLANA_RPC_URL: "https://api.mainnet-beta.solana.com",
      CRON_SECRET: "x",
      PLATFORM_FOUNDER_PUBKEY: "So11111111111111111111111111111111111111112",
      PLATFORM_IRYS_PRIVATE_KEY: "fake",
    });
    expect(r.rpc.usesPublicRateLimitedEndpoint).toBe(true);
    expect(r.rpc.automatedReady).toBe(false);
  });

  it("accepts dedicated Helius-style RPC", () => {
    const r = assessBetaReadiness({
      NEXT_PUBLIC_SOLANA_RPC_URL: "https://mainnet.helius-rpc.com/?api-key=test",
      CRON_SECRET: "secret",
      PLATFORM_FOUNDER_PUBKEY: "So11111111111111111111111111111111111111112",
      PLATFORM_IRYS_PRIVATE_KEY: "5K...",
    });
    expect(r.rpc.automatedReady).toBe(true);
    expect(r.rpc.cluster).toBe("mainnet");
  });

  it("requires sweeper env trio", () => {
    const partial = assessBetaReadiness({
      NEXT_PUBLIC_SOLANA_RPC_URL: "https://mainnet.helius-rpc.com/?api-key=test",
      CRON_SECRET: "secret",
    });
    expect(partial.sweeper.automatedReady).toBe(false);

    const full = assessBetaReadiness({
      NEXT_PUBLIC_SOLANA_RPC_URL: "https://mainnet.helius-rpc.com/?api-key=test",
      CRON_SECRET: "secret",
      PLATFORM_FOUNDER_PUBKEY: "So11111111111111111111111111111111111111112",
      PLATFORM_IRYS_PRIVATE_KEY: "abc",
    });
    expect(full.sweeper.automatedReady).toBe(true);
    expect(full.automatedReady).toBe(true);
  });

  it("mainnet smoke blocker is always manual", () => {
    const r = assessBetaReadiness({
      NEXT_PUBLIC_SOLANA_RPC_URL: "https://mainnet.helius-rpc.com/?api-key=test",
      CRON_SECRET: "s",
      PLATFORM_FOUNDER_PUBKEY: "So11111111111111111111111111111111111111112",
      PLATFORM_IRYS_PRIVATE_KEY: "k",
    });
    const smoke = r.blockers.find((b) => b.id === "mainnet-smoke");
    expect(smoke?.automatedReady).toBe(false);
  });
});

describe("isPublicRateLimitedRpc", () => {
  it("detects known public endpoints", () => {
    for (const host of PUBLIC_RATE_LIMITED_RPC_HOSTS) {
      expect(isPublicRateLimitedRpc(`https://${host}`)).toBe(true);
    }
    expect(isPublicRateLimitedRpc("https://mainnet.helius-rpc.com/?api-key=x")).toBe(false);
  });
});
