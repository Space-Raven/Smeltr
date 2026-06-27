import type { SolanaSignInOutput } from "@solana/wallet-standard-features";

/**
 * Wire format for SolanaSignInOutput over JSON: Uint8Arrays serialize as
 * plain number arrays (Array.from), matching the documented SIWS
 * client/server pattern (Solana Mobile docs, Phantom SIWS examples).
 */
export interface SiwsOutputWire {
  account: {
    address: string;
    publicKey: number[];
  };
  signature: number[];
  signedMessage: number[];
}

export function toWireOutput(output: SolanaSignInOutput): SiwsOutputWire {
  return {
    account: {
      address: output.account.address,
      publicKey: Array.from(output.account.publicKey),
    },
    signature: Array.from(output.signature),
    signedMessage: Array.from(output.signedMessage),
  };
}

/**
 * Reconstructs a SolanaSignInOutput-shaped object for verifySignIn.
 *
 * NOTE: account is typed as the full WalletAccount interface, but
 * documented verifySignIn usage only relies on account.publicKey,
 * signedMessage, and signature — we provide address + publicKey and cast.
 * Revisit if a future @solana/wallet-standard-util version requires more.
 */
export function fromWireOutput(wire: SiwsOutputWire): SolanaSignInOutput {
  return {
    account: {
      address: wire.account.address,
      publicKey: new Uint8Array(wire.account.publicKey),
    },
    signature: new Uint8Array(wire.signature),
    signedMessage: new Uint8Array(wire.signedMessage),
  } as unknown as SolanaSignInOutput;
}
