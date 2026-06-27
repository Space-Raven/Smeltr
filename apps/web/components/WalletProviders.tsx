"use client";

import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

/**
 * Wraps the app with ConnectionProvider + WalletProvider.
 *
 * Wallet Standard wallets (Phantom, Solflare, Backpack, etc.) are detected
 * automatically — no explicit adapter list needed for v0.15+.
 *
 * autoConnect is intentionally false: we don't want to silently re-connect
 * on page load without the user's awareness.
 */
export function WalletProviders({ children }: { children: React.ReactNode }) {
  // Empty adapter list — Wallet Standard wallets register themselves.
  const adapters = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <WalletProvider wallets={adapters} autoConnect={false}>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
