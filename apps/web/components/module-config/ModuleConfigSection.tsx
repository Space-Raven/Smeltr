"use client";
import { useEffect, useRef, useState } from "react";
import { ModuleId } from "@platform/module-registry";
import { ModuleSelection } from "@platform/tx-builder";
import { HIGH_IMPACT_MODULES } from "../../lib/risk";
import { TransferFeeConfigForm } from "./TransferFeeConfigForm";
import { NonTransferableConfigForm } from "./NonTransferableConfigForm";
import { PermanentDelegateConfigForm } from "./PermanentDelegateConfigForm";

interface ModuleEntry {
  id: ModuleId;
  label: string;
  description: string;
  Form: React.ComponentType<{ onChange: (params: unknown, isValid: boolean) => void }>;
}

const AVAILABLE_MODULES: ModuleEntry[] = [
  {
    id: ModuleId.TRANSFER_FEE,
    label: "Transfer Fee",
    description: "Charge a basis-point fee on every transfer.",
    Form: TransferFeeConfigForm,
  },
  {
    id: ModuleId.NON_TRANSFERABLE,
    label: "Non-Transferable (Soulbound)",
    description: "Permanently prevent transfers after minting.",
    Form: NonTransferableConfigForm,
  },
  {
    id: ModuleId.PERMANENT_DELEGATE,
    label: "Permanent Delegate",
    description: "Grant an address permanent transfer/burn authority over all holders.",
    Form: PermanentDelegateConfigForm,
  },
];

interface ModuleState {
  enabled: boolean;
  params: unknown;
  isValid: boolean;
}

interface ModuleConfigSectionProps {
  /** Caller should memoize this (useCallback) to avoid re-render loops. */
  onChange: (modules: ModuleSelection[], allValid: boolean) => void;
}

const initialState = (): Record<ModuleId, ModuleState> =>
  Object.fromEntries(
    AVAILABLE_MODULES.map((m) => [m.id, { enabled: false, params: undefined, isValid: true }])
  ) as Record<ModuleId, ModuleState>;

export function ModuleConfigSection({ onChange }: ModuleConfigSectionProps) {
  const [moduleStates, setModuleStates] = useState<Record<ModuleId, ModuleState>>(initialState);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Aggregate -> parent as a side effect of state changes. `onChange` is read
  // through a ref and kept OUT of the dep array — a non-memoized parent callback
  // would otherwise re-fire this every render and cause an infinite update loop.
  useEffect(() => {
    const enabled = Object.entries(moduleStates).filter(
      ([, s]) => (s as ModuleState).enabled
    ) as [ModuleId, ModuleState][];

    const modules: ModuleSelection[] = enabled.map(([id, s]) => ({ id, params: s.params }));
    const allValid = enabled.every(([, s]) => s.isValid);

    onChangeRef.current(modules, allValid);
  }, [moduleStates]);

  const toggleModule = (id: ModuleId, enabled: boolean) => {
    setModuleStates((prev) => ({ ...prev, [id]: { ...prev[id], enabled } }));
  };

  const handleModuleChange = (id: ModuleId, params: unknown, isValid: boolean) => {
    setModuleStates((prev) => ({ ...prev, [id]: { ...prev[id], params, isValid } }));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Modules</h3>
      {AVAILABLE_MODULES.map(({ id, label, description, Form }) => {
        const state = moduleStates[id];
        const isHighImpact = HIGH_IMPACT_MODULES.has(id);

        return (
          <div key={id} className="rounded-md border border-gray-200 p-3">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={state.enabled}
                onChange={(e) => toggleModule(id, e.target.checked)}
                className="mt-1"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{label}</span>
                  {isHighImpact && (
                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
                      High impact
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{description}</p>
              </div>
            </label>

            {state.enabled && (
              <div className="mt-3">
                <Form onChange={(params, isValid) => handleModuleChange(id, params, isValid)} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
