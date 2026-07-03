"use client";

import { isSmeltrPlusLiveClient } from "../lib/smeltrPlusClient";

interface SmeltrPlusUpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  upgrading?: boolean;
  context?: "permanent-delegate" | "template" | "general";
}

/**
 * Upgrade prompt — shows "coming soon" during beta when Smeltr+ purchases are disabled.
 */
export function SmeltrPlusUpgradeModal({
  open,
  onClose,
  onUpgrade,
  upgrading,
  context = "general",
}: SmeltrPlusUpgradeModalProps) {
  if (!open) return null;

  const live = isSmeltrPlusLiveClient();

  if (!live) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Smeltr+ — coming soon</h2>
          <p className="text-sm text-gray-600">
            Premium subscriptions are not open during the public beta. All Token-2022 modules,
            including Permanent Delegate, are available on the free tier for now.
          </p>
          <p className="text-xs text-gray-500">
            Smeltr+ (platform uploads, fee waivers, management tools) launches after legal review
            and payment setup are complete.
          </p>
          <button type="button" onClick={onClose} className="text-sm text-amber-700 underline">
            Got it
          </button>
        </div>
      </div>
    );
  }

  const title =
    context === "permanent-delegate"
      ? "Permanent Delegate is a Smeltr+ instrument"
      : "Upgrade to Smeltr+";

  const body =
    context === "permanent-delegate"
      ? "Permanent Delegate grants irrevocable transfer/burn authority over all holders — a professional compliance tool. Smeltr+ unlocks deployment, platform-funded metadata uploads, and the management dashboard."
      : "Smeltr+ includes platform-funded Arweave uploads, permanent delegate access, and deployment management tools.";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="smeltr-plus-title"
    >
      <div className="max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
        <h2 id="smeltr-plus-title" className="text-lg font-semibold text-gray-900">
          {title}
        </h2>
        <p className="text-sm text-gray-600">{body}</p>
        <p className="text-xs text-gray-500">
          7-day refund available only if no Smeltr+ features have been used.
        </p>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="text-sm text-gray-600 underline">
            Not now
          </button>
          <button
            type="button"
            onClick={onUpgrade}
            disabled={upgrading}
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {upgrading ? "Redirecting…" : "Get Smeltr+ — $19/mo"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Inline banner for dashboard / homepage when Smeltr+ is disabled. */
export function SmeltrPlusComingSoonBanner() {
  if (isSmeltrPlusLiveClient()) return null;
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <strong>Smeltr+ coming soon.</strong> Premium subscriptions are paused during the public beta.
      All deployment modules remain free.
    </div>
  );
}
