import { computeSweepLamports } from "../sweep";

const SOL = 1_000_000_000; // lamports per SOL

describe("computeSweepLamports (Irys hot-wallet sweeper)", () => {
  const base = {
    reserveLamports: 0.5 * SOL,
    feeLamports: 5000,
    minSweepLamports: 0.05 * SOL,
  };

  it("does not sweep when balance is below the reserve", () => {
    const p = computeSweepLamports({ ...base, balanceLamports: 0.3 * SOL });
    expect(p.sweep).toBe(false);
    expect(p.lamports).toBe(0);
  });

  it("does not sweep when balance equals reserve + fee exactly", () => {
    const p = computeSweepLamports({ ...base, balanceLamports: 0.5 * SOL + 5000 });
    expect(p.sweep).toBe(false);
  });

  it("does not sweep dust just above the reserve (below min threshold)", () => {
    // 0.5 reserve + 5000 fee + 0.01 excess -> excess < 0.05 min
    const p = computeSweepLamports({ ...base, balanceLamports: 0.5 * SOL + 5000 + 0.01 * SOL });
    expect(p.sweep).toBe(false);
    expect(p.reason).toMatch(/minimum sweep threshold/i);
  });

  it("sweeps the excess above reserve + fee once past the threshold", () => {
    const balance = 2 * SOL;
    const p = computeSweepLamports({ ...base, balanceLamports: balance });
    expect(p.sweep).toBe(true);
    expect(p.lamports).toBe(balance - 0.5 * SOL - 5000);
  });

  it("leaves exactly reserve + fee behind after a sweep", () => {
    const balance = 3 * SOL;
    const p = computeSweepLamports({ ...base, balanceLamports: balance });
    const remaining = balance - p.lamports;
    expect(remaining).toBe(0.5 * SOL + 5000);
  });

  it("sweeps right at the minimum threshold boundary", () => {
    const balance = 0.5 * SOL + 5000 + 0.05 * SOL; // excess == min
    const p = computeSweepLamports({ ...base, balanceLamports: balance });
    expect(p.sweep).toBe(true);
    expect(p.lamports).toBe(0.05 * SOL);
  });
});

// --- resolveSweepRpc (Audit-2 Medium-3) --------------------------------------

import { resolveSweepRpc } from "../sweep";

describe("resolveSweepRpc", () => {
  const prodEnv = { NODE_ENV: "production" };

  it("refuses to run in production with no RPC configured (no devnet fallback)", () => {
    expect(resolveSweepRpc({ ...prodEnv })).toMatchObject({ ok: false });
    expect(resolveSweepRpc({ VERCEL: "1" })).toMatchObject({ ok: false });
  });

  it("falls back to public devnet in development only", () => {
    expect(resolveSweepRpc({})).toEqual({
      ok: true,
      url: "https://api.devnet.solana.com",
    });
  });

  it("prefers PLATFORM_RPC_URL over the public client URL", () => {
    const r = resolveSweepRpc({
      PLATFORM_RPC_URL: "https://mainnet.helius-rpc.com/?api-key=x",
      NEXT_PUBLIC_SOLANA_RPC_URL: "https://api.devnet.solana.com",
      ...prodEnv,
    });
    expect(r).toEqual({ ok: true, url: "https://mainnet.helius-rpc.com/?api-key=x" });
  });

  it("rejects a devnet URL in production by default (expected mainnet)", () => {
    const r = resolveSweepRpc({
      PLATFORM_RPC_URL: "https://api.devnet.solana.com",
      ...prodEnv,
    });
    expect(r).toMatchObject({ ok: false });
  });

  it("allows a devnet URL in production when PLATFORM_SOLANA_CLUSTER says devnet", () => {
    const r = resolveSweepRpc({
      PLATFORM_RPC_URL: "https://api.devnet.solana.com",
      PLATFORM_SOLANA_CLUSTER: "devnet",
      ...prodEnv,
    });
    expect(r).toEqual({ ok: true, url: "https://api.devnet.solana.com" });
  });

  it("rejects a mainnet URL when PLATFORM_SOLANA_CLUSTER expects devnet", () => {
    const r = resolveSweepRpc({
      PLATFORM_RPC_URL: "https://mainnet.helius-rpc.com/?api-key=x",
      PLATFORM_SOLANA_CLUSTER: "devnet",
    });
    expect(r).toMatchObject({ ok: false });
  });

  it("passes an unrecognizable custom hostname (cluster unknown = no signal)", () => {
    const r = resolveSweepRpc({
      PLATFORM_RPC_URL: "https://my-private-node.example.com",
      ...prodEnv,
    });
    expect(r).toEqual({ ok: true, url: "https://my-private-node.example.com" });
  });
});
