import type { Metadata } from "next";
import { articleJsonLd } from "../../../lib/articleJsonLd";

export const metadata: Metadata = {
  title: "Token-2022 module configuration: the complete reference",
  description:
    "The definitive reference for configuring Solana Token-2022 extension modules — Transfer Fee, Non-Transferable, Permanent Delegate, and on-chain TokenMetadata: every parameter, valid ranges, authority fields, compatibility rules, and security implications.",
  openGraph: {
    title: "Token-2022 module configuration: the complete reference",
    description:
      "Every Token-2022 extension parameter, valid range, authority field, compatibility rule, and security implication — in one page.",
    images: [{ url: "/og-image.svg", width: 1200, height: 630 }],
  },
};

const jsonLd = articleJsonLd({
  slug: "token-2022-module-configuration-reference",
  headline: "Token-2022 module configuration: the complete reference",
  description:
    "Every Token-2022 extension parameter, valid range, authority field, compatibility rule, and security implication.",
  datePublished: "2026-07-01",
});

export default function ModuleConfigurationReference() {
  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mb-8">
        <a href="/blog" className="text-sm text-amber-700 hover:text-amber-800 no-underline">← Blog</a>
      </div>
      <span className="badge-amber mb-4 inline-block">Reference</span>
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
        Token-2022 module configuration: the complete reference
      </h1>
      <p className="text-gray-400 text-sm mb-10">July 1, 2026 · 12 min read · Kept current with SPL Token-2022</p>

      <div className="prose prose-gray max-w-none space-y-6 text-[15px] leading-relaxed text-gray-700">

        <p>
          This page is a configuration reference for Solana <strong>Token-2022</strong> (also called
          SPL Token Extensions) — the token program at address{" "}
          <code>TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb</code>. It covers the extensions Smeltr
          exposes as deployment modules: <strong>Transfer Fee</strong>, <strong>Non-Transferable</strong>,{" "}
          <strong>Permanent Delegate</strong>, and on-chain <strong>TokenMetadata</strong>. Every parameter,
          valid range, authority field, and compatibility rule below reflects the on-chain program&apos;s
          behavior, not Smeltr-specific conventions.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-10">The one rule that governs everything</h2>
        <p>
          <strong>Extensions must be initialized before <code>InitializeMint</code>, inside the same
          transaction that creates the mint account.</strong> The mint account&apos;s size is fixed at
          allocation to fit exactly the extensions you selected. After <code>InitializeMint</code> executes,
          no further extensions can be added — there is no &quot;upgrade&quot; path. If you deploy without
          Transfer Fee, that token can never charge transfer fees. Plan the full extension set before
          deployment.
        </p>
        <p>The canonical instruction order for a Token-2022 mint deployment is:</p>
        <ol className="list-decimal pl-6 space-y-1">
          <li><code>SystemProgram.createAccount</code> — allocate the mint account, sized for all selected extensions, owned by the Token-2022 program</li>
          <li>Each extension&apos;s initialization instruction (any order among themselves for the extensions on this page)</li>
          <li><code>InitializeMetadataPointer</code> — if using on-chain metadata</li>
          <li><code>InitializeMint</code> — finalizes the mint; decimals, mint authority, and freeze authority are set here</li>
        </ol>

        <h2 className="text-2xl font-bold text-gray-900 mt-10">Transfer Fee (TransferFeeConfig)</h2>
        <p>
          Charges a protocol-enforced fee on every transfer of the token. The fee is withheld{" "}
          <em>on the recipient&apos;s token account</em> in the transferred token (never in SOL), and sits
          there until the withdraw authority harvests it. No off-chain infrastructure is involved — the
          Solana runtime enforces collection.
        </p>
        <table className="w-full text-sm border-collapse">
          <thead><tr className="border-b border-gray-300 text-left">
            <th className="py-2 pr-3">Parameter</th><th className="py-2 pr-3">Type / range</th><th className="py-2">Notes</th>
          </tr></thead>
          <tbody className="align-top">
            <tr className="border-b border-gray-200"><td className="py-2 pr-3 font-mono text-xs">transferFeeBasisPoints</td><td className="py-2 pr-3">u16, 0–10,000</td><td className="py-2">1 bps = 0.01%. 10,000 = 100%. Typical range for legitimate projects: 10–500 (0.1%–5%).</td></tr>
            <tr className="border-b border-gray-200"><td className="py-2 pr-3 font-mono text-xs">maximumFee</td><td className="py-2 pr-3">u64, base units</td><td className="py-2">Hard cap per transfer, denominated in the token&apos;s base units (before decimals). Set to u64::MAX for &quot;no cap&quot;. A low cap effectively converts the percentage fee into a flat fee for large transfers.</td></tr>
            <tr className="border-b border-gray-200"><td className="py-2 pr-3 font-mono text-xs">transferFeeConfigAuthority</td><td className="py-2 pr-3">Pubkey or none</td><td className="py-2">Can change the fee later (takes effect after ~2 epochs). Set to none to make the fee permanent.</td></tr>
            <tr><td className="py-2 pr-3 font-mono text-xs">withdrawWithheldAuthority</td><td className="py-2 pr-3">Pubkey or none</td><td className="py-2">The only address that can harvest withheld fees. If none, withheld fees are permanently unrecoverable.</td></tr>
          </tbody>
        </table>
        <p>
          <strong>Common mistake:</strong> forgetting that recipients receive <em>less than the sent
          amount</em>. Integrations that assert <code>received == sent</code> (some DEX pools, payment
          processors) break against transfer-fee tokens. Use <code>transferChecked</code> semantics and
          account for the fee.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-10">Non-Transferable (soul-bound)</h2>
        <p>
          Tokens minted into an account can never be transferred out of it — enforced by the program on
          every transfer path. There are no parameters to configure; the extension is a flag on the mint.
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Holders can still burn</strong> their tokens and close their accounts — soul-bound is not seize-proof custody, it is transfer prevention.</li>
          <li>Use cases: credentials, certifications, memberships, achievement badges, reputation systems.</li>
          <li>Combining with Transfer Fee is legal at the protocol level but pointless — no transfers can ever occur to charge a fee on. Smeltr surfaces this as a soft-conflict warning.</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-10">Permanent Delegate</h2>
        <p>
          Grants one address <strong>unconditional authority to transfer or burn any holder&apos;s balance</strong>{" "}
          of this token, forever, with no holder consent and no revocation. It is the most powerful
          extension in Token-2022 and the one most often misused.
        </p>
        <table className="w-full text-sm border-collapse">
          <thead><tr className="border-b border-gray-300 text-left">
            <th className="py-2 pr-3">Parameter</th><th className="py-2 pr-3">Type</th><th className="py-2">Notes</th>
          </tr></thead>
          <tbody className="align-top">
            <tr><td className="py-2 pr-3 font-mono text-xs">delegate</td><td className="py-2 pr-3">Pubkey</td><td className="py-2">Cannot be changed or removed after <code>InitializeMint</code>. Choose a governance-controlled or multisig address for legitimate deployments.</td></tr>
          </tbody>
        </table>
        <p>
          Legitimate uses: regulatory compliance (court-ordered seizure), subscription revocation,
          expirable game assets, RWA clawback requirements. <strong>Disclosure is the ethical line:</strong>{" "}
          holders must be able to discover that a permanent delegate exists before they acquire the token.
          It is visible on-chain in the mint account&apos;s extension data — explorers and wallets
          increasingly surface it.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-10">On-chain metadata (TokenMetadata + MetadataPointer)</h2>
        <p>
          Token-2022 supports name/symbol/URI metadata stored <em>in the mint account itself</em> — no
          Metaplex account needed. Two pieces cooperate: <code>MetadataPointer</code> (initialized before{" "}
          <code>InitializeMint</code>, pointing at the mint itself) and the <code>TokenMetadata</code> TLV
          data (written <em>after</em> <code>InitializeMint</code>).
        </p>
        <p>
          Because the metadata is written after mint initialization but enlarges the account, the deployment
          must either pre-fund the mint account with enough lamports for the eventual size (Smeltr&apos;s
          approach — a two-transaction flow) or perform a reallocation. Metadata fields: <code>name</code>{" "}
          (≤32 chars as enforced by common wallets), <code>symbol</code> (≤10), <code>uri</code> (typically
          an Arweave/IPFS JSON document with image and description). The update authority can rewrite
          metadata later unless set to none.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-10">Compatibility matrix</h2>
        <table className="w-full text-sm border-collapse">
          <thead><tr className="border-b border-gray-300 text-left">
            <th className="py-2 pr-3">Combination</th><th className="py-2 pr-3">Valid?</th><th className="py-2">Notes</th>
          </tr></thead>
          <tbody className="align-top">
            <tr className="border-b border-gray-200"><td className="py-2 pr-3">Transfer Fee + Permanent Delegate</td><td className="py-2 pr-3">✓</td><td className="py-2">Delegate transfers also incur the fee.</td></tr>
            <tr className="border-b border-gray-200"><td className="py-2 pr-3">Transfer Fee + Non-Transferable</td><td className="py-2 pr-3">✓ (discouraged)</td><td className="py-2">Legal but inert — no transfers ever occur.</td></tr>
            <tr className="border-b border-gray-200"><td className="py-2 pr-3">Non-Transferable + Permanent Delegate</td><td className="py-2 pr-3">✓</td><td className="py-2">Delegate can still burn/move despite non-transferability — the delegate authority supersedes the transfer block. Disclose clearly.</td></tr>
            <tr className="border-b border-gray-200"><td className="py-2 pr-3">Any module + TokenMetadata</td><td className="py-2 pr-3">✓</td><td className="py-2">MetadataPointer must not collide with another pointer configuration.</td></tr>
            <tr><td className="py-2 pr-3">Same extension twice</td><td className="py-2 pr-3">✗</td><td className="py-2">Duplicate extension initialization fails at the program level.</td></tr>
          </tbody>
        </table>

        <h2 className="text-2xl font-bold text-gray-900 mt-10">Authority security model</h2>
        <p>Every authority field is an attack surface. A trustworthy deployment tool should enforce:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>User-owned authorities only.</strong> Mint authority, freeze authority, fee authorities, and the permanent delegate should belong to the deployer (or their governance), never to the deployment platform. Smeltr enforces this with a platform-key denylist checked on every authority field before instructions are built.</li>
          <li><strong>Explicit none is better than a forgotten key.</strong> Setting freeze authority or fee-config authority to none permanently disables that power — often the right call for community tokens.</li>
          <li><strong>The mint keypair is ephemeral.</strong> It signs once at creation and should then be discarded; ongoing control flows through the authority fields, not the mint key.</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-10">Quick answers</h2>
        <p><strong>Can I add an extension to an existing token?</strong> No. Extensions are fixed at mint creation.</p>
        <p><strong>Can the transfer fee be changed later?</strong> Yes, by the fee-config authority (effective after ~2 epochs) — unless that authority was set to none.</p>
        <p><strong>Are Token-2022 tokens compatible with regular SPL tooling?</strong> Mostly, via the shared interface — but integrations must use the Token-2022 program ID and <code>transferChecked</code>; some older dApps only support the legacy token program.</p>
        <p><strong>Is the fee paid in SOL?</strong> No — transfer fees are withheld in the token being transferred. Only network (gas) fees are paid in SOL.</p>

        <div className="rounded-xl p-5 border mt-10" style={{ background: "rgba(245,158,11,0.08)", borderColor: "#F59E0B" }}>
          <p className="m-0">
            <strong>Deploy it without writing code:</strong> Smeltr composes these modules with
            compatibility checks, authority denylisting, and transparent per-deployment pricing —{" "}
            <a href="/deploy" className="text-amber-700 underline">smeltr.org/deploy</a>. You sign every
            transaction with your own wallet; Smeltr never holds keys or authorities.
          </p>
        </div>
      </div>
    </article>
  );
}
