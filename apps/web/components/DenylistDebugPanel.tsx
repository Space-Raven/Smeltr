"use client";

import { useEffect, useState } from "react";
import {
  getDenylistDebugSnapshot,
  type DenylistDebugSnapshot,
} from "@platform/module-registry";

interface ServerDebugResponse {
  server: DenylistDebugSnapshot;
  hints: string[];
}

/**
 * Shown on /deploy?debug=denylist — compares client bundle (build-time inlined)
 * vs server runtime env to diagnose TOB-01 misconfiguration.
 */
export function DenylistDebugPanel() {
  const [client, setClient] = useState<DenylistDebugSnapshot | null>(null);
  const [server, setServer] = useState<ServerDebugResponse | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    setClient(getDenylistDebugSnapshot());
    fetch("/api/debug/denylist")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<ServerDebugResponse>;
      })
      .then(setServer)
      .catch((e) => setFetchError(e instanceof Error ? e.message : String(e)));
  }, []);

  const mismatch =
    client &&
    server &&
    client.parsedKeyCount === 0 &&
    server.server.parsedKeyCount > 0;

  return (
    <div className="rounded-lg border border-amber-500/50 bg-amber-950/40 p-4 text-xs font-mono text-amber-100 space-y-3">
      <p className="font-sans font-semibold text-amber-200">
        Denylist debug (remove ?debug=denylist after fixing)
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <section>
          <p className="text-amber-400/80 mb-1">Client bundle (build-time inlined)</p>
          <pre className="whitespace-pre-wrap break-all overflow-x-auto">
            {client ? JSON.stringify(client, null, 2) : "loading…"}
          </pre>
        </section>
        <section>
          <p className="text-amber-400/80 mb-1">Server runtime (/api/debug/denylist)</p>
          {fetchError ? (
            <p className="text-red-400">{fetchError}</p>
          ) : (
            <pre className="whitespace-pre-wrap break-all overflow-x-auto">
              {server ? JSON.stringify(server.server, null, 2) : "loading…"}
            </pre>
          )}
        </section>
      </div>

      {mismatch && (
        <p className="font-sans text-amber-300 border-t border-amber-800/50 pt-2">
          Mismatch: server sees keys but client bundle has none. Set{" "}
          <code className="text-amber-100">NEXT_PUBLIC_PLATFORM_AUTHORITY_DENYLIST</code> in
          Vercel, confirm Build Time enabled, then trigger a new deployment.
        </p>
      )}

      {server?.hints && (
        <ul className="font-sans list-disc pl-4 text-amber-300/90 space-y-1">
          {server.hints.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
