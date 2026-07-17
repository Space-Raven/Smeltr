import type { ParsedTransactionWithMeta } from "@solana/web3.js";

const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const METAPLEX_METADATA_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";

export type MintProgramId = typeof TOKEN_2022_PROGRAM_ID | typeof TOKEN_PROGRAM_ID;

export { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, METAPLEX_METADATA_PROGRAM_ID };

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

/**
 * True when a parsed or partially-decoded instruction references `mintAddress`
 * in its accounts (partially decoded) or anywhere in its parsed info values.
 * Metadata instructions are not always parsed by RPC providers, so both
 * shapes must be handled.
 */
function instructionReferencesMint(
  ix: ParsedTransactionWithMeta["transaction"]["message"]["instructions"][number],
  mintAddress: string
): boolean {
  if ("accounts" in ix && Array.isArray(ix.accounts)) {
    return ix.accounts.some((a) => a.toBase58() === mintAddress);
  }
  if ("parsed" in ix && typeof ix.parsed === "object" && ix.parsed !== null) {
    const info = (ix.parsed as { info?: Record<string, unknown> }).info;
    if (!info || typeof info !== "object") return false;
    return Object.values(info).some((v) => v === mintAddress);
  }
  return false;
}

/**
 * Pure, network-free metadata-attachment check (Audit-2 High-2).
 *
 * Given an already-fetched parsed transaction, verifies it is a SUCCESSFUL
 * transaction, fee-paid by `walletAddress` (the SIWS session wallet), that
 * invokes the expected metadata program for this token standard against
 * `mintAddress` — Token-2022 native metadata (instructions execute on the
 * mint itself) or the Metaplex metadata program for legacy SPL. This is what
 * prevents a signed-in owner from flipping `metadataAttached` in the index
 * with an arbitrary signature string.
 */
export function checkMetadataAttachment(
  tx: ParsedTransactionWithMeta | null,
  mintAddress: string,
  walletAddress: string,
  tokenStandard: "token-2022" | "spl-legacy"
): VerifyResult {
  if (!tx) {
    return { ok: false, status: 409, reason: "Transaction not found or not yet confirmed." };
  }
  if (tx.meta?.err) {
    return { ok: false, status: 400, reason: "Transaction failed on-chain." };
  }

  const feePayer = tx.transaction.message.accountKeys[0]?.pubkey.toBase58();
  if (feePayer !== walletAddress) {
    return {
      ok: false,
      status: 403,
      reason: "The signed-in wallet is not the fee payer of this transaction.",
    };
  }

  const metadataProgramId =
    tokenStandard === "spl-legacy" ? METAPLEX_METADATA_PROGRAM_ID : TOKEN_2022_PROGRAM_ID;

  const attachesMetadata = tx.transaction.message.instructions.some((ix) => {
    if (!("programId" in ix) || ix.programId.toBase58() !== metadataProgramId) return false;
    if (!instructionReferencesMint(ix, mintAddress)) return false;
    // When the RPC parsed the instruction, require the actual metadata
    // initialize type — not just any instruction of this program touching the
    // mint (e.g. a transfer). Partially-decoded instructions can't be typed,
    // so the program + mint-reference check is the best available there.
    if ("parsed" in ix && typeof ix.parsed === "object" && ix.parsed !== null) {
      const type = (ix.parsed as { type?: string }).type;
      if (tokenStandard === "token-2022") {
        return typeof type === "string" && type.startsWith("initializeTokenMetadata");
      }
      return typeof type === "string" && type.toLowerCase().includes("metadata");
    }
    return true;
  });
  if (!attachesMetadata) {
    return {
      ok: false,
      status: 400,
      reason: "Transaction does not attach metadata to this mint.",
    };
  }

  return { ok: true };
}
