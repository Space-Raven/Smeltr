import {
  ModuleDefinition,
  ModuleId,
  assertModuleVerificationIntegrity,
} from "./schema";
import { TransferFeeModule } from "./modules/transfer-fee";
import { NonTransferableModule } from "./modules/non-transferable";
import { PermanentDelegateModule } from "./modules/permanent-delegate";

export const MODULE_REGISTRY: Record<ModuleId, ModuleDefinition<any>> = {
  [ModuleId.TRANSFER_FEE]: TransferFeeModule,
  [ModuleId.NON_TRANSFERABLE]: NonTransferableModule,
  [ModuleId.PERMANENT_DELEGATE]: PermanentDelegateModule,
};

// TOB-12: fail closed at load if any module claims verified:true without a
// completed audit reference, so the "verified + TODO" misrepresentation
// cannot ship.
for (const mod of Object.values(MODULE_REGISTRY)) {
  assertModuleVerificationIntegrity(mod);
}

export function getModule(id: ModuleId): ModuleDefinition<any> {
  const module = MODULE_REGISTRY[id];
  if (!module) {
    throw new Error(`Unknown module id: ${id}`);
  }
  return module;
}

export * from "./schema";
export * from "./compatibility";
export * from "./modules/transfer-fee";
export * from "./modules/non-transferable";
export * from "./modules/permanent-delegate";
export * from "./metadata/types";
export * from "./metadata/token2022-native";
export * from "./metadata/metaplex-legacy";
