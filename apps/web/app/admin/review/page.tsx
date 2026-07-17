"use client";

import { useCallback, useEffect, useState } from "react";
import { WalletButton } from "../../../components/WalletButton";
import { useSiwsAuth } from "../../../hooks/useSiwsAuth";

interface Row {
  chainId: string;
  mintAddress: string;
  walletAddress: string;
  name: string | null;
  symbol: string | null;
  uri: string | null;
  createdAt: string;
  reviewStatus: string;
  reviewNote: string | null;
}

const STATUSES = ["pending", "approved", "featured", "rejected", "hidden", "all"] as const;

export default function AdminReviewPage() {
  const siws = useSiwsAuth();
  const [status, setStatus] = useState<string>("pending");
  const [weeksAgo, setWeeksAgo] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notAdmin, setNotAdmin] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotAdmin(false);
    try {
      const res = await fetch(
        `/api/admin/review?status=${status}&weeksAgo=${weeksAgo}`,
        { credentials: "same-origin" }
      );
      if (res.status === 403) { setNotAdmin(true); setRows([]); return; }
      if (!res.ok) throw new Error(`Load failed (HTTP ${res.status})`);
      const data = (await res.json()) as { deployments: Row[] };
      setRows(data.deployments);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [status, weeksAgo]);

  useEffect(() => {
    if (siws.status === "authenticated") void load();
  }, [siws.status, load]);

  async function flag(mint: string, chainId: string, next: string) {
    const note = window.prompt(`Note for ${next} (optional):`) ?? undefined;
    const res = await fetch(`/api/admin/review/${mint}?chainId=${encodeURIComponent(chainId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ status: next, note }),
    });
    if (res.ok) void load();
    else setError(`Flag failed (HTTP ${res.status})`);
  }

  if (siws.status === "restoring") {
    return <Shell><p className="text-sm text-gray-500">Checking your session…</p></Shell>;
  }

  if (siws.status !== "authenticated") {
    return (
      <Shell>
        <p className="text-sm text-amber-900/80 mb-4">
          Admin review is restricted to platform admin wallets. Connect and sign in.
        </p>
        <div className="flex items-center gap-3">
          <WalletButton />
          <button
            onClick={siws.signIn}
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
          >
            Sign in
          </button>
        </div>
        {siws.error && <p className="mt-2 text-xs text-red-600">{siws.error}</p>}
      </Shell>
    );
  }

  if (notAdmin) {
    return (
      <Shell>
        <p className="text-sm text-red-700">
          This wallet is not a platform admin. (Signed in as{" "}
          <span className="font-mono">{siws.walletAddress?.slice(0, 8)}…</span>)
        </p>
        <button onClick={siws.signOut} className="mt-3 text-sm text-gray-500 underline">Sign out</button>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <label className="text-sm">
          Status{" "}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded border-amber-300 text-sm"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="text-sm">
          Week{" "}
          <select
            value={weeksAgo}
            onChange={(e) => setWeeksAgo(Number(e.target.value))}
            className="rounded border-amber-300 text-sm"
          >
            <option value={0}>This week</option>
            <option value={1}>Last week</option>
            <option value={2}>2 weeks ago</option>
            <option value={3}>3 weeks ago</option>
          </select>
        </label>
        <a
          href={`/api/admin/review?status=${status}&weeksAgo=${weeksAgo}&format=csv`}
          className="text-sm text-amber-700 underline"
        >
          Export CSV ↓
        </a>
        <span className="text-xs text-gray-500 ml-auto">{rows.length} mints</span>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && rows.length === 0 && (
        <p className="text-sm text-gray-500">No mints in this window.</p>
      )}

      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.mintAddress} className="rounded-lg border border-amber-200 bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium truncate">
                  {r.name ?? "(no name)"}{" "}
                  {r.symbol && <span className="text-gray-500 font-normal">({r.symbol})</span>}{" "}
                  <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-800">{r.reviewStatus}</span>
                </p>
                <p className="font-mono text-xs text-gray-500 truncate">{r.mintAddress}</p>
                <p className="text-xs text-gray-400">
                  by <span className="font-mono">{r.walletAddress.slice(0, 8)}…</span> ·{" "}
                  {new Date(r.createdAt).toLocaleString()}
                </p>
                {r.reviewNote && <p className="text-xs text-amber-800 mt-1">📝 {r.reviewNote}</p>}
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button onClick={() => flag(r.mintAddress, r.chainId, "featured")} className="rounded bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-500">★ Feature</button>
                <button onClick={() => flag(r.mintAddress, r.chainId, "approved")} className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-500">✓ Approve</button>
                <button onClick={() => flag(r.mintAddress, r.chainId, "rejected")} className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">✕ Reject</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10" style={{ background: "#FDF8EF", minHeight: "70vh" }}>
      <h1 className="text-2xl font-bold mb-1" style={{ color: "#1A0C05" }}>Mint review</h1>
      <p className="text-sm text-amber-900/60 mb-6">
        Weekly stream of tokens minted on Smeltr. Approve or feature to surface them in the
        <span className="font-medium"> Created on Smeltr</span> explorer.
      </p>
      {children}
    </div>
  );
}
