"use client";

import { useState } from "react";

/**
 * Small inline copy-to-clipboard button with confirmation feedback.
 * Users' first instinct after minting is to paste the mint address into a
 * wallet or explorer — make that one click.
 */
export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (very old browser / non-secure context) —
      // select-and-copy fallback isn't worth the complexity here.
    }
  }

  return (
    <button
      onClick={copy}
      type="button"
      className="inline-flex items-center gap-1 rounded-md border border-amber-300 px-2 py-0.5 text-xs font-medium text-amber-800 hover:bg-amber-50 transition-colors"
      aria-label={`${label} to clipboard`}
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}
