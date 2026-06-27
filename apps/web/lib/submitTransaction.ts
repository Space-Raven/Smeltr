import { Connection, Keypair, Transaction, TransactionInstruction } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";

const MAX_TRANSACTION_SIZE = 1232; // Solana's hard packet-size limit, in bytes.

export interface SubmitTransactionArgs {
  connection: Connection;
  wallet: WalletContextState;
  instructions: TransactionInstruction[];
  /** Additional keypairs that must co-sign (e.g. a freshly-generated mint account). */
  extraSigners?: Keypair[];
}

/**
 * Assembles, size-checks, simulates, signs, and submits a transaction. The
 * platform never holds or transmits a signing key for the user's wallet —
 * only `extraSigners` (ephemeral keypairs generated client-side, e.g. for
 * a new mint account) are signed locally and discarded after use.
 */
export async function submitTransaction({
  connection,
  wallet,
  instructions,
  extraSigners = [],
}: SubmitTransactionArgs): Promise<string> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error("Wallet not connected or does not support signing.");
  }

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

  const transaction = new Transaction({
    feePayer: wallet.publicKey,
    blockhash,
    lastValidBlockHeight,
  }).add(...instructions);

  for (const signer of extraSigners) {
    transaction.partialSign(signer);
  }

  // --- Pre-flight size check ------------------------------------------------
  // Catch oversized transactions with a clear message instead of an opaque
  // RPC rejection.
  const serializedSize = transaction.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  }).length;

  if (serializedSize > MAX_TRANSACTION_SIZE) {
    throw new Error(
      `Transaction is ${serializedSize} bytes, exceeding the ` +
        `${MAX_TRANSACTION_SIZE}-byte network limit. Reduce the number of ` +
        `selected modules, or split this into multiple transactions.`
    );
  }

  // --- Simulate before requesting the user's signature ----------------------
  const simulation = await connection.simulateTransaction(transaction);
  if (simulation.value.err) {
    throw new Error(
      `Simulation failed: ${JSON.stringify(simulation.value.err)}. ` +
        `Logs: ${simulation.value.logs?.join("\n") ?? "none"}`
    );
  }

  const signedTransaction = await wallet.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signedTransaction.serialize());

  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");

  return signature;
}
