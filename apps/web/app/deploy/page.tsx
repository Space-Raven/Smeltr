"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { ModuleSelection } from "@platform/tx-builder";
import { Token2022NativeMetadataProvider, TokenMetadataInput } from "@platform/module-registry";
import { ModuleConfigSection } from "../../components/module-config/ModuleConfigSection";
import { MetadataForm } from "../../components/MetadataForm";
import { DeploymentReviewPanel } from "../../components/DeploymentReviewPanel";
import { useTokenDeployment } from "../../hooks/useTokenDeployment";
import { useSiwsAuth } from "../../hooks/useSiwsAuth";

export default function DeployPage() {
  const wallet = useWallet();
  const deployment = useTokenDeployment();
  const siws = useSiwsAuth();

  const [decimals, setDecimals] = useState(9);
  const [modules, setModules] = useState<ModuleSelection[]>([]);
  const [modulesValid, setModulesValid] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [metadataInput, setMetadataInput] = useState<TokenMetadataInput | undefined>();

  // Memoized — ModuleConfigSection uses this in a useEffect dependency array.
  // An inline function would create a new reference every render, causing an
  // infinite re-render loop that silently crashes the module section.
  const handleModulesChange = useCallback((mods: ModuleSelection[], valid: boolean) => {
    setModules(mods);
    setModulesValid(valid);
  }, []);

  const canReview =
    wallet.connected && modulesValid && (!includeMetadata || metadataInput !== undefined);

  const handlePrepare = () => {
    if (!wallet.publicKey) return;
    deployment.prepare({
      decimals,
      mintAuthority: wallet.publicKey.toBase58(),
      freezeAuthority: null,
      modules,
      metadata:
        includeMetadata && metadataInput
          ? { provider: Token2022NativeMetadataProvider, input: metadataInput }
          : undefined,
    });
  };

  // --- Success: transaction 1 confirmed --------------------------------------
  if (deployment.status === "success") {
    return (
      <div className="max-w-xl mx-auto space-y-4 p-6">
        <h2 className="text-xl font-semibold">Token created</h2>
        <p className="text-sm text-gray-600">
          Mint address: <span className="font-mono">{deployment.mintAddress}</span>
        </p>
        <p className="text-sm text-gray-600">
          Transaction:{" "}
          <a
            className="text-indigo-600 underline"
            href={`https://explorer.solana.com/tx/${deployment.signature}`}
            target="_blank"
            rel="noreferrer"
          >
            {deployment.signature}
          </a>
        </p>

        {/* Sign-in nudge: shown when the indexing POST returned 401.
            The token is on-chain regardless -- this only affects dashboard
            visibility. Disappears once the user signs in. */}
        {deployment.indexingStatus === "needs-sign-in" &&
          siws.status !== "authenticated" && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 space-y-2">
              <p className="text-sm font-medium text-amber-800">
                This deployment is not saved to your dashboard yet.
              </p>
              <p className="text-sm text-amber-700">
                Sign in with your wallet to track this token and resume any
                incomplete steps from any device.
              </p>
              <button
                onClick={siws.signIn}
                disabled={
                  !wallet.connected ||
                  siws.status === "signing" ||
                  siws.status === "verifying"
                }
                className="rounded-md bg-amber-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 hover:bg-amber-800 transition-colors"
              >
                {siws.status === "signing" || siws.status === "verifying"
                  ? "Signing in…"
                  : "Sign in to save"}
              </button>
              {siws.error && (
                <p className="text-xs text-red-600">{siws.error}</p>
              )}
            </div>
          )}

        {deployment.metadataStatus !== "idle" && deployment.metadataStatus !== "success" && (
          <div className="space-y-2 rounded-md border border-gray-200 p-4">
            <p className="text-sm text-gray-700">
              Your token was created, but it has no on-chain metadata yet &mdash;
              wallets and explorers may show it as &quot;Unknown Token&quot;
              until this step completes.
            </p>
            {deployment.metadataError && (
              <p className="text-sm text-red-600">{deployment.metadataError}</p>
            )}
            <button
              onClick={deployment.attachMetadata}
              disabled={deployment.metadataStatus === "submitting"}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {deployment.metadataStatus === "submitting" ? "Adding metadata…" : "Add Metadata"}
            </button>
          </div>
        )}

        {deployment.metadataStatus === "success" && (
          <p className="text-sm text-green-700">
            Metadata attached &mdash;{" "}
            <a
              className="underline"
              href={`https://explorer.solana.com/tx/${deployment.metadataSignature}`}
              target="_blank"
              rel="noreferrer"
            >
              transaction
            </a>
          </p>
        )}

        <button onClick={deployment.reset} className="text-sm text-gray-500 underline">
          Deploy another token
        </button>
      </div>
    );
  }

  // --- Review: plan built, awaiting signature ---------------------------------
  if (deployment.status === "ready" && deployment.plan) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <DeploymentReviewPanel
          plan={deployment.plan}
          acknowledgedModules={deployment.acknowledgedModules}
          onAcknowledgeChange={deployment.acknowledgeModule}
          onConfirm={deployment.confirm}
          status={deployment.status}
        />
        {deployment.error && <p className="mt-3 text-sm text-red-600">{deployment.error}</p>}
        <button onClick={deployment.reset} className="mt-3 text-sm text-gray-500 underline">
          Back to configuration
        </button>
      </div>
    );
  }

  // --- Configuration -----------------------------------------------------------
  return (
    <div className="max-w-xl mx-auto space-y-6 p-6">
      <h2 className="text-xl font-semibold">Deploy a Token</h2>

      <div>
        <label className="block text-sm font-medium">Decimals</label>
        <input
          type="number"
          value={decimals}
          onChange={(e) => setDecimals(Number(e.target.value))}
          className="mt-1 block w-32 rounded-md border-gray-300 text-sm"
          min={0}
          max={9}
        />
      </div>

      <ModuleConfigSection onChange={handleModulesChange} />

      <div className="rounded-md border border-gray-200 p-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={includeMetadata}
            onChange={(e) => setIncludeMetadata(e.target.checked)}
          />
          Add name, symbol, and logo (recommended)
        </label>
        {includeMetadata && (
          <div className="mt-3">
            <MetadataForm onChange={setMetadataInput} />
          </div>
        )}
      </div>

      {deployment.error && <p className="text-sm text-red-600">{deployment.error}</p>}

      <button
        onClick={handlePrepare}
        disabled={!canReview || deployment.status === "planning"}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {deployment.status === "planning" ? "Building plan…" : "Review Deployment"}
      </button>
    </div>
  );
}
