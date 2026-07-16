import {
  buildFairLaunchReport,
  formatSupply,
  trustedImageUrl,
  type MintFacts,
} from "../fairLaunch";

const AUTH = "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin";

function facts(overrides: Partial<MintFacts> = {}): MintFacts {
  return {
    mintAddress: "So11111111111111111111111111111111111111112",
    tokenStandard: "token-2022",
    supply: 1_000_000_000n,
    decimals: 9,
    mintAuthority: null,
    freezeAuthority: null,
    permanentDelegate: null,
    transferFeeBps: null,
    nonTransferable: false,
    mintCloseAuthority: null,
    metadata: null,
    ...overrides,
  };
}

function check(report: ReturnType<typeof buildFairLaunchReport>, id: string) {
  return report.checks.find((c) => c.id === id);
}

describe("buildFairLaunchReport", () => {
  test("fully revoked mint earns the badge with all passes", () => {
    const report = buildFairLaunchReport(facts());
    expect(report.allControlsRevoked).toBe(true);
    expect(check(report, "supply")?.status).toBe("pass");
    expect(check(report, "freeze")?.status).toBe("pass");
    expect(check(report, "delegate")?.status).toBe("pass");
  });

  test("active mint authority is a caution and loses the badge", () => {
    const report = buildFairLaunchReport(facts({ mintAuthority: AUTH }));
    expect(report.allControlsRevoked).toBe(false);
    expect(check(report, "supply")?.status).toBe("caution");
  });

  test("freeze authority and permanent delegate each break the badge", () => {
    expect(buildFairLaunchReport(facts({ freezeAuthority: AUTH })).allControlsRevoked).toBe(false);
    expect(buildFairLaunchReport(facts({ permanentDelegate: AUTH })).allControlsRevoked).toBe(false);
    expect(
      check(buildFairLaunchReport(facts({ permanentDelegate: AUTH })), "delegate")?.status
    ).toBe("caution");
  });

  test("metadata check only appears when metadata exists; immutable passes", () => {
    expect(check(buildFairLaunchReport(facts()), "metadata")).toBeUndefined();

    const locked = buildFairLaunchReport(
      facts({ metadata: { name: "T", symbol: "T", uri: "", updateAuthority: null } })
    );
    expect(check(locked, "metadata")?.status).toBe("pass");

    const mutable = buildFairLaunchReport(
      facts({ metadata: { name: "T", symbol: "T", uri: "", updateAuthority: AUTH } })
    );
    expect(check(mutable, "metadata")?.status).toBe("info");
    // Mutable metadata is informational — it does not break the badge.
    expect(mutable.allControlsRevoked).toBe(true);
  });

  test("transfer fee, soulbound, and close authority surface as info", () => {
    const report = buildFairLaunchReport(
      facts({ transferFeeBps: 250, nonTransferable: true, mintCloseAuthority: AUTH })
    );
    expect(check(report, "transfer-fee")?.label).toContain("2.5%");
    expect(check(report, "soulbound")?.status).toBe("info");
    expect(check(report, "close")?.status).toBe("info");
    expect(report.allControlsRevoked).toBe(true);
  });
});

describe("formatSupply", () => {
  test("applies decimals and trims trailing zeros", () => {
    expect(formatSupply(1_000_000_000n, 9)).toBe("1");
    expect(formatSupply(1_500_000_000n, 9)).toBe("1.5");
    expect(formatSupply(123n, 0)).toBe("123");
    expect(formatSupply(1_234_567_000_000_000n, 6)).toBe("1,234,567,000");
    expect(formatSupply(0n, 9)).toBe("0");
  });
});

describe("trustedImageUrl", () => {
  test("accepts Arweave/Irys https URLs only", () => {
    expect(trustedImageUrl("https://gateway.irys.xyz/abc")).toBe("https://gateway.irys.xyz/abc");
    expect(trustedImageUrl("https://arweave.net/xyz")).toBe("https://arweave.net/xyz");
    expect(trustedImageUrl("https://sub.arweave.net/xyz")).toBe("https://sub.arweave.net/xyz");
    expect(trustedImageUrl("http://gateway.irys.xyz/abc")).toBeNull();
    expect(trustedImageUrl("https://evil.com/a.png")).toBeNull();
    expect(trustedImageUrl("https://evilarweave.net/a.png")).toBeNull();
    expect(trustedImageUrl("not a url")).toBeNull();
    expect(trustedImageUrl(null)).toBeNull();
  });
});
