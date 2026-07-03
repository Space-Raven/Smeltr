"use client";

import { useMemo } from "react";
import { resolveClientRpcUrl, isRpcMisconfigured } from "../lib/rpcEndpoint";

/**
 * Fail-closed guard when production is missing NEXT_PUBLIC_SOLANA_RPC_URL.
 * Prevents silent devnet fallback on live beta deployments.
 */
export function RpcConfigGuard({ children }: { children: React.ReactNode }) {
  const misconfigured = useMemo(() => {
    try {
      if (isRpcMisconfigured()) return true;
      resolveClientRpcUrl();
      return false;
    } catch {
      return true;
    }
  }, []);

  if (misconfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-amber-50">
        <div className="max-w-md rounded-xl border border-amber-300 bg-white p-8 text-center space-y-3">
          <p className="text-2xl" aria-hidden="true">
            ⚠️
          </p>
          <h1 className="text-lg font-semibold text-amber-950">Network not configured</h1>
          <p className="text-sm text-amber-900/80">
            This deployment is missing <code className="text-xs">NEXT_PUBLIC_SOLANA_RPC_URL</code>.
            Smeltr will not default to devnet in production — set a mainnet RPC endpoint and
            redeploy.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
