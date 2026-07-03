"use client";

import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { resolveClientRpcUrl } from "../lib/rpcEndpoint";

/**
 * Wraps the app with ConnectionProvider + WalletProvider.
 *
 * Wallet Standard wallets (Phantom, Solflare, Backpack, etc.) are detected
 * automatically — no explicit adapter list needed for v0.15+.
 *
 * autoConnect is true: the adapter only reconnects a wallet the user has
 * already trusted for this origin (it reads the wallet's own trusted-connection
 * state, never prompts for fresh approval). Without it the wallet disconnects
 * on every client navigation, which — combined with SIWS session restore —
 * was the "have to reconnect and re-sign on every page" friction.
 */
export function WalletProviders({ children }: { children: React.ReactNode }) {
  const adapters = useMemo(() => [], []);
  const endpoint = useMemo(() => resolveClientRpcUrl(), []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={adapters} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
