import { resolveIrysNetwork } from "../irysNetwork";

describe("resolveIrysNetwork (engineering roadmap 1E)", () => {
  it("detects mainnet from the platform RPC", () => {
    const net = resolveIrysNetwork({
      platformRpcUrl: "https://mainnet.helius-rpc.com/?api-key=x",
    });
    expect(net.mainnet).toBe(true);
    expect(net.gatewayBase).toBe("https://gateway.irys.xyz");
  });

  it("detects mainnet from the public RPC when platform RPC is unset", () => {
    const net = resolveIrysNetwork({
      publicRpcUrl: "https://api.mainnet-beta.solana.com",
    });
    expect(net.mainnet).toBe(true);
  });

  it("defaults to devnet with the devnet gateway", () => {
    const net = resolveIrysNetwork({ publicRpcUrl: "https://api.devnet.solana.com" });
    expect(net.mainnet).toBe(false);
    expect(net.gatewayBase).toBe("https://devnet.irys.xyz");
    expect(net.rpcUrl).toBe("https://api.devnet.solana.com");
  });

  it("prefers the platform RPC for funding calls", () => {
    const net = resolveIrysNetwork({
      platformRpcUrl: "https://my-devnet-rpc.example",
      publicRpcUrl: "https://api.devnet.solana.com",
    });
    expect(net.rpcUrl).toBe("https://my-devnet-rpc.example");
  });

  it("falls back to public devnet when nothing is configured", () => {
    const net = resolveIrysNetwork({});
    expect(net.mainnet).toBe(false);
    expect(net.rpcUrl).toBe("https://api.devnet.solana.com");
  });
});
