import { ExtensionType } from "@solana/spl-token";
import { ModuleId } from "./schema";
import { MODULE_REGISTRY, getModule } from "./index";

export type CompatibilityErrorType =
  | "unknown-module"
  | "duplicate-module"
  | "duplicate-extension"
  | "hard-conflict";

export interface CompatibilityError {
  type: CompatibilityErrorType;
  moduleIds: ModuleId[];
  message: string;
}

export interface CompatibilityWarning {
  type: "soft-conflict";
  moduleIds: ModuleId[];
  message: string;
}

export interface CompatibilityResult {
  valid: boolean;
  errors: CompatibilityError[];
  warnings: CompatibilityWarning[];
  /**
   * Deduplicated module ids in input order. Only present when `valid` is
   * true. Final instruction ordering is determined separately by the
   * orchestrator — do not assume this order is execution order.
   */
  resolvedModules?: ModuleId[];
}

/**
 * Pairs of modules that are protocol-legal together but produce a result
 * likely surprising to the user. Surfaced as warnings in the UI; never
 * block deployment.
 */
type SoftConflictRule = {
  pair: [ModuleId, ModuleId];
  message: string;
};

export const SOFT_CONFLICT_RULES: SoftConflictRule[] = [
  {
    pair: [ModuleId.NON_TRANSFERABLE, ModuleId.TRANSFER_FEE],
    message:
      "Non-Transferable tokens cannot be transferred, so the Transfer Fee " +
      "configured here will never be triggered and no fees will ever be " +
      "collected. This combination is allowed but is likely not what you want.",
  },
];

export class ExtensionCollisionError extends Error {
  constructor(public readonly providerId: string, public readonly extension: ExtensionType) {
    super(
      `Metadata provider "${providerId}" requires extension ` +
        `${ExtensionType[extension]}, which is already configured by a selected module.`
    );
  }
}

/**
 * Guards against a metadata provider and a selected module both
 * configuring the same underlying Token-2022 extension. Currently
 * unreachable with the existing module set (none use MetadataPointer/
 * TokenMetadata), but kept as a standalone function so it stays
 * unit-testable independent of the full orchestrator/registry.
 */
export function assertNoExtensionCollision(
  moduleExtensionTypes: ExtensionType[],
  metadataExtensionTypes: ExtensionType[],
  metadataProviderId: string
): void {
  for (const ext of metadataExtensionTypes) {
    if (moduleExtensionTypes.includes(ext)) {
      throw new ExtensionCollisionError(metadataProviderId, ext);
    }
  }
}

/**
 * Validates a set of selected module ids against:
 *   1. Unknown module ids (typos, stale ids from old configs)
 *   2. Duplicate module selections
 *   3. Duplicate underlying Token-2022 extensions across different modules
 *   4. Hard conflicts declared via `incompatibleWith`
 *   5. Soft conflicts (warnings only — does not affect `valid`)
 */
export function validateModuleSelection(
  moduleIds: ModuleId[]
): CompatibilityResult {
  const errors: CompatibilityError[] = [];
  const warnings: CompatibilityWarning[] = [];

  // --- 1. Unknown modules -------------------------------------------------
  const unknownIds = moduleIds.filter((id) => !MODULE_REGISTRY[id]);
  if (unknownIds.length > 0) {
    for (const id of unknownIds) {
      errors.push({
        type: "unknown-module",
        moduleIds: [id],
        message: `"${id}" is not a recognized module id.`,
      });
    }
    return { valid: false, errors, warnings };
  }

  // --- 2. Duplicate module selections -------------------------------------
  const seen = new Set<ModuleId>();
  const deduped: ModuleId[] = [];
  for (const id of moduleIds) {
    if (seen.has(id)) {
      errors.push({
        type: "duplicate-module",
        moduleIds: [id],
        message: `Module "${id}" was selected more than once.`,
      });
      continue;
    }
    seen.add(id);
    deduped.push(id);
  }

  // --- 3. Duplicate underlying extensions across different modules --------
  const extensionOwner = new Map<ExtensionType, ModuleId>();
  for (const id of deduped) {
    for (const ext of getModule(id).extensionTypes) {
      const owner = extensionOwner.get(ext);
      if (owner) {
        errors.push({
          type: "duplicate-extension",
          moduleIds: [owner, id],
          message:
            `Modules "${owner}" and "${id}" both configure the same ` +
            `Token-2022 extension (${ExtensionType[ext]}). A mint cannot ` +
            `initialize the same extension twice.`,
        });
      } else {
        extensionOwner.set(ext, id);
      }
    }
  }

  // --- 4. Hard conflicts (checked bidirectionally) ------------------------
  for (let i = 0; i < deduped.length; i++) {
    for (let j = i + 1; j < deduped.length; j++) {
      const a = deduped[i]!;
      const b = deduped[j]!;
      const modA = getModule(a);
      const modB = getModule(b);

      if (modA.incompatibleWith.includes(b) || modB.incompatibleWith.includes(a)) {
        errors.push({
          type: "hard-conflict",
          moduleIds: [a, b],
          message: `"${modA.name}" and "${modB.name}" cannot be combined on the same mint.`,
        });
      }
    }
  }

  // --- 5. Soft conflicts (warnings only) ----------------------------------
  for (const rule of SOFT_CONFLICT_RULES) {
    const [a, b] = rule.pair;
    if (seen.has(a) && seen.has(b)) {
      warnings.push({
        type: "soft-conflict",
        moduleIds: [a, b],
        message: rule.message,
      });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  return {
    valid: true,
    errors: [],
    warnings,
    resolvedModules: deduped,
  };
}
