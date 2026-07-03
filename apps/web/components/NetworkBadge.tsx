"use client";

import { useConnection } from "@solana/wallet-adapter-react";
import { clusterFromRpcUrl, clusterLabel } from "../lib/cluster";

/**
 * Persistent cluster indicator in the site header.
 * Helps users avoid deploying on the wrong network (a common beta support issue).
 */
export function NetworkBadge() {
  const { connection } = useConnection();
  const cluster = clusterFromRpcUrl(connection.rpcEndpoint);
  const label = clusterLabel(cluster);

  const isMainnet = cluster === "mainnet";
  const isDevnet = cluster === "devnet";

  return (
    <span
      className={`hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border ${
        isMainnet
          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
          : isDevnet
            ? "bg-amber-50 text-amber-800 border-amber-200"
            : "bg-gray-50 text-gray-600 border-gray-200"
      }`}
      title={`RPC: ${connection.rpcEndpoint}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isMainnet ? "bg-emerald-500" : isDevnet ? "bg-amber-500" : "bg-gray-400"
        }`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
