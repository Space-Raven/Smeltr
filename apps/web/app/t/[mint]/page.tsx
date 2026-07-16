import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { isValidWalletAddress } from "../../../lib/solanaAddress";
import { PUBLIC_REVIEW_STATUSES, isReviewStatus } from "../../../lib/reviewQueue";
import { buildFairLaunchReport, formatSupply, type CheckStatus } from "../../../lib/fairLaunch";
import {
  fetchMintFacts,
  fetchTokenImage,
  resolveServerRpcUrl,
} from "../../../lib/fairLaunchServer";
import { explorerAddressUrl } from "../../../lib/explorer";
import { SITE_URL, OG_IMAGE } from "../../../lib/seo";
import { CopyButton } from "../../../components/CopyButton";

/**
 * /t/<mint> — the public token page (strategy overhaul Phase B, "result layer").
 *
 * The shareable, visible RESULT of a deployment: name, logo, supply, and the
 * Smeltr Fair-Launch Check (a read-only checklist of on-chain control — never
 * a score of value). Renders for any real mint; only tokens curated into the
 * /created explorer (reviewStatus approved/featured) are search-indexable, so
 * an unreviewed or rejected mint never gains SEO from our domain.
 */

export const revalidate = 300;

type Props = { params: { mint: string } };

async function getDeploymentRecord(mint: string) {
  try {
    return await prisma.deployment.findFirst({ where: { mintAddress: mint } });
  } catch {
    // DB unavailable must not take down a chain-readable public page.
    return null;
  }
}

async function getPageData(mint: string) {
  if (!isValidWalletAddress(mint)) return null;
  const [facts, deployment] = await Promise.all([
    fetchMintFacts(mint).catch(() => null),
    getDeploymentRecord(mint),
  ]);
  if (!facts) return null;

  const name = facts.metadata?.name || deployment?.name || `Token ${mint.slice(0, 4)}…${mint.slice(-4)}`;
  const symbol = facts.metadata?.symbol || deployment?.symbol || "";
  const isCurated =
    deployment !== null &&
    isReviewStatus(deployment.reviewStatus) &&
    PUBLIC_REVIEW_STATUSES.has(deployment.reviewStatus);

  return { facts, deployment, name, symbol, isCurated };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getPageData(params.mint);
  if (!data) return { robots: { index: false } };

  const title = data.symbol ? `${data.name} (${data.symbol})` : data.name;
  const description = `${title} on Solana — supply, fair-launch check, and on-chain details. Created with Smeltr, the non-custodial token launcher.`;
  const url = `${SITE_URL}/t/${params.mint}`;

  return {
    title: `${title} — Token Page`,
    description,
    // Curation is the indexing gate: only approved/featured tokens get SEO.
    robots: data.isCurated ? undefined : { index: false, follow: false },
    alternates: data.isCurated ? { canonical: url } : undefined,
    openGraph: { url, title: `${title} | Smeltr`, description, images: [{ ...OG_IMAGE }] },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
  };
}

const STATUS_STYLE: Record<CheckStatus, { icon: string; color: string }> = {
  pass: { icon: "✓", color: "#15803d" },
  caution: { icon: "⚠", color: "#b45309" },
  info: { icon: "ℹ", color: "#64748b" },
};

export default async function TokenPage({ params }: Props) {
  const data = await getPageData(params.mint);
  if (!data) notFound();

  const { facts, deployment, name, symbol, isCurated } = data;
  const report = buildFairLaunchReport(facts);
  const imageUrl = await fetchTokenImage(facts.metadata?.uri ?? deployment?.uri);
  const rpcUrl = resolveServerRpcUrl();
  const pageUrl = `${SITE_URL}/t/${facts.mintAddress}`;

  return (
    <div style={{ background: "#FDF8EF", minHeight: "70vh" }}>
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`${name} logo`}
              width={72}
              height={72}
              className="rounded-2xl border border-amber-200 bg-white object-cover"
            />
          ) : (
            <div
              className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl border border-amber-200 bg-white text-2xl"
              aria-hidden
            >
              🪙
            </div>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "#1A0C05" }}>
              {name}
            </h1>
            <p className="text-sm text-amber-900/70">
              {symbol && <span className="font-mono font-semibold mr-2">{symbol}</span>}
              {facts.tokenStandard === "token-2022" ? "Solana Token-2022" : "Solana SPL Token"}
            </p>
          </div>
        </div>

        {/* ── Badges ─────────────────────────────────────────────────── */}
        <div className="mt-4 flex flex-wrap gap-2">
          {report.allControlsRevoked && (
            <span className="inline-flex items-center gap-1 rounded-full border border-green-300 bg-green-50 px-3 py-1 text-xs font-semibold text-green-800">
              ✓ Fair-Launch Check passed — all controls revoked
            </span>
          )}
          {deployment && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
              🔥 Created on Smeltr
            </span>
          )}
          {deployment?.reviewStatus === "featured" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
              ★ Smeltr Featured
            </span>
          )}
        </div>

        {/* ── Facts ──────────────────────────────────────────────────── */}
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Fact label="Supply" value={formatSupply(facts.supply, facts.decimals)} />
          <Fact label="Decimals" value={String(facts.decimals)} />
          {facts.transferFeeBps !== null && (
            <Fact label="Transfer fee" value={`${(facts.transferFeeBps / 100).toFixed(2)}%`} />
          )}
        </dl>

        <div className="mt-3 rounded-lg border border-amber-200 bg-white p-3">
          <p className="text-xs text-gray-500">Mint address</p>
          <p className="mt-1 flex items-center gap-2 text-sm">
            <span className="font-mono break-all">{facts.mintAddress}</span>
            <CopyButton value={facts.mintAddress} />
          </p>
        </div>

        {/* ── Fair-Launch Check ──────────────────────────────────────── */}
        <section className="mt-8">
          <h2 className="text-lg font-bold" style={{ color: "#1A0C05" }}>
            Smeltr Fair-Launch Check
          </h2>
          <p className="mt-1 text-xs text-amber-900/60">
            A read-only checklist of on-chain control — who can still change this token. It is not
            a rating, endorsement, or measure of value.
          </p>
          <ul className="mt-3 space-y-2">
            {report.checks.map((c) => (
              <li key={c.id} className="rounded-lg border border-amber-200 bg-white p-3">
                <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: STATUS_STYLE[c.status].color }}>
                  <span aria-hidden>{STATUS_STYLE[c.status].icon}</span>
                  {c.label}
                </p>
                <p className="mt-0.5 text-xs text-gray-600">{c.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Actions ────────────────────────────────────────────────── */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href={explorerAddressUrl(facts.mintAddress, rpcUrl)}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800 hover:border-amber-400"
          >
            View on Solana Explorer ↗
          </a>
          <span className="inline-flex items-center gap-2 text-sm text-gray-600">
            Share this page <CopyButton value={pageUrl} label="Copy link" />
          </span>
        </div>

        {/* ── Cross-links ────────────────────────────────────────────── */}
        <div className="mt-10 rounded-xl border border-amber-200 bg-white p-4 text-sm">
          <p className="font-semibold" style={{ color: "#1A0C05" }}>
            Want your own coin, points, or passes?
          </p>
          <p className="mt-1 text-gray-600">
            {deployment
              ? "This token was made with Smeltr — non-custodial, fair-launch defaults, no code."
              : "Smeltr makes coins, points, and passes — non-custodial, fair-launch defaults, no code."}
          </p>
          <div className="mt-3 flex flex-wrap gap-4">
            <Link
              href="/create"
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-amber-500"
            >
              Make your own →
            </Link>
            {isCurated && (
              <Link href="/created" className="self-center text-amber-700 underline">
                Browse tokens created on Smeltr
              </Link>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          Information display only — not financial advice. Smeltr does not endorse or evaluate any
          token as an investment.
        </p>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-white p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-semibold break-all" style={{ color: "#1A0C05" }}>
        {value}
      </p>
    </div>
  );
}
