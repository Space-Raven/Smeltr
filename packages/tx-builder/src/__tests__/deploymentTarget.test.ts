import {
  getDeploymentCapabilities,
  chainRecordKey,
  defaultSolanaTarget,
} from "../chain/deploymentTarget";

describe("deploymentTarget", () => {
  const mainnetConn = { rpcEndpoint: "https://api.mainnet-beta.solana.com" } as never;

  it("defaults to token-2022 on mainnet", () => {
    const t = defaultSolanaTarget(mainnetConn);
    expect(t.tokenStandard).toBe("token-2022");
    expect(t.cluster).toBe("mainnet-beta");
  });

  it("legacy spl enables Metaplex metadata and two-step flow", () => {
    const caps = getDeploymentCapabilities({
      chain: "solana",
      cluster: "mainnet-beta",
      tokenStandard: "spl-legacy",
    });
    expect(caps.extensionModules).toBe(false);
    expect(caps.nativeTokenMetadata).toBe(false);
    expect(caps.metaplexMetadata).toBe(true);
    expect(caps.twoStepMetadataFlow).toBe(true);
    expect(caps.protocolFeeSol).toBe(true);
  });

  it("chainRecordKey maps cluster to stable id", () => {
    expect(
      chainRecordKey({ chain: "solana", cluster: "mainnet-beta", tokenStandard: "token-2022" })
    ).toBe("solana-mainnet");
  });
});
