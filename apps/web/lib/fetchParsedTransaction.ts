import { Connection, ParsedTransactionWithMeta } from "@solana/web3.js";

export interface FetchParsedTxResult {
  tx: ParsedTransactionWithMeta | null;
  /** False only when every attempt threw (RPC unreachable) — callers 503. */
  reachedNetwork: boolean;
}

/**
 * Fetch a parsed transaction with retries. A just-confirmed signature can lag
 * behind the RPC node the server hits, so a null result is retried a few
 * times before being treated as "not found" (callers map that to 409, not 404
 * — the tx may still land).
 */
export async function fetchParsedTransactionWithRetry(
  connection: Connection,
  signature: string,
  { attempts = 5, delayMs = 1500 }: { attempts?: number; delayMs?: number } = {}
): Promise<FetchParsedTxResult> {
  let tx: ParsedTransactionWithMeta | null = null;
  let reachedNetwork = false;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      tx = await connection.getParsedTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      reachedNetwork = true;
    } catch {
      // transient RPC error — retry
    }
    if (tx) break;
    if (attempt < attempts - 1) await new Promise((r) => setTimeout(r, delayMs));
  }
  return { tx, reachedNetwork };
}
