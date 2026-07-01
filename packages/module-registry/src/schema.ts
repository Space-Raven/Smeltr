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
  env: Record<string, string | undefined>
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

/**
 * Snapshot of denylist env vars using **static** `process.env.NEXT_PUBLIC_*`
 * property access. Next.js/webpack only inlines NEXT_PUBLIC values when read
 * this way — dynamic access like `process.env[key]` or reading from a generic
 * `env` object (the TOB-01 bug) leaves the browser bundle with an empty denylist
 * even when Vercel has the var set at build time.
 */
function readPublicDenylistEnv(): Record<string, string | undefined> {
  return {
    NEXT_PUBLIC_PLATFORM_AUTHORITY_DENYLIST:
      process.env.NEXT_PUBLIC_PLATFORM_AUTHORITY_DENYLIST,
    NEXT_PUBLIC_PLATFORM_FEE_RECIPIENT: process.env.NEXT_PUBLIC_PLATFORM_FEE_RECIPIENT,
  };
}

/** Current denylist — always re-reads from (build-time-inlined) public env. */
export function getPlatformAuthorityDenylist(): ReadonlySet<string> {
  return parsePlatformAuthorityDenylist(readPublicDenylistEnv());
}

/** Diagnostic snapshot for TOB-01 / denylist misconfiguration (pubkeys are public). */
export interface DenylistDebugSnapshot {
  nodeEnv: string;
  /** Whether the raw NEXT_PUBLIC list env var is defined (may be build-time-inlined). */
  rawListDefined: boolean;
  rawListLength: number;
  /** First 8 chars of raw value — enough to confirm inlining without logging full list. */
  rawListPrefix: string | null;
  feeRecipientDefined: boolean;
  parsedKeyCount: number;
  /** Parsed base58 pubkeys — safe to expose; used to verify comma-splitting. */
  parsedKeys: string[];
}

export function getDenylistDebugSnapshot(): DenylistDebugSnapshot {
  const raw = readPublicDenylistEnv();
  const list = raw.NEXT_PUBLIC_PLATFORM_AUTHORITY_DENYLIST;
  const denylist = getPlatformAuthorityDenylist();
  return {
    nodeEnv: process.env.NODE_ENV ?? "unknown",
    rawListDefined: typeof list === "string" && list.length > 0,
    rawListLength: list?.length ?? 0,
    rawListPrefix: list && list.length > 0 ? list.slice(0, 8) : null,
    feeRecipientDefined: !!raw.NEXT_PUBLIC_PLATFORM_FEE_RECIPIENT,
    parsedKeyCount: denylist.size,
    parsedKeys: [...denylist],
  };
}

/** @deprecated Use getPlatformAuthorityDenylist() — evaluated once at import. */
export const PLATFORM_AUTHORITY_DENYLIST: ReadonlySet<string> =
  getPlatformAuthorityDenylist();

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
  const denylist = opts.denylist ?? getPlatformAuthorityDenylist();
  if (isProduction && denylist.size === 0) {
    const dbg = getDenylistDebugSnapshot();
    throw new Error(
      "[SECURITY] Platform authority denylist is not configured. Refusing to " +
        "build a deployment — set NEXT_PUBLIC_PLATFORM_AUTHORITY_DENYLIST and " +
        "redeploy (NEXT_PUBLIC_* vars are inlined at build time). " +
        `Debug: ${JSON.stringify(dbg)}`
    );
  }
}

export function assertNoPlatformAuthority(
  authority: PublicKey,
  fieldName: string,
  moduleId: string,
  // Defaults to the module-level denylist; overridable for unit testing.
  denylist: ReadonlySet<string> = getPlatformAuthorityDenylist()
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

  /**
   * True ONLY when this module's instruction set has passed a completed
   * EXTERNAL security audit cited in `auditReference`. A placeholder/TODO
   * reference does not count — see assertModuleVerificationIntegrity, which
   * fails the registry load if this invariant is violated (Audit-1 TOB-12).
   */
  verified: boolean;

  /** Reference (URL or doc id) to the completed audit report. Required if verified. */
  auditReference?: string;

  /**
   * Relative position of this module's init instruction(s) within a mint
   * transaction, ascending. The universal "before initializeMint" rule always
   * applies; this only orders extensions against EACH OTHER (Audit-1 TOB-15).
   * Omitted → 0. Modules with equal priority keep caller/input order.
   */
  initOrderPriority?: number;

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

/**
 * ============================================================================
 * MODULE INTEGRITY (Audit-1 TOB-12 / TOB-15)
 * ============================================================================
 */

/** Matches a placeholder audit reference (e.g. "TODO: link audit report"). */
const PLACEHOLDER_AUDIT_REF = /^\s*(todo|tbd|placeholder)\b/i;

/**
 * True only when a module carries a completed EXTERNAL audit: `verified` is set
 * AND `auditReference` is present and not a placeholder. This is the honest
 * signal to surface to users, not the raw `verified` boolean.
 */
export function isExternallyAudited(
  m: Pick<ModuleDefinition<unknown>, "verified" | "auditReference">
): boolean {
  return (
    m.verified === true &&
    typeof m.auditReference === "string" &&
    m.auditReference.trim().length > 0 &&
    !PLACEHOLDER_AUDIT_REF.test(m.auditReference)
  );
}

/**
 * Fails closed if a module claims `verified: true` without a real audit
 * reference, so the misleading "verified + TODO" state can never ship. Run
 * against every registered module at load time.
 */
export function assertModuleVerificationIntegrity(m: ModuleDefinition<unknown>): void {
  if (m.verified && !isExternallyAudited(m)) {
    throw new Error(
      `Module "${m.id}" is marked verified:true but cites no completed audit ` +
        `(auditReference: ${m.auditReference ?? "undefined"}). Set verified:false ` +
        `until a real external audit reference is provided.`
    );
  }
}

/** Ascending comparator by initOrderPriority (undefined → 0). Stable-friendly. */
export function compareInitOrder(
  a: Pick<ModuleDefinition<unknown>, "initOrderPriority">,
  b: Pick<ModuleDefinition<unknown>, "initOrderPriority">
): number {
  return (a.initOrderPriority ?? 0) - (b.initOrderPriority ?? 0);
}
