"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ModuleId, MetadataProvider, TokenMetadataInput } from "@platform/module-registry";
import {
  ModuleSelection,
  resolveSolanaContext,
  chainRecordKey,
  type DeploymentTarget,
  type SolanaDeploymentTarget,
} from "@platform/tx-builder";
import { buildDeploymentPlan, DeploymentPlan } from "../lib/buildDeploymentPlan";
import { submitTransaction } from "../lib/submitTransaction";

export interface TokenConfig {
  target: DeploymentTarget;
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

type IndexingStatus = "untracked" | "tracked" | "needs-sign-in";

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
  const [deploymentTarget, setDeploymentTarget] = useState<SolanaDeploymentTarget | null>(null);
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
          target: config.target,
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
        setDeploymentTarget(config.target.chain === "solana" ? config.target : null);
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
    if (!plan || !mintKeypair || !deploymentTarget) {
      setError("No deployment plan prepared.");
      setStatus("error");
      return;
    }

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
      if (!wallet.publicKey) throw new Error("Wallet disconnected — reconnect and try again.");
      const feeLamports = plan.platformFee?.feeLamports ?? 0;
      const txFeeBufferLamports = 100_000;
      const requiredLamports = plan.rentExemptLamports + feeLamports + txFeeBufferLamports;
      const balance = await connection.getBalance(wallet.publicKey);
      if (balance < requiredLamports) {
        const network = connection.rpcEndpoint.includes("devnet") ? "Devnet" : "Mainnet";
        const need = (requiredLamports / LAMPORTS_PER_SOL).toFixed(3);
        const have = (balance / LAMPORTS_PER_SOL).toFixed(3);
        throw new Error(
          `Not enough SOL to create this token. You need about ${need} SOL on ` +
            `${network} but this wallet has ${have} SOL. ` +
            (balance === 0
              ? `If you expected funds here, your wallet may be set to a different ` +
                `network — Smeltr is currently running on ${network}.`
              : `Add SOL to your wallet and try again.`)
        );
      }

      const sig = await submitTransaction({
        connection,
        wallet,
        instructions: plan.instructions,
        extraSigners: [mintKeypair],
      });
      setSignature(sig);
      setStatus("success");

      const chainId = chainRecordKey(deploymentTarget);

      void fetch("/api/deployments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          chainId,
          tokenStandard: deploymentTarget.tokenStandard,
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
  }, [
    connection,
    wallet,
    plan,
    mintKeypair,
    deploymentTarget,
    acknowledgedModules,
    decimals,
    metadataConfig,
  ]);

  const attachMetadata = useCallback(async () => {
    if (!mintKeypair || !metadataConfig || !wallet.publicKey || !deploymentTarget) {
      setMetadataError("Nothing to attach -- was metadata configured for this deployment?");
      setMetadataStatus("error");
      return;
    }

    setMetadataStatus("submitting");
    setMetadataError(null);

    try {
      const { adapter, chainRecordId } = resolveSolanaContext(deploymentTarget);
      const instructions = await adapter.buildMetadataAttachmentInstructions(
        { chainRecordId, connection },
        {
          mint: mintKeypair.publicKey,
          payer: wallet.publicKey,
          userWallet: wallet.publicKey,
          decimals,
          provider: metadataConfig.provider,
          input: metadataConfig.input,
        }
      );

      const sig = await submitTransaction({ connection, wallet, instructions });
      setMetadataSignature(sig);
      setMetadataStatus("success");

      const chainId = chainRecordKey(deploymentTarget);
      void fetch(
        `/api/deployments/${mintKeypair.publicKey.toBase58()}?chainId=${encodeURIComponent(chainId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ metadataSignature: sig }),
        }
      )
        .then((res) => {
          if (res.status === 401) setIndexingStatus("needs-sign-in");
          else if (res.ok) setIndexingStatus("tracked");
        })
        .catch(() => {});
    } catch (err) {
      setMetadataError(err instanceof Error ? err.message : String(err));
      setMetadataStatus("error");
    }
  }, [connection, wallet, mintKeypair, metadataConfig, decimals, deploymentTarget]);

  const autoMetadataStarted = useRef(false);
  useEffect(() => {
    if (
      status === "success" &&
      metadataStatus === "ready" &&
      metadataConfig &&
      !autoMetadataStarted.current
    ) {
      autoMetadataStarted.current = true;
      void attachMetadata();
    }
  }, [status, metadataStatus, metadataConfig, attachMetadata]);

  const reset = useCallback(() => {
    autoMetadataStarted.current = false;
    setStatus("idle");
    setPlan(null);
    setMintKeypair(null);
    setSignature(null);
    setError(null);
    setAcknowledgedModules(new Set());
    setDeploymentTarget(null);
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
    tokenStandard: deploymentTarget?.tokenStandard ?? null,
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
