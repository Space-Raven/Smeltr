"use client";
import { ModuleId } from "@platform/module-registry";
import { DeploymentPlan } from "../lib/buildDeploymentPlan";
import { HIGH_IMPACT_MODULE_WARNINGS } from "../lib/risk";

interface DeploymentReviewPanelProps {
  plan: DeploymentPlan;
  acknowledgedModules: Set<ModuleId>;
  onAcknowledgeChange: (id: ModuleId, acknowledged: boolean) => void;
  onConfirm: () => void;
  status: string;
}

const FALLBACK_WARNING =
  "This module grants elevated authority over the token. Please confirm " +
  "you understand its implications before proceeding.";

export function DeploymentReviewPanel({
  plan,
  acknowledgedModules,
  onAcknowledgeChange,
  onConfirm,
  status,
}: DeploymentReviewPanelProps) {
  const allHighImpactAcknowledged = plan.highImpactModules.every((id) =>
    acknowledgedModules.has(id)
  );
  const canConfirm = allHighImpactAcknowledged && status === "ready";

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold">Review Deployment</h3>

      {/* Soft-conflict warnings — informational, no gate */}
      {plan.warnings.length > 0 && (
        <div className="space-y-1 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {plan.warnings.map((warning, i) => (
            <p key={i}>{warning.message}</p>
          ))}
        </div>
      )}

      {/* High-impact module acknowledgments — each gates the confirm button */}
      {plan.highImpactModules.map((id) => (
        <label
          key={id}
          className="flex items-start gap-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900"
        >
          <input
            type="checkbox"
            className="mt-1"
            checked={acknowledgedModules.has(id)}
            onChange={(e) => onAcknowledgeChange(id, e.target.checked)}
          />
          <span>{HIGH_IMPACT_MODULE_WARNINGS[id] ?? FALLBACK_WARNING}</span>
        </label>
      ))}

      {/* Cost breakdown — every charge shown explicitly. The platform fee is
          never hidden; transparency is a hard requirement. */}
      <div className="space-y-1 rounded-md border border-gray-200 p-3 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Rent-exempt deposit</span>
          <span>{(plan.rentExemptLamports / 1_000_000_000).toFixed(6)} SOL</span>
        </div>
        {plan.platformFee && (
          <div className="flex justify-between">
            <span>Smeltr platform fee</span>
            <span>{(plan.platformFee.feeLamports / 1_000_000_000).toFixed(2)} SOL</span>
          </div>
        )}
        <div className="flex justify-between border-t border-gray-200 pt-1 font-medium text-gray-900">
          <span>Total (excl. network fee)</span>
          <span>
            {(
              (plan.rentExemptLamports + (plan.platformFee?.feeLamports ?? 0)) /
              1_000_000_000
            ).toFixed(6)}{" "}
            SOL
          </span>
        </div>
      </div>

      <button
        onClick={onConfirm}
        disabled={!canConfirm}
        className="w-full rounded-md bg-indigo-600 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "submitting" ? "Confirming…" : "Sign & Deploy"}
      </button>
    </div>
  );
}
