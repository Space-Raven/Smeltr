import { ModuleId } from "@platform/module-registry";

/**
 * Modules whose risk profile requires an explicit, separate user
 * acknowledgment (beyond the general "review and sign" step) before a
 * deployment plan can proceed to the confirm/sign stage.
 *
 * TODO: promote this to a `riskLevel: "standard" | "high"` field on
 * ModuleDefinition once the registry is stable. Kept separate for now to
 * avoid touching module-registry code under test.
 */
export const HIGH_IMPACT_MODULES: ReadonlySet<ModuleId> = new Set([
  ModuleId.PERMANENT_DELEGATE,
]);

/**
 * Specific, plain-language risk explanations shown next to each
 * high-impact module's acknowledgment checkbox. Keyed by ModuleId so a
 * future module added to HIGH_IMPACT_MODULES without a corresponding entry
 * here falls back to a generic warning (see DeploymentReviewPanel) rather
 * than silently rendering nothing.
 */
export const HIGH_IMPACT_MODULE_WARNINGS: Partial<Record<ModuleId, string>> = {
  [ModuleId.PERMANENT_DELEGATE]:
    "Permanent Delegate grants the address you specify the permanent, " +
    "irrevocable ability to transfer or burn tokens from ANY holder's " +
    "account — including yours — for as long as this token exists. This " +
    "cannot be turned off later. Only enable this if you fully understand " +
    "and intend this level of control.",
};
