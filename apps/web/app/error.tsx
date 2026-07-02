"use client";

import { useEffect } from "react";

/**
 * Route-level error boundary. Catches render/runtime errors in any page and
 * shows a calm, on-brand recovery screen instead of a blank crash. On-chain
 * state is never affected by a UI error — say so, since our users' first fear
 * is "did I lose my token?"
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <main
      className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center"
      style={{ background: "#FDF8EF" }}
    >
      <p className="text-sm font-semibold tracking-[0.25em] uppercase" style={{ color: "#B45309" }}>
        Something misfired
      </p>
      <h1 className="mt-2 text-3xl font-bold" style={{ color: "#1A0C05" }}>
        The page hit an error
      </h1>
      <p className="mt-3 max-w-md text-sm text-amber-900/70">
        This was a display problem, not a blockchain one — no transaction was
        sent and nothing changed on-chain. Try again, and if it keeps happening,
        email{" "}
        <a href="mailto:pjorg@smeltr.org" className="text-amber-700 underline">
          pjorg@smeltr.org
        </a>
        {error.digest ? ` and mention error ${error.digest}` : ""}.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-500"
      >
        Try again
      </button>
    </main>
  );
}
