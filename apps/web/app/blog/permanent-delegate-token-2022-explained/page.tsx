import type { Metadata } from "next";
import { articleJsonLd } from "../../../lib/articleJsonLd";
import { blogPostMetadata } from "../../../lib/seo";

export const metadata: Metadata = blogPostMetadata({
  slug: "permanent-delegate-token-2022-explained",
  title: "Permanent Delegate: the most powerful (and misunderstood) Token-2022 extension",
  description:
    "Permanent Delegate lets a single address transfer or burn tokens from any holder's account. Here's exactly what that means, when it's legitimate, and how to use it safely.",
  ogDescription:
    "What Permanent Delegate is, when it's legitimate, and the risks of misusing it.",
});
const jsonLd = articleJsonLd({
  slug: "permanent-delegate-token-2022-explained",
  headline: "Permanent Delegate: the most powerful (and misunderstood) Token-2022 extension",
  description: "What the PermanentDelegate authority can do, when it is legitimate, and how to use it safely.",
  datePublished: "2026-06-30",
});

export default function Post3() {
  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mb-8"><a href="/blog" className="text-sm text-amber-700 hover:text-amber-800 no-underline">← Blog</a></div>
      <span className="badge bg-red-100 text-red-700 mb-4 inline-block">Deep Dive</span>
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">Permanent Delegate: the most powerful (and misunderstood) Token-2022 extension</h1>
      <p className="text-gray-400 text-sm mb-10">June 30, 2026 · 7 min read</p>
      <div className="prose prose-gray max-w-none space-y-6 text-[15px] leading-relaxed text-gray-700">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800 font-semibold">High-impact extension</p>
          <p className="text-sm text-red-700 mt-1">Permanent Delegate grants unconditional transfer and burn authority over every token account for a mint — forever and irrevocably. Smeltr requires explicit acknowledgement before deploying a token with this extension.</p>
        </div>
        <p>Permanent Delegate is the most consequential of Token-2022's extensions. Understanding it fully — both its legitimate uses and its abuse potential — is essential before deploying any token that includes it.</p>
        <h2 className="text-xl font-bold text-gray-900 mt-8">What Permanent Delegate actually does</h2>
        <p>The PermanentDelegate extension designates a single public key as the permanent delegate for the entire mint. This delegate can:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li><strong>Transfer tokens</strong> from any holder's account to any destination — without the holder's signature</li>
          <li><strong>Burn tokens</strong> from any holder's account — without the holder's signature</li>
        </ul>
        <p>This authority is encoded in the mint at creation and <em>cannot be changed, transferred, or revoked</em> after the fact. There is no mechanism to remove or rotate the permanent delegate once the mint is live.</p>
        <h2 className="text-xl font-bold text-gray-900 mt-8">Legitimate use cases</h2>
        <p>Despite the power this extension grants, there are genuine, non-malicious use cases:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li><strong>Regulatory compliance</strong> — financial institutions issuing tokenised securities may have legal obligations to freeze or reclaim assets from sanctioned addresses</li>
          <li><strong>Stablecoin issuers</strong> — OFAC compliance requires the ability to freeze assets associated with prohibited entities</li>
          <li><strong>Subscription services</strong> — tokens representing a subscription can be automatically burned when the subscription expires</li>
          <li><strong>In-game economies</strong> — game operators may need to reclaim tokens from banned accounts</li>
          <li><strong>Enterprise token programmes</strong> — employee equity tokens that should be clawed back under certain contractual conditions</li>
        </ul>
        <h2 className="text-xl font-bold text-gray-900 mt-8">The risks — be honest with your holders</h2>
        <p>Any holder of a Permanent Delegate token should understand they are holding something that can be taken from them at any time by the delegate address. This is not a hypothetical — it is a guaranteed on-chain capability.</p>
        <p>If you deploy a Permanent Delegate token, you have a responsibility to:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>Disclose this clearly in your token's documentation and marketing</li>
          <li>Assign the delegate address to a multisig or DAO — not a single hot wallet</li>
          <li>Define in writing the circumstances under which the authority will be exercised</li>
          <li>Consider legal implications in your jurisdiction (particularly for securities-adjacent tokens)</li>
        </ul>
        <h2 className="text-xl font-bold text-gray-900 mt-8">Deploy with Smeltr — the acknowledgement gate</h2>
        <p>Smeltr requires a mandatory acknowledgement checkbox before any deployment including Permanent Delegate can proceed. The confirmation is re-checked in the transaction builder as a defence-in-depth measure — the UI cannot bypass it.</p>
        <ol className="list-decimal list-inside space-y-3 pl-2">
          <li>Go to <a href="/deploy" className="text-amber-600">smeltr.org/deploy</a>.</li>
          <li>Toggle on <strong>Permanent Delegate</strong> and enter the delegate address (recommend a multisig, not your hot wallet).</li>
          <li>In the Review panel, check the acknowledgement confirming you understand the implications.</li>
          <li>Sign and deploy.</li>
        </ol>
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-5 mt-8">
          <p className="font-semibold text-amber-900 mb-1">Deploy with Permanent Delegate</p>
          <p className="text-sm text-amber-700 mb-3">Full acknowledgement flow. Non-custodial. Your delegate address, not ours.</p>
          <a href="/deploy" className="btn-primary inline-flex text-sm">Deploy now →</a>
        </div>
      </div>
    </article>
  );
}
