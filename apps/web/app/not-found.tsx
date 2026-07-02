import Link from "next/link";

export default function NotFound() {
  return (
    <main
      className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center"
      style={{ background: "#FDF8EF" }}
    >
      <p className="text-sm font-semibold tracking-[0.25em] uppercase" style={{ color: "#B45309" }}>
        404
      </p>
      <h1 className="mt-2 text-3xl font-bold" style={{ color: "#1A0C05" }}>
        This page hasn&apos;t been forged yet
      </h1>
      <p className="mt-3 max-w-md text-sm text-amber-900/70">
        The address may be mistyped, or the page may have moved. Nothing on-chain
        is affected — your tokens live on Solana, not on this page.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 no-underline"
        >
          Back to the forge
        </Link>
        <Link
          href="/blog"
          className="rounded-lg border border-amber-300 px-5 py-2.5 text-sm font-semibold text-amber-800 hover:border-amber-400 no-underline"
        >
          Read the guides
        </Link>
      </div>
    </main>
  );
}
