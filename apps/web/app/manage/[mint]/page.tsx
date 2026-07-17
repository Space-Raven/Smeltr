"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import Link from "next/link";
import { WalletButton } from "../../../components/WalletButton";
import { useSiwsAuth } from "../../../hooks/useSiwsAuth";
import { submitTransaction } from "../../../lib/submitTransaction";
import { explorerTxUrl } from "../../../lib/explorer";
import { isValidWalletAddress } from "../../../lib/solanaAddress";
import { buildFairLaunchReport, formatSupply } from "../../../lib/fairLaunch";
import {
  ManagedMintFacts,
  buildHarvestWithheldToMint,
  buildRevokeFreezeAuthority,
  buildRevokeMintAuthority,
  buildWithdrawWithheldFromMint,
  findAccountsWithWithheldFees,
  inspectManagedMint,
} from "../../../lib/manageActions";

/**
 * /manage/[mint] — post-launch management (strategy overhaul Phase D).
 *
 * The retention surface: every failing fair-launch check gets a one-click,
 * USER-SIGNED fix. Smeltr builds instructions; the connected wallet must hold
 * the on-chain authority or the chain rejects it — never custodial.
 */
export default function ManageTokenPage({ params }: { params: { mint: string } }) {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [facts, setFacts] = useState<ManagedMintFacts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [lastSig, setLastSig] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [ackMint, setAckMint] = useState(false);
  const [ackFreeze, setAckFreeze] = useState(false);
  const [scanNote, setScanNote] = useState<string | null>(null);

  const validMint = isValidWalletAddress(params.mint);

  const load = useCallback(async () => {
    if (!validMint) return;
    setLoading(true);
    setError(null);
    try {
      const f = await inspectManagedMint(connection, params.mint);
      if (!f) setError("This address is not a token mint on the current network.");
      setFacts(f);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [connection, params.mint, validMint]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: string, buildIxs: () => ReturnType<typeof buildRevokeMintAuthority>) {
    setBusy(action);
    setActionError(null);
    setLastSig(null);
    try {
      const signature = await submitTransaction({
        connection,
        wallet,
        instructions: buildIxs(),
      });
      setLastSig(signature);
      setAckMint(false);
      setAckFreeze(false);
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function harvestFromHolders() {
    setBusy("harvest");
    setActionError(null);
    setScanNote(null);
    try {
      const sources = await findAccountsWithWithheldFees(connection, params.mint);
      if (sources.length === 0) {
        setScanNote("No holder accounts are carrying withheld fees right now.");
        return;
      }
      const signature = await submitTransaction({
        connection,
        wallet,
        instructions: buildHarvestWithheldToMint({
          mint: new PublicKey(params.mint),
          sources: sources.map((s) => s.address),
        }),
      });
      setLastSig(signature);
      setScanNote(`Harvested withheld fees from ${sources.length} account(s) onto the mint.`);
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setActionError(
        /gPA|program accounts|excluded|disabled|410|not supported/i.test(msg)
          ? "This RPC endpoint doesn't allow scanning holder accounts. Fees holders have already harvested to the mint can still be withdrawn below."
          : msg
      );
    } finally {
      setBusy(null);
    }
  }

  if (!validMint) {
    return (
      <Shell>
        <p className="text-sm text-red-600">That doesn&apos;t look like a valid mint address.</p>
      </Shell>
    );
  }

  const walletKey = wallet.publicKey?.toBase58() ?? null;
  const report = facts ? buildFairLaunchReport(facts) : null;
  const isMintAuthority = !!facts?.mintAuthority && facts.mintAuthority === walletKey;
  const isFreezeAuthority = !!facts?.freezeAuthority && facts.freezeAuthority === walletKey;
  const isWithdrawAuthority =
    !!facts?.transferFee?.withdrawWithheldAuthority &&
    facts.transferFee.withdrawWithheldAuthority === walletKey;
  const holdsAnyAuthority = isMintAuthority || isFreezeAuthority || isWithdrawAuthority;

  return (
    <Shell>
      <div className="flex items-start justify-between gap-3 mb-1">
        <h1 className="text-2xl font-bold" style={{ color: "#1A0C05" }}>
          Manage {facts?.metadata?.name ?? "token"}
          {facts?.metadata?.symbol ? (
            <span className="ml-2 text-base font-semibold text-amber-700">
              {facts.metadata.symbol}
            </span>
          ) : null}
        </h1>
        <Link href={`/t/${params.mint}`} className="text-sm text-amber-700 underline shrink-0">
          Public page →
        </Link>
      </div>
      <p className="font-mono text-xs text-gray-500 break-all mb-4">{params.mint}</p>

      {loading && <p className="text-sm text-gray-500">Reading on-chain state…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {facts && report && (
        <>
          <div className="rounded-xl border border-amber-200 bg-white p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold" style={{ color: "#1A0C05" }}>Fair-Launch Check</h2>
              <span className="text-xs text-gray-500">
                Supply: {formatSupply(facts.supply, facts.decimals)}
              </span>
            </div>
            <ul className="space-y-1.5">
              {report.checks.map((c) => (
                <li key={c.id} className="flex gap-2 text-sm">
                  <span aria-hidden>
                    {c.status === "pass" ? "✅" : c.status === "caution" ? "⚠️" : "ℹ️"}
                  </span>
                  <span>
                    <span className="font-medium">{c.label}</span>
                    <span className="text-gray-600"> — {c.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
            {report.allControlsRevoked && (
              <p className="mt-3 text-sm text-emerald-700">
                All controls revoked — this is a fair-launch token. Fair-launch tokens are
                eligible to be featured on <Link href="/created" className="underline">/created</Link>.
              </p>
            )}
          </div>

          {!wallet.connected && (
            <div className="mb-4 flex items-center gap-3">
              <WalletButton />
              <span className="text-sm text-gray-500">
                Connect the wallet that holds this token&apos;s authorities to manage it.
              </span>
            </div>
          )}

          {wallet.connected && !holdsAnyAuthority && (
            <p className="mb-4 text-sm text-gray-500">
              The connected wallet doesn&apos;t hold any active authority on this token
              {facts.transferFee ? " (mint, freeze, or fee-withdraw)" : " (mint or freeze)"}.
              Actions are shown to the authority holder only.
            </p>
          )}

          {isMintAuthority && (
            <ActionCard
              title="Fix the supply — revoke mint authority"
              body="No one (including you) will ever be able to mint more. This turns the ⚠️ 'Supply can grow' check into ✅ 'Fixed supply' on your public page."
              ack={ackMint}
              onAck={setAckMint}
              ackLabel="I understand this is permanent and cannot be undone."
              buttonLabel={busy === "revoke-mint" ? "Revoking…" : "Revoke mint authority"}
              disabled={!ackMint || busy !== null}
              onClick={() =>
                run("revoke-mint", () =>
                  buildRevokeMintAuthority({
                    mint: new PublicKey(params.mint),
                    currentAuthority: wallet.publicKey!,
                    standard: facts.tokenStandard,
                  })
                )
              }
            />
          )}

          {isFreezeAuthority && (
            <ActionCard
              title="Remove the freeze authority"
              body="No one will ever be able to freeze a holder's balance. Permanent, and a strong trust signal."
              ack={ackFreeze}
              onAck={setAckFreeze}
              ackLabel="I understand this is permanent and cannot be undone."
              buttonLabel={busy === "revoke-freeze" ? "Revoking…" : "Revoke freeze authority"}
              disabled={!ackFreeze || busy !== null}
              onClick={() =>
                run("revoke-freeze", () =>
                  buildRevokeFreezeAuthority({
                    mint: new PublicKey(params.mint),
                    currentAuthority: wallet.publicKey!,
                    standard: facts.tokenStandard,
                  })
                )
              }
            />
          )}

          {facts.transferFee && wallet.connected && (
            <div className="rounded-xl border border-amber-200 bg-white p-4 mb-4">
              <h3 className="font-semibold mb-1" style={{ color: "#1A0C05" }}>Transfer fees</h3>
              <p className="text-sm text-gray-600 mb-3">
                Withheld on the mint, ready to withdraw:{" "}
                <span className="font-mono">
                  {formatSupply(facts.transferFee.withheldOnMint, facts.decimals)}
                </span>
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={harvestFromHolders}
                  disabled={busy !== null}
                  className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 disabled:opacity-40"
                >
                  {busy === "harvest" ? "Scanning…" : "1 · Harvest from holder accounts"}
                </button>
                <button
                  onClick={() =>
                    run("withdraw", () =>
                      buildWithdrawWithheldFromMint({
                        mint: new PublicKey(params.mint),
                        withdrawAuthority: wallet.publicKey!,
                      }).instructions
                    )
                  }
                  disabled={
                    busy !== null || !isWithdrawAuthority || facts.transferFee.withheldOnMint === 0n
                  }
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-40"
                >
                  {busy === "withdraw" ? "Withdrawing…" : "2 · Withdraw to my wallet"}
                </button>
              </div>
              {!isWithdrawAuthority && (
                <p className="mt-2 text-xs text-gray-500">
                  Withdrawing requires the fee-withdraw authority; harvesting (step 1) is
                  permissionless — anyone can trigger it.
                </p>
              )}
              {scanNote && <p className="mt-2 text-sm text-amber-800">{scanNote}</p>}
            </div>
          )}

          <AlertsCard mintAddress={params.mint} isCreatorCandidate={holdsAnyAuthority || wallet.connected} />

          {lastSig && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 mb-4">
              Done ✓ —{" "}
              <a
                href={explorerTxUrl(lastSig, connection.rpcEndpoint)}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                view the transaction
              </a>
              . Your <Link href={`/t/${params.mint}`} className="underline">public page</Link> now
              reflects the change.
            </div>
          )}
          {actionError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 mb-4">
              {actionError}
            </div>
          )}
        </>
      )}

      <p className="mt-6 text-xs text-gray-400">
        All actions are built by Smeltr but signed by your wallet — Smeltr never holds any
        authority over your token.
      </p>
    </Shell>
  );
}

interface AlertSubscriptionStatus {
  email: string;
  verified: boolean;
  lastMilestone: number;
}

/**
 * Opt-in holder-milestone alerts (Phase D). Requires SIWS — the email may
 * only be attached by the wallet that owns the deployment record. Double
 * opt-in; unsubscribing (from any alert email) deletes the address entirely.
 */
function AlertsCard({
  mintAddress,
  isCreatorCandidate,
}: {
  mintAddress: string;
  isCreatorCandidate: boolean;
}) {
  const siws = useSiwsAuth();
  const wallet = useWallet();
  const [subs, setSubs] = useState<AlertSubscriptionStatus[] | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [noteKind, setNoteKind] = useState<"ok" | "err">("ok");

  const loadStatus = useCallback(async () => {
    if (siws.status !== "authenticated") return;
    try {
      const res = await fetch(
        `/api/alerts/status?mint=${encodeURIComponent(mintAddress)}`,
        { credentials: "same-origin" }
      );
      if (!res.ok) return;
      const data = (await res.json()) as { subscriptions?: AlertSubscriptionStatus[] };
      setSubs(Array.isArray(data.subscriptions) ? data.subscriptions : []);
    } catch {
      // Status is a nicety — the card still works without it.
    }
  }, [mintAddress, siws.status]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  async function subscribe() {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/alerts/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ mintAddress, email }),
      });
      const data = (await res.json().catch(() => ({}))) as { status?: string; error?: string; note?: string };
      if (res.ok || res.status === 429) {
        setNoteKind("ok");
        setNote(
          data.status === "active"
            ? "Alerts are already active for this email."
            : data.note ?? "Check your inbox — click the verification link to switch alerts on."
        );
        setEmail("");
        await loadStatus();
      } else {
        setNoteKind("err");
        setNote(data.error ?? "Could not subscribe right now.");
      }
    } catch {
      setNoteKind("err");
      setNote("Could not subscribe right now.");
    } finally {
      setBusy(false);
    }
  }

  if (!isCreatorCandidate) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-white p-4 mb-4">
      <h3 className="font-semibold mb-1" style={{ color: "#1A0C05" }}>Holder-milestone alerts</h3>
      <p className="text-sm text-gray-600 mb-3">
        Get an email when this token crosses holder milestones (10, 25, 50, 100…). Double
        opt-in; unsubscribing deletes your email from Smeltr entirely.
      </p>

      {siws.status !== "authenticated" ? (
        <button
          onClick={siws.signIn}
          disabled={!wallet.connected || siws.status === "signing" || siws.status === "verifying"}
          className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 disabled:opacity-40"
        >
          {siws.status === "signing" || siws.status === "verifying"
            ? "Signing in…"
            : "Sign in with your wallet to enable"}
        </button>
      ) : (
        <>
          {subs && subs.length > 0 && (
            <ul className="mb-3 space-y-1 text-sm text-gray-700">
              {subs.map((s) => (
                <li key={s.email}>
                  {s.email} —{" "}
                  {s.verified ? (
                    <span className="text-emerald-700">
                      active{s.lastMilestone > 0 ? ` · last milestone: ${s.lastMilestone} holders` : ""}
                    </span>
                  ) : (
                    <span className="text-amber-700">awaiting email verification</span>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm flex-1 min-w-[200px]"
            />
            <button
              onClick={subscribe}
              disabled={busy || email.length < 6}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-40"
            >
              {busy ? "Sending…" : "Enable alerts"}
            </button>
          </div>
        </>
      )}

      {note && (
        <p className={`mt-2 text-sm ${noteKind === "ok" ? "text-emerald-700" : "text-red-600"}`}>{note}</p>
      )}
    </div>
  );
}

function ActionCard(props: {
  title: string;
  body: string;
  ack: boolean;
  onAck: (v: boolean) => void;
  ackLabel: string;
  buttonLabel: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className="rounded-xl border border-amber-200 bg-white p-4 mb-4">
      <h3 className="font-semibold mb-1" style={{ color: "#1A0C05" }}>{props.title}</h3>
      <p className="text-sm text-gray-600 mb-3">{props.body}</p>
      <label className="flex items-start gap-2 text-sm text-gray-700 mb-3">
        <input
          type="checkbox"
          checked={props.ack}
          onChange={(e) => props.onAck(e.target.checked)}
          className="mt-0.5"
        />
        <span>{props.ackLabel}</span>
      </label>
      <button
        onClick={props.onClick}
        disabled={props.disabled}
        className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-40"
      >
        {props.buttonLabel}
      </button>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-10" style={{ background: "#FDF8EF", minHeight: "70vh" }}>
      {children}
    </div>
  );
}
