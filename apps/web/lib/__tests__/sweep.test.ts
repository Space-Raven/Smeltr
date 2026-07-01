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
