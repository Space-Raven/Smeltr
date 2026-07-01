import type { ParsedTransactionWithMeta } from "@solana/web3.js";

// The canonical SPL Token-2022 program ID (a fixed on-chain constant). Hardcoded
// as a string rather than imported from @solana/spl-token so this module stays
// dependency-free and unit-testable without pulling the web3.js ESM chain.
const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

export type VerifyResult =
  | { ok: true }
  | { ok: false; status: number; reason: string };

/**
 * Pure, network-free attribution check (Audit-1 TOB-03).
 *
 * Given an already-fetched parsed transaction, verifies it is a SUCCESSFUL
 * Token-2022 mint creation whose FEE PAYER is `walletAddress` (the SIWS session
 * wallet) and which references `mintAddress`. This is what prevents a signed-in
 * user from registering — and thereby claiming in their dashboard — a mint they
 * did not deploy.
 *
 * Kept pure (takes the tx, does no I/O) so it is unit-testable with fixtures.
 */
export function checkMintCreation(
  tx: ParsedTransactionWithMeta | null,
  mintAddress: string,
  walletAddress: string
): VerifyResult {
  if (!tx) {
    return { ok: false, status: 409, reason: "Transaction not found or not yet confirmed." };
  }
  if (tx.meta?.err) {
    return { ok: false, status: 400, reason: "Transaction failed on-chain." };
  }

  const accountKeys = tx.transaction.message.accountKeys;

  // accountKeys[0] is always the fee payer. It must be the session wallet.
  const feePayer = accountKeys[0]?.pubkey.toBase58();
  if (feePayer !== walletAddress) {
    return {
      ok: false,
      status: 403,
      reason: "The signed-in wallet is not the fee payer of this transaction.",
    };
  }

  // The mint account must appear in the transaction (it is created here).
  if (!accountKeys.some((k) => k.pubkey.toBase58() === mintAddress)) {
    return { ok: false, status: 400, reason: "Transaction does not reference the given mint." };
  }

  // The transaction must CREATE the mint, not merely reference it. Without
  // this, any successful Token-2022 transaction the wallet fee-paid (e.g. a
  // plain transfer of an existing token) could be submitted to claim that
  // token in the dashboard. getParsedTransaction decodes SPL Token-2022
  // instructions, so a genuine deployment contains an initializeMint
  // instruction whose `info.mint` is this mint.
  const createsMint = tx.transaction.message.instructions.some((ix) => {
    if (!("programId" in ix) || ix.programId.toBase58() !== TOKEN_2022_PROGRAM_ID) return false;
    if (!("parsed" in ix) || typeof ix.parsed !== "object" || ix.parsed === null) return false;
    const parsed = ix.parsed as { type?: string; info?: { mint?: string } };
    return (
      typeof parsed.type === "string" &&
      parsed.type.startsWith("initializeMint") &&
      parsed.info?.mint === mintAddress
    );
  });
  if (!createsMint) {
    return {
      ok: false,
      status: 400,
      reason: "Transaction does not initialize this mint — only the deployment transaction can register a token.",
    };
  }

  return { ok: true };
}
