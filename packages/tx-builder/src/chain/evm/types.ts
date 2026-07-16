/**
 * EVM chain adapter — Track B1 spike only. No implementation registered.
 * See docs/architecture/DEPLOYMENT_TARGET.md
 */
export type EvmChainId = "base" | "ethereum";

export interface EvmMintParams {
  evmChainId: EvmChainId;
  /** Deployer wallet — never platform-held */
  owner: `0x${string}`;
  name: string;
  symbol: string;
  decimals: number;
  /** OpenZeppelin-style module ids — future module-registry port */
  modules: string[];
}

export interface EvmMintPlan {
  /** Unsigned tx or calldata bundle for wallet signing */
  unsigned: unknown;
  warnings: string[];
}

export interface EvmChainAdapter {
  readonly evmChainId: EvmChainId;
  readonly displayName: string;
  buildMintPlan(params: EvmMintParams): Promise<EvmMintPlan>;
}

/** Throws until B1 spike lands — prevents accidental UI wiring */
export function getEvmChainAdapter(_evmChainId: EvmChainId): EvmChainAdapter {
  throw new Error(
    "[evm] EVM adapter not implemented. Complete Solana DeploymentTarget wiring (A1) first — see docs/architecture/DEPLOYMENT_TARGET.md"
  );
}
