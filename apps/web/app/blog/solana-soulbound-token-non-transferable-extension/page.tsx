import type { Metadata } from "next";
import { articleJsonLd } from "../../../lib/articleJsonLd";
import { blogPostMetadata } from "../../../lib/seo";

export const metadata: Metadata = blogPostMetadata({
  slug: "solana-soulbound-token-non-transferable-extension",
  title: "Soul-bound tokens on Solana: the Non-Transferable extension explained",
  description:
    "What soul-bound tokens are, why they matter for credentials and loyalty, and how to deploy a Non-Transferable SPL token using Token-2022 without code.",
  ogDescription:
    "Deploy non-transferable (soul-bound) tokens on Solana using Token-2022. No code required.",
});
const jsonLd = articleJsonLd({
  slug: "solana-soulbound-token-non-transferable-extension",
  headline: "Soul-bound tokens on Solana: the Non-Transferable extension explained",
  description: "What soul-bound tokens are, why they matter for credentials and loyalty, and how to deploy one with Token-2022.",
  datePublished: "2026-06-29",
});

export default function Post2() {
  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mb-8"><a href="/blog" className="text-sm text-amber-700 hover:text-amber-800 no-underline">← Blog</a></div>
      <span className="badge-amber mb-4 inline-block">Deep Dive</span>
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">Soul-bound tokens on Solana: the Non-Transferable extension explained</h1>
      <p className="text-gray-400 text-sm mb-10">June 29, 2026 · 6 min read</p>
      <div className="prose prose-gray max-w-none space-y-6 text-[15px] leading-relaxed text-gray-700">
        <p>A soul-bound token is a token that permanently belongs to a single wallet. It cannot be transferred, sold, or moved — it's cryptographically bound to the address it was minted into. Token-2022's <strong>NonTransferable</strong> extension makes soul-bound tokens a first-class feature on Solana.</p>
        <h2 className="text-xl font-bold text-gray-900 mt-8">Why soul-bound tokens matter</h2>
        <p>Most tokens are fungible and freely transferable by design. But many digital credentials are <em>not</em> supposed to be transferable. Consider:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li><strong>Event attendance</strong> — a proof-of-attendance token should belong to the person who attended, not be resellable</li>
          <li><strong>Loyalty tiers</strong> — "Gold member" status should reflect actual loyalty, not be purchasable on a secondary market</li>
          <li><strong>Course completions</strong> — a certificate of completion should be earned, not bought</li>
          <li><strong>DAO membership</strong> — a governance token that can't be sold prevents plutocratic capture</li>
          <li><strong>Game achievements</strong> — "First to reach Level 100" should stay with the player who earned it</li>
        </ul>
        <p>In all of these cases, transferability breaks the thing the token is supposed to represent. Soul-bound tokens solve this at the protocol level.</p>
        <h2 className="text-xl font-bold text-gray-900 mt-8">How the Non-Transferable extension works</h2>
        <p>The NonTransferable extension is a boolean flag on the mint account. There are no parameters to configure — you either have it or you don't. Once the mint is created with this extension, <em>every</em> transfer instruction targeting this mint will fail with a program error. This is enforced by the Token-2022 program itself, not by the application.</p>
        <p>Burning is still permitted. The token can be destroyed by its holder — it just can't be moved to another wallet.</p>
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
          <p className="text-sm text-amber-800"><strong>Note:</strong> Non-Transferable cannot be combined with Transfer Fee. Since the token can never be transferred, any fee configuration is meaningless. Smeltr surfaces this as a compatibility warning rather than blocking the deployment, since it's technically legal — just operationally pointless.</p>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mt-8">Minting non-transferable tokens to holders</h2>
        <p>Creating the mint is only half the story. To distribute soul-bound tokens to holders, you need to mint directly into their token accounts. Since tokens can't be transferred after minting, you cannot send them from a central treasury wallet — you must mint directly to each recipient's associated token account.</p>
        <p>Operationally, this means your distribution system needs mint authority access. Design your authority structure accordingly — consider a programmatic multisig or a DAO-controlled mint authority for large-scale credential issuance.</p>
        <h2 className="text-xl font-bold text-gray-900 mt-8">Deploy a non-transferable token with Smeltr</h2>
        <ol className="list-decimal list-inside space-y-3 pl-2">
          <li>Go to <a href="/deploy" className="text-amber-600">smeltr.org/deploy</a> and connect your wallet.</li>
          <li>Toggle on <strong>Non-Transferable</strong> in the module selection. No parameters needed — it's a flag.</li>
          <li>Add metadata (name, symbol, image) to make it recognisable in wallets.</li>
          <li>Review and sign. The mint is live in two transactions.</li>
        </ol>
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-5 mt-8">
          <p className="font-semibold text-amber-900 mb-1">Deploy a soul-bound token</p>
          <p className="text-sm text-amber-700 mb-3">Credentials, loyalty tiers, achievements — all in two wallet clicks.</p>
          <a href="/deploy" className="btn-primary inline-flex text-sm">Deploy now →</a>
        </div>
      </div>
    </article>
  );
}
