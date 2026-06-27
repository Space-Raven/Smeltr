"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWallet } from "@solana/wallet-adapter-react";
import { TransferFeeParamsSchema } from "@platform/module-registry";

const U64_MAX = "18446744073709551615"; // "no cap" — conventional default

interface ModuleFormProps {
  onChange: (params: unknown, isValid: boolean) => void;
}

export function TransferFeeConfigForm({ onChange }: ModuleFormProps) {
  const wallet = useWallet();
  const walletAddress = wallet.publicKey?.toBase58() ?? "";

  const {
    register,
    watch,
    trigger,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(TransferFeeParamsSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      transferFeeBasisPoints: 100,
      maximumFee: U64_MAX,
      transferFeeConfigAuthority: walletAddress,
      withdrawWithheldAuthority: walletAddress,
    },
  });

  const values = watch();

  // Validate default values immediately on mount so the parent's `modulesValid`
  // reflects the real validity state before the user has touched any field.
  useEffect(() => {
    trigger();
  }, [trigger]);

  useEffect(() => {
    onChange(values, isValid);
  }, [values, isValid, onChange]);

  if (!walletAddress) {
    return (
      <p className="pl-4 text-sm text-amber-700">
        Connect your wallet to configure this module — authority fields default to your wallet.
      </p>
    );
  }

  return (
    <div className="space-y-3 pl-4 border-l-2 border-gray-200">
      <div>
        <label className="block text-sm font-medium">Fee (basis points)</label>
        <input
          type="number"
          {...register("transferFeeBasisPoints", { valueAsNumber: true })}
          className="mt-1 block w-full rounded-md border-gray-300 text-sm"
        />
        <p className="text-xs text-gray-500">100 bps = 1%. Maximum 10000 (100%).</p>
        {errors.transferFeeBasisPoints && (
          <p className="text-xs text-red-600">{errors.transferFeeBasisPoints.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">Maximum fee (base units)</label>
        <input
          type="text"
          {...register("maximumFee")}
          className="mt-1 block w-full rounded-md border-gray-300 text-sm"
        />
        <p className="text-xs text-gray-500">
          Hard cap per transfer, in the token&apos;s smallest unit. Default is effectively
          unlimited — lower this to cap the fee.
        </p>
        {errors.maximumFee && <p className="text-xs text-red-600">{errors.maximumFee.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium">Fee config authority</label>
        <input
          type="text"
          {...register("transferFeeConfigAuthority")}
          className="mt-1 block w-full rounded-md border-gray-300 text-sm font-mono"
        />
        <p className="text-xs text-gray-500">
          Wallet allowed to change the fee later. Defaults to your connected wallet.
        </p>
        {errors.transferFeeConfigAuthority && (
          <p className="text-xs text-red-600">{errors.transferFeeConfigAuthority.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">Withdraw withheld authority</label>
        <input
          type="text"
          {...register("withdrawWithheldAuthority")}
          className="mt-1 block w-full rounded-md border-gray-300 text-sm font-mono"
        />
        <p className="text-xs text-gray-500">
          Wallet allowed to claim collected fees. Defaults to your connected wallet.
        </p>
        {errors.withdrawWithheldAuthority && (
          <p className="text-xs text-red-600">{errors.withdrawWithheldAuthority.message}</p>
        )}
      </div>
    </div>
  );
}
