import { z } from "zod";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { ExtensionType } from "@solana/spl-token";

/**
 * ============================================================================
 * PLATFORM AUTHORITY DENYLIST
 * ============================================================================
 * Critical Security Path — non-custodial invariant.
 *
 * No module may ever assign a Token-2022 authority field (transfer fee
 * authority, withdraw authority, permanent delegate, mint authority,
 * freeze authority, metadata update authority, etc.) to a platform-held
 * key. This denylist is the runtime backstop; assertNoPlatformAuthority is
 * called by every module/provider that accepts an authority parameter, and
 * by the orchestrator for core mint authorities.
 *
 * Populate from secure environment config at startup. Never hardcode real
 * keys in source — placeholders only.
 */
/**
 * Populated at module load time from env. Filters out missing/empty entries
 * so an unset var doesn't add "" to the set (which would block nothing but
 * pollute logs). In dev with no vars set this is an empty set and
 * assertNoPlatformAuthority is a no-op — that is intentional for local
 * development. MUST be populated before any production deployment.
 */
export const PLATFORM_AUTHORITY_DENYLIST: ReadonlySet<string> = new Set<string>(
  [
    process.env.PLATFORM_FEE_PAYER_PUBKEY,
    process.env.PLATFORM_SERVICE_WALLET_PUBKEY,
  ].filter((key): key is string => typeof key === "string" && key.length > 0)
);

export function assertNoPlatformAuthority(
  authority: PublicKey,
  fieldName: string,
  moduleId: string
): void {
  if (PLATFORM_AUTHORITY_DENYLIST.has(authority.toBase58())) {
    throw new Error(
      `[SECURITY] "${moduleId}" attempted to set "${fieldName}" to a ` +
        `platform-controlled key (${authority.toBase58()}). This violates the ` +
        `platform's non-custodial guarantee and has been blocked.`
    );
  }
}

/**
 * Base58-encoded Solana public key string (from form input / API
 * payloads), validated and transformed into a PublicKey instance.
 */
export const PublicKeyStringSchema = z
  .string()
  .trim()
  .refine(
    (val) => {
      try {
        new PublicKey(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Must be a valid base58-encoded Solana public key" }
  )
  .transform((val) => new PublicKey(val));

/**
 * Authority fields use this schema rather than PublicKeyStringSchema
 * directly so they're greppable — every usage is a candidate for the
 * denylist check. There is intentionally NO default/optional variant;
 * authorities must always be explicitly supplied by the caller (i.e. the
 * user's wallet).
 */
export const AuthorityPublicKeySchema = PublicKeyStringSchema;

/**
 * u64 values (fees, amounts) arrive as numeric strings to avoid JS Number
 * precision loss above 2^53, and are coerced to bigint.
 */
export const U64StringSchema = z
  .string()
  .regex(/^\d+$/, "Must be a non-negative integer string")
  .transform((val) => BigInt(val))
  .refine((val) => val <= 18446744073709551615n, {
    message: "Value exceeds u64 maximum",
  });

/**
 * Unique identifiers for modules in the registry. Extend this enum as new
 * modules are added — never reuse or repurpose an existing id, since it
 * may be persisted in user-facing deployment configs/history.
 */
export enum ModuleId {
  TRANSFER_FEE = "transfer-fee",
  NON_TRANSFERABLE = "non-transferable",
  PERMANENT_DELEGATE = "permanent-delegate",
  // Reserved for future milestones:
  // TRANSFER_HOOK = "transfer-hook",
}

/**
 * Runtime context passed to every module's instruction builder.
 * `userWallet` is the sole source of truth for any authority the user
 * wants assigned — modules must never substitute a different key, and
 * must never read a "platform wallet" from this context (it doesn't exist
 * on purpose).
 */
export interface ModuleContext {
  mint: PublicKey;
  payer: PublicKey;
  userWallet: PublicKey;
  decimals: number;
  /** TOKEN_2022_PROGRAM_ID, injected by tx-builder. */
  programId: PublicKey;
}

/**
 * A pre-audited, parameterized configuration for one or more Token-2022
 * mint extensions.
 */
export interface ModuleDefinition<TParams> {
  id: ModuleId;
  name: string;
  description: string;

  /** Token-2022 extension(s) this module activates on the mint account. */
  extensionTypes: ExtensionType[];

  /** Validates raw (string-based) input from the UI/API into typed params. */
  paramsSchema: z.ZodSchema<TParams>;

  /** True once this module's instruction set has passed a security audit. */
  verified: boolean;

  /** Reference (URL or doc id) to the audit report. Required if verified. */
  auditReference?: string;

  /**
   * Reserved for future Transfer Hook modules — the on-chain program that
   * will be invoked on every transfer. Absent for native-extension modules.
   */
  hookProgramId?: PublicKey;

  /**
   * Module ids this module HARD-conflicts with (cannot coexist on the same
   * mint at the protocol level). Leave empty if no hard conflicts.
   *
   * Soft conflicts (legal but discouraged combinations, e.g. Transfer Fee +
   * Non-Transferable) are NOT modeled here — they belong to the
   * compatibility/warning engine (compatibility.ts), which operates on the
   * full selected set rather than pairwise module definitions.
   */
  incompatibleWith: ModuleId[];

  /**
   * Builds the mint-account initialization instruction(s) for this
   * extension. Must be called BEFORE `initializeMint` and AFTER the mint
   * account has been allocated with sufficient space for all selected
   * extensions — ordering and sizing are the orchestrator's responsibility,
   * not the module's.
   *
   * Implementations MUST call `assertNoPlatformAuthority` for every
   * authority-typed parameter before constructing instructions.
   */
  buildInitInstructions(
    ctx: ModuleContext,
    params: TParams
  ): TransactionInstruction[];
}
