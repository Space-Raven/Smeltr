import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "../../lib/prisma";
import { PUBLIC_REVIEW_STATUSES } from "../../lib/reviewQueue";
import { fetchTokenImage } from "../../lib/fairLaunchServer";
import { SITE_URL, OG_IMAGE } from "../../lib/seo";

/**
 * /created — the "Created on Smeltr" explorer (strategy overhaul Phase B).
 *
 * A CURATED, opt-in showcase of tokens launched on the platform — social proof
 * + discovery + the SEO hub linking to every public token page. Only mints the
 * founder has marked approved/featured in /admin/review ever appear (see
 * lib/reviewQueue.ts PUBLIC_REVIEW_STATUSES). Never an open feed, never ranked
 * by price/market-cap — a showcase of what was built, not a leaderboard of
 * investments (market-expansion-roadmap non-goals).
 */

export const revalidate = 300;

const TITLE = "Created on Smeltr — Token Showcase";
const DESCRIPTION =
  "A curated showcase of coins, points, passes, and collectibles launched with Smeltr — the non-custodial Solana token launcher with fair-launch defaults.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/created` },
  openGraph: {
    url: `${SITE_URL}/created`,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ ...OG_IMAGE }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [OG_IMAGE.url] },
};

interface ShowcaseToken {
  mintAddress: string;
  name: string;
  symbol: string;
  featured: boolean;
  createdAt: Date;
  imageUrl: string | null;
}

async function getShowcase(): Promise<ShowcaseToken[] | null> {
  try {
    const rows = await prisma.deployment.findMany({
      where: { reviewStatus: { in: [...PUBLIC_REVIEW_STATUSES] } },
      orderBy: { createdAt: "desc" },
      take: 48,
      select: {
        mintAddress: true,
        name: true,
        symbol: true,
        uri: true,
        reviewStatus: true,
        createdAt: true,
      },
    });

    const withImages = await Promise.all(
      rows.map(async (r) => ({
        mintAddress: r.mintAddress,
        name: r.name || `Token ${r.mintAddress.slice(0, 4)}…${r.mintAddress.slice(-4)}`,
        symbol: r.symbol || "",
        featured: r.reviewStatus === "featured",
        createdAt: r.createdAt,
        imageUrl: await fetchTokenImage(r.uri),
      }))
    );

    // Featured first, then newest — never by any market metric.
    return withImages.sort((a, b) =>
      a.featured === b.featured
        ? b.createdAt.getTime() - a.createdAt.getTime()
        : a.featured
          ? -1
          : 1
    );
  } catch {
    // DB down: render the page shell rather than a 500 — this is a public
    // marketing/SEO surface.
    return null;
  }
}

export default async function CreatedPage() {
  const tokens = await getShowcase();

  return (
    <div style={{ background: "#FDF8EF", minHeight: "70vh" }}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
        <h1 className="text-3xl font-bold" style={{ color: "#1A0C05" }}>
          Created on Smeltr
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-900/70">
          Real coins, points, passes, and collectibles forged on Smeltr — a curated showcase, not
          an open feed. Every listing links to its public token page and fair-launch check.
        </p>

        {tokens === null && (
          <p className="mt-10 text-sm text-gray-500">
            The showcase is briefly unavailable — try again in a moment.
          </p>
        )}

        {tokens !== null && tokens.length === 0 && (
          <div className="mt-10 rounded-xl border border-amber-200 bg-white p-6 text-center">
            <p className="text-sm text-gray-600">
              The first showcase picks are being reviewed. Yours could be here —
            </p>
            <Link
              href="/create"
              className="mt-3 inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-amber-500"
            >
              Make your token →
            </Link>
          </div>
        )}

        {tokens !== null && tokens.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tokens.map((t) => (
              <Link
                key={t.mintAddress}
                href={`/t/${t.mintAddress}`}
                className={`rounded-xl border bg-white p-4 no-underline transition-all hover:shadow-sm ${
                  t.featured ? "border-amber-400 ring-1 ring-amber-300" : "border-amber-200 hover:border-amber-400"
                }`}
              >
                <div className="flex items-center gap-3">
                  {t.imageUrl ? (
                    <Image
                      src={t.imageUrl}
                      alt={`${t.name} logo`}
                      width={44}
                      height={44}
                      className="rounded-xl border border-amber-100 object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-lg"
                      aria-hidden
                    >
                      🪙
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold" style={{ color: "#1A0C05" }}>
                      {t.name}
                    </p>
                    <p className="text-xs text-amber-900/60">
                      {t.symbol && <span className="font-mono mr-2">{t.symbol}</span>}
                      {t.featured && <span className="font-semibold text-amber-700">★ Featured</span>}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 rounded-xl border border-amber-200 bg-white p-4 text-sm">
          <p className="font-semibold" style={{ color: "#1A0C05" }}>
            Launched with Smeltr and want to be listed?
          </p>
          <p className="mt-1 text-gray-600">
            Every mint created on the platform is reviewed for the showcase. Featured picks
            highlight fair launches — authorities revoked, honest metadata, real projects.
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          A showcase of what was built — never investment advice. Smeltr does not endorse or
          evaluate any token as an investment.
        </p>
      </div>
    </div>
  );
}
