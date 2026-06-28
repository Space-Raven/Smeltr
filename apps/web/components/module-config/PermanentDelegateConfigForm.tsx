"use client";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWallet } from "@solana/wallet-adapter-react";
import { PermanentDelegateParamsSchema } from "@platform/module-registry";

interface ModuleFormProps {
  onChange: (params: unknown, isValid: boolean) => void;
}

export function PermanentDelegateConfigForm({ onChange }: ModuleFormProps) {
  const wallet = useWallet();
  const walletAddress = wallet.publicKey?.toBase58() ?? "";
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const {
    register,
    watch,
    trigger,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(PermanentDelegateParamsSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { delegate: walletAddress },
  });

  // Emit validated values on mount AND on every change. Reading watch() at render
  // time + using it as an effect dependency caused an infinite render loop; the
  // subscription form fires only on real changes and trigger() supplies validity.
  useEffect(() => {
    const emit = async () => {
      const valid = await trigger();
      onChangeRef.current(getValues(), valid);
    };
    void emit();
    const subscription = watch(() => {
      void emit();
    });
    return () => subscription.unsubscribe();
  }, [watch, trigger, getValues]);

  if (!walletAddress) {
    return (
      <p className="pl-4 text-sm text-amber-700">
        Connect your wallet to configure this module.
      </p>
    );
  }

  return (
    <div className="space-y-3 pl-4 border-l-2 border-red-300">
      <div>
        <label className="block text-sm font-medium">Delegate address</label>
        <input
          type="text"
          {...register("delegate")}
          className="mt-1 block w-full rounded-md border-gray-300 text-sm font-mono"
        />
        <p className="text-xs text-gray-500">
          This address will be permanently able to transfer or burn tokens from
          ANY holder&apos;s account. Defaults to your connected wallet.
        </p>
        {errors.delegate && <p className="text-xs text-red-600">{errors.delegate.message}</p>}
      </div>
    </div>
  );
}
