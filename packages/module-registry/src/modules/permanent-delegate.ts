import { z } from "zod";
import {
  createInitializePermanentDelegateInstruction,
  ExtensionType,
} from "@solana/spl-token";
import {
  ModuleDefinition,
  ModuleId,
  AuthorityPublicKeySchema,
  assertNoPlatformAuthority,
} from "../schema";

export const PermanentDelegateParamsSchema = z.object({
  /** Authority granted permanent transfer/burn rights over ALL holders. */
  delegate: AuthorityPublicKeySchema,
});

export type PermanentDelegateParams = z.infer<typeof PermanentDelegateParamsSchema>;

export const PermanentDelegateModule: ModuleDefinition<PermanentDelegateParams> = {
  id: ModuleId.PERMANENT_DELEGATE,
  name: "Permanent Delegate",
  description:
    "Grants a permanent delegate authority the ability to transfer or " +
    "burn ANY token from ANY holder's account, indefinitely, with no way " +
    "to revoke it. This is the highest-impact authority a mint can have — " +
    "the UI MUST surface an explicit, hard-to-miss warning before a user " +
    "enables this module. See apps/web/lib/risk.ts (HIGH_IMPACT_MODULES).",
  extensionTypes: [ExtensionType.PermanentDelegate],
  paramsSchema: PermanentDelegateParamsSchema,
  // TOB-12: no external audit yet — do not claim "verified" until auditReference
  // cites a completed report. assertModuleVerificationIntegrity enforces this.
  verified: false,
  incompatibleWith: [],

  buildInitInstructions(ctx, params) {
    assertNoPlatformAuthority(
      params.delegate,
      "delegate",
      ModuleId.PERMANENT_DELEGATE
    );

    return [
      createInitializePermanentDelegateInstruction(
        ctx.mint,
        params.delegate,
        ctx.programId
      ),
    ];
  },
};
