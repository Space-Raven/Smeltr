import { z } from "zod";
import {
  createInitializeNonTransferableMintInstruction,
  ExtensionType,
} from "@solana/spl-token";
import { ModuleDefinition, ModuleId } from "../schema";

/** No configurable parameters — this module is a binary on/off switch. */
export const NonTransferableParamsSchema = z.object({});

export type NonTransferableParams = z.infer<typeof NonTransferableParamsSchema>;

export const NonTransferableModule: ModuleDefinition<NonTransferableParams> = {
  id: ModuleId.NON_TRANSFERABLE,
  name: "Non-Transferable (Soulbound)",
  description:
    "Permanently prevents the token from being transferred between " +
    "accounts after minting. Commonly used for credentials, " +
    "memberships, or achievement/reputation tokens.",
  extensionTypes: [ExtensionType.NonTransferable],
  paramsSchema: NonTransferableParamsSchema,
  verified: true,
  auditReference: "TODO: link audit report before production launch",

  /**
   * No HARD conflicts. Note for the compatibility engine: combining this
   * with Transfer Fee is protocol-legal but the fee can never be collected
   * (no transfers occur) — surfaced as a soft-conflict warning, not a
   * block. Combining with Permanent Delegate remains meaningful, since the
   * delegate can still move/burn tokens regardless of this flag.
   */
  incompatibleWith: [],

  buildInitInstructions(ctx, _params) {
    return [
      createInitializeNonTransferableMintInstruction(ctx.mint, ctx.programId),
    ];
  },
};
