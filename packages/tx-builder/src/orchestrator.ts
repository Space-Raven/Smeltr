import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  createInitializeMintInstruction,
} from "@solana/spl-token";
import {
  ModuleId,
  ModuleContext,
  CompatibilityWarning,
  MetadataProvider,
  TokenMetadataInput,
  getModule,
  validateModuleSelection,
  assertNoPlatformAuthority,
  assertPlatformDenylistConfigured,
  assertNoExtensionCollision,
  compareInitOrder,
} from "@platform/module-registry";

export interface ModuleSelection {
  id: ModuleId;
  /** Raw, unvalidated params from the UI/API for this module. */
  params: unknown;
}

export interface BuildMintInstructionsParams {
  connection: Connection;
  /** Pays for account creation + tx fees. */
  payer: PublicKey;
  /** The mint account's public key (caller generates and signs with this keypair). */
  mint: PublicKey;
  /** The user's wallet — passed through to module builders as the authority source. */
  userWallet: PublicKey;
  decimals: number;
  /** Mint authority for the token. Must NOT be a platform-held key. */
  mintAuthority: PublicKey;
  /** Freeze authority, or null to permanently disable freezing. */
  freezeAuthority: PublicKey | null;
  modules: ModuleSelection[];

  /**
   * Optional metadata to attach. If provided, the provider's pre-init
   * extension types/instructions are included in THIS transaction's mint
   * sizing and instruction set (transaction 1). The provider's post-init
   * instructions (transaction 2) are built separately via
   * `buildMetadataAttachmentInstructions`, after transaction 1 confirms.
   */
  metadata?: {
    provider: MetadataProvider;
    input: TokenMetadataInput;
  };
}

export interface BuildMintInstructionsResult {
  instructions: TransactionInstruction[];
  mintAccountSpace: number;
  rentExemptLamports: number;
  warnings: CompatibilityWarning[];
}

export class ModuleValidationError extends Error {
  constructor(
    public readonly issues: unknown,
    public readonly moduleId: ModuleId | "metadata"
  ) {
    super(`Invalid parameters for module "${moduleId}"`);
  }
}

/**
 * Builds the full, correctly-ordered instruction set to create a new
 * Token-2022 mint with the selected modules (extensions).
 *
 * Order is non-negotiable and centralized here:
 *   1. SystemProgram.createAccount — allocate the mint account. `space` is
 *      sized for the mint + selected extensions + MetadataPointer (if
 *      metadata). `lamports` is sized for that PLUS the eventual
 *      TokenMetadata TLV entry (see metadata.getAdditionalMintSpace) — this
 *      overfunding is what lets transaction 2 resize the account without a
 *      separate lamport transfer. See CLAUDE.md.
 *   2. Each module's extension-initialization instruction(s) — MUST
 *      execute before step 4.
 *   3. MetadataPointer init (if metadata) — MUST also execute before step 4.
 *   4. initializeMint — finalizes the mint; no further extension
 *      initialization is possible after this point (except TokenMetadata,
 *      handled in transaction 2).
 *
 * This function returns instructions only. The caller (frontend) is
 * responsible for assembling the transaction, including `mint` and `payer`
 * as signers, and sending it via the user's wallet — the platform never
 * holds or submits a signing key.
 */
export async function buildMintInstructions(
  args: BuildMintInstructionsParams
): Promise<BuildMintInstructionsResult> {
  const {
    connection,
    payer,
    mint,
    userWallet,
    decimals,
    mintAuthority,
    freezeAuthority,
    modules,
  } = args;

  // --- 0. Security preconditions ------------------------------------------
  // Fail closed if the denylist is unconfigured in production (Audit-1 TOB-01):
  // without it the non-custodial authority backstop is inert, so refuse to build.
  assertPlatformDenylistConfigured();

  // mintAuthority/freezeAuthority feed directly into initializeMint and are
  // NOT covered by any module's buildInitInstructions — check here.
  assertNoPlatformAuthority(mintAuthority, "mintAuthority", "core/initializeMint");
  if (freezeAuthority !== null) {
    assertNoPlatformAuthority(freezeAuthority, "freezeAuthority", "core/initializeMint");
  }

  // --- 1. Validate module selection (hard conflicts, dup extensions) ------
  const moduleIds = modules.map((m) => m.id);
  const compatibility = validateModuleSelection(moduleIds);
  if (!compatibility.valid) {
    throw new Error(
      "Module selection is invalid: " +
        compatibility.errors.map((e) => e.message).join("; ")
    );
  }

  // --- 2. Validate + parse each module's params against its schema --------
  const parsedModules = modules.map(({ id, params }) => {
    const moduleDef = getModule(id);
    const result = moduleDef.paramsSchema.safeParse(params);
    if (!result.success) {
      throw new ModuleValidationError(result.error.issues, id);
    }
    return { moduleDef, params: result.data };
  });

  // TOB-15: enforce canonical extension init order. Array.sort is stable, so
  // modules with equal (or default 0) initOrderPriority keep their input order.
  // This orders BOTH the sizing pass below and the instruction assembly, so a
  // future order-sensitive module can pin its position without callers knowing.
  parsedModules.sort((a, b) => compareInitOrder(a.moduleDef, b.moduleDef));

  // --- 3. Build context, then compute mint account size -------------------
  const ctx: ModuleContext = {
    mint,
    payer,
    userWallet,
    decimals,
    programId: TOKEN_2022_PROGRAM_ID,
  };

  const moduleExtensionTypes = parsedModules.flatMap((m) => m.moduleDef.extensionTypes);
  const metadataExtensionTypes = args.metadata?.provider.getPreInitExtensionTypes() ?? [];

  if (args.metadata) {
    assertNoExtensionCollision(moduleExtensionTypes, metadataExtensionTypes, args.metadata.provider.id);
  }

  const extensionTypes: ExtensionType[] = [...moduleExtensionTypes, ...metadataExtensionTypes];
  const mintAccountSpace = getMintLen(extensionTypes);

  // Overfund CreateAccount's lamports (not its `space`) to cover the
  // eventual TokenMetadata resize in transaction 2.
  const additionalMintSpace = args.metadata
    ? args.metadata.provider.getAdditionalMintSpace(ctx, args.metadata.input)
    : 0;

  const rentExemptLamports = await connection.getMinimumBalanceForRentExemption(
    mintAccountSpace + additionalMintSpace
  );

  // --- 4. Assemble instructions in required order --------------------------
  const instructions: TransactionInstruction[] = [];

  instructions.push(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: mint,
      space: mintAccountSpace,
      lamports: rentExemptLamports,
      programId: TOKEN_2022_PROGRAM_ID,
    })
  );

  // Iteration order = the initOrderPriority-sorted order established above
  // (TOB-15). The current module set (Transfer Fee, Non-Transferable,
  // Permanent Delegate) all use the default priority, so this is input order
  // today; an order-sensitive future module (e.g. Transfer Hook) just sets a
  // priority and lands in the right position without caller changes.
  for (const { moduleDef, params } of parsedModules) {
    instructions.push(...moduleDef.buildInitInstructions(ctx, params));
  }

  if (args.metadata) {
    instructions.push(
      ...args.metadata.provider.buildPreInitInstructions(ctx, args.metadata.input)
    );
  }

  instructions.push(
    createInitializeMintInstruction(
      mint,
      decimals,
      mintAuthority,
      freezeAuthority,
      TOKEN_2022_PROGRAM_ID
    )
  );

  return {
    instructions,
    mintAccountSpace,
    rentExemptLamports,
    warnings: compatibility.warnings,
  };
}
