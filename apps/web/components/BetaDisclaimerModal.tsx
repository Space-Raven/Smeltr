"use client";

import { useState, useEffect } from "react";

/**
 * BetaDisclaimerModal
 *
 * Must be acknowledged before any action that triggers a real financial
 * commitment (Stripe checkout). Shown once per browser session; dismissed
 * state is stored in sessionStorage so it doesn't re-appear mid-session.
 *
 * Usage:
 *   const { acknowledged, DisclaimerModal } = useBetaDisclaimer();
 *
 *   // Gate the Stripe button:
 *   <button onClick={acknowledged ? handleUpgrade : openDisclaimer}>
 *     Upgrade
 *   </button>
 *   <DisclaimerModal onConfirm={handleUpgrade} />
 */

const STORAGE_KEY = "smeltr_beta_disclaimer_ack";

export function useBetaDisclaimer() {
  const [acknowledged, setAcknowledged] = useState(false);
  const [open, setOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAcknowledged(sessionStorage.getItem(STORAGE_KEY) === "1");
    }
  }, []);

  function gate(action: () => void) {
    if (acknowledged) {
      action();
    } else {
      setPendingAction(() => action);
      setOpen(true);
    }
  }

  function confirm() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setAcknowledged(true);
    setOpen(false);
    pendingAction?.();
    setPendingAction(null);
  }

  function dismiss() {
    setOpen(false);
    setPendingAction(null);
  }

  return {
    acknowledged,
    gate,
    DisclaimerModal: () =>
      open ? (
        <BetaDisclaimerModal onConfirm={confirm} onDismiss={dismiss} />
      ) : null,
  };
}

interface Props {
  onConfirm: () => void;
  onDismiss: () => void;
}

export default function BetaDisclaimerModal({ onConfirm, onDismiss }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         role="dialog" aria-modal="true" aria-labelledby="disclaimer-title">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md rounded-xl border border-amber-900/50
                      bg-[#1A0C05] p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-lg">⚠</span>
            <h2 id="disclaimer-title" className="text-base font-semibold text-amber-100">
              Beta Software — Read Before Continuing
            </h2>
          </div>
          <p className="text-xs text-amber-600 uppercase tracking-widest">
            Smeltr Early Access
          </p>
        </div>

        {/* Body */}
        <div className="space-y-3 text-sm text-amber-200/80 leading-relaxed">
          <p>
            Smeltr is currently in <strong className="text-amber-300">beta</strong>.
            The platform is functional and has been tested, but may contain bugs or
            change without notice.
          </p>
          <ul className="space-y-2 pl-4 list-disc marker:text-amber-600">
            <li>
              <strong className="text-amber-300">Your wallet signs everything.</strong>{" "}
              Smeltr never holds your keys, funds, or mint authority.
            </li>
            <li>
              <strong className="text-amber-300">Subscriptions are live charges.</strong>{" "}
              The $19/month premium plan bills your payment method immediately via Stripe.
              Cancel any time from your Stripe billing portal.
            </li>
            <li>
              <strong className="text-amber-300">Tokens deployed on-chain are permanent.</strong>{" "}
              Solana transactions cannot be reversed. Verify all parameters before confirming.
            </li>
            <li>
              <strong className="text-amber-300">No financial advice.</strong>{" "}
              Smeltr is neutral infrastructure. Nothing here constitutes investment or
              financial advice.
            </li>
          </ul>
          <p>
            By continuing you confirm you have read and understood the above, and that
            you are using this beta software at your own risk.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
          <button
            onClick={onDismiss}
            className="flex-1 rounded-lg border border-amber-900/50 px-4 py-2.5
                       text-sm font-medium text-amber-400 hover:bg-amber-900/20
                       transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-amber-600 hover:bg-amber-500
                       active:bg-amber-700 px-4 py-2.5 text-sm font-semibold
                       text-white transition-colors"
          >
            I understand — continue
          </button>
        </div>
      </div>
    </div>
  );
}
