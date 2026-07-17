import { clusterFromRpcUrl, chainIdForCluster, SUPPORTED_CHAIN_IDS } from "../cluster";

describe("chainIdForCluster (Audit-2 High-3)", () => {
  it("maps mainnet and devnet to their chain record ids", () => {
    expect(chainIdForCluster("mainnet")).toBe("solana-mainnet");
    expect(chainIdForCluster("devnet")).toBe("solana-devnet");
  });

  it("returns null (no constraint) for localnet, testnet, and unknown", () => {
    expect(chainIdForCluster("localnet")).toBeNull();
    expect(chainIdForCluster("testnet")).toBeNull();
    expect(chainIdForCluster("unknown")).toBeNull();
  });

  it("round-trips from real RPC URLs", () => {
    expect(chainIdForCluster(clusterFromRpcUrl("https://mainnet.helius-rpc.com/?api-key=x"))).toBe(
      "solana-mainnet"
    );
    expect(chainIdForCluster(clusterFromRpcUrl("https://api.devnet.solana.com"))).toBe(
      "solana-devnet"
    );
  });

  it("only supports Solana chain ids until a second chain adapter is real", () => {
    expect([...SUPPORTED_CHAIN_IDS]).toEqual(["solana-mainnet", "solana-devnet"]);
  });
});
