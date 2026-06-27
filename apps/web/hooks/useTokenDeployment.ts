"use client";
import { useCallback, useState } from "react";
import { Keypair, PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ModuleId, MetadataProvider, TokenMetadataInput } from "@platform/module-registry";
import { ModuleSelection, buildMetadataAttachmentInstructions } from "@platform/tx-builder";
import { buildDeploymentPlan, DeploymentPlan } from "../lib/buildDeploymentPlan";
import { submitTransaction } from "../lib/submitTransaction";

export interface TokenConfig {
  decimals: number;
  mintAuthority: string;
  freezeAuthority: string | null;
  modules: ModuleSelection[];
  metadata?: {
    provider: MetadataProvider;
    input: TokenMetadataInput;
  };
}

type Status = "idle" | "planning" | "ready" | "submitting" | "success" | "error";
type MetadataStatus = "idle" | "ready" | "submitting" | "success" | "error";

/**
 * Reflects the state of the best-effort POST /api/deployments indexing call.
 *   untracked   - not yet attempted (initial state, or after reset)
 *   tracked     - server acknowledged the record (2xx)
 *   needs-sign-in - server returned 401; user has no SIWS session. The
 *                   on-chain tx succeeded -- this only affects dashboard
 *                   visibility. The UI can offer a sign-in prompt.
 */
type IndexingStatus = "untracked" | "tracked" | "needs-sign-in";

/**
 * Two-step deployment flow:
 *   1. prepare(config) -- builds and validates the deployment plan
 *      (instructions, size, warnings, high-impact flags) WITHOUT
 *      prompting the wallet. The UI should render plan for review.
 *   2. confirm() -- only called after the user has reviewed plan and
 *      acknowledged any highImpactModules warnings. Submits
 *      transaction 1 (mint creation).
 *
 * After confirm() succeeds, attachMetadata() submits transaction 2
 * (TokenMetadata initialization) if metadata was configured. Both
 * transactions reuse the SAME mint keypair / metadata config captured in
 * prepare() -- never regenerated.
 *
 * Both successful transactions are recorded via best-effort, non-blocking
 * calls to /api/deployments -- failure to record does NOT surface as a
 * deployment error, since the on-chain transaction already succeeded.
 */
export function useTokenDeployment() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [status, setStatus] = useState<Status>("idle");
  const [plan, setPlan] = useState<DeploymentPlan | null>(null);
  const [mintKeypair, setMintKeypair] = useState<Keypair | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acknowledgedModules, setAcknowledgedModules] = useState<Set<ModuleId>>(new Set());

  const [decimals, setDecimals] = useState(0);
  const [metadataConfig, setMetadataConfig] = useState<{
    provider: MetadataProvider;
    input: TokenMetadataInput;
  } | null>(null);
  const [metadataStatus, setMetadataStatus] = useState<MetadataStatus>("idle");
  const [metadataSignature, setMetadataSignature] = useState<string | null>(null);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [indexingStatus, setIndexingStatus] = useState<IndexingStatus>("untracked");

  const acknowledgeModule = useCallback((id: ModuleId, acknowledged: boolean) => {
    setAcknowledgedModules((prev) => {
      const next = new Set(prev);
      if (acknowledged) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const prepare = useCallback(
    async (config: TokenConfig) => {
      if (!wallet.publicKey) {
        setError("Connect a wallet first.");
        setStatus("error");
        return;
      }

      setStatus("planning");
      setError(null);
      setAcknowledgedModules(new Set());
      setMetadataStatus("idle");
      setMetadataSignature(null);
      setMetadataError(null);

      try {
        const newMint = Keypair.generate();
        const newPlan = await buildDeploymentPlan({
          connection,
          payer: wallet.publicKey,
          mint: newMint.publicKey,
          userWallet: wallet.publicKey,
          decimals: config.decimals,
          mintAuthority: new PublicKey(config.mintAuthority),
          freezeAuthority: config.freezeAuthority ? new PublicKey(config.freezeAuthority) : null,
          modules: config.modules,
          metadata: config.metadata,
        });

        setMintKeypair(newMint);
        setPlan(newPlan);
        setDecimals(config.decimals);
        setMetadataConfig(config.metadata ?? null);
        if (config.metadata) setMetadataStatus("ready");
        setStatus("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    },
    [connection, wallet.publicKey]
  );

  const confirm = useCallback(async () => {
    if (!plan || !mintKeypair) {
      setError("No deployment plan prepared.");
      setStatus("error");
      return;
    }

    // Defense-in-depth: re-check acknowledgments here even though the UI
    // should already disable the confirm action until these are all true.
    const unacknowledged = plan.highImpactModules.filter((id) => !acknowledgedModules.has(id));
    if (unacknowledged.length > 0) {
      setError(
        `Please acknowledge the risk warning(s) for: ${unacknowledged.join(", ")} before proceeding.`
      );
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setError(null);

    try {
      const sig = await submitTransaction({
        connection,
        wallet,
        instructions: plan.instructions,
        extraSigners: [mintKeypair],
      });
      setSignature(sig);
      setStatus("success");

      // Best-effort dashboard indexing -- failure must NOT surface as a
      // deployment error; the on-chain transaction already succeeded.
      // 401 means no SIWS session -- expose via indexingStatus so the UI
      // can prompt the user to sign in without blocking the success screen.
      void fetch("/api/deployments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          mintAddress: mintKeypair.publicKey.toBase58(),
          decimals,
          signature: sig,
          metadata: metadataConfig
            ? {
                name: metadataConfig.input.name,
                symbol: metadataConfig.input.symbol,
                uri: metadataConfig.input.uri,
              }
            : undefined,
        }),
      })
        .then((res) => {
          if (res.status === 401) setIndexingStatus("needs-sign-in");
          else if (res.ok) setIndexingStatus("tracked");
        })
        .catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }, [connection, wallet, plan, mintKeypair, acknowledgedModules, decimals, metadataConfig]);

  const attachMetadata = useCallback(async () => {
    if (!mintKeypair || !metadataConfig || !wallet.publicKey) {
      setMetadataError("Nothing to attach -- was metadata configured for this deployment?");
      setMetadataStatus("error");
      return;
    }

    setMetadataStatus("submitting");
    setMetadataError(null);

    try {
      const instructions = buildMetadataAttachmentInstructions({
        mint: mintKeypair.publicKey,
        payer: wallet.publicKey,
        userWallet: wallet.publicKey,
        decimals,
        provider: metadataConfig.provider,
        input: metadataConfig.input,
      });

      const sig = await submitTransaction({ connection, wallet, instructions });
      setMetadataSignature(sig);
      setMetadataStatus("success");

      void fetch(`/api/deployments/${mintKeypair.publicKey.toBase58()}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ metadataSignature: sig }),
      })
        .then((res) => {
          if (res.status === 401) setIndexingStatus("needs-sign-in");
          else if (res.ok) setIndexingStatus("tracked");
        })
        .catch(() => {});
    } catch (err) {
      setMetadataError(err instanceof Error ? err.message : String(err));
      setMetadataStatus("error");
    }
  }, [connection, wallet, mintKeypair, metadataConfig, decimals]);

  const reset = useCallback(() => {
    setStatus("idle");
    setPlan(null);
    setMintKeypair(null);
    setSignature(null);
    setError(null);
    setAcknowledgedModules(new Set());
    setMetadataConfig(null);
    setMetadataStatus("idle");
    setMetadataSignature(null);
    setMetadataError(null);
    setIndexingStatus("untracked");
  }, []);

  return {
    status,
    plan,
    signature,
    error,
    acknowledgedModules,
    acknowledgeModule,
    mintAddress: mintKeypair?.publicKey.toBase58() ?? null,
    metadataStatus,
    metadataSignature,
    metadataError,
    indexingStatus,
    prepare,
    confirm,
    attachMetadata,
    reset,
  };
}
