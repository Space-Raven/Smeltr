"use client";

import { useEffect, useRef, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";

type Finality = "confirmed" | "finalized" | "unknown";

/**
 * Shows how settled a transaction is. We render the success screen at
 * "confirmed" (fast); this badge upgrades itself to "finalized" (~15-30s
 * later) so users see the network fully settle without refreshing.
 *
 * Polls getSignatureStatus every 5s, stops on finalized or after ~2 minutes.
 */
export function TxFinalityBadge({ signature }: { signature: string }) {
  const { connection } = useConnection();
  const [finality, setFinality] = useState<Finality>("confirmed");
  const stopped = useRef(false);

  useEffect(() => {
    stopped.current = false;
    let attempts = 0;

    async function poll() {
      if (stopped.current) return;
      attempts += 1;
      try {
        const res = await connection.getSignatureStatus(signature, {
          searchTransactionHistory: false,
        });
        const status = res.value?.confirmationStatus;
        if (status === "finalized") {
          setFinality("finalized");
          return; // done — stop polling
        }
      } catch {
        // transient RPC hiccup — keep the current badge, retry
      }
      if (attempts < 24) setTimeout(poll, 5000); // ~2 minutes max
    }

    const t = setTimeout(poll, 5000);
    return () => {
      stopped.current = true;
      clearTimeout(t);
    };
  }, [connection, signature]);

  if (finality === "finalized") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        Finalized
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
      Confirmed — finalizing…
    </span>
  );
}
