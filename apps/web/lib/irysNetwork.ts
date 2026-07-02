/**
 * Network + gateway resolution for platform-funded Irys uploads.
 * Pure so it is unit-testable; the route wires it to process.env.
 */

export interface IrysNetworkConfig {
  mainnet: boolean;
  /** RPC used to fund/price uploads (only consulted on devnet). */
  rpcUrl: string;
  /** Public gateway serving the uploaded content. */
  gatewayBase: string;
}

export function resolveIrysNetwork(env: {
  platformRpcUrl?: string;
  publicRpcUrl?: string;
}): IrysNetworkConfig {
  const mainnet =
    (env.platformRpcUrl ?? "").includes("mainnet") ||
    (env.publicRpcUrl ?? "").includes("mainnet");
  return {
    mainnet,
    rpcUrl: env.platformRpcUrl ?? env.publicRpcUrl ?? "https://api.devnet.solana.com",
    gatewayBase: mainnet ? "https://gateway.irys.xyz" : "https://devnet.irys.xyz",
  };
}
