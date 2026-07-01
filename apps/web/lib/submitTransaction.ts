import { Connection, Keypair, Transaction, TransactionInstruction } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import { explorerTxUrl } from "./explorer";

const MAX_TRANSACTION_SIZE = 1232; // Solana's hard packet-size limit, in bytes.

export interface SubmitTransactionArgs {
  connection: Connection;
  wallet: WalletContextState;
  instructions: TransactionInstruction[];
  /** Additional keypairs that must co-sign (e.g. a freshly-generated mint account). */
  extraSigners?: Keypair[];
}

/**
 * Assembles, size-checks, signs, and submits a transaction.
 *
 * Uses wallet.sendTransaction (not signTransaction + sendRawTransaction) so
 * that the wallet adapter handles submission through its own reliable RPC
 * endpoint with built-in retry. Phantom, Backpack, etc. each maintain their
 * own high-availability nodes — bypassing them with sendRawTransaction via
 * the public mainnet RPC caused dropped transactions and "unsafe" warnings.
 *
 * The platform never holds or transmits a signing key for the user's wallet.
 * Only extraSigners (ephemeral keypairs, e.g. a new mint account) are signed
 * locally and discarded after use.
 */
export async function submitTransaction({
  connection,
  wallet,
  instructions,
  extraSigners = [],
}: SubmitTransactionArgs): Promise<string> {
  if (!wallet.publicKey || !wallet.sendTransaction) {
    throw new Error("Wallet not connected or does not support sending transactions.");
  }

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");

  const transaction = new Transaction({
    feePayer: wallet.publicKey,
    blockhash,
    lastValidBlockHeight,
  }).add(...instructions);

  // --- Pre-flight size check ------------------------------------------------
  // Catch oversized transactions with a clear message instead of an opaque
  // RPC rejection. Serialize without requiring all signatures since the
  // user's wallet hasn't signed yet.
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

  // wallet.sendTransaction: signs via the wallet UI, co-signs with any
  // extraSigners, and submits through the wallet's own RPC endpoint.
  // skipPreflight: false keeps simulation on so errors surface before
  // the user sees a wallet prompt.
  const signature = await wallet.sendTransaction(transaction, connection, {
    signers: extraSigners,
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  const confirmation = await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed"
  );

  // A confirmed-but-reverted transaction is a FAILURE — without this check a
  // reverted mint would flow into the success UI and dashboard indexing.
  if (confirmation.value.err) {
    throw new Error(
      `The transaction was rejected by the network (${JSON.stringify(confirmation.value.err)}). ` +
        `No token was created and only the network fee was spent. ` +
        `Details: ${explorerTxUrl(signature, connection.rpcEndpoint)}`
    );
  }

  return signature;
}
