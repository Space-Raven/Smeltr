import { z } from "zod";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { ExtensionType } from "@solana/spl-token";

/**
 * PLATFORM AUTHORITY DENYLIST — non-custodial invariant.
 *
 * No module may assign a Token-2022 authority field (mint, freeze, permanent
 * delegate, transfer-fee, withdraw, metadata-update) to a platform-held key.
 * assertNoPlatformAuthority is the runtime backstop.
 *
 * ⚠️ RUNTIME BOUNDARY (Audit-1 TOB-01): bundled into the BROWSER, where only
 * NEXT_PUBLIC_* env vars are defined — the denylist MUST come from NEXT_PUBLIC_
 * vars or the check silently no-ops in production. Public keys are not secret.
 * (NEXT_PUBLIC_PLATFORM_FEE_RECIPIENT is folded in per Audit-1 TOB-11.)
 */
export function parsePlatformAuthorityDenylist(
  env: Record<string, string | undefined> = process.env
): ReadonlySet<string> {
  const keys: string[] = [];

  const list = env.NEXT_PUBLIC_PLATFORM_AUTHORITY_DENYLIST;
  if (list) {
    for (const key of list.split(/[\s,]+/)) {
      if (key.length > 0) keys.push(key);
    }
  }

  const feeRecipient = env.NEXT_PUBLIC_PLATFORM_FEE_RECIPIENT;
  if (feeRecipient && feeRecipient.length > 0) keys.push(feeRecipient);

  return new Set(keys);
}

export const PLATFORM_AUTHORITY_DENYLIST: ReadonlySet<string> =
  parsePlatformAuthorityDenylist();

/**
 * Fail-closed guard: throws when the denylist is unconfigured in a production
 * build (the TOB-01 failure mode). Called at the deployment chokepoint
 * (buildMintInstructions), so a misconfigured env aborts the deploy with a clear
 * error rather than shipping an inert non-custodial guarantee. Params are
 * overridable for unit testing.
 */
export function assertPlatformDenylistConfigured(
  opts: { isProduction?: boolean; denylist?: ReadonlySet<string> } = {}
): void {
  const isProduction = opts.isProduction ?? process.env.NODE_ENV === "production";
  const denylist = opts.denylist ?? PLATFORM_AUTHORITY_DENYLIST;
  if (isProduction && denylist.size === 0) {
    throw new Error(
      "[SECURITY] Platform authority denylist is not configured. Refusing to " +
        "build a deployment — set NEXT_PUBLIC_PLATFORM_AUTHORITY_DENYLIST."
    );
  }
}

export function assertNoPlatformAuthority(
  authority: PublicKey,
  fieldName: string,
  moduleId: string,
  // Defaults to the module-level denylist; overridable for unit testing.
  denylist: ReadonlySet<string> = PLATFORM_AUTHORITY_DENYLIST
): void {
  if (denylist.has(authority.toBase58())) {
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

  /** Validates raw (string-based) input from the UI/API into typed params.
   *  Input type is intentionally `unknown` — schemas transform string-based
   *  form data (e.g. base58 pubkeys) into rich output types (PublicKey). */
  paramsSchema: z.ZodType<TParams, z.ZodTypeDef, unknown>;

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
