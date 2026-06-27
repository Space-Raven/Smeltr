"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useState } from "react";

/**
 * Minimal wallet connect/disconnect button.
 * Sits in the header slot; no external UI library dependency.
 */
export function WalletButton() {
  const { wallet, connect, disconnect, connecting, connected, publicKey, select, wallets } =
    useWallet();
  const [showPicker, setShowPicker] = useState(false);

  const handleClick = useCallback(async () => {
    if (connected) {
      await disconnect();
      return;
    }
    if (wallet) {
      await connect();
      return;
    }
    setShowPicker((v) => !v);
  }, [connected, wallet, connect, disconnect]);

  const label = connected
    ? `${publicKey!.toBase58().slice(0, 4)}…${publicKey!.toBase58().slice(-4)}`
    : connecting
    ? "Connecting…"
    : "Connect Wallet";

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={connecting}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
      >
        {connected && (
          <span className="h-2 w-2 rounded-full bg-green-400" aria-hidden="true" />
        )}
        {label}
      </button>

      {/* Simple wallet picker — only shown when no wallet is pre-selected */}
      {showPicker && !connected && wallets.length > 0 && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl border border-gray-200 bg-white py-1 shadow-xl z-50">
          {wallets.map((w) => (
            <button
              key={w.adapter.name}
              onClick={() => {
                select(w.adapter.name);
                setShowPicker(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={w.adapter.icon} alt="" width={20} height={20} className="rounded" />
              {w.adapter.name}
            </button>
          ))}
        </div>
      )}

      {showPicker && !connected && wallets.length === 0 && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl border border-gray-200 bg-white p-4 shadow-xl z-50 text-sm text-gray-500">
          No wallets detected. Install{" "}
          <a
            href="https://phantom.app"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-600 underline"
          >
            Phantom
          </a>{" "}
          or another Solana wallet.
        </div>
      )}
    </div>
  );
}
