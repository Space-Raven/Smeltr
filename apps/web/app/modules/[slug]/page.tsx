import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const SITE_URL = "https://smeltr.org";

const MODULES: Record<
  string,
  {
    title: string;
    description: string;
    blog: string;
    tag: string;
    keywords: string[];
  }
> = {
  "transfer-fee": {
    title: "Transfer Fee",
    description:
      "Charge a basis-point fee on every Solana Token-2022 transfer. Fees accrue in recipient accounts until harvested by the withdraw authority.",
    blog: "/blog/how-to-deploy-solana-token-2022-transfer-fee",
    tag: "Revenue & loyalty",
    keywords: ["solana transfer fee token", "token-2022 transfer fee", "spl transfer fee"],
  },
  "non-transferable": {
    title: "Non-Transferable (Soulbound)",
    description:
      "Solana soulbound tokens that cannot be transferred after minting. Used for credentials, memberships, and reputation.",
    blog: "/blog/solana-soulbound-token-non-transferable-extension",
    tag: "Soulbound",
    keywords: ["solana soulbound token", "non-transferable token-2022", "soulbound spl token"],
  },
  "permanent-delegate": {
    title: "Permanent Delegate",
    description:
      "Token-2022 Permanent Delegate extension — designates an address with permanent transfer and burn authority over all holders. High-impact compliance instrument.",
    blog: "/blog/permanent-delegate-token-2022-explained",
    tag: "High impact",
    keywords: ["solana permanent delegate", "token-2022 permanent delegate", "compliance token solana"],
  },
};

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return Object.keys(MODULES).map((slug) => ({ slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const mod = MODULES[params.slug];
  if (!mod) return {};
  const url = `${SITE_URL}/modules/${params.slug}`;
  return {
    title: `${mod.title} — Solana Token-2022 Module`,
    description: mod.description,
    keywords: mod.keywords,
    alternates: { canonical: url },
    openGraph: { url, title: `${mod.title} | Smeltr`, description: mod.description },
  };
}

export default function ModulePage({ params }: Props) {
  const mod = MODULES[params.slug];
  if (!mod) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: `${mod.title} — Solana Token-2022 Extension Module`,
    description: mod.description,
    url: `${SITE_URL}/modules/${params.slug}`,
    author: { "@type": "Organization", name: "Smeltr", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Smeltr Technologies LLC", url: SITE_URL },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">{mod.tag}</p>
        <h1 className="text-3xl font-bold text-gray-900">{mod.title}</h1>
        <p className="text-gray-600 leading-relaxed">{mod.description}</p>
        <p className="text-sm text-gray-500">
          Configurations are schema-validated against the SPL Token-2022 spec before you sign.
          Smeltr never holds your keys.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/deploy"
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-amber-700 transition-colors"
          >
            Deploy with this module →
          </Link>
          <Link href={mod.blog} className="text-sm text-amber-700 underline self-center">
            Read the guide
          </Link>
          <Link href="/docs/mcp" className="text-sm text-amber-700 underline self-center">
            Configure via MCP / AI →
          </Link>
        </div>
      </div>
    </>
  );
}
