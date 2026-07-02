"use client";

import { Suspense, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { explorerTxUrl } from "../../lib/explorer";
import { ModuleSelection } from "@platform/tx-builder";
import { Token2022NativeMetadataProvider, TokenMetadataInput } from "@platform/module-registry";
import { ModuleConfigSection } from "../../components/module-config/ModuleConfigSection";
import { MetadataForm } from "../../components/MetadataForm";
import { DeploymentReviewPanel } from "../../components/DeploymentReviewPanel";
import { DenylistDebugPanel } from "../../components/DenylistDebugPanel";
import { useTokenDeployment } from "../../hooks/useTokenDeployment";
import { useSiwsAuth } from "../../hooks/useSiwsAuth";

export default function DeployPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Loading…</div>}>
      <DeployPageInner />
    </Suspense>
  );
}

function DeployPageInner() {
  const searchParams = useSearchParams();
  const showDenylistDebug = searchParams.get("debug") === "denylist";
  const { connection } = useConnection();
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
            className="text-amber-700 underline"
            href={explorerTxUrl(deployment.signature ?? "", connection.rpcEndpoint)}
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
              {deployment.metadataStatus === "submitting"
                ? "Step 2 of 2: approve the second signature in your wallet to attach your token's name, symbol, and logo."
                : 'Your token was created, but it has no on-chain metadata yet — wallets and explorers may show it as "Unknown Token" until this step completes.'}
            </p>
            {deployment.metadataError && (
              <p className="text-sm text-red-600">{deployment.metadataError}</p>
            )}
            <button
              onClick={deployment.attachMetadata}
              disabled={deployment.metadataStatus === "submitting"}
              className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
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
              href={explorerTxUrl(deployment.metadataSignature ?? "", connection.rpcEndpoint)}
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

  // --- Review / signing / confirm-failure --------------------------------------
  // The panel stays mounted through "submitting" (wallet prompt + on-chain
  // confirmation) and "error" (retry). Previously only "ready" rendered it, so
  // clicking Sign & Deploy dropped the user straight back to the configuration
  // form while the wallet was still open — the "deploy loop" bug.
  if (deployment.plan && ["ready", "submitting", "error"].includes(deployment.status)) {
    return (
      <div className="max-w-xl mx-auto p-6 space-y-4">
        {showDenylistDebug && <DenylistDebugPanel />}
        <DeploymentReviewPanel
          plan={deployment.plan}
          acknowledgedModules={deployment.acknowledgedModules}
          onAcknowledgeChange={deployment.acknowledgeModule}
          onConfirm={deployment.confirm}
          status={deployment.status}
        />
        {deployment.status === "submitting" && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-medium">Creating your token…</p>
            <p className="mt-1">
              Approve the transaction in your wallet, then we&apos;ll wait for the
              network to confirm it. This usually takes a few seconds — don&apos;t
              close this page.
            </p>
          </div>
        )}
        {deployment.status === "error" && deployment.error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 space-y-2">
            <p className="text-sm font-medium text-red-800">The token was not created</p>
            <p className="text-sm text-red-700">{deployment.error}</p>
            <p className="text-sm text-red-700">
              Nothing was minted, and you can safely try again.
            </p>
          </div>
        )}
        <button
          onClick={deployment.reset}
          disabled={deployment.status === "submitting"}
          className="mt-3 text-sm text-gray-500 underline disabled:opacity-40"
        >
          Back to configuration
        </button>
      </div>
    );
  }

  // --- Configuration -----------------------------------------------------------
  return (
    <div className="max-w-xl mx-auto space-y-6 p-6">
      <h2 className="text-xl font-semibold">Deploy a Token</h2>

      {showDenylistDebug && <DenylistDebugPanel />}

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
        className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {deployment.status === "planning" ? "Building plan…" : "Review Deployment"}
      </button>
    </div>
  );
}
