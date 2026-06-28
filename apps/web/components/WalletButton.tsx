"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useState, useEffect } from "react";

/**
 * Returns true when running on iOS (iPhone, iPad, iPod).
 * Used to show the Phantom deep-link instead of "install extension" copy.
 * Runs only client-side — returns false on first SSR render.
 */
function useIsIOS() {
  const [ios, setIos] = useState(false);
  useEffect(() => {
    setIos(/iPhone|iPad|iPod/i.test(window.navigator.userAgent));
  }, []);
  return ios;
}

/**
 * Phantom in-app browser deep link. Opens the current page inside Phantom's
 * built-in browser where window.phantom is injected and wallets are detected.
 * Only useful on iOS/Android where browser extensions don't exist.
 */
function phantomDeepLink() {
  if (typeof window === "undefined") return "https://phantom.app";
  return `https://phantom.app/ul/browse/${encodeURIComponent(
    window.location.href
  )}?ref=${encodeURIComponent(window.location.origin)}`;
}

export function WalletButton() {
  const { wallet, connect, disconnect, connecting, connected, publicKey, select, wallets } =
    useWallet();
  const [showPicker, setShowPicker] = useState(false);
  const isIOS = useIsIOS();

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
        className="inline-flex items-center gap-2 rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-60"
      >
        {connected && (
          <span className="h-2 w-2 rounded-full bg-green-400" aria-hidden="true" />
        )}
        {label}
      </button>

      {/* Wallet picker — detected wallets */}
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

      {/* No wallets detected */}
      {showPicker && !connected && wallets.length === 0 && (
        <div className="absolute right-0 mt-2 w-60 rounded-xl border border-amber-200 bg-white p-4 shadow-xl z-50 text-sm text-gray-600 space-y-3">
          {isIOS ? (
            <>
              <p className="text-gray-700">
                On iOS, open this page inside the Phantom wallet browser to connect.
              </p>
              <a
                href={phantomDeepLink()}
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2.5 transition-colors no-underline text-sm"
              >
                <svg width="18" height="18" viewBox="0 0 128 128" fill="none" aria-hidden="true">
                  <rect width="128" height="128" rx="32" fill="#AB9FF2"/>
                  <path d="M110.4 64c0 25.7-20.8 46.5-46.4 46.5S17.6 89.7 17.6 64 38.4 17.5 64 17.5 110.4 38.3 110.4 64z" fill="white"/>
                  <path d="M84.3 55.5H75c-.8 0-1.5.7-1.5 1.5v18.6c0 .8.7 1.5 1.5 1.5h9.3c5.4 0 9.7-4.4 9.7-9.8s-4.3-9.8-9.7-9.8z" fill="#AB9FF2"/>
                  <path d="M43.7 55.5h-9.3c-.8 0-1.5.7-1.5 1.5v18.6c0 .8.7 1.5 1.5 1.5h9.3V55.5z" fill="#AB9FF2"/>
                </svg>
                Open in Phantom
              </a>
              <p className="text-xs text-gray-400 text-center">
                Don&apos;t have Phantom?{" "}
                <a
                  href="https://phantom.app"
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-600 underline"
                >
                  Download
                </a>
              </p>
            </>
          ) : (
            <>
              <p>No wallets detected. Install a Solana wallet to continue.</p>
              <a
                href="https://phantom.app"
                target="_blank"
                rel="noreferrer"
                className="block w-full text-center rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 transition-colors no-underline"
              >
                Install Phantom
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}
