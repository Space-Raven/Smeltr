/**
 * Smeltr MCP tools — pure logic layer.
 *
 * These functions ARE the "definitive source": validate_config runs Smeltr's
 * real compatibility engine (validateModuleSelection) and each module's real
 * Zod schema, so an AI assistant configuring a Token-2022 token gets the same
 * answer the deploy flow would give. No network, no keys — pure over the
 * @platform/module-registry package. The stdio server in server.ts is a thin
 * adapter over these.
 */
import {
  MODULE_REGISTRY,
  getModule,
  validateModuleSelection,
  ModuleId,
} from "@platform/module-registry";

export const PLATFORM_FEE_SOL = 0.03;

export interface ParamSpec {
  name: string;
  type: string;
  required: boolean;
  authority: boolean;
  notes: string;
}

/**
 * Curated per-module parameter specs (mirrors the on-chain program behavior
 * documented at smeltr.org/blog/token-2022-module-configuration-reference).
 */
const PARAM_SPECS: Record<string, ParamSpec[]> = {
  [ModuleId.TRANSFER_FEE]: [
    { name: "transferFeeBasisPoints", type: "integer 0–10000", required: true, authority: false, notes: "1 bps = 0.01%; 10000 = 100%." },
    { name: "maximumFee", type: "u64 string (base units)", required: true, authority: false, notes: "Per-transfer cap; u64::MAX for no cap." },
    { name: "transferFeeConfigAuthority", type: "base58 pubkey", required: true, authority: true, notes: "Can change the fee later; must be user-owned (not a platform key)." },
    { name: "withdrawWithheldAuthority", type: "base58 pubkey", required: true, authority: true, notes: "Harvests withheld fees; must be user-owned." },
  ],
  [ModuleId.NON_TRANSFERABLE]: [],
  [ModuleId.PERMANENT_DELEGATE]: [
    { name: "delegate", type: "base58 pubkey", required: true, authority: true, notes: "Unconditional transfer/burn authority over ALL holders; permanent. Must be user-owned." },
  ],
};

export function listModules() {
  return Object.values(MODULE_REGISTRY).map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    extensionTypes: m.extensionTypes.map((e) => String(e)),
    highImpact: m.id === ModuleId.PERMANENT_DELEGATE,
  }));
}

export function describeModule(id: string) {
  if (!(id in MODULE_REGISTRY)) {
    return { error: `Unknown module id "${id}". Call list_modules for valid ids.` };
  }
  const m = getModule(id as ModuleId);
  return {
    id: m.id,
    name: m.name,
    description: m.description,
    parameters: PARAM_SPECS[id] ?? [],
    highImpact: id === ModuleId.PERMANENT_DELEGATE,
  };
}

export interface ValidateInput {
  modules: Array<{ id: string; params?: unknown }>;
}

/**
 * Validate a proposed module selection + params against Smeltr's real engine.
 * Reports compatibility (hard conflicts, duplicate extensions, soft-conflict
 * warnings) AND per-module parameter validation from each module's Zod schema.
 */
export function validateConfig(input: ValidateInput) {
  const ids = input.modules.map((m) => m.id as ModuleId);
  const compatibility = validateModuleSelection(ids);

  const parameterIssues: Array<{ moduleId: string; issues: unknown }> = [];
  for (const { id, params } of input.modules) {
    if (!(id in MODULE_REGISTRY)) continue; // already reported by compatibility
    const result = getModule(id as ModuleId).paramsSchema.safeParse(params ?? {});
    if (!result.success) {
      parameterIssues.push({ moduleId: id, issues: result.error.issues });
    }
  }

  const valid = compatibility.valid && parameterIssues.length === 0;
  return {
    valid,
    compatibilityErrors: compatibility.errors,
    warnings: compatibility.warnings,
    parameterIssues,
  };
}

/**
 * Approximate deployment cost. The platform fee is exact; rent depends on the
 * final mint-account size (which extensions add) and the current rent rate, so
 * it is given as a documented range rather than a false-precision number.
 */
export function estimateCost(input: ValidateInput) {
  const known = input.modules.filter((m) => m.id in MODULE_REGISTRY).length;
  const rentLow = 0.0015;
  const rentHigh = 0.002 + known * 0.0008;
  return {
    platformFeeSol: PLATFORM_FEE_SOL,
    estimatedRentSolRange: [Number(rentLow.toFixed(4)), Number(rentHigh.toFixed(4))],
    networkFeeSol: 0.00001,
    note:
      "Platform fee is exact. Rent is an estimate — actual rent-exempt minimum " +
      "is set by the Solana network from the final mint-account size. Deploy at " +
      "smeltr.org/deploy for the exact figure before you sign.",
  };
}
