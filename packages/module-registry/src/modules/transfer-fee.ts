import { z } from "zod";
import {
  createInitializeTransferFeeConfigInstruction,
  ExtensionType,
} from "@solana/spl-token";
import {
  ModuleDefinition,
  ModuleId,
  AuthorityPublicKeySchema,
  U64StringSchema,
  assertNoPlatformAuthority,
} from "../schema";

export const TransferFeeParamsSchema = z.object({
  /** Fee in basis points (1 bps = 0.01%). Max 10,000 = 100%. */
  transferFeeBasisPoints: z
    .number()
    .int()
    .min(0)
    .max(10_000, "Fee cannot exceed 100% (10000 bps)"),

  /** Hard cap on fee per transfer, in base units. Default in UI: u64::MAX ("no cap"). */
  maximumFee: U64StringSchema,

  /** Authority that can modify the fee config. Must be user-supplied. */
  transferFeeConfigAuthority: AuthorityPublicKeySchema,

  /** Authority that can withdraw withheld fees. Must be user-supplied. */
  withdrawWithheldAuthority: AuthorityPublicKeySchema,
});

export type TransferFeeParams = z.infer<typeof TransferFeeParamsSchema>;

export const TransferFeeModule: ModuleDefinition<TransferFeeParams> = {
  id: ModuleId.TRANSFER_FEE,
  name: "Transfer Fee",
  description:
    "Charges a configurable basis-point fee on every transfer. Fees are " +
    "withheld on recipient token accounts until claimed by the withdraw " +
    "authority — the platform never touches withheld fees.",
  extensionTypes: [ExtensionType.TransferFeeConfig],
  paramsSchema: TransferFeeParamsSchema,
  // TOB-12: no external audit yet — do not claim "verified" until auditReference
  // cites a completed report. assertModuleVerificationIntegrity enforces this.
  verified: false,
  incompatibleWith: [],

  buildInitInstructions(ctx, params) {
    assertNoPlatformAuthority(
      params.transferFeeConfigAuthority,
      "transferFeeConfigAuthority",
      ModuleId.TRANSFER_FEE
    );
    assertNoPlatformAuthority(
      params.withdrawWithheldAuthority,
      "withdrawWithheldAuthority",
      ModuleId.TRANSFER_FEE
    );

    return [
      createInitializeTransferFeeConfigInstruction(
        ctx.mint,
        params.transferFeeConfigAuthority,
        params.withdrawWithheldAuthority,
        params.transferFeeBasisPoints,
        params.maximumFee,
        ctx.programId
      ),
    ];
  },
};
