"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * /beta
 *
 * Shown when NEXT_PUBLIC_MODE=beta and the visitor lacks the
 * smeltr_beta_approved cookie. Access is granted via an invite code only.
 *
 * (Audit-1 TOB-09: the wallet-address path was removed — a public wallet
 * address is not proof of ownership, and SIWS can't run ahead of this gate.
 * Beta access is high-entropy invite codes issued in BETA_ALLOWLIST.)
 *
 * On approval: sets the httpOnly cookie via /api/beta/verify and redirects to
 * the originally requested page (or /deploy).
 */
export default function BetaPage() {
  return (
    <Suspense>
      <BetaPageInner />
    </Suspense>
  );
}

function BetaPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/deploy";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setChecking(true);

    try {
      const res = await fetch("/api/beta/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      if (res.ok) {
        router.push(next);
      } else if (res.status === 429) {
        setError("Too many attempts. Please wait a minute and try again.");
      } else {
        setError("Invalid invite code. Check your email or request access.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#1A0C05] px-6">
      <svg
        width="64"
        height="64"
        viewBox="0 0 96 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="mb-6"
      >
        <circle cx="48" cy="48" r="44" fill="#92400E" />
        <circle cx="48" cy="48" r="44" stroke="#F59E0B" strokeWidth="2.5" />
        <polygon points="48,18 62,36 62,48 34,48 34,36" fill="none" stroke="#1A0C05" strokeWidth="4" strokeLinejoin="miter" />
        <polygon points="48,18 62,36 62,48 34,48 34,36" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinejoin="miter" />
        <polygon points="34,48 62,48 62,60 48,78 34,60" fill="none" stroke="#1A0C05" strokeWidth="4" strokeLinejoin="miter" />
        <polygon points="34,48 62,48 62,60 48,78 34,60" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinejoin="miter" />
      </svg>

      <h1
        className="text-3xl font-bold tracking-wide mb-1"
        style={{ color: "#F59E0B", fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        Smeltr Beta
      </h1>
      <p className="text-sm tracking-[0.25em] uppercase mb-8" style={{ color: "#B45309" }}>
        Early Access
      </p>

      <div className="w-full max-w-sm bg-[#2A1205] border border-amber-900/40 rounded-xl p-6 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs text-amber-200/60 uppercase tracking-widest">
              Invite code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter your invite code"
              autoFocus
              className="w-full rounded-lg border border-amber-900/50 bg-[#1A0C05] px-3.5 py-2.5
                         text-sm text-amber-100 placeholder:text-amber-900/60
                         focus:outline-none focus:ring-2 focus:ring-amber-600/40"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={checking || !code.trim()}
            className="w-full rounded-lg bg-amber-600 hover:bg-amber-500 active:bg-amber-700
                       px-4 py-2.5 text-sm font-semibold text-white transition-colors
                       disabled:opacity-40 disabled:pointer-events-none"
          >
            {checking ? "Checking…" : "Request access"}
          </button>
        </form>

        <p className="text-center text-xs text-amber-900">
          Not on the list?{" "}
          <a
            href="mailto:space.raven.studios@gmail.com?subject=Smeltr Beta Access"
            className="text-amber-600 hover:text-amber-400 underline"
          >
            Request access
          </a>
        </p>
      </div>

      <div className="flex gap-2 mt-8">
        <span className="block w-1.5 h-1.5 rounded-full bg-[#84CC16] opacity-70" />
        <span className="block w-1.5 h-1.5 rounded-full bg-[#84CC16] opacity-40" />
        <span className="block w-1.5 h-1.5 rounded-full bg-[#84CC16] opacity-70" />
      </div>
    </main>
  );
}
