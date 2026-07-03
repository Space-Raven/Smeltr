"use client";

import { useEffect, useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Token2022NativeMetadataProvider } from "@platform/module-registry";
import { buildMetadataAttachmentInstructions } from "@platform/tx-builder";
import { useSiwsAuth } from "../../hooks/useSiwsAuth";
import { useSubscription } from "../../hooks/useSubscription";
import { useBetaDisclaimer } from "../../components/BetaDisclaimerModal";
import { SmeltrPlusComingSoonBanner } from "../../components/SmeltrPlusUpgradeModal";
import { isSmeltrPlusLiveClient } from "../../lib/smeltrPlusClient";
import { submitTransaction } from "../../lib/submitTransaction";
import { API_ENDPOINTS, EXPLORER } from "../../lib/constants";
import { explorerClusterParam } from "../../lib/explorer";

interface DeploymentRecord {
  mintAddress: string;
  decimals: number;
  hasMetadata: boolean;
  metadataAttached: boolean;
  name: string | null;
  symbol: string | null;
  uri: string | null;
  signature: string;
  metadataSignature: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const siws = useSiwsAuth();
  const subscriptionStatus = useSubscription();
  const isPremium = isSmeltrPlusLiveClient() && subscriptionStatus === "premium";
  const smeltrPlusLive = isSmeltrPlusLiveClient();

  const [deployments, setDeployments] = useState<DeploymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attaching, setAttaching] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const { gate: gateDisclaimer, DisclaimerModal } = useBetaDisclaimer();

  const loadDeployments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_ENDPOINTS.DEPLOYMENTS, { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to load deployments.");
      const data = await res.json();
      if (!Array.isArray(data?.deployments)) {
        throw new Error("Invalid response structure from server");
      }
      setDeployments(data.deployments);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (siws.status === "authenticated") {
      loadDeployments();
    }
  }, [siws.status, loadDeployments]);

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Checkout failed (HTTP ${res.status})`);
      }
      const { url } = await res.json() as { url: string };
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setUpgrading(false);
    }
  };

  const handleAddMetadata = async (deployment: DeploymentRecord) => {
    if (!wallet.publicKey || !deployment.uri || !deployment.name || !deployment.symbol) return;

    setAttaching(deployment.mintAddress);
    setError(null);
    try {
      const instructions = buildMetadataAttachmentInstructions({
        mint: new PublicKey(deployment.mintAddress),
        payer: wallet.publicKey,
        userWallet: wallet.publicKey,
        decimals: deployment.decimals,
        provider: Token2022NativeMetadataProvider,
        input: { name: deployment.name, symbol: deployment.symbol, uri: deployment.uri },
      });

      const sig = await submitTransaction({ connection, wallet, instructions });

      const patchRes = await fetch(`/api/deployments/${deployment.mintAddress}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ metadataSignature: sig }),
      });
      if (!patchRes.ok) {
        const body = await patchRes.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ??
            `Failed to record metadata (HTTP ${patchRes.status})`
        );
      }

      await loadDeployments();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAttaching(null);
    }
  };

  // While restoring an existing session, show a neutral loading state rather
  // than flashing the "sign in" prompt to an already-authenticated user.
  if (siws.status === "restoring") {
    return (
      <div className="max-w-xl mx-auto p-6">
        <h2 className="text-xl font-semibold mb-2">My Tokens</h2>
        <p className="text-sm text-gray-500">Checking your session…</p>
      </div>
    );
  }

  if (siws.status !== "authenticated") {
    return (
      <div className="max-w-xl mx-auto p-6 space-y-4">
        <h2 className="text-xl font-semibold">My Tokens</h2>
        <p className="text-sm text-gray-600">
          Sign in with your wallet to view tokens you&apos;ve deployed and
          resume any incomplete steps. This is optional &mdash; your tokens exist
          on-chain regardless of whether you sign in.
        </p>
        <button
          onClick={siws.signIn}
          disabled={!wallet.connected || siws.status === "signing" || siws.status === "verifying"}
          className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {siws.status === "signing" || siws.status === "verifying" ? "Signing in…" : "Sign in"}
        </button>
        {siws.error && <p className="text-sm text-red-600">{siws.error}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Tokens</h2>
        {isPremium ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            ★ Premium
          </span>
        ) : smeltrPlusLive ? (
          <button
            onClick={() => gateDisclaimer(handleUpgrade)}
            disabled={upgrading}
            className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 hover:bg-amber-700 transition-colors"
          >
            {upgrading ? "Redirecting…" : "Upgrade — $19/mo"}
          </button>
        ) : null}
      </div>

      {!smeltrPlusLive && <SmeltrPlusComingSoonBanner />}

      {subscriptionStatus === "free" && smeltrPlusLive && (
        <div className="rounded-md border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800 space-y-1">
          <p className="font-medium">Smeltr+</p>
          <p>
            Platform-funded metadata uploads (no storage transaction from your
            wallet), larger upload limits, and early access to new modules.
          </p>
        </div>
      )}

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Empty state — a first-time user's very first impression of the dashboard */}
      {!loading && !error && siws.status === "authenticated" && deployments.length === 0 && (
        <div
          className="rounded-xl border border-amber-200 p-8 text-center"
          style={{ background: "#FDF8EF" }}
        >
          <p className="text-2xl mb-2" aria-hidden="true">⚒️</p>
          <h3 className="font-semibold mb-1" style={{ color: "#1A0C05" }}>
            Nothing forged yet
          </h3>
          <p className="text-sm text-amber-900/70 max-w-sm mx-auto mb-4">
            Tokens you deploy will appear here, with their metadata status and
            explorer links — resumable from any device.
          </p>
          <a
            href="/deploy"
            className="inline-block rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 no-underline"
          >
            Deploy your first token →
          </a>
        </div>
      )}

      {deployments.map((d) => (
        <div key={d.mintAddress} className="rounded-md border border-gray-200 p-3 text-sm">
          <p className="font-mono text-xs text-gray-500">{d.mintAddress}</p>
          {d.name && (
            <p className="font-medium mt-0.5">
              {d.name}{" "}
              <span className="text-gray-500 font-normal">({d.symbol})</span>
            </p>
          )}
          <a
            className="text-amber-700 underline text-xs"
            href={`${EXPLORER.BASE_URL}/address/${d.mintAddress}${explorerClusterParam(connection.rpcEndpoint)}`}
            target="_blank"
            rel="noreferrer"
          >
            View on Explorer
          </a>

          {d.hasMetadata && !d.metadataAttached && (
            <div className="mt-2">
              <p className="text-amber-700 text-xs">Metadata not yet attached.</p>
              <button
                onClick={() => handleAddMetadata(d)}
                disabled={attaching === d.mintAddress}
                className="mt-1 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
              >
                {attaching === d.mintAddress ? "Adding metadata…" : "Add Metadata"}
              </button>
            </div>
          )}
        </div>
      ))}

      {deployments.length === 0 && !loading && (
        <p className="text-sm text-gray-500">No deployments yet.</p>
      )}

      <DisclaimerModal />
    </div>
  );
}
