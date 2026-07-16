"use client";

import { useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Token2022NativeMetadataProvider, TokenMetadataInput } from "@platform/module-registry";
import { solanaTargetFromConnection } from "../../lib/deploymentTarget";
import { TOKEN_TEMPLATES, getTemplate, templateToModuleSelections } from "../../lib/templates";
import { MetadataForm } from "../../components/MetadataForm";
import { DeploymentReviewPanel } from "../../components/DeploymentReviewPanel";
import { WalletButton } from "../../components/WalletButton";
import { CopyButton } from "../../components/CopyButton";
import { TxFinalityBadge } from "../../components/TxFinalityBadge";
import { useTokenDeployment } from "../../hooks/useTokenDeployment";
import { explorerTxUrl } from "../../lib/explorer";

/**
 * /create — the outcome-first funnel (strategy overhaul Phase A).
 * "What do you want to make?" → pick a template → name/symbol/logo → sign.
 * All Token-2022 jargon stays behind the /deploy "Advanced" console; this
 * screen speaks plain language over the same shipped plumbing.
 */
export default function CreatePage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const deployment = useTokenDeployment();

  const [templateId, setTemplateId] = useState<string | null>(null);
  const [metadataInput, setMetadataInput] = useState<TokenMetadataInput | undefined>();

  const template = templateId ? getTemplate(templateId) : undefined;

  const target = useMemo(
    () => solanaTargetFromConnection(connection, "token-2022"),
    [connection]
  );

  function startCreate() {
    if (!wallet.publicKey || !template || !metadataInput) return;
    deployment.prepare({
      target,
      decimals: template.decimals,
      mintAuthority: wallet.publicKey.toBase58(),
      freezeAuthority: null,
      modules: templateToModuleSelections(template),
      metadata: { provider: Token2022NativeMetadataProvider, input: metadataInput },
    });
  }

  // ── Success ────────────────────────────────────────────────────────────
  if (deployment.status === "success") {
    return (
      <Shell>
        <div className="rounded-2xl border border-amber-200 bg-white p-6 text-center">
          <p className="text-3xl mb-2" aria-hidden>✨</p>
          <h2 className="text-2xl font-bold" style={{ color: "#1A0C05" }}>
            Your {template?.label ?? "token"} is live!
          </h2>
          {deployment.signature && (
            <div className="mt-2 flex justify-center">
              <TxFinalityBadge signature={deployment.signature} />
            </div>
          )}
          <p className="mt-4 text-sm text-gray-600 flex items-center justify-center gap-2 flex-wrap">
            Address: <span className="font-mono break-all">{deployment.mintAddress}</span>
            {deployment.mintAddress && <CopyButton value={deployment.mintAddress} />}
          </p>
          <p className="mt-2 text-sm">
            <a
              className="text-amber-700 underline"
              href={explorerTxUrl(deployment.signature ?? "", connection.rpcEndpoint)}
              target="_blank"
              rel="noreferrer"
            >
              View on Solana Explorer ↗
            </a>
          </p>

          {deployment.metadataStatus !== "idle" && deployment.metadataStatus !== "success" && (
            <div className="mt-5 rounded-lg border border-gray-200 p-4 text-left">
              <p className="text-sm text-gray-700">
                {deployment.metadataStatus === "submitting"
                  ? "One more signature adds your name and logo on-chain — approve it in your wallet."
                  : "Your token is created. Add its name and logo on-chain so wallets show it properly."}
              </p>
              {deployment.metadataError && (
                <p className="mt-1 text-sm text-red-600">{deployment.metadataError}</p>
              )}
              <button
                onClick={deployment.attachMetadata}
                disabled={deployment.metadataStatus === "submitting"}
                className="mt-3 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
              >
                {deployment.metadataStatus === "submitting" ? "Adding…" : "Add name & logo"}
              </button>
            </div>
          )}

          {deployment.metadataStatus === "success" && (
            <p className="mt-4 text-sm text-green-700">Name and logo attached on-chain ✓</p>
          )}

          {deployment.mintAddress && (
            <a
              href={`/t/${deployment.mintAddress}`}
              className="mt-5 inline-block rounded-xl bg-amber-600 px-6 py-3 text-base font-bold text-white no-underline hover:bg-amber-500"
            >
              See your token&apos;s page →
            </a>
          )}

          <button
            onClick={() => {
              deployment.reset();
              setTemplateId(null);
              setMetadataInput(undefined);
            }}
            className="mt-6 text-sm text-gray-500 underline"
          >
            Make another
          </button>
        </div>
      </Shell>
    );
  }

  // ── Review / signing ───────────────────────────────────────────────────
  if (deployment.plan && ["ready", "submitting", "error"].includes(deployment.status)) {
    return (
      <Shell>
        <DeploymentReviewPanel
          plan={deployment.plan}
          acknowledgedModules={deployment.acknowledgedModules}
          onAcknowledgeChange={deployment.acknowledgeModule}
          onConfirm={deployment.confirm}
          status={deployment.status}
        />
        {deployment.status === "submitting" && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-medium">Creating your {template?.label ?? "token"}…</p>
            <p className="mt-1">Approve the transaction in your wallet, then we&apos;ll wait for the network. Don&apos;t close this page.</p>
          </div>
        )}
        {deployment.status === "error" && deployment.error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-medium">That didn&apos;t go through</p>
            <p>{deployment.error}</p>
            <p>Nothing was created — you can safely try again.</p>
          </div>
        )}
        <button
          onClick={deployment.reset}
          disabled={deployment.status === "submitting"}
          className="mt-3 text-sm text-gray-500 underline disabled:opacity-40"
        >
          ← Back
        </button>
      </Shell>
    );
  }

  // ── Step 2: details for the chosen template ────────────────────────────
  if (template) {
    const canCreate = wallet.connected && metadataInput !== undefined;
    return (
      <Shell>
        <button onClick={() => setTemplateId(null)} className="text-sm text-amber-700 hover:text-amber-800 mb-4">
          ← Choose something else
        </button>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl" aria-hidden>{template.emoji}</span>
          <h2 className="text-2xl font-bold" style={{ color: "#1A0C05" }}>{template.label}</h2>
        </div>
        <p className="text-sm text-amber-900/70 mb-4">{template.description}</p>

        <ul className="mb-6 space-y-1">
          {template.fairLaunch.map((f) => (
            <li key={f} className="flex gap-2 text-xs text-amber-900/80">
              <span aria-hidden>✓</span><span>{f}</span>
            </li>
          ))}
        </ul>

        <div className="rounded-xl border border-amber-200 bg-white p-4">
          <MetadataForm onChange={setMetadataInput} />
        </div>

        {!wallet.connected && (
          <div className="mt-4 flex items-center gap-3">
            <WalletButton />
            <span className="text-sm text-gray-500">Connect your wallet to continue</span>
          </div>
        )}

        <button
          onClick={startCreate}
          disabled={!canCreate || deployment.status === "planning"}
          className="mt-5 w-full rounded-xl bg-amber-600 px-6 py-3 text-base font-bold text-white hover:bg-amber-500 disabled:opacity-40"
        >
          {deployment.status === "planning" ? "Preparing…" : `Create my ${template.label} →`}
        </button>
        {deployment.error && deployment.status === "error" && (
          <p className="mt-2 text-sm text-red-600">{deployment.error}</p>
        )}

        <p className="mt-4 text-center text-xs text-gray-400">
          Need transfer fees, delegates, or full control?{" "}
          <a href="/deploy" className="text-amber-700 underline">Use the Advanced console</a>.
        </p>
      </Shell>
    );
  }

  // ── Step 1: chooser ────────────────────────────────────────────────────
  return (
    <Shell>
      <h1 className="text-3xl font-bold mb-1" style={{ color: "#1A0C05" }}>
        What do you want to make?
      </h1>
      <p className="text-sm text-amber-900/70 mb-6">
        Pick a starting point. Everything is non-custodial — you hold the keys, and you can change the details before you create anything.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TOKEN_TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTemplateId(t.id)}
            className="text-left rounded-xl border border-amber-200 bg-white p-4 hover:border-amber-400 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl" aria-hidden>{t.emoji}</span>
              <span className="font-semibold" style={{ color: "#1A0C05" }}>{t.label}</span>
            </div>
            <p className="text-sm text-amber-900/70">{t.tagline}</p>
          </button>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-gray-400">
        Building something more technical?{" "}
        <a href="/deploy" className="text-amber-700 underline">Advanced console →</a>
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-10" style={{ background: "#FDF8EF", minHeight: "70vh" }}>
      {children}
    </div>
  );
}
