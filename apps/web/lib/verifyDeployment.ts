import type { ParsedTransactionWithMeta } from "@solana/web3.js";

const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

export type MintProgramId = typeof TOKEN_2022_PROGRAM_ID | typeof TOKEN_PROGRAM_ID;

export { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID };

export type VerifyResult =
  | { ok: true }
  | { ok: false; status: number; reason: string };

export interface CheckMintCreationOptions {
  /** SPL mint program that must initialize the mint. Defaults to Token-2022. */
  mintProgramId?: MintProgramId;
}

/**
 * Pure, network-free attribution check (Audit-1 TOB-03).
 *
 * Given an already-fetched parsed transaction, verifies it is a SUCCESSFUL
 * mint creation whose FEE PAYER is `walletAddress` (the SIWS session
 * wallet) and which references `mintAddress`. This is what prevents a signed-in
 * user from registering — and thereby claiming in their dashboard — a mint they
 * did not deploy.
 *
 * Kept pure (takes the tx, does no I/O) so it is unit-testable with fixtures.
 */
export function checkMintCreation(
  tx: ParsedTransactionWithMeta | null,
  mintAddress: string,
  walletAddress: string,
  options: CheckMintCreationOptions = {}
): VerifyResult {
  const mintProgramId = options.mintProgramId ?? TOKEN_2022_PROGRAM_ID;

  if (!tx) {
    return { ok: false, status: 409, reason: "Transaction not found or not yet confirmed." };
  }
  if (tx.meta?.err) {
    return { ok: false, status: 400, reason: "Transaction failed on-chain." };
  }

  const accountKeys = tx.transaction.message.accountKeys;

  const feePayer = accountKeys[0]?.pubkey.toBase58();
  if (feePayer !== walletAddress) {
    return {
      ok: false,
      status: 403,
      reason: "The signed-in wallet is not the fee payer of this transaction.",
    };
  }

  if (!accountKeys.some((k) => k.pubkey.toBase58() === mintAddress)) {
    return { ok: false, status: 400, reason: "Transaction does not reference the given mint." };
  }

  const createsMint = tx.transaction.message.instructions.some((ix) => {
    if (!("programId" in ix) || ix.programId.toBase58() !== mintProgramId) return false;
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

export function mintProgramIdForTokenStandard(
  tokenStandard: "token-2022" | "spl-legacy"
): MintProgramId {
  return tokenStandard === "spl-legacy" ? TOKEN_PROGRAM_ID : TOKEN_2022_PROGRAM_ID;
}
