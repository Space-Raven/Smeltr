import type { Metadata } from "next";
import { articleJsonLd } from "../../../lib/articleJsonLd";

export const metadata: Metadata = {
  title: "How to deploy a Solana Token-2022 token with transfer fees",
  description:
    "A complete guide to the Token-2022 TransferFeeConfig extension — what it does, how the fee mechanics work, and how to deploy a transfer-fee token without writing code.",
  openGraph: {
    title: "How to deploy a Solana Token-2022 token with transfer fees",
    description: "Complete guide to TransferFeeConfig: mechanics, parameters, and no-code deployment.",
    images: [{ url: "/og-image.svg", width: 1200, height: 630 }],
  },
};

const jsonLd = articleJsonLd({
  slug: "how-to-deploy-solana-token-2022-transfer-fee",
  headline: "How to deploy a Solana Token-2022 token with transfer fees",
  description: "Complete guide to the TransferFeeConfig extension: fee mechanics, parameters, withheld amounts, and no-code deployment.",
  datePublished: "2026-06-22",
});

export default function Post1() {
  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mb-8">
        <a href="/blog" className="text-sm text-amber-700 hover:text-amber-800 no-underline">← Blog</a>
      </div>
      <span className="badge-amber mb-4 inline-block">Tutorial</span>
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
        How to deploy a Solana Token-2022 token with transfer fees
      </h1>
      <p className="text-gray-400 text-sm mb-10">June 22, 2026 · 8 min read</p>

      <div className="prose prose-gray max-w-none space-y-6 text-[15px] leading-relaxed text-gray-700">

        <p>
          Token-2022's <strong>TransferFeeConfig</strong> extension lets you collect a percentage fee on every token transfer, automatically — without any off-chain infrastructure, webhooks, or centralised fee collection. The fee is enforced by the Solana runtime itself.
        </p>
        <p>
          This guide explains exactly how transfer fees work under the hood, what the parameters mean, and how to deploy a transfer-fee token using Smeltr in under five minutes.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8">What is Token-2022?</h2>
        <p>
          Token-2022 (program address: <code className="address">TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb</code>) is Solana's next-generation token standard. Unlike the original SPL Token program, Token-2022 supports optional <em>extensions</em> that can be configured at mint creation. Transfer fees are one of those extensions.
        </p>
        <p>
          Extensions are permanent. Once a mint is created with TransferFeeConfig enabled, you can't remove it — though you can update the fee rate and maximum if you hold the <code className="address inline-block">transferFeeConfigAuthority</code>.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8">How transfer fees actually work</h2>
        <p>
          This is the part most people get wrong, so read carefully.
        </p>
        <p>
          When a transfer occurs, the fee is <strong>withheld in the recipient's token account</strong> — it does not go directly to your wallet. The recipient holds slightly less than what was transferred, and the difference accumulates as a withheld amount in their account data.
        </p>
        <p>To collect fees, you need to do two things:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Harvest:</strong> Call <code className="address inline-block">harvestWithheldTokensToMint</code> to sweep the withheld amounts from all recipient accounts into the mint account's withheld pool.</li>
          <li><strong>Withdraw:</strong> Call <code className="address inline-block">withdrawWithheldTokensFromMint</code> to move the tokens from the mint's withheld pool to your designated fee collection wallet.</li>
        </ol>
        <p>
          Both steps require the <code className="address inline-block">withdrawWithheldAuthority</code> to sign. This two-step pattern is intentional — it allows you to batch-harvest fees from thousands of accounts in a single sweep rather than tracking individual transfers.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8">The parameters</h2>
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-amber-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-amber-900">Parameter</th>
                <th className="px-4 py-2 text-left font-semibold text-amber-900">What it does</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr><td className="px-4 py-3 font-mono text-xs">transferFeeBasisPoints</td><td className="px-4 py-3">Fee rate. 100 = 1%. Max 10,000 (100%). Start around 25–100 bps for most use cases.</td></tr>
              <tr><td className="px-4 py-3 font-mono text-xs">maximumFee</td><td className="px-4 py-3">Absolute cap in token base units. Prevents outsized fees on large transfers. Set this thoughtfully — a 10,000 SOL transfer at 1% without a cap is 100 SOL in fees.</td></tr>
              <tr><td className="px-4 py-3 font-mono text-xs">transferFeeConfigAuthority</td><td className="px-4 py-3">Can update the fee rate and maximum. Use your deployer wallet or a multisig.</td></tr>
              <tr><td className="px-4 py-3 font-mono text-xs">withdrawWithheldAuthority</td><td className="px-4 py-3">Can harvest fees. Typically the same as config authority, but can be separate for operational security.</td></tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mt-8">What you cannot do with transfer fees</h2>
        <p>A few gotchas worth knowing:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>You cannot combine Transfer Fee with Non-Transferable. A non-transferable token can never be transferred, so the fee can never be collected. Smeltr surfaces this as a warning.</li>
          <li>You cannot remove the TransferFeeConfig extension after deployment — only update the rate and cap.</li>
          <li>The fee is charged in the token's own denomination, not in SOL.</li>
          <li>Fees are not automatically sent to you — you must actively harvest them.</li>
        </ul>

        <h2 className="text-xl font-bold text-gray-900 mt-8">Deploy a transfer-fee token with Smeltr</h2>
        <p>
          Smeltr handles the TransferFeeConfig extension as one of its core modules. You don't need to write any transaction code — the platform constructs the correctly ordered instruction set and your wallet signs it.
        </p>
        <ol className="list-decimal list-inside space-y-3 pl-2">
          <li>Go to <a href="/deploy" className="text-amber-600">smeltr.app/deploy</a> and connect your wallet.</li>
          <li>In the Module Selection section, toggle on <strong>Transfer Fee</strong>.</li>
          <li>Enter your basis points (e.g., <code className="address inline-block">50</code> for 0.5%), your maximum fee, and the two authority addresses (default: your connected wallet).</li>
          <li>Optionally fill in the Metadata section with a name, symbol, and image.</li>
          <li>Review the deployment plan — Smeltr shows you the estimated rent and any compatibility warnings.</li>
          <li>Sign Transaction 1 (mint creation) and Transaction 2 (metadata attachment).</li>
        </ol>
        <p>Your token is live on Solana. The transfer fee is enforced by the runtime — no ongoing action required until you want to harvest.</p>

        <div className="rounded-lg bg-amber-50 border border-amber-200 p-5 mt-8">
          <p className="font-semibold text-amber-900 mb-1">Ready to deploy?</p>
          <p className="text-sm text-amber-700 mb-3">No code. No custody. Two wallet signatures.</p>
          <a href="/deploy" className="btn-primary inline-flex text-sm">Deploy a transfer-fee token →</a>
        </div>
      </div>
    </article>
  );
}
